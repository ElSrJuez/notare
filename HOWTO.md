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

## 4. Launch placeholder GUI
Option A – VS Code Live Server:
1. Open `frontend/index.html` in VS Code.
2. Use the “Open with Live Server” extension.

Option B – Python static server:
```pwsh
python -m http.server 5500 --directory frontend
```
Open http://localhost:5500/index.html in your browser.

---

## 5. Test normalization
1. Paste a public article URL into the text box.
2. Click “Normalize.”
3. The cleaned text appears in the page, confirming backend → frontend flow.

---

Happy testing! Future milestones will replace this placeholder UI with the full React app.
