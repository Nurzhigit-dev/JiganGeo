# MyGeoGame

A geography trainer for the things StudyGe puts behind its paywall: subnational
regions, big cities, and a proper GeoGuessr "how do I read this street" school.

Plain HTML, CSS and JavaScript. No build step, no framework, no account, no
network calls (except the optional panorama round). Progress lives in your
browser's `localStorage`.

---

## Running it

**Double-click `start.bat`.** It serves the folder on <http://localhost:8000>
and opens your browser.

You can also just open `index.html` directly — everything works from `file://`
except the panorama round, because browsers block requests to Mapillary from
local files.

### On a phone

The layout is responsive and the map is built for touch. Two things change on a
narrow screen:

- **The map canvas reshapes.** On a desktop it is a wide frame; on a phone it
  becomes a near-square one, sized from each map's own proportions so the
  content fills it instead of being letterboxed into a thin strip. Japan's
  Okinawa inset moves from the bottom-left corner to the top-left, following
  the free space.
- **Pinch to zoom, drag to pan.** The floating +/− buttons are hidden on touch
  — they sat exactly on top of Corsica — and a *Reset view* button appears in
  the question bar once you have zoomed.

To use it on your phone over your home wifi, run the server on your computer and
visit `http://<your-computer's-IP>:8000` from the phone. Progress is stored per
browser, so the phone keeps its own schedule.

Requires Python (for the server) and, if you want to rebuild the map data,
Node. Both are optional for day-to-day use.

---

## What's in it

### Maps

| Set | Items |
|---|---|
| World — all countries, and one deck per continent | 176 |
| Japan — the 8 regions | 8 |
| Japan — all 47 prefectures, plus a sub-deck per region | 47 |
| Japan — major cities | 55 |
| France — the 13 metropolitan regions | 13 |
| France — all 96 départements, plus a sub-deck per region | 96 |
| France — major cities | 54 |

Three modes per set:

- **Explore** — hover or tap anything and its name appears on the map, right
  under the pointer. Click for the full details. No scoring. Use this first.
- **Find it** — a name appears, you click it on the map, then confirm. The first
  click only marks your pick, turning it gold, and a small **Is this Bas-Rhin?**
  popover opens right next to it with *Yes* and *No*. It stays pinned to that
  spot through pan and zoom. A second click on the same place, or just Enter,
  also commits. Nothing is scored until you commit, so a misclick on a small
  département costs nothing. On a phone the popover gives way to a full-width
  bar pinned to the bottom of the screen, where a thumb can reach it. The marked
  shape is deliberately never named: being told what you just clicked would turn
  the mode into clicking around reading labels until the right name appeared.
- **Name it** — a shape lights up, you choose its name from five options.

Names stay hidden while a question is live and come back the moment you answer,
so you can read around the answer before moving on.

### What you get told about a place

Every answer, right or wrong, leaves a card on screen.

- **Countries** get a reference card: capital, population, currency, area,
  languages, dialling code and domain, continent, and how many countries they
  border.
- **Regions and cities** get the same kind of card plus one **Worth knowing**
  fact — 273 of them, one for every Japanese prefecture and region, every
  French région and département, and every city in both lists. They live in
  `data/facts.js` and are hand-written, so that is the file to edit when one
  reads badly or you learn a better one.

The per-region sub-decks matter more than they look. Learning 96 départements
in one sitting does not work; learning the five of Bretagne, then the eight of
Normandie, does. Start there and use the full deck as a review.

### Street School

The GeoGuessr half. Four parts:

- **The deduction funnel** — the order to check things in, and how much of the
  world each step eliminates. This is the part worth reading twice.
- **Clue diagrams** — bollards, road lines, utility poles, licence plates and
  signs, drawn side by side. All original SVG, no photographs.
- **Clue drill** — flashcards over the same diagrams, on the same scheduler as
  the maps.
- **Panorama round** — real street imagery from Mapillary, with the funnel
  pinned beside it as a checklist. Needs a free token, see below.

Six countries to start: **Japan, France, Brazil, Russia, USA, South Africa**.
They are chosen for contrast, not coverage — two drive on the left, two use
yellow centre lines, three use a script you can identify at a glance. Italy is
included as a contrast card in the bollard set, because a French bollard only
means anything next to an Italian one.

---

## How the scheduling works

Every item you answer goes into a Leitner box. A correct answer promotes it one
box and pushes it further out; a wrong answer knocks it straight back to box 1
so it returns before the session ends.

| Box | Comes back after |
|---|---|
| 1 | later today |
| 2 | 1 day |
| 3 | 3 days |
| 4 | 7 days |
| 5 | 16 days |
| 6 | 40 days |

A round pulls anything due first, then unseen items. "Learned" on the home
screen means box 3 or higher.

---

## Turning on the panorama round

Mapillary is free and does not ask for a card.

