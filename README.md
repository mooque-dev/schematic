# Schematic — Visualization of Maladaptive Schema

A clean, single-page website that gathers and presents the *Schematic* design-research
project (Allen Sung Kang · YSDN 4004 Design Workshop, 2016–2017) from the source files
in `~/Downloads/SCHEMA`.

## Run it
```bash
cd schematic
python3 -m http.server 4599
# open http://localhost:4599
```

The site presents the original 2016 project as a dated **archive**, wrapped in a curated
learning layer (domain structure, a guided finder, and external resources).

## Structure
```
index.html   Single-page site:
             Hero · About · Concept · Schemas · Studies · Resources · Archive
styles.css   Dark editorial theme
app.js       Sticky nav, scroll reveals, guided finder, accessible tooltips, lightbox
assets/
  img/       Brand mark (mark.svg / favicon.svg), OG social image (og.png), hero art
  schemas/   01–18.png — the 18 schema posters (from SC_1.0.pdf)
  schemas/th 01–18.jpg — compressed grid thumbnails (full PNGs load only in the lightbox)
  gallery/   Generative mesh art, visual essays, colour-treatment study
  thumbs/    Document cover previews + early layout study
  docs/      Viewable PDFs (Proposal, Monograph, Timeline, Poster set)
```

## Content & curation
- **Schemas** — the 18 early maladaptive schemas grouped into Young's **5 domains**
  (the posters are already numbered in domain order). Poster #10 reproduces the Enmeshment
  text in the original artwork; the site flags this and shows the standard definition.
- **Guided finder** — a client-side keyword matcher (`SCHEMAS` map in `app.js`) that points
  a described feeling to likely schemas. Nothing is sent anywhere. A conversational AI phase
  is planned but not built (would need a serverless proxy + guardrails).
- **Resources** — curated authoritative links (ISST directory, overviews, meta-analysis) plus
  a care note and crisis line (988), kept distinct from the 2016 bibliography.
- **Text** (About / Concept) is drawn from the original Research Proposal and Report — no
  placeholder copy. Poster images are `qlmanage`-rendered from the source PDFs.

To re-render the 18 schema posters + thumbnails from source:
```bash
# split SC_1.0.pdf into single pages, then:
qlmanage -t -s 1300 -o assets/schemas <page>.pdf
sips -s format jpeg -s formatOptions 82 --resampleWidth 820 assets/schemas/NN.png --out assets/schemas/th/NN.jpg
```
