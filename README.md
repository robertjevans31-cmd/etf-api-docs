# ETF Holdings API — Documentation

Source for the public documentation site at
https://robertjevans31-cmd.github.io/etf-api-docs/, built with
[VitePress](https://vitepress.dev). Deployed independently from the main
API service (a separate static site on GitHub Pages) so documentation
stays available even if the API itself has an incident.

This is documentation content only — no application code, and no real API
keys or secrets anywhere in these files (every example uses the obviously
fake placeholder `etf_YOUR_API_KEY_HERE`).

## Local development

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build to .vitepress/dist
npm run preview   # preview the production build locally
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds
the site and publishes it to GitHub Pages automatically. No manual deploy
step.

## Source repo

The API this documents lives at
[robertjevans31-cmd/ETF-API](https://github.com/robertjevans31-cmd/ETF-API)
(private).
