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
index.html   One page: Hero · About · Concept · Schemas · Studies · Resources · Archive
styles.css   Dark editorial theme. Design tokens in :root (--ink*, --crimson*, --line*).
app.js       Six concerns in one IIFE-less file (see below).
assets/      img/ (mark, favicon, og, hero) · schemas/ (01–18.png full + th/ jpg thumbs)
             gallery/ · docs/ (PDFs) · thumbs/ (doc covers)
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
  Keep the finder/Reflect fully client-side. See the fonts finding below — the
  page itself is not yet 100% request-free.
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
- 🟡 **`innerHTML` in 6 spots (app.js: finder + Reflect results).** Currently
  fed **only constant data** (`SCHEMAS`/`DOMAINS`), so **not exploitable today** —
  but it's a latent XSS pattern. If any user/URL text ever flows into those
  templates, it becomes an injection. Prefer `textContent` / DOM building, or
  keep a strict "static-data-only" rule on these builders.
- 🟡 **Google Fonts is the only third-party dependency** (`fonts.googleapis.com`
  + `fonts.gstatic.com`). It leaks the visitor's IP/UA to Google on every load
  and is a supply-chain + privacy surface. It slightly undercuts the "nothing
  leaves your device" framing (true for *user data*, not for page load).
- 🟡 **No Content-Security-Policy.** A `<meta http-equiv="CSP">` would enforce
  the privacy promise (e.g. `connect-src 'none'`) and neutralize the innerHTML risk.

## Loading performance

- 🔴 **32 `<img>` with no `width`/`height` (0 of 32).** Causes layout shift (CLS)
  as images load. Add intrinsic dimensions or `aspect-ratio`.
- 🟡 **Render-blocking Google Fonts CSS**, 2 families × 4 weights (8 files).
  Has `display=swap` (good) but blocks first paint on a third party.
- 🟢 Grid images are compressed thumbnails; full posters and Studies art are
  `loading="lazy"`. No `decoding="async"` yet (minor).
- 🟢 CSS/JS unminified but tiny (~35 KB) — minification is marginal here.

---

# Prioritized roadmap — structure, testing, error handling

Ordered by impact ÷ effort. P0 = do first.

## P0 — correctness & cheap wins (hours)

1. **Fix CLS**: add `width`/`height` (or `aspect-ratio`) + `decoding="async"` to
   the 32 images. *(perf)*
2. **Self-host fonts**: subset Inter + Fraunces to `woff2`, drop the Google
   `<link>`s. Removes the third party → airtight privacy + faster first paint. *(security/perf)*
3. **Add a CSP meta** once fonts are local: `default-src 'self'; img-src 'self'
   data:; style-src 'self'; font-src 'self'; connect-src 'none'; base-uri 'none'`. *(security)*
4. **Defensive JS init**: wrap each `app.js` section so one missing node can't
   halt the whole script (guard clauses / `try…catch` per module) and add a
   `window.onerror` breadcrumb. *(error handling)*
5. **Add `404.html`** (branded, links home). *(UX)*

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
12. **WebP posters**: convert `schemas/*.png` → `.webp` (~60% smaller lightbox
    payload) with PNG fallback.
13. **Rewrite git history** (`git filter-repo`) to drop the ~11 MB of removed
    PDFs. **Destructive / force-push — coordinate before doing it.**
14. **Reconsider a build/SSG** (Astro/Eleventy) only if content stops fitting in
    one hand-authored `index.html`.

## Explicitly out of scope / not needed

- A JS framework, a server, or a database — the static model is correct for this.
- Heavy bundling for 35 KB of source.

> Note: items above are a **plan**, not yet implemented. Ask to execute any tier.
