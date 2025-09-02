# 🛠️ How to Run Notāre (Milestone 1)

## Prerequisites
- Python 3.9+
- Node.js (optional for Live Server)

---

## 1. Set up Python environment
```pwsh
python -m venv .venv
.venv\Scripts\Activate   # PowerShell
```

## 2. Install backend dependencies
```pwsh
pip install -r backend\requirements.txt
```

## 3. Start FastAPI server
```pwsh
uvicorn backend.app.main:app --reload
```
Server runs at http://localhost:8000

---

## 4. Launch front-end (Vite dev server)
```pwsh
cd frontend
npm install       # first time only
npm run dev
```
This starts React at http://localhost:5173 and proxies API calls to FastAPI.

---

## 5. Test normalization
1. Open http://localhost:5173 in your browser.
2. Paste a public article URL into the input.
3. Click “Normalize.”
4. The cleaned article appears with preserved headings.

---

## 6. Optional: Production build
```pwsh
npm run build     # outputs static files to frontend/dist
```
Copy `dist/` to a `static/` folder and mount with FastAPI for single-origin deployment.

---

## 7. Configure your Large Language Model (LLM)
Notāre is **BYOM** (Bring-Your-Own-Model). Edit `backend/app/config.toml`:

```toml
[llm]
provider = "openai"          # or "llama"

[llm.openai]
api_key = "sk-..."          # required
model   = "gpt-4o-chat-bison"
# endpoint / api_version if using Azure OpenAI
```

For a local llama.cpp HTTP server:
```toml
[llm]
provider = "llama"

[llm.llama]
endpoint = "http://localhost:8080/completions"
model    = "phi2.Q4_K_M.gguf"  # optional
```

---

## 8. Use a custom PowerPoint template (optional but recommended)
1. Place **one** `.pptx` file in `assets/ppt_templates/`.
2. From that folder run the mapping helper:

```pwsh
cd assets/ppt_templates
python layout_helper.py
```
The script shows all layouts and asks you to map Notāre’s default slide types (Title Slide, Title and Content, etc.) to your template. It writes `layout_map.json` used by the backend.

> If bullets don’t appear in generated slides, ensure the mapped layout contains a **body/content** placeholder. You can add one in PowerPoint → View → Slide Master → Insert Placeholder → Text.

---

## 9. Mark-up semantics (<<mark>> tags)
When you highlight text in the reader, the frontend wraps it in:
```html
<mark class="notare-mark">Important text</mark>
```
This converts to Markdown delimiters `<<mark>> … <</mark>>` before reaching the LLM.
The updated system prompt tells the model to **use the emphasis but strip the delimiters**. If tags still leak through, the backend post-processes the outline to remove them.

---

## 10. Troubleshooting

| Symptom | Possible Cause & Fix |
|---------|----------------------|
| Titles show, body text missing | The mapped layout lacks a BODY/CONTENT placeholder. Edit Slide Master or re-run `layout_helper.py` and choose a layout that contains one. |
| `<<mark>>` appears in slides | Pull latest code (≥ 2025-09-02) with new prompt & post-filter. |
| 400 error from `/outline` | Wrong LLM credentials/model name in `config.toml`. |
| Template ignored (default theme) | No `.pptx` found in `assets/ppt_templates` or `template_dir` mis-configured. |
| Frontend cannot reach API | Ensure FastAPI is running on port 8000 or adjust proxy in `frontend/vite.config.ts`. |

---

Enjoy crafting decks at lightning speed! ✨
