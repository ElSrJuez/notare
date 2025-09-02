# 📁 Proposed Project Structure – Notāre

This structure reflects our maxims (Simplicity, Maintainability), separation of concerns, DRY, and BYOM principles.

---

## Top-Level Folders

- `frontend/`  
  React app (UI, document viewer, highlighter, sidebar, configuration)
- `backend/`  
  API service (content extraction, normalization, LLM abstraction, PPTX generation)
- `models/`  
  LLM integration layer, model adapters, configuration
- `shared/`  
  Common types, utilities, validation, constants
- `docs/`  
  Documentation, vision, architecture, onboarding
- `scripts/`  
  Dev tools, setup, migration, automation

---

## Example Substructure

### `frontend/`
- `components/`  
  UI elements (Highlighter, Magnifier, Sidebar, Outline)
- `pages/`  
  App entry points (ReviewMode, Settings)
- `hooks/`  
  Custom React hooks (highlight tracking, model config)
- `styles/`  
  Tailwind config, global styles
- `utils/`  
  UI helpers, animation logic

### `backend/`
- `api/`  
  FastAPI/Node endpoints (extract, process, export)
- `services/`  
  LLM orchestration, PPTX generation
- `adapters/`  
  Model connectors (OpenAI, local, etc.)
- `schemas/`  
  Data validation, serialization
- `storage/`  
  Highlight persistence, user data

### `models/`
- `llm/`  
  Abstractions, interfaces, isolation
- `config/`  
  User model config, BYOM logic

### `shared/`
- `types/`  
  Shared TypeScript/Python types
- `utils/`  
  Cross-cutting helpers
- `constants/`  
  App-wide constants

---

## Notes
- Each module is small, focused, and replaceable.
- LLM logic is isolated and configurable (BYOM).
- UI and backend are decoupled; shared code lives in `shared/`.
- Documentation and scripts are first-class citizens.

This structure is a starting point—adjust as the project evolves.
