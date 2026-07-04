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
index.html        Single-page site (Hero · About · Concept · Gallery · Documents · Sources)
styles.css        Dark editorial theme
app.js            Sticky nav, scroll reveals, gallery lightbox
assets/
  img/            Brand mark + hero art
  gallery/        Poster plates, generative mesh art, visual essays
  thumbs/         PNG previews auto-generated from the poster/document PDFs
  docs/           Viewable PDFs (Proposal, Monograph, Timeline, Poster set, plates)
```

## Content sources
- Text (About / Concept / Sources) is drawn from the original **Research Proposal**
  (`Kang_Proposal_DWS.pdf`) and **Report** (`DWSReport.odt`) — no placeholder Lorem Ipsum.
- Gallery images are the schema posters (`td/*.pdf`), mesh studies (`ti1/ti2.png`),
  and visual essays, previewed via `qlmanage`-generated PNGs.

To refresh a PDF preview:
`qlmanage -t -s 1400 -o assets/thumbs assets/docs/<file>.pdf`
