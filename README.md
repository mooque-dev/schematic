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

## Structure
```
index.html        Single-page site
                  (Hero · About · Concept · Schemas · Studies · Documents · Sources)
styles.css        Dark editorial theme
app.js            Sticky nav, scroll reveals, gallery lightbox
assets/
  img/            Brand mark
  schemas/        01–18.png — the eighteen schema posters (from SC_1.0.pdf)
  gallery/        Generative mesh art, visual essays, colour-treatment study
  thumbs/         Document cover previews + early layout study
  docs/           Viewable PDFs (Proposal, Monograph, Timeline, Poster set)
```

## Content
- **Schemas** — all 18 early maladaptive schemas (Young's model), each shown as its own
  poster with a name, two-letter code, and a one-line summary transcribed from the artwork.
  Note: the original poster #10 (Entitlement / Grandiosity) reproduces the Enmeshment text;
  the site flags this and shows the standard definition.
- **Text** (About / Concept / Sources) is drawn from the original **Research Proposal**
  (`Kang_Proposal_DWS.pdf`) and **Report** (`DWSReport.odt`) — no placeholder Lorem Ipsum.
- Poster images are `qlmanage`-rendered from the source PDFs.

To re-render the 18 schema posters from source:
```bash
# split SC_1.0.pdf into pages, then thumbnail each:
qlmanage -t -s 1300 -o assets/schemas <single-page>.pdf
```
