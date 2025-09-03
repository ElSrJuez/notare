# 🗂️ Stateless Notāre – Unified Implementation Plan

Goal: Deploy Notāre (FastAPI backend + React SPA) on Cloud Run/Storage with **zero external storage dependencies**.  
The backend holds no secrets or user data; all user-specific settings (LLM key, model, templates) live in the browser and are transmitted for each request.

---

## 1  Current State Snapshot

| Area | Behaviour | Risk |
|------|-----------|------|
| `backend/config.toml` | Local demo file, **ignored by git**, missing in container → crash. | ❌ Must be optional. |
| PPT template (`assets/ppt_templates/Template.pptx`) | Local, git-ignored. | ❌ Must be optional upload. |
| Highlights / outlines | Held client-side only. | ✅ already stateless |
| Secrets | Hard-coded in dev `config.toml`. | ❌ Remove from image |

---

## 2  Task Breakdown

### 2.1 Backend (FastAPI)
1. **Config Loader** (`backend/app/config.py`)
   * If `config.toml` present → load (local dev).
   * Else read `OPENAI_API_KEY`, `OPENAI_MODEL`, `LLM_PROVIDER` env vars.
   * Allow per-request override via dependency that inspects headers/JSON.
2. **Request Model**  
   `SettingsPayload` with `openai_key`, `openai_model`, `provider`.
3. **Endpoints**
   * Extend `/pptx` to accept multipart form:
     • field `settings` (JSON)  
     • file `template` (optional `.pptx`)  
     • file `layout_map` (optional `.json`)
   * Add `/healthz` → `{"ok":true}`.
4. **Template Handling**
   * Save uploads to `tempfile.TemporaryDirectory()`; delete after use.
   * Template upload **never persisted**: when “Remember” is on we store only `templateFileName` and `lastPath` (if available via File System Access API), not the binary.
5. **Size & Security**
   * Limit template upload ≤ 5 MiB.

### 2.2 Frontend (React/Vite)

#### GUI Concept – Settings Drawer
```
┌──────────────────────────────┐
│ ⚙️  Settings                 │
├──────────────────────────────┤
│ Provider    [ OpenAI ▼ ]      │
│ API key     [••••••••••••] ⓘ │
│ Model       [ gpt-4.1     ]  │
│                              │
│ Custom template (.pptx)       │
│ [ Select file… ] ═════════    │
│ Layout map (.json, optional)  │
│ [ Select file… ]              │
├──────────────────────────────┤
│ ☑ Remember these settings      │
│    (stores in localStorage)    │
│                              │
│ Save  |  Reset  |  Close       │
└──────────────────────────────┘
```
* Floating cog FAB opens this side-panel.
* "Remember" saves provider/key/model + **only the template file name / path handle**, never the binary.
* Validation: key required, template ≤ 5 MB.
* When template chosen panel shows file name with Change/Remove buttons.
* Top-bar badge:
  * `🔒 Local` when settings remembered
  * `⚠️ Temp` when session-only.
* Generate button disabled until a key is present; tooltip explains.
* "Clear stored settings" in footer wipes localStorage and reloads.

#### Implementation Tasks
1. Create `SettingsPanel` component with state synced to `localStorage`.
2. Use File System Access API (where supported) to persist `lastPath`; fallback to just file name.
3. On `Generate PPTX`, build `FormData` containing:
   * `settings` JSON (provider, key, model, templateFileName)
   * `template` and optional `layout_map` files.
4. Update header badge and button states based on settings persistence.

### 2.3 Docker / DevOps
1. **Dockerfile**  
   * Do **not** copy real `config.toml` or template.  
   * Keep sample for local dev.
2. **Healthcheck**  
   `HEALTHCHECK CMD curl -f http://localhost:8080/healthz || exit 1`.
3. **.gitignore** remains—private files stay untracked.
4. **Cloud Run Deploy**  
   ```bash
   gcloud run deploy notare-api \
     --source . \
     --region us-central1 \
     --allow-unauthenticated
   ```
   Users supply key/template via UI.

### 2.4 Documentation
* Update HOWTO / DEPLOYMENT to describe new flow (enter key in UI, optional template upload).

---

## 3  Milestones & Owners

| # | Deliverable | Owner | ETA |
|---|-------------|-------|-----|
| 1 | Backend runtime config override + `/healthz` | Python | Day 1 |
| 2 | Multipart template upload handling | Python | Day 1 |
| 3 | React Settings panel & request wiring | Frontend | Day 2 |
| 4 | Dockerfile cleanup & Cloud Run validation | DevOps | Day 2 |
| 5 | Docs refresh | Docs | Day 2 |

---

## 4  Validation Checklist

- [ ] Unit tests: config loader path (file, env, header).  
- [ ] Upload custom template → correct slide mapping.  
- [ ] Cloud Run starts; `/healthz` returns 200.  
- [ ] Image contains no `OPENAI_API_KEY` string (`docker run` + `grep`).

---

✅ **Outcome:** Container is secret-free; users supply credentials & templates per session; Cloud Run deploys smoothly with always-free resources.
