# landing.djlabs.cl

Standalone GitHub Pages site for the Don Jack Labs landing page.

**Live URL:** https://jacktravolta.github.io/landing.djlabs.cl/

## What this repo is

A single self-contained `index.html` (React 18 production bundle, no build step,
no external assets). It is served as-is by GitHub Pages.

- `.nojekyll` — disables Jekyll processing so the HTML is served untouched.
- No `package.json`, no bundler, no dependencies. Push `index.html` and you are
  done.

## Source of truth

This repository is a **publish target**, not the source of truth. The source
lives in the private monorepo:

```
controldecarroceria/djlabs.cl/index.html
```

To publish a change:

```bash
cd controldecarroceria/djlabs.cl
./publish.sh
```

The script copies `index.html`, adds `.nojekyll`, commits and pushes to `main`,
which triggers the GitHub Pages build.

## Contact form

The form posts to the contact API. The endpoint is resolved at runtime by
`contactEndpoint()`:

- `window.__API_BASE__` overrides the base URL (default `https://api.djlabs.cl`).
- On local hosts (`localhost`, `127.0.0.1`) it uses the same-origin `/contact`
  proxy, which avoids CORS during development.
- If the API is unreachable (network error, `404`, `405`) the form shows a
  WhatsApp fallback link instead of a dead end.

> **Note:** the API's CORS allowlist must include the Pages origin
> (`https://jacktravolta.github.io`) for the live form to work.
