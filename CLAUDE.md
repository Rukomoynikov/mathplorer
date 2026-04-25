# Math Notebook Lab

Math Notebook Lab is a local-first desktop app for student-friendly math exploration. It is built as a Tauri v2 app with a React, TypeScript, Vite, and Tailwind frontend.

## Product Scope

- Notebook made of editable blocks: text, formula, graph, solver, and explanation.
- Blocks can be added, edited, duplicated, deleted, and reordered.
- Notebook state persists in browser `localStorage` inside the Tauri WebView.
- Import/export uses plain JSON through browser upload/download APIs.
- No backend is used. Keep the app local-first.

## Architecture

- `src/App.tsx` owns notebook state, localStorage persistence, import/export, and block-level actions.
- `src/types.ts` defines the shared `Block` type. Avoid changing it unless required.
- `src/components` contains notebook UI and block orchestration.
- `src/components/blocks` contains individual block editors/renderers.
- `src/data` contains sample notebook and block factory helpers.
- `src/lib` contains pure logic for plotting, solving, notebook serialization, formula transforms, and local explanations.
- `src-tauri` contains the minimal Tauri v2 shell. Avoid adding Rust/native APIs unless the MVP truly needs them.

## Frontend Notes

- Tailwind is wired through `@tailwindcss/vite` in `vite.config.ts`.
- Global styles live in `src/index.css`.
- KaTeX CSS is imported once in `src/main.tsx`.
- Markdown text blocks use `react-markdown`, `remark-gfm`, `remark-math`, and `rehype-katex`.
- Formula blocks render display math through Markdown + KaTeX.
- Graph blocks use `mathjs` plus custom SVG plotting in `src/lib/graphPlot.ts`.
- Solver blocks support simple linear equations via `src/lib/linearSolver.ts`.
- Explanation blocks currently use a deterministic local generator in `src/lib/explanationGenerator.ts`.

## Commands

```sh
npm install
npm run dev
npm run build
npm run tauri dev
npm run tauri build
```

In this local environment, Rust/Cargo may be available through `mise`, so these Tauri commands may need:

```sh
mise exec -- npm run tauri dev
mise exec -- npm run tauri build
```

The Vite dev server runs on `http://localhost:1420/`, which Tauri uses in development.

## Development Guidance

- Prefer small, maintainable changes that preserve the current block architecture.
- Keep notebook behavior local-first unless explicitly asked to add a service.
- Preserve JSON import/export compatibility.
- Do not add Tauri file dialogs, storage plugins, or backend calls unless browser APIs are insufficient.
- Keep Rust changes limited to metadata/window configuration unless native behavior is required.
- Before finishing significant changes, run `npm run build`; run Tauri commands when the shell or packaging is affected.

## Known Build Note

The frontend build may warn that the JS bundle is larger than 500 kB because math, Markdown, and KaTeX libraries are bundled together. This is acceptable for the current MVP unless performance work is explicitly requested.
