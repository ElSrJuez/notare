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

Happy testing! Future milestones will replace this placeholder UI with the full React app.
