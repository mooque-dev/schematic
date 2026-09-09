# Changelog — Schematic

All notable changes to this project. Each entry is a push to `main`, which
auto-deploys to GitHub Pages (<https://mooque-dev.github.io/schematic/>).
Newest first. Dates are commit dates; hashes link the exact change.

The project began as a scattered archive of a 2016 YSDN 4004 design-research
project (*Schematic — Visualization of Maladaptive Schema*, by Allen Sung Kang)
and was rebuilt into a single-page, static, dependency-free educational site.

---

## 2026-09-09 — Enhancement pass (audit-driven)

A multi-dimension audit (8 reviewers → adversarial verification) surfaced 43
verified findings; 28 implemented across content, a11y, UX, perf, SEO, and fonts.

- **Content:** accurate "modes" definition; the three coping styles now taught
  (not just named); softened the absolute "all are destructive"; fixed two
  bibliography errors; date consistency.
- **A11y:** background made `inert` behind modals; fixed a Reflect focus-trap
  escape; restored the finder focus ring; fixed Archive heading order; removed a
  role=button-nested link; comprehensive reduced-motion; `color-scheme:dark`.
- **UX:** lightbox pages schemas/gallery as separate loops and shows a
  title + description caption; tile captions reveal on focus; finder empty-submit
  feedback + scroll-into-view.
- **Perf:** Studies grid thumbnails (~3.6 MB → ~0.5 MB).
- **Correctness:** finder keyword matching anchored to word starts (no more
  `lie`⊂believe false positives).
- **SEO:** JSON-LD, canonical, theme-color, apple-touch-icon, sitemap.xml,
  robots.txt, absolute OG image URLs; `<h1>` moved inside `<main>`.
- **Fonts:** variable `font-weight:300 700` range (true bold, no faux-synthesis).
- Added **CHANGELOG.md**; refreshed **CLAUDE.md** (audit + roadmap).

## 2026-07-12 — Hardening pass (P0) · `7d91303`

Security, privacy, and loading-performance foundation.

- **Self-hosted fonts.** Dropped Google Fonts + preconnect; Inter and Fraunces
  now ship as local variable `woff2` in `assets/fonts/` (one file each, ~120 KB).
  The page now makes **zero external requests** — verified.
- **Content-Security-Policy** `<meta>` added: `default-src 'self'; connect-src
  'none'; script-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'`.
  Enforces the privacy promise and boxes in the `innerHTML` builders.
- **Cumulative Layout Shift fixed.** Intrinsic `width`/`height` + `decoding="async"`
  on all 31 images; global `img{height:auto}` keeps them fluid.
- **Defensive JS.** Non-fatal `window.error` breadcrumb, null-guarded nav,
  lightbox init wrapped so a missing node can't halt the Reflect tool.
- **`404.html`** — branded, self-contained not-found page.

## 2026-07-12 — Project docs · `b0722ab`

- Added **`CLAUDE.md`**: a codebase audit (file size / security / performance)
  and a prioritized P0–P2 roadmap for structure, testing, and error handling.

## 2026-07-11 — Accessibility & legibility overhaul (WCAG 2.1 AA) · `9603aa1`

- **Contrast fixes** so all text meets AA: `--ink-faint` #7d7278 → #a49aa0
  (4.3:1 → 7.4:1); small-text accent → #e8557f (5.8:1); strengthened control borders.
- **Real mobile nav** — a hamburger disclosure menu (was hidden < 620px).
- **Back-to-top** button; **scroll-spy** active-nav with `aria-current`.
- **Touch targets** ≥ 40–48px; **skip link**.
- Hero definitions made tap/keyboard-accessible (no longer hover-only).
- **Reflect + lightbox**: focus traps, live-region announcements, `progressbar`
  role; **external links** announce "opens in new tab" + `rel="noopener noreferrer"`.
- Reduced-motion coverage extended (transitions + smooth-scroll disabled).
- Content correctness: fixed the dead ISST link, added a worldwide helpline
  (findahelpline.com) + crisis note, replaced an unverifiable citation, and
  clarified the reflection is not the validated YSQ.

## 2026-07-05 — Reflect self-check tool · `2fdb008`

- Added **Reflect**: a private, 2-minute, fully client-side self-check.
  18 first-person statements on a 1–4 scale → a five-domain profile (animated
  bars) + the schemas that stood out, each linking back to its poster.
  Nothing is stored or sent. Statements + scoring live in `app.js`.

## 2026-07-04 — Curation: structure, finder, resources, brand · `21afa21`

- Regrouped the 18 schemas into **Young's five domains** with per-band intros
  and domain jump-chips.
- Added the **guided finder** (client-side keyword → schema matcher).
- New **Resources** section (curated authoritative links) + a **care/crisis** note.
- Reframed the 2016 material as a dated **Archive**; corrected the bibliography.
- Minimal **brain/schema mark** (nav + footer), **favicon**, and a composed
  1200×630 **OG social image**; Open Graph / Twitter meta.
- Introduced compressed grid thumbnails (`assets/schemas/th/*.jpg`).

## 2026-07-04 — Gallery rebuild: all 18 schemas · `ff98cdb`

- Replaced the redundant early gallery (duplicate posters, vague captions) with
  **all 18 maladaptive-schema posters**, each captioned with name + two-letter
  code + a one-line summary, opening the full poster in a lightbox.
- De-duplicated the studies/process pieces; flagged poster #10's source text error.
- Trimmed ~17 MB of unreferenced assets from the working tree.

## 2026-07-04 — Deploy provisioning · `04ab884`, `6a3946b`

- Empty commits to retrigger the first GitHub Pages build (initial deploy
  returned "try again later" until provisioning finished). Also enabled Pages
  and renamed the default branch `master` → `main`.

## 2026-07-04 — Initial site · `e2c2184`

- First version: gathered the scattered SCHEMA source files (Illustrator/InDesign
  exports, PDFs, images, research docs) and laid them out as a clean, readable
  single-page site with Hero, About, Concept, Gallery, Documents, and Sources.
  Real project text pulled from the original proposal and report (no Lorem Ipsum).

---

### Notes

- **Deploys:** every push above triggered a GitHub Pages rebuild; all are live.
- **Not yet done** (tracked in `CLAUDE.md`): P1 testing/CI (link-checker,
  unit tests for scoring, Playwright + axe-core, Lighthouse budgets) and P2
  scale work (modularize `app.js`, WebP posters, git-history rewrite).
