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

## 7. Provide LLM credentials at runtime
Click the ⚙️ Settings button in the UI and fill in:

* Provider (`openai`, `azure`, or `llama`)
* API Key / Endpoint / Model / API Version as required

Tick “Remember” to store them in `localStorage` for the next visit. No server-side configuration is needed.

---

## 8. Use a custom PowerPoint template (optional)
Click “Choose File” in Settings and upload any `.pptx`. The backend validates it instantly and shows green/orange/red diagnostics.

If the “Title Slide” or “Title and Content” layouts lack the necessary placeholders, open Slide Master in PowerPoint and add them (Insert → Placeholder).

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
| Template ignored (default theme) | No template uploaded. |
| Frontend cannot reach API | Ensure FastAPI is running on port 8000 or adjust proxy in `frontend/vite.config.ts`. |

---

Enjoy crafting decks at lightning speed! ✨
