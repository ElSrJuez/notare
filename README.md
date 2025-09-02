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

See `scratchpad/vision.md` for full design notes and `scratchpad/planning.md` for progress tracking.
