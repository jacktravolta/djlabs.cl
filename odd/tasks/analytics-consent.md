# Feature — Analytics consent gate

- **Feature id**: `analytics-consent-gate`
- **Repository**: `/home/test/test/landing.djlabs.cl-site`
- **Branch**: `main`
- **Production surface**: `djlabs.cl` and `www.djlabs.cl`
- **Analytics container**: `GTM-WZBZZHFV`

## Objective

Prevent Google Tag Manager and Google Analytics from loading until a visitor explicitly authorizes analytics. The site must remain fully usable when analytics is denied, and the visitor must be able to revoke a previous decision.

## Problem

`index.html` loaded `gtm.js` directly and included the GTM `<noscript>` iframe. Both paths began analytics collection without authorization. The `<noscript>` path was the more serious case because it loaded the container even when JavaScript was unavailable.

## Scope

### In scope

- Remove the direct GTM script and the GTM `<noscript>` iframe from `index.html`.
- Add `js/analytics-consent.js` and `css/analytics-consent.css`.
- Store the decision under `djlabs_analytics_consent` as `granted` or `denied`.
- Expose `window.__djlabsConsent.reset()` for reopening the choice.
- Keep the CSP in `index.html` and `_headers` synchronized without weakening it.

### Out of scope

- `sitemap.xml` and `robots.txt`.
- The other clone at `/home/test/test/djlabs-landing`.
- Push, PR, merge, or any production deployment.

## Privacy finding

A repository-wide search of `index.html` and `js/inline/index-*.js` found no privacy page, privacy section, legal notice, or privacy modal. The banner therefore has no invented or broken privacy link. Its own copy explains the purpose of aggregate measurement, states that visitors are not identified, says the site can be used normally without authorization, and tells visitors that they can change or revoke the decision from the banner.

## Implementation

- The inline `dataLayer`/`gtag` bootstrap remains unchanged and does not make a network request.
- `js/analytics-consent.js` injects `gtm.js` only after a stored `granted` decision.
- A `denied` decision prevents the container from loading on the current and subsequent visits.
- Revoking a previously granted decision stores `denied` and performs a clean reload, so the current document cannot keep sending analytics requests.
- After a decision is saved, the banner collapses to a persistent preference control that reopens the full choice.
- The reset API clears the stored decision. If analytics was active, it reloads before asking again.
- The banner uses the site's existing `--bg-*`, `--text*`, `--accent`, `--line*`, Space Grotesk, dark-surface, pill-button, and rounded-card visual language.
- Accessibility includes a named `region`, semantic heading and paragraph, status live region, keyboard-operable controls, visible focus, 44-pixel minimum targets, responsive layout, and reduced-motion handling.

## CSP review

No CSP expansion was required:

- The new stylesheet and script are same-origin and covered by `'self'`.
- `script-src` already allows `https://www.googletagmanager.com`.
- `connect-src` already allows Google Tag Manager, Google Analytics, and Analytics Google endpoints.
- No `'unsafe-inline'` was added to `script-src`.
- The `script-src`, `connect-src`, and `frame-src` directives are identical between the meta CSP and `_headers`.

## Acceptance criteria

1. With no stored decision, the site renders and makes zero GTM/Google Analytics requests.
2. The banner is present and explains what is measured, that people are not identified, that denial does not limit site use, and that the choice can be revoked.
3. `Autorizar analítica` stores `granted` and then loads GTM; GA4 sends its page-view request.
4. `Continuar sin analítica` stores `denied`; reloads keep GTM absent.
5. Revoking a granted decision performs a clean reload with no GTM script or analytics resource in the new document.
6. `window.__djlabsConsent.reset()` clears the decision and reopens the choice.
7. The site renders without console errors or CSP violations with analytics denied.
8. At 375 pixels the banner causes no horizontal overflow.

## Verification

### Focused static checks

```text
node --check js/analytics-consent.js
```

Result: exit 0.

```text
python3 <CSP/static assertion script>
```

Result: `static_assertions=PASS`; the direct GTM script and `<noscript>` iframe are absent, the new script and stylesheet are included once, the local-storage key and reset API are present, the relevant CSP directives match in both policy locations, `script-src` contains no `'unsafe-inline'`, and `sitemap.xml`, `robots.txt`, and `_headers` have no diff.

```text
git diff --check
```

Result: exit 0.

### Runtime harness

```text
python3 -m http.server 8124 --bind 127.0.0.1
FT_URL=http://localhost:8124/ CDP_PORT=9223 node /tmp/opencode/gtm/verificar-consent.mjs
```

Result: exit 0.

Observed output:

```text
=== ANTES de autorizar ===
peticiones de analitica: (ninguna ✅)
banner: existe=true, hayBoton=true
=== DESPUES de autorizar ===
peticiones de analitica:
  https://www.googletagmanager.com/gtm.js?id=GTM-WZBZZHFV
  https://www.google-analytics.com/g/collect?...&tid=G-9ZRZ6Z0ERC...
decision guardada: {"djlabs_analytics_consent":"granted"}
```

A supplementary CDP scenario covered deny, deny-after-reload, grant, grant-after-reload, revoke, reset, and a 375-pixel viewport. Observed results:

- Initial page: banner present, `decision=null`, no GTM script, zero analytics resources.
- Denied and denied reload: `decision=denied`, no GTM script, zero analytics resources.
- Granted: `decision=granted`, GTM script present, GA4 `collect` request present.
- Granted reload: GTM and GA4 loaded from the stored authorization.
- Revoked: `decision=denied`, no GTM script, zero analytics resources in the clean document.
- Reset: `decision=null`, full choice reopened, no GTM script, zero analytics resources.
- The React root rendered with one child in every scenario; no console errors, browser log errors, or CSP violations were observed.
- Mobile viewport: 375 pixels wide with no horizontal overflow.

## Rollback boundary

Remove `js/analytics-consent.js` and `css/analytics-consent.css`, then restore the prior GTM script and `<noscript>` block in `index.html`. `_headers`, `sitemap.xml`, and `robots.txt` require no rollback because they were not changed.

## Work-unit commit

The implementation commit is recorded after the behavior commit is created; this evidence document is then updated with its immutable hash in a separate documentation commit.

## Delivery note

The cohesive implementation adds more than the repository's 400-line review guideline (approximately 437 authored lines including the new JavaScript and CSS; 571 including this evidence document). Splitting the JavaScript and CSS from `index.html` would create broken intermediate states, so they remain one work unit. No PR was created.
