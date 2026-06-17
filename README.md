# raphaelperezz.github.io

Personal mechanical-engineering portfolio for Raphael Perez.
Static site (HTML, CSS, vanilla JS). No build step.

## Local preview
```
python3 -m http.server 8000
```
Then open http://localhost:8000

## Deploy (GitHub Pages)
Served from the root of the `main` branch. Settings > Pages >
Source: "Deploy from a branch", Branch: `main` / `/ (root)`.
The `.nojekyll` file disables Jekyll processing so all files are served as-is.

External dependencies are loaded from CDNs (Google Fonts, KaTeX); everything
else (images, the Motion animation library, résumé) is vendored in this repo.
