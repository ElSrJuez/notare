from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware
from readability import Document
import logging
from typing import List

app = FastAPI(title="Notāre Backend")

# Configure logging
logging.basicConfig(level=logging.INFO)

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

@app.post("/outline")
async def outline(req: OutlineRequest):
    """Extracts highlighted sentences (inside <mark.notare-mark>) and returns them as an outline list."""
    soup = BeautifulSoup(req.html, "html.parser")
    marks: List[str] = [m.get_text(" ", strip=True) for m in soup.select("mark.notare-mark")]
    return {"outline": marks}
