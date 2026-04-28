# Math Notebook Lab

Local-first desktop math notebook built with Tauri, React, TypeScript, and Tailwind CSS.

## Development

```sh
npm run dev
npm run tauri dev
```

The frontend dev server runs on `http://localhost:1420/`, which is the URL Tauri v2 uses in development.

## CI and releases

GitHub Actions runs tests, the frontend build, and Windows/macOS Tauri bundle builds on pushes and pull requests.

Desktop releases are created manually from the **Release** workflow in GitHub Actions. Run it with a semantic version such as `0.1.1`; the workflow builds Windows, macOS Apple Silicon, and macOS Intel bundles, then uploads them to a GitHub release tagged `v<version>`.
