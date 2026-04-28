# Agent Guide

This repository contains one app: Math Notebook Lab, a local-first Tauri v2 desktop app with a React, TypeScript, Vite, and Tailwind frontend.

## What This App Does

Math Notebook Lab lets students build local math notebooks from blocks:

- `text`: Markdown notes with math support.
- `formula`: KaTeX-rendered formulas.
- `graph`: mathjs-backed function plotting with custom SVG output.
- `solver`: simple linear equation solver.
- `explanation`: deterministic local explanation generator.

The notebook is local-first. It persists to `localStorage` in the Tauri WebView and supports JSON import/export through browser upload/download APIs. No backend is used.

## Repository Map

- `src/App.tsx`: app state, persistence, import/export, and block actions.
- `src/types.ts`: shared block types and labels.
- `src/components`: notebook layout, block renderer, toolbar, and add-block menu.
- `src/components/blocks`: block-specific editors and previews.
- `src/data`: sample notebook and block factory helpers.
- `src/lib`: pure domain logic for formulas, plotting, solving, explanations, and serialization.
- `src-tauri`: minimal Tauri v2 shell and app metadata.
- `vite.config.ts`: Vite config with React and Tailwind plugins.

## Frontend Notes

- Tailwind is wired through `@tailwindcss/vite` in `vite.config.ts`.
- Global styles live in `src/index.css`.
- KaTeX CSS is imported once in `src/main.tsx`.
- Markdown text blocks use `react-markdown`, `remark-gfm`, `remark-math`, and `rehype-katex`.
- Formula blocks render display math through Markdown and KaTeX.
- Graph blocks use `mathjs` plus custom SVG plotting in `src/lib/graphPlot.ts`.
- Solver blocks support simple linear equations via `src/lib/linearSolver.ts`.
- Explanation blocks use a deterministic local generator in `src/lib/explanationGenerator.ts`.

## Working Rules

- Keep the shared `Block` type stable unless a requested feature cannot work without changing it.
- Keep behavior local-first by default.
- Preserve JSON import/export compatibility.
- Avoid backend services, native storage, and native file dialogs unless specifically needed.
- Keep code simple. This is still an MVP, not a full CAS or AI backend.
- Prefer pure helpers in `src/lib` for math/domain behavior.
- Keep block-specific UI inside `src/components/blocks`.
- Keep Rust/native changes limited to metadata, window configuration, or required Tauri shell behavior.
- Import KaTeX CSS only once, currently in `src/main.tsx`.
- Do not commit generated outputs such as `dist`, `node_modules`, or `src-tauri/target`.

## Commands

Use these from the repository root:

```sh
npm install
npm run dev
npm run build
npm run test
npm run tauri dev
npm run tauri build
```

If `cargo` is not on PATH, use the local toolchain wrapper:

```sh
mise exec -- npm run tauri dev
mise exec -- npm run tauri build
```

The Vite dev server runs on `http://localhost:1420/`, which Tauri uses in development.

## Verification Expectations

- For frontend-only changes, run `npm run build`.
- For pure logic changes in `src/lib`, run `npm run test` when tests are present or affected.
- For Tauri config, Rust, metadata, or packaging changes, run `mise exec -- npm run tauri dev` or `mise exec -- npm run tauri build` as appropriate.
- The desktop app should open as `Math Notebook Lab`, not the default Tauri starter.
- Existing notebook features should continue to work: sample notebook, add/edit/delete/duplicate/reorder blocks, Markdown, KaTeX, graphing, solving, explanations, local persistence, and JSON import/export.

## Design Direction

The UI should stay polished, calm, and student-friendly. Prefer clear controls, readable spacing, and practical block workflows over marketing-style layout. The primary screen should remain the usable notebook.

## Known Build Note

The frontend build may warn that the JavaScript bundle is larger than 500 kB because math, Markdown, and KaTeX libraries are bundled together. This is acceptable for the current MVP unless performance work is explicitly requested.