1. Sign in at <https://www.mapillary.com>
2. Go to **Dashboard → Developers → Register application**
3. Copy the **Client token** — it starts with `MLY|`
4. Paste it into **Progress → Settings**, or the prompt on the panorama page

The token is stored in your browser and is only ever sent to Mapillary. The
round must be served over `http://localhost`, not opened as a file.

Coverage is patchier than Google Street View, so a question occasionally comes
back empty — it picks a different area and retries.

---

## Adding to it

### A better fact about somewhere

`data/facts.js` is plain text keyed by region code or city name. Edit it and
reload — nothing needs rebuilding. A missing key just means no fact card.

### More countries in Street School

Open `data/meta.js`. Add an entry to `countries` following the shape of the
existing ones, then add `clues` entries pointing at diagram names. Diagrams live
in `js/core/diagrams.js` as plain SVG strings — copy a bollard and change the
colours. To include a country in the panorama round, add a few small search
boxes to `BOXES` in `js/modes/pano.js`.

Nothing needs rebuilding — reload the page.

### More geography

Map data is generated. `tools/raw/` holds the downloaded sources and
`tools/build-data.js` turns them into the `data/*.js` files:

```bash
node tools/build-data.js
```

Decks are declared in `js/core/decks.js`. Adding a country's regions means
dropping a GeoJSON into `tools/raw/`, adding a build step, and declaring a deck.
`tools/simplify.js` will thin oversized geometry:

```bash
node tools/simplify.js input.json output.json 0.004 4 0.0006
```

(arguments: tolerance in degrees, coordinate decimal places, minimum polygon
area — it took Japan's prefectures from 12.7 MB to 331 KB.)

---

## Notes on the data

A few decisions worth knowing about:

- **Okinawa is drawn in an inset.** It sits 1,000 km southwest of Kyushu, and
  fitting it into the same frame leaves mainland Japan tiny and surrounded by
  ocean — so the map does what Japanese atlases do.
- **Zooming targets the main landmass**, not the full shape. Tokyo prefecture
  legally extends to the Ogasawara islands 1,800 km out in the Pacific, so its
  bounding box is mostly sea.
- **The world map has 176 countries**, from Natural Earth's 110m data. Very
  small states (Monaco, San Marino, Malta, Andorra…) are not in it and are not
  really clickable at that scale anyway.
- **France is metropolitan only** — the five overseas départements are not
  included.
- **French plates are a soft clue.** Since the 2009 SIV system a driver can pick
  any département number, so the app says so rather than teaching it as a rule.

### Sources and licences

| Data | Source | Licence |
|---|---|---|
| Country borders | [world-atlas](https://github.com/topojson/world-atlas) / Natural Earth | Public domain |
| Country codes and continents | [ISO-3166 with regional codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes) | Public domain |
| Japanese prefectures | [dataofjapan/land](https://github.com/dataofjapan/land) | Open data |
| French regions and départements | [france-geojson](https://github.com/gregoiredavid/france-geojson) (from IGN) | Open data |
| French administrative mapping | [@etalab/decoupage-administratif](https://github.com/etalab/decoupage-administratif) | Licence Ouverte |
| City coordinates and populations | [GeoNames](https://www.geonames.org) `cities15000` | CC BY 4.0 |
| Country capitals, currencies, areas, languages | [mledoze/countries](https://github.com/mledoze/countries) | ODbL |
| Country populations | [World Bank](https://data.worldbank.org/indicator/SP.POP.TOTL) `SP.POP.TOTL` | CC BY 4.0 |
| Libraries | [d3-geo](https://github.com/d3/d3-geo), [d3-array](https://github.com/d3/d3-array), [topojson-client](https://github.com/topojson/topojson-client) | ISC / BSD |

The Street School content was written for this project, checked against these
guides:

- [GeoGuessr country identification: the complete clue guide](https://geoguessrguide.com/blog-geoguessr-country-identification.html)
- [GeoGuessr camera & car meta guide](https://geoguessrguide.com/blog-geoguessr-camera-meta-guide.html)
- [Geometas — Google car meta](https://geometas.com/metas/categories/google_car/)
- [Geomastr — bollards by country](https://geomastr.com/bollards/)
- [Vehicle registration plates of France](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_France) (the 2009 SIV change)

---

## Layout

```
index.html            page shell and script order
css/style.css         both themes
data/*.js             generated map data; hand-written meta.js and facts.js
js/vendor/            d3-geo, d3-array, topojson-client
js/core/dom.js        tiny DOM helpers
js/core/store.js      localStorage, Leitner scheduling
js/core/diagrams.js   the clue SVGs
js/core/mapview.js    SVG map: panels, zoom/pan, hit testing
js/core/decks.js      every study set
js/modes/mapquiz.js   explore / find it / name it
js/modes/school.js    funnel, diagrams, drill, country profiles
js/modes/pano.js      Mapillary round
js/app.js             router, home, progress
tools/                data pipeline and the dev server
```

Data files are loaded as plain `<script>` tags that assign to `window`, which is
why the whole thing works without a server.
