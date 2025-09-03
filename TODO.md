# TODO

## Known Issues

1.1 Links still appear bold instead of underlined in article viewer.
1.2 Hover-magnify occasionally shifts layout on narrow screens.

- Sentence detection fails for quotes containing ellipsis (`…`).
- Highlight bar misaligned when paragraph contains inline code elements.
- CSS `@apply` rules trigger postcss warnings during build.
- Backend `/normalize` endpoint lacks comprehensive error handling for malformed URLs.
- No visual feedback while article is loading.

## Planned Improvements

3. Export options
   - Download annotated HTML.
   - PPTX and Markdown export.

4. LLM-driven outline endpoint (backend `/outline`) – IMPLEMENTING.

+### Session-scoped file inputs
+- Template and layout selectors reset on reload (no persistent handle).
+- Plan: add explicit restore via File System Access API.

- Persist highlighted sentences to backend for optional cross-device storage.
- Dark-mode theme support.
- Unit tests for React components and FastAPI routes.
- Accessibility audit: ensure proper ARIA roles and color contrast.
- Implement user-moderation prompt that merges outline with source context before final generation.
- Allow users to upload, manage, and normalize custom PPT templates via UI & backend endpoint.
- Treat highlighted ‘central’ sentences/phrases as slide section dividers with auto numbering based on mapped layout.
- Implement local/session-based storage for templates, outlines, and user profiles; backend remains stateless.
- Build UI for users to configure their LLM credentials and settings (BYOM) and persist them locally.
