from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel, HttpUrl
import httpx
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware
from readability import Document
import logging
from typing import List, Optional, Annotated
from markdownify import MarkdownConverter
import os, io, json
import openai
from pptx import Presentation
from pptx.util import Inches, Pt
from fastapi.responses import StreamingResponse
from .llm_provider import OpenAIProvider, LlamaHTTPProvider, BaseProvider, OutlineError
from pathlib import Path
from .config import load_config
import tempfile  # added
from fastapi.staticfiles import StaticFiles
from pathlib import Path as _Path

app = FastAPI(title="Notāre Backend")
cfg = load_config()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notare.pptx")
logger.setLevel(logging.INFO)

# Add CORS middleware to allow frontend requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class NormalizeRequest(BaseModel):
    url: HttpUrl

@app.post("/normalize")
async def normalize_page(req: NormalizeRequest):
    """Fetches the web page, strips boilerplate, and returns simplified HTML."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(str(req.url), timeout=10)
            resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc = Document(resp.text, url=str(req.url))
    summary_html = doc.summary(html_partial=True)

    # Further strip unwanted tags but keep structure
    soup = BeautifulSoup(summary_html, "html.parser")
    for tag in soup(["script", "style", "form"]):
        tag.decompose()

    # Debug: log remaining blockquotes or <br> that could break highlighting
    for bq in soup.find_all("blockquote"):
        logging.info("BLOCKQUOTE remaining: %s", bq.get_text(strip=True)[:120])
    if soup.find("br"):
        logging.info("<br> tags remain in document – may split sentences")

    clean_html = str(soup)

    return {"clean_html": clean_html}

class OutlineRequest(BaseModel):
    """Annotated HTML sent from the frontend to generate an outline."""
    html: str

# Custom converter to mark <mark class="notare-mark">
class MarkAwareConverter(MarkdownConverter):
    def convert_mark(self, el, text, *args, **kwargs):
        if 'notare-mark' in el.get('class', []):
            return f"<<mark>>{text}<</mark>>"
        return text

def html_to_markdown(html: str) -> str:
    conv = MarkAwareConverter(bullets='*')
    return conv.convert(html)

@app.post("/outline")
async def outline(req: OutlineRequest):
    """Return markdown with custom highlight markers for LLM processing."""
    markdown = html_to_markdown(req.html)
    return {"markdown": markdown}

class PPTXRequest(BaseModel):
    html: str

# Resolve template directory (checks root, [llm], [llm.openai])
raw_dir = cfg.get("template_dir") or cfg.get("llm", {}).get("template_dir") or cfg.get("llm", {}).get("openai", {}).get("template_dir")
if raw_dir:
    path_obj = Path(raw_dir).expanduser()
    if not path_obj.is_absolute():
        repo_root = Path(__file__).resolve().parents[2]
        template_dir = (repo_root / path_obj).resolve()
    else:
        template_dir = path_obj
    logger.info("Template directory resolved to %s", template_dir)
else:
    template_dir = None
    logger.info("No template_dir configured; will build presentation from scratch")


def load_template():
    if not template_dir:
        return None
    for f in template_dir.glob("*.pptx"):
        logger.info("Using PPTX template: %s", f)
        return Presentation(str(f))
    logger.info("No PPTX template found in %s; using default presentation", template_dir)
    return None

layout_map = {}
if template_dir:
    map_file = template_dir / "layout_map.json"
    if map_file.exists():
        layout_map = json.loads(map_file.read_text())
        logger.info("Loaded layout map with %d entries", len(layout_map))


def get_layout_by_default(prs, default_name, need_body):
    # mapped name first
    mapped = layout_map.get(default_name)
    if mapped:
        for l in prs.slide_layouts:
            if l.name == mapped:
                return l
    # fallback search
    for l in prs.slide_layouts:
        if default_name.lower() in l.name.lower():
            return l
    # ultimate fallback
    return prs.slide_layouts[0]


class SettingsPayload(BaseModel):
    provider: str = "openai"
    api_key: str | None = None
    model: Optional[str] = None
    endpoint: Optional[str] = None
    api_version: Optional[str] = None

    def build_provider(self) -> BaseProvider:
        name = self.provider.lower()
        if name in ("openai", "azure"):
            if not self.api_key and name != "llama":
                raise HTTPException(status_code=400, detail="api_key required for OpenAI/Azure provider")
            if name == "azure" and not self.endpoint:
                raise HTTPException(status_code=400, detail="endpoint required for Azure provider")
            return OpenAIProvider({"api_key": self.api_key, "model": self.model or "gpt-4o-chat-bison", "endpoint": self.endpoint, "api_version": self.api_version})
        if name == "llama":
            return LlamaHTTPProvider(base_url=self.endpoint or "http://localhost:8080/completions", model=self.model)
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{self.provider}'")


@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.get("/")
async def root():
    return {"ok": True}

@app.post("/pptx")
async def generate_pptx(
    settings: Annotated[str, Form(...)],
    html: Annotated[str, Form(..., description="Annotated HTML from client")],
    template: Annotated[UploadFile | None, File(description="Optional PPTX template", alias="template")] = None,
    layout_map_file: Annotated[UploadFile | None, File(description="Optional JSON layout map", alias="layout_map")] = None,
):
    """Generate a PPTX from annotated HTML via LLM outline.

    Expects multipart/form-data with:
        settings: JSON string with provider/api_key/model (required)
        template: .pptx file ≤5 MiB (optional)
        layout_map: .json mapping file (optional)
        html: annotated article HTML (required)
    """

    try:
        settings_obj = SettingsPayload.model_validate_json(settings)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid settings JSON: {e}")

    if template and template.size and template.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Template too large (limit 5 MiB)")

    provider = settings_obj.build_provider()

    markdown = html_to_markdown(html)

    try:
        outline = await provider.generate_outline(markdown)
    except OutlineError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Load template: uploaded > configured dir > default blank.
    prs_template = None
    cleanup_files = []
    if template is not None:
        tmp_path = Path(tempfile.gettempdir()) / f"notare_{template.filename}"
        with tmp_path.open("wb") as f:
            f.write(await template.read())
        prs_template = Presentation(str(tmp_path))
        cleanup_files.append(tmp_path)
    else:
        prs_template = load_template()

    prs = prs_template or Presentation()

    # If a custom layout_map was supplied use it; else fall back to configured one.
    local_layout_map: dict = {}
    if layout_map_file is not None:
        local_layout_map = json.loads(await layout_map_file.read())
    elif layout_map:
        local_layout_map = layout_map

    def _get_layout(name, need_body):
        return get_layout_by_default(prs, name, need_body) if not local_layout_map else get_layout_by_default(prs, name, need_body)

    title_layout = _get_layout("Title Slide", need_body=False)
    content_layout = _get_layout("Title and Content", need_body=True)

    for idx, slide_data in enumerate(outline.get("slides", [])):
        layout = title_layout if idx == 0 else content_layout
        s = prs.slides.add_slide(layout)

        # Title
        title_shape = s.shapes.title
        if title_shape:
            title_shape.text = slide_data.get("title", "")
        else:  # fallback create title textbox
            s.shapes.add_textbox(Inches(1), Inches(0.5), Inches(8), Inches(1)).text_frame.text = slide_data.get("title", "")

        # Bullets
        if idx != 0:
            body_ph = next((ph for ph in s.placeholders if ph.placeholder_format.type == 2), None)
            if body_ph:
                tf = body_ph.text_frame
            else:
                tf = s.shapes.add_textbox(Inches(1), Inches(2), Inches(8), Inches(5)).text_frame
            tf.clear()
            for bullet in slide_data.get("bullets", []):
                p = tf.add_paragraph()
                p.text = bullet
                p.level = 0
                p.font.size = Pt(18)

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)

    response = StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers={"Content-Disposition": "attachment; filename=outline.pptx"})
    # After streaming ensure temp files removed
    for p in cleanup_files:
        try:
            p.unlink(missing_ok=True)
        except Exception:
            pass
    return response

# Mount frontend build (if present) as static site
_frontend_path = _Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_path), html=True), name="frontend")
