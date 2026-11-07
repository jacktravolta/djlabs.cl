# landing.djlabs.cl

Standalone GitHub Pages site for the Don Jack Labs landing page.

**Live URL:** https://djlabs.cl/ (canonical domain)
Fallback URL: https://jacktravolta.github.io/landing.djlabs.cl/

## What this repo is

A single self-contained `index.html` (React 18 production bundle, no build step,
no external assets). It is served as-is by GitHub Pages.

- `CNAME` — the custom domain (`djlabs.cl`). GitHub Pages serves this repo at
  the root of that domain and issues the TLS certificate for it.
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

The script copies `index.html`, writes `CNAME`, adds `.nojekyll`, commits and
pushes to `main`, which triggers the GitHub Pages build.

## DNS (Cloudflare)

The zone `djlabs.cl` is on Cloudflare (`chuck.ns.cloudflare.com` /
`melissa.ns.cloudflare.com`). Records required for GitHub Pages:

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| AAAA | `@` | `2606:50c0:8000::153` | DNS only |
| AAAA | `@` | `2606:50c0:8001::153` | DNS only |
| AAAA | `@` | `2606:50c0:8002::153` | DNS only |
| AAAA | `@` | `2606:50c0:8003::153` | DNS only |
| CNAME | `www` | `jacktravolta.github.io` | DNS only |

**Keep the apex records as "DNS only" (grey cloud).** GitHub must be able to
verify the domain and issue its own certificate for `djlabs.cl`. If the records
are proxied, GitHub's domain check can fail and the certificate is never
issued. If you do enable the orange cloud, set SSL/TLS mode to **Full
(strict)** — `Flexible` creates a redirect loop with GitHub's HTTPS
enforcement.

## Contact form

The form posts to the contact API. The endpoint is resolved at runtime by
`contactEndpoint()`:

- `window.__API_BASE__` overrides the base URL (default `https://api.djlabs.cl`).
- On local hosts (`localhost`, `127.0.0.1`) it uses the same-origin `/contact`
  proxy, which avoids CORS during development.
- If the API is unreachable (network error, `404`, `405`) the form shows a
  WhatsApp fallback link instead of a dead end.

> **Note:** the API's CORS allowlist (`cors.origins` in the gitignored
> `config/config.php` on the server) must include `https://djlabs.cl` — and the
> other product origins (`leydatos.djlabs.cl`, `laboral.djlabs.cl`,
> `chatcorporativo.djlabs.cl`, `cotiza.djlabs.cl`) as they go live — or the
> browser will block the request.
