# 🚀 Notāre – App Vision

---

## 🎨 Design Principles

### Design Philosophy
- **Clarity over clutter** → interface should disappear when not needed; focus remains on the document.  
- **Beautiful minimalism** → simple typography, restrained colors, generous whitespace.  
- **Familiar, but better** → keep the structure of the original document but normalize it into a clean Reading Mode.  
- **Fluid interaction** → highlighting feels organic with smooth animations and wave effects.  
- **Respect structure** → preserve title → heading → paragraph hierarchy for context integrity.  

---

## 🏛️ Architecture & Coding Principles

### Core Maxims
- **Simplicity** → Prefer straightforward, clear solutions over complex ones. Code should be easy to understand and reason about.
- **Maintainability** → Write code that is easy to modify, debug, and extend. Future-proof our work by keeping it clean.

### Guiding Principles
- **Separation of Concerns** → Decompose the application into small, focused modules with distinct responsibilities (e.g., content extraction, UI rendering, LLM interaction).
- **DRY (Don't Repeat Yourself)** → Avoid redundant code by abstracting and reusing common logic and components.
- **Don't Reinvent the Wheel** → Always look for existing libraries, frameworks, and established patterns first. Leverage the best of what the open-source community has to offer.

### "Bring Your Own Model" (BYOM)
(Contrary to Bring your own Key)
- **Robust Abstraction** → The LLM integration will be behind a well-defined interface. This allows us to swap different models (local or cloud-based) with minimal friction.
- **Strong Isolation** → The core application logic will not be tightly coupled to any specific LLM provider's API.
- **On-Device AI Friendly** → If all the user has is local models, the app will leverage well-established local frameworks to support when the size of the task lends itself.
- **Graceful Configuration** → Users should be able to easily configure and connect their preferred models through a simple and clear UI.

---

## 📄 Review Mode Rendering

### Normalization
- Strip ads, navigation, sidebars, footers, unnecessary scripts.  
- Keep **title, headings, subheadings, paragraphs, lists, inline images/figures**.  
- Normalize font sizes:  
  - Title → XL (2–3× body size)  
  - Headings → clear hierarchy  
  - Body → 16–18px, highly readable  
- Convert all text into one clean, legible typeface (*Merriweather* for scholarly serif or *Inter* for modern sans).  

### Layout & Style
- Centered column (700–800px width).  
- Wide margins + ample line height.  
- Background: soft off-white or light grey (reduce eye strain).  
- Subtle cues:  
  - Headings bold, maybe accented with bar/underline.  
  - Paragraphs left-aligned, comfortable spacing.  
  - Links muted, highlighted only on hover.  

---

## ✨ Highlighter UI

### Magnifying Lens Effect
- Cursor becomes a **subtle circular magnifier**.  
- On hover:  
  - Word under pointer + 2–3 adjacent words enlarge smoothly in a **wave effect** (110–120% scale).  
  - Animation tapers off for fluidity, no mechanical feel.  
  - No hard borders; faint glow or gradient signals focus.  

- **Layout considerations**:  
  - Increase `line-height` to ~1.6–1.8 so the scale-up doesn’t push neighbouring lines downward.  
  - Reserve ~`8ch` of right-side padding/margin so enlarged words don’t wrap or overflow.  
- **Implementation notes**:  
  - Apply `transform: scale()` to inline `<span>` wrappers; keep the parent container `overflow: hidden`.  
  - Render highlight backgrounds with a lower-`z` pseudo-element so edges stay crisp when the word grows.

- **Animation mechanics**:  
  - On `mouseenter`, apply `transform: scale(1.12)` to the span wrapping the word(s) with `transition: transform 180ms cubic-bezier(0.22,1,0.36,1)`.  
  - Use `transform-origin: center bottom` so growth radiates outward without shifting the baseline.  
  - On `mouseleave`, return to scale `1` with a slightly longer ease-out (~240 ms) for smoothness.  
  - Example (Framer Motion):  
    ```tsx
    <motion.span
      whileHover={{ scale: 1.12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {word}
    </motion.span>
    ```  
- **Underlying text objects**:  
  - Render each word/phrase as an inline `<span>` so scaling affects only that element’s transform layer—layout flow stays intact.  
  - Keep highlight backgrounds on a lower-`z` pseudo-element (`::before`) so edges remain crisp when text grows.  
  - When a highlight is “locked,” persist a `<mark>` tag or CSS class and disable the transform (or swap to a gentle glow).

### Click → Phrase Recognition
- Detect the **full phrase/sentence** (via punctuation boundaries or NLP).  
- Apply highlight:  
  - Smooth fade-in pastel background.  
  - Rounded rectangle effect.  
  - Optional subtle underline.  
- Highlights stay **aesthetic, not neon**.  

### Interaction Flow
1. **Hover** → wave magnify effect.  
2. **Click** → highlight entire phrase.  
3. **Store** → highlighted phrases tracked for backend/LLM.  
4. **Re-hover** → subtle glow or underline signals “already captured.”  

### Extra Interaction Ideas
- **Undo/Remove Highlight** → click again or context menu.  
- **Highlight categories** (future): e.g., Key Point, Data, Example.  
- **Sidebar Outline** → builds dynamically as highlights accumulate.  

---

## 🌟 Visual Style
- **Typography**: Merriweather/Lora (serif) or Inter/Source Sans/Noto (sans).  
- **Colors**:  
  - Background → warm off-white.  
  - Highlights → soft pastel (yellow, mint, lavender).  
  - Accents → brand colors (deep navy/charcoal + bright highlight bar).  
- **Animation**:  
  - Powered by Framer Motion.  
  - Spring-based easing.  
  - No blinks—everything fades/scales/slides gracefully.  

---

## 🔧 Product & Technical Roadmap

### Core Flow
1. **Input**: user provides a web link (later: PDF/DOCX support).  
2. **Content Extraction**:  
   - Web pages → fetch HTML + boilerplate removal.  
   - PDF/DOCX → parse to plain text (e.g., `pdfplumber`, `python-docx`).  
3. **User Highlighting**:  
   - Interactive magnifier/highlighter UI.  
   - Store highlights as structured data.  
4. **LLM Processing**:  
   - Send highlights + outline template to GPT-5 (via API).  
   - Generate structured PowerPoint outline.  
5. **Output**: export `.pptx` via `python-pptx` (backend) or `pptxgenjs` (frontend).  

### Frontend
- React + Tailwind CSS + Framer Motion.  
- Document viewer in Review Mode.  
- Highlighter/magnifier interaction.  
- Sidebar for collected highlights and outline preview.  

### Backend
- FastAPI (Python) or Node.js service.  
- Handles ingestion, normalization, parsing.  
- Manages LLM calls.  
- Generates and serves `.pptx` output.  

### Prompt Strategy
```plaintext
You are a presentation assistant. 
Using the provided highlights and template, generate a PowerPoint outline. 
Template: [Outline Template Here]
Highlights: [User’s highlighted content]
```
