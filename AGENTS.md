# Agent Guide

This repository contains one app: Math Notebook Lab, a Tauri v2 desktop app with a React, TypeScript, Vite, and Tailwind frontend.

## What This App Does

Math Notebook Lab lets students build local math notebooks from blocks:

- `text`: Markdown notes with math support.
- `formula`: KaTeX-rendered formulas.
- `graph`: mathjs-backed function plotting with custom SVG output.
- `solver`: simple linear equation solver.
- `explanation`: deterministic local explanation generator.

The notebook is local-first. It persists to `localStorage` in the Tauri WebView and supports JSON import/export.

## Repository Map

- `src/App.tsx`: app state, persistence, import/export, block actions.
- `src/types.ts`: shared block types and labels.
- `src/components`: notebook layout, block renderer, toolbar, add-block menu.
- `src/components/blocks`: block-specific editor and preview components.
- `src/data`: sample notebook and block factory.
- `src/lib`: pure domain logic for formulas, plotting, solving, explanations, and serialization.
- `src-tauri`: minimal Tauri v2 shell and app metadata.
- `vite.config.ts`: Vite config with React and Tailwind plugins.

## Working Rules

- Keep the shared `Block` type stable unless a requested feature cannot work without changing it.
- Keep behavior local-first by default.
- Avoid backend services, native storage, and native file dialogs unless specifically needed.
- Keep code simple. This is still an MVP, not a full CAS or AI backend.
- Prefer pure helpers in `src/lib` for math/domain behavior.
- Keep block-specific UI inside `src/components/blocks`.
- Import KaTeX CSS only once, currently in `src/main.tsx`.
- Do not commit generated outputs such as `dist`, `node_modules`, or `src-tauri/target`.

## Commands

Use these from the repository root:

```sh
npm install
npm run dev
npm run build
npm run tauri dev
npm run tauri build
```

If `cargo` is not on PATH, use the local toolchain wrapper:

```sh
mise exec -- npm run tauri dev
mise exec -- npm run tauri build
```

## Verification Expectations

- For frontend-only changes, run `npm run build`.
- For Tauri config, Rust, metadata, or packaging changes, run `mise exec -- npm run tauri dev` or `mise exec -- npm run tauri build` as appropriate.
- The desktop app should open as `Math Notebook Lab`, not the default Tauri starter.
- Existing notebook features should continue to work: sample notebook, add/edit/delete/duplicate/reorder blocks, Markdown, KaTeX, graphing, solving, explanations, local persistence, and JSON import/export.

## Design Direction

The UI should stay polished, calm, and student-friendly. Prefer clear controls, readable spacing, and practical block workflows over marketing-style layout. The primary screen should remain the usable notebook.
