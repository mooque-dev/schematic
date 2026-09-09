# CLAUDE.md — Schematic

Guidance for working in this repo, plus a codebase audit and roadmap
(audited 2026-07-04).

## What this is

A single-page, **static, dependency-free** website presenting *Schematic* — a
2016 design-research project visualizing the 18 early maladaptive schemas
(Young's schema model). No framework, no backend, no build step. Vanilla
HTML/CSS/JS. Deployed to GitHub Pages at
<https://mooque-dev.github.io/schematic/> (`main` branch, root).

## Commands

```bash
# Run locally
python3 -m http.server 4599            # → http://localhost:4599

# Deploy: just push. GitHub Pages auto-builds from main/.
git push origin main
# First-ever Pages deploy may 500 ("try again later") — retrigger with an
# empty commit; it clears once the site finishes provisioning.

# Re-render a schema poster from source (needs macOS qlmanage + sips)
qlmanage -t -s 1300 -o assets/schemas <single-page>.pdf
sips -s format jpeg -s formatOptions 82 --resampleWidth 820 \
     assets/schemas/NN.png --out assets/schemas/th/NN.jpg
```

## Architecture

```
index.html      One page: Hero · About · Concept · Schemas · Studies · Resources · Archive
404.html        Branded, self-contained not-found page (links to /schematic/).
styles.css      Dark editorial theme. Design tokens in :root (--ink*, --crimson*, --line*).
app.js          Nine concerns in one flat file (see below).
CHANGELOG.md    Full push/deploy history.
sitemap.xml · robots.txt   Static SEO (project-page: robots at a subpath is advisory only).
assets/  img/    mark, favicon, apple-touch-icon, og, hero (logo.png)
         fonts/  self-hosted Inter + Fraunces variable woff2 (latin subset, one face each, 300–700 range)
         schemas/  01–18.png (full, lightbox-only) + th/*.jpg (grid thumbs)
         gallery/  originals (lightbox) + th/*.jpg (Studies grid thumbs) · docs/ (PDFs) · thumbs/
```

`app.js` sections, in order: (1) nav scroll state + back-to-top,
(2) mobile nav toggle, (3) scroll-spy `aria-current`, (4) external-link
hardening, (5) reveal-on-scroll, (6) accessible term tooltips,
(7) guided finder (`SCHEMAS` keyword map + scoring), (8) lightbox,
(9) Reflect self-check (`STATEMENTS` + `DOMAINS` + scoring).

## Conventions & gotchas

- **Color tokens are contrast-tuned.** `--ink-faint` = #a49aa0 (7.4:1),
  `--crimson-soft` = #e8557f (5.8:1) for small text; `--crimson-art` #e23a6d is
  the saturated brand hue for graphics only. Don't reintroduce #7d7278 (fails AA).
- **Reveal-on-scroll uses `opacity:0` until JS adds `.in`.** Consequence for
  automated screenshots: a programmatic scroll past the fold renders **black**
  because the observer hasn't fired. To screenshot a lower section, force
  `document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))` and
  hide the sections above it so the target sits at scroll 0.
- **Full schema PNGs (`assets/schemas/NN.png`, ~1 MB) load only in the
  lightbox** (`data-full`); the grid uses `th/NN.jpg` thumbnails. Keep it that way.
- **Privacy is a product promise** ("nothing you type or tap is sent anywhere").
  Keep the finder/Reflect fully client-side. As of the P0 pass the page makes
  **zero external requests** (fonts are self-hosted in `assets/fonts/`, enforced
  by a CSP with `connect-src 'none'`). Don't reintroduce a CDN/Google-Fonts link.
- Poster #10 (Entitlement) reproduces the Enmeshment text in the source art;
  it's flagged in a footnote — intentional, don't "fix" the image.

---

# Audit — file size, security, loading performance

## File size

| Area | Size | Note |
|---|---|---|
| Working tree | ~28 MB | Mostly poster imagery |
| `.git` history | **41 MB** | Bloated by deleted PDFs (SC_1.x, DWS03, M8* ≈ 11 MB still in history) |
| `assets/schemas/*.png` | 20 MB | 18 × ~1 MB full posters — lightbox-only |
| `assets/schemas/th/*.jpg` | 2.2 MB | Grid thumbnails (good) |
| Source (html+css+js) | ~55 KB | 1,554 lines total |

- 🟠 **Git history holds ~11 MB of files already deleted from the tree.** Every
  clone/CI checkout pays for it. Fix = history rewrite (destructive).
- 🟢 Initial page weight is already reasonable: HTML/CSS/JS ≈ 55 KB + thumbnails,
  not the 20 MB of full posters.

## Security (static site — low overall risk)

- 🟢 No backend, no secrets committed, no `eval`/`document.write`, all links
  `https`, every `target="_blank"` has `rel="noopener"` (JS also adds `noreferrer`).
- 🟢 **CSP added** (`<meta http-equiv>`, P0): `default-src 'self'; connect-src
  'none'; script-src 'self'; font-src 'self'; base-uri 'none'; form-action
  'none'`. Enforces the privacy promise and neutralizes the innerHTML risk.
- 🟢 **Google Fonts removed** — Inter + Fraunces self-hosted as local woff2 in
  `assets/fonts/` (both are variable → one file each). Page now makes **zero
  external requests** (verified).
- 🟡 **`innerHTML` in 6 spots (app.js: finder + Reflect results).** Still fed
  **only constant data** (`SCHEMAS`/`DOMAINS`) → not exploitable, and now also
  boxed in by the CSP. Keep the "static-data-only" rule on these builders.

## Loading performance

- 🟢 **CLS fixed (P0):** all 31 content `<img>` now carry intrinsic
  `width`/`height` + `decoding="async"`; global `img{height:auto}` keeps them fluid.
- 🟢 **Fonts self-hosted + preloaded (P0):** no render-blocking third-party CSS;
  `font-display:swap`; ~120 KB for both families.
- 🟢 Grid images are compressed thumbnails; full posters and Studies art are
  `loading="lazy"`.
- 🟢 CSS/JS unminified but tiny (~35 KB) — minification is marginal here.

---

# Enhancement pass — 2026-09-09

A multi-dimension audit (8 reviewers → adversarial verify) produced 43 verified
findings; **28 were implemented** this pass (commit follows this date). Highlights:

- **Content:** rewrote the garbled "modes" construct into an accurate definition;
  taught the three coping styles (surrender / avoidance / overcompensation) as a
  gloss in card II; softened "all are destructive" → "self-defeating to some
  degree"; fixed two bibliography errors (Bartlett co-author; Young year/order);
  date consistency (2016–2017).
- **A11y:** background landmarks (`nav`/`main`/`.footer`/`#to-top`) made `inert`
  while a modal is open (`setBgInert`); fixed the Reflect focus-trap escape when
  the self-disabling Back button blurred to `<body>`; restored the finder input
  focus ring; fixed heading order (Archive gained a "Documents" `h3`); removed the
  footnote `<a>` nested in a role=button; reduced-motion made comprehensive;
  added `color-scheme:dark`.
- **UX:** lightbox pages schemas and gallery as **separate loops**; lightbox
  caption now shows **title + one-line description** (was number+title only, built
  with `textContent`); tile captions reveal on focus; finder gives empty-submit
  feedback and scrolls results into view.
- **Perf:** Studies grid uses `assets/gallery/th/*.jpg` thumbnails (~3.6 MB → ~0.5 MB).
- **Correctness:** finder keyword matching **anchored to word starts** — kills
  false positives (`lie`⊄believe, `die`⊄studied) while keeping stems (`abandon`→abandoned).
- **SEO:** JSON-LD `CreativeWork`, canonical, theme-color, apple-touch-icon,
  sitemap.xml/robots.txt, absolute OG/Twitter image URLs + og extras; moved
  `<h1>`/hero inside `<main>`.
- **Fonts:** collapsed to one variable face per family with `font-weight:300 700`
  (true bold for `<strong>`, no faux-synthesis).

Verified in-browser: zero external requests preserved, no CSP violations (the
JSON-LD data block is not subject to `script-src`), no console errors, all
interactive flows green.

---

# Prioritized roadmap — structure, testing, error handling

Ordered by impact ÷ effort. P0 = do first.

## P0 — correctness & cheap wins — ✅ DONE (2026-07-12)

1. ✅ **CLS fixed**: `width`/`height` + `decoding="async"` on all 31 images;
   `img{height:auto}` keeps them responsive. *(perf)*
2. ✅ **Fonts self-hosted**: Inter + Fraunces variable woff2 in `assets/fonts/`,
   preloaded, Google links dropped → zero external requests. *(security/perf)*
3. ✅ **CSP meta added** with `connect-src 'none'` etc. (see Security). *(security)*
4. ✅ **Defensive JS**: `window.error` breadcrumb, null-guarded nav, lightbox
   init wrapped so a missing node can't halt Reflect. *(error handling)*
5. ✅ **`404.html`** — branded, self-contained, links home. *(UX)*

## P1 — testing & guardrails (a day) — catches the bugs we actually shipped

6. **Link checker in CI** (`lychee` or `linkinator`). We shipped a **dead ISST
   link twice**; this class of bug is now auto-caught.
7. **Extract pure logic** — `scoreSchemas()` (finder) and the Reflect
   domain/schema scoring — into a small ES module and **unit-test** with
   `node:test` or Vitest (deterministic, no DOM).
8. **Playwright e2e + `axe-core`**: Reflect happy-path, keyboard/focus-trap,
   mobile-nav toggle, and an automated a11y scan (locks in the WCAG work).
9. **Lighthouse CI** with budgets (perf / a11y / best-practices ≥ 90).
10. **GitHub Actions** running 6–9 on every PR to `main`.

## P2 — structure & scale (when it grows)

11. **Modularize `app.js`** → `src/js/{nav,finder,reflect,lightbox,a11y}.js`
    + a tiny `esbuild` bundle/minify step. Add `package.json` with scripts
    (`dev`, `build`, `test`, `lint`).
12. **WebP posters + hero mark**: convert `schemas/*.png` and `img/logo.png` →
    `.webp` (~60% smaller) with `<picture>` PNG fallback. **Needs `cwebp` or
    `pngquant`** — macOS `sips` here has no WebP encoder, so this was deferred.
13. **Rewrite git history** (`git filter-repo`) to drop the ~11 MB of removed
    PDFs. **Destructive / force-push — coordinate before doing it.**
14. **Reconsider a build/SSG** (Astro/Eleventy) only if content stops fitting in
    one hand-authored `index.html`.

## Remaining polish (low-severity, deferred from the 2026-09-09 audit)

- Throttle the two scroll handlers with `requestAnimationFrame` (both read
  layout — `offsetTop`/`scrollHeight` — on every scroll event).
- `@media (prefers-contrast: more)`: strengthen hairline borders + faint text.
- Term tooltips: make dismissable on `Esc` / hoverable (WCAG 1.4.13).
- Code hygiene (no-build-safe): factor the two focus-trap blocks and the two
  result-button builders into shared helpers; retire the unused `--crimson-art`
  token drift; `jumpToSchema`/lightbox rely on positional DOM order.
- Schema codes `ETI`/`ISI` break the 2-letter convention — left as the author's
  original poster codes (fidelity); revisit only if standardizing.

## Explicitly out of scope / not needed

- A JS framework, a server, or a database — the static model is correct for this.
- Heavy bundling for 35 KB of source.

> Status: **P0** (2026-07-12) and the **2026-09-09 enhancement pass** are implemented.
> P1 (testing/CI) and P2 (scale) are still a plan — ask to execute a tier.
