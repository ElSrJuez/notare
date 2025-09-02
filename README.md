![Notāre Logo](assets/logo/notare-logo-dark.png)

# Notāre

Notāre transforms dense articles into structured presentation outlines. Highlight key phrases in an elegant reading mode and export a polished PowerPoint—powered by your choice of Large Language Model (BYOM).

## Vision
A calm, minimal workspace that lets readers distill knowledge fast. Hover-magnify text, click to capture insights, and let an LLM turn highlights into a slide deck.

## Key Features
- Review Mode that cleans and re-typesets any web article
- Hover magnifier & one-click highlighter with smooth animations
- Bring-Your-Own-Model architecture: swap local or cloud LLMs via config
- Instant export to `.pptx` using the captured outline

## Tech at a Glance
Frontend (React + Tailwind + Framer Motion) renders the document viewer and interactions. Backend (FastAPI/Node) handles extraction, LLM orchestration, and PowerPoint generation. Shared types/utilities keep the stack DRY and maintainable.

## Development Principles
Simplicity and Maintainability guide every module. We practice small-module Separation of Concerns, DRY, and leverage existing libraries rather than reinventing the wheel.

[➡️ Quick HOW-TO »](./HOWTO.md)

---

## Design Principles
- **Clarity over clutter** – interface fades so the document stays central.
- **Beautiful minimalism** – clean typography, restrained colours, generous whitespace.
- **Respect structure** – preserve heading hierarchy during normalization.
- **Fluid interaction** – highlighting and magnification feel organic and smooth.
- **BYOM friendly** – Large-Language-Model integration sits behind a clean abstraction layer.

## Architecture at a Glance
| Layer      | Stack                         | Notes                                   |
|------------|------------------------------|-----------------------------------------|
| Frontend   | React + Vite + Tailwind CSS  | Reader, highlighter, export trigger     |
| Animation  | Framer Motion                | Hover magnifier & highlight effects     |
| Backend    | FastAPI (Python)             | Extraction, LLM calls, PPTX generation  |
| LLM        | OpenAI / Azure / Llama.cpp   | Configure in `backend/app/config.toml`  |
| Slides     | python-pptx                  | Uses optional template + layout mapping |

---

## Workflow
1. **Normalize** – Fetch article, strip boilerplate, render clean reading mode.
2. **Highlight** – Hover magnify, click to mark key phrases (`<<mark>>`).
3. **Outline** – Backend passes annotated markdown to your LLM, which returns JSON.
4. **Export** – JSON outline → python-pptx, applied to your template → download.

---

For full setup instructions and troubleshooting see **[HOWTO.md](./HOWTO.md)**.
