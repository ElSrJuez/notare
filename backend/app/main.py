from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Notāre Backend")

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

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove unwanted tags
    for tag in soup(["script", "style", "nav", "footer", "aside", "header", "form" ]):
        tag.decompose()

    # Keep structural elements
    body = soup.body or soup
    content = "\n".join(p.get_text(separator=" ", strip=True) for p in body.find_all(["h1","h2","h3","p","li"]))

    return {"clean_text": content}
