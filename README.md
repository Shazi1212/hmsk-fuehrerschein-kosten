# Führerschein-Kosten-Rechner

Driving school price lists in Germany are hard to compare and the exam and office fees come on top; this calculator shows what a Führerschein realistically costs in total, as a range with every item broken down.

**Use it online:** [hmsk.life/de/tools/fuehrerschein-kosten](https://hmsk.life/de/tools/fuehrerschein-kosten/) (runs in your browser, nothing is sent anywhere).

## What it does

- Classes B, B197, BE, A1, A2, A, AM and Mofa, each with what it requires (theory/practical test, special drives, eye test, first aid, licence office).
- Official TÜV/DEKRA exam fees from the GebOSt (valid since 31 Jan 2024): theory 24.99, practical 129.83 (B, B197, BE, AM) or 162.67 (A1, A2, A), Mofa test 26.54.
- Minimum special drives from Annex 4 FahrschAusbO (A1, A2, A, B: 5 country road, 4 motorway, 3 night; B to BE: 3, 1, 1), editable to try the planned reform.
- Driving school prices as low / typical / high **estimates**, scaled by an estimated price level per Bundesland and town size.
- Every price can be replaced with the driving school's own quote; failed theory or practical tests add retake costs.
- Status of the 2026 driving licence reform as of 19 October 2026 (cabinet decision 20 May 2026, not in force yet).
- German and English, inputs saved in your browser and in the URL (share link), print view.

All figures live in [`public/data.js`](public/data.js): official ones with their source, estimates marked as such. Not a quote.

## Quick start

No build step, no dependencies. Serve `public/` with any static web server:

```sh
python3 -m http.server 8080 --directory public
# open http://localhost:8080/
```

Run the tests (Node.js 20+):

```sh
node --test tests/
```

The tests check class B totals worked out by hand, the official fees, the regional factor, own-quote overrides, the class rules (BE, Mofa, B197), retakes and that every class computes.

## Files

| File | What |
|---|---|
| `public/data.js` | official fees, special drives, class rules, price estimates, regional factors, sources |
| `public/calc.js` | pure calculation, no DOM |
| `public/i18n.js` | German and English texts |
| `public/app.js`, `index.html`, `app.css` | the UI |

To self-host, set `LINK_BASE` in `public/data.js` if the top-strip links should point somewhere other than hmsk.life. Fonts (Martian Mono, Geist; SIL Open Font License) are in `public/assets/fonts/`.
