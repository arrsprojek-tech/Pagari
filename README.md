# NamaApp (GitHub Pages Ready, v2)

Static single-page app (React via CDN) — no build step needed.

## What changed
- Replaced **Recharts** with **Chart.js** to avoid UMD/global load issues on some Pages setups.
- Kept Tailwind + Babel via CDN (safe for demo).

## Deploy to GitHub Pages
1. Create repo `pagari-app` (Public) under `zidanramadhan-dev`.
2. Upload the **contents** of this zip to the repo root (not the zip file).
3. Go to **Settings → Pages**: Source = `Deploy from a branch`, Branch = `main`, Folder = `/ (root)`.
4. Open: `https://zidanramadhan-dev.github.io/pagari-app/`

> If you use a different branch (e.g., `gh-pages`), set **Settings → Pages** accordingly.
