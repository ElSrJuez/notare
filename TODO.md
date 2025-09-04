# TODO

## Known Issues (v1.0)

1. Reader polish
   - Links are styled as **bold** instead of _underlined_.
   - Hover-magnify can nudge layout on mobile widths.

2. Highlight edge-cases
   - Sentences with `…` or nested `<code>` break detection → misaligned highlight bar.

3. Build warnings – Tailwind `@apply` noise during `npm run build`.

4. UX – missing progress indicator while Normalize fetch is in flight.

## Roadmap

### 1. Visual & UX
• Favicon / PWA icon bundle (dark + light variants).  
• Switch logo image to dark version when site is in light mode (prefers-color-scheme detection).  
• Dark-mode theme polish.
• Interactive product tour / onboarding walkthrough (e.g., Shepherd.js): guide user through URL input → highlight → Settings → template upload → generate & download.

### 2. Authentication
Integrated IdP sign-in (optional):  
  - Microsoft Account / Entra ID  
  - Google + Google Workspace  
  - GitHub  
Sign-in is only to persist user templates & history; core features remain anonymous.

### 3. PowerPoint Generation
• Smart layout selection:   
  - Section separators  
  - Two-column content  
  - Outro / Q-A slide  
• Heuristic + GPT prompt to map outline items → suitable template layouts.

### 4. Export & Import
• Additional export formats: annotated HTML and Markdown.  
• Import `.docx` or raw Markdown as alternate content sources.

### 5. Prompt Engineering & Persistence
• Clean separation of **system**, **meta**, and **user** prompts in backend provider layer.  
• Move hard-coded prompt strings into versioned JSON/YAML “prompt cards”.  
• Admin endpoint to list / preview / update prompt cards without redeploying.  
• Persist per-user preferred prompt card + LLM settings once IdP sign-in is available.

### 6. Quality & Ops
• Unit tests for React components and FastAPI routes (pytest + React Testing Library).  
• Lighthouse & axe accessibility audits.  
• Bundle `frontend/dist` into backend for single-origin deployment.  
• Aggressive/cautious request throttling tiers for free workloads (protect Cloud Run & Vercel quotas).  
• Full security review: dependency scanning, SSRF/SSTI checks, auth flows, file-upload validation, threat-vector matrix.
• **Top priority:** add strong anti-scraping / no-index measures (robots.txt `Disallow: /`, `<meta name="robots" content="noindex,nofollow">`, rate-limit headers) to avoid paying for crawler traffic.
