/*
 * decks.js — every study set the app offers, built from the data files.
 *
 * A deck is: a list of items with ids, plus instructions for drawing a map
 * those ids can be clicked on. `build()` is lazy so we only project the
 * geometry for the deck actually being played.
 */
(function () {
  'use strict';

  // (map canvas dimensions come from mapview.js; panel rects below are in that space)

  /* Continent windows have to be explicit. Fitting to the features fails
   * because France's geometry includes French Guiana at 54°W and Russia
   * crosses the antimeridian, so the automatic bounds wrap the wrong way. */
  const CONTINENT_BOUNDS = {
    Europe: [[-25, 34], [45, 71]],
    Asia: [[25, -12], [150, 56]],
    Africa: [[-20, -36], [52, 38]],
    Americas: [[-170, -56], [-30, 72]],
    Oceania: [[110, -48], [180, -5]],
  };
  const WORLD_BOUNDS = [[-180, -58], [180, 84]];

  // Japan needs two frames: Okinawa is 1,000 km off the southwest corner.
  // Inset rects are fractions of the drawing canvas, so they survive the
  // canvas reshaping between a wide desktop frame and a tall phone one.
  // Japan's arc runs bottom-left to top-right, so the free corner is the
  // bottom-left when the frame is wide and the top-left when it is tall.
  const JP_MAIN = [[128.4, 30.0], [146.3, 45.9]];
  const JP_OKI = [[122.7, 23.9], [129.3, 27.4]];
  const JP_OKI_RECT = { x: 0.014, y: 0.694, w: 0.194, h: 0.203 };
  const JP_OKI_RECT_PORTRAIT = { x: 0.02, y: 0.015, w: 0.32, h: 0.162 };

  const registry = [];
  const byId = new Map();

  function define(deck) {
    registry.push(deck);
    byId.set(deck.id, deck);
    return deck;
  }

  const world = () => window.DATA_WORLD;
  const japan = () => window.DATA_JAPAN;
  const france = () => window.DATA_FRANCE;
  const cities = () => window.DATA_CITIES;
  const info = () => window.DATA_COUNTRY_INFO || {};
  const facts = () => window.DATA_FACTS || {};

  const num = n => (n == null ? null : n.toLocaleString('en-US'));

  /* ---------------------------------------------------------------- WORLD */
  function countryItems(filter) {
    return world().features.filter(filter).map(f => {
      const p = f.properties;
      const d = info()[p.id] || {};
      const rows = [];
      if (d.capital) rows.push(['Capital', d.capital]);
      if (d.population) {
        rows.push(['Population', num(d.population)
          + (d.popYear ? ' (' + d.popYear + ')' : '')]);
      }
      if (d.currency) {
        rows.push(['Currency', d.currency.name
          + (d.currency.symbol ? '  ' + d.currency.symbol : '')
          + '  · ' + d.currency.code]);
      }
      if (d.area) rows.push(['Area', num(d.area) + ' km²']);
      if (d.languages && d.languages.length) {
        rows.push([d.languages.length > 1 ? 'Languages' : 'Language', d.languages.join(', ')]);
      }
      rows.push(['Continent', p.region + (p.subregion ? ' · ' + p.subregion : '')]);
      if (d.phone || d.tld) {
        rows.push(['Dialling · TLD', [d.phone, d.tld].filter(Boolean).join('   ')]);
      }
      rows.push(['Neighbours', d.landlocked
        ? 'Landlocked — ' + (d.borders || []).length + ' land borders'
        : ((d.borders && d.borders.length)
          ? d.borders.length + ' land borders'
          : 'None — island or sole occupant')]);

      return { id: p.id, name: p.name, group: p.region, facts: rows };
    });
  }

  function worldDeck(id, title, subtitle, continent) {
    return define({
      id, title, subtitle, group: 'World', kind: 'shape', focusFill: 0.3,
      get items() { return countryItems(f => !continent || f.properties.region === continent); },
      build() {
        const all = world().features;
        const inDeck = continent ? all.filter(f => f.properties.region === continent) : all;
        const context = continent ? all.filter(f => f.properties.region !== continent) : [];
        return {
          projection: continent ? 'mercator' : 'naturalEarth',
          panels: [{
            id: 'main',
            features: inDeck,
            context,
            bounds: continent ? CONTINENT_BOUNDS[continent] : WORLD_BOUNDS,
          }],
        };
      },
    });
  }

  worldDeck('world-all', 'All countries', 'Every country on one map', null);
  worldDeck('world-eu', 'Europe', 'Countries of Europe', 'Europe');
  worldDeck('world-as', 'Asia', 'Countries of Asia', 'Asia');
  worldDeck('world-af', 'Africa', 'Countries of Africa', 'Africa');
  worldDeck('world-am', 'Americas', 'North, Central and South America', 'Americas');
  worldDeck('world-oc', 'Oceania', 'Australia and the Pacific', 'Oceania');

  /* ---------------------------------------------------------------- JAPAN */
  // `isOki` is passed separately because a region deck relabels every feature
  // with its region name, so we can no longer recognise Okinawa by its id.
  function japanPanels(features, isOki) {
    const oki = isOki || (f => f.properties.id === '47');
    return {
      projection: 'mercator',
      panels: [
        { id: 'main', features: features.filter(f => !oki(f)), bounds: JP_MAIN },
        {
          id: 'oki', features: features.filter(oki), bounds: JP_OKI,
          rect: JP_OKI_RECT, rectPortrait: JP_OKI_RECT_PORTRAIT,
          frame: true, label: 'Okinawa',
        },
      ],
    };
  }

  define({
    id: 'jp-pref', title: 'All 47 prefectures', subtitle: 'Hokkaido to Okinawa',
    group: 'Japan', kind: 'shape', focusFill: 0.35,
    get items() {
      return japan().prefectures.features.map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        sub: f.properties.nameLocal,
        group: f.properties.region,
        facts: [
          ['Region', f.properties.region],
          ['Capital', f.properties.capital],
          ['Prefecture no.', f.properties.id],
        ],
        note: (facts().jpPref || {})[f.properties.id],
      }));
    },
    build() { return japanPanels(japan().prefectures.features); },
  });

  // Chunked sub-decks. Learning 47 at once does not work; learning the seven
  // prefectures of Kanto and then moving on does.
  for (const region of ['Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu']) {
    if (region === 'Hokkaido') continue;             // a single prefecture is not a quiz
    define({
      id: 'jp-pref-' + region.toLowerCase(),
      title: region, subtitle: 'Prefectures of ' + region,
      group: 'Japan', kind: 'shape', focusFill: 0.35, indent: true,
      get items() {
        return japan().prefectures.features
          .filter(f => f.properties.region === region)
          .map(f => ({
            id: f.properties.id, name: f.properties.name, sub: f.properties.nameLocal,
            group: f.properties.region,
            facts: [['Region', f.properties.region], ['Capital', f.properties.capital]],
            note: (facts().jpPref || {})[f.properties.id],
          }));
      },
      build() {
        const all = japan().prefectures.features;
        const inDeck = all.filter(f => f.properties.region === region);
        const context = all.filter(f => f.properties.region !== region);
        const main = inDeck.filter(f => f.properties.id !== '47');
        const oki = inDeck.filter(f => f.properties.id === '47');
        const panels = [{
          id: 'main',
          features: main,
          context: context.filter(f => f.properties.id !== '47'),
          bounds: JP_MAIN,
        }];
        if (oki.length) {                          // only Kyushu contains Okinawa
          panels.push({
            id: 'oki', features: oki, bounds: JP_OKI, rect: JP_OKI_RECT,
            rectPortrait: JP_OKI_RECT_PORTRAIT, frame: true, label: 'Okinawa',
          });
        }
        return { projection: 'mercator', panels };
      },
    });
  }

  define({
    id: 'jp-region', title: 'The 8 regions', subtitle: 'Tohoku, Kanto, Kansai, Kyushu…',
    group: 'Japan', kind: 'shape', focusFill: 0.3,
    get items() {
      return japan().regions.map(r => ({
        id: r, name: r,
        facts: [['Prefectures', String(japan().prefectures.features
          .filter(f => f.properties.region === r).length)]],
        note: (facts().jpRegion || {})[r],
      }));
    },
    build() {
      // draw the prefectures, but every prefecture answers to its region name
      const regrouped = japan().prefectures.features.map(f => ({
        type: 'Feature',
        properties: { id: f.properties.region, name: f.properties.region, pref: f.properties.id },
        geometry: f.geometry,
      }));
      return japanPanels(regrouped, f => f.properties.pref === '47');
    },
  });

  define({
    id: 'jp-city', title: 'Major cities', subtitle: '55 largest cities of Japan',
    group: 'Japan', kind: 'dot', focusFill: 0.2,
    get items() {
      return cities().JP.map(c => ({
        id: 'jp-' + c.name,
        name: c.name,
        group: c.parent,
        facts: [
          ['Prefecture', c.parent],
          ['Population', num(c.pop)],
        ],
        note: (facts().jpCity || {})[c.name],
      }));
    },
    build() {
      const base = japanPanels(japan().prefectures.features);
      base.panels.forEach(p => { p.context = p.features; p.features = []; });
      base.dots = cities().JP.map(c => ({ id: 'jp-' + c.name, lat: c.lat, lon: c.lon }));
      return base;
    },
  });

  /* --------------------------------------------------------------- FRANCE */
  define({
    id: 'fr-region', title: 'The 13 regions', subtitle: 'Metropolitan regions',
    group: 'France', kind: 'shape', focusFill: 0.35,
    get items() {
      return france().regions.features.map(f => ({
        id: f.properties.id, name: f.properties.name,
        facts: [['Départements', String(france().departments.features
          .filter(d => d.properties.regionId === f.properties.id).length)]],
        note: (facts().frRegion || {})[f.properties.id],
      }));
    },
    build() {
      return { projection: 'mercator', panels: [{ id: 'main', features: france().regions.features }] };
    },
  });

  define({
    id: 'fr-dep', title: 'All 96 départements', subtitle: 'Ain to Val-d\'Oise',
    group: 'France', kind: 'shape', focusFill: 0.28,
    get items() {
      return france().departments.features.map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        sub: f.properties.id,
        group: f.properties.region,
        facts: [['Number', f.properties.id], ['Region', f.properties.region]],
        note: (facts().frDep || {})[f.properties.id],
      }));
    },
    build() {
      return { projection: 'mercator', panels: [{ id: 'main', features: france().departments.features }] };
    },
  });

  // Same chunking idea as Japan: 96 départements is hopeless in one sitting.
  const FR_REGION_ORDER = ['Île-de-France', 'Bretagne', 'Normandie', 'Hauts-de-France',
    'Grand Est', 'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Pays de la Loire',
    'Nouvelle-Aquitaine', 'Occitanie', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Corse'];
  for (const region of FR_REGION_ORDER) {
    define({
      id: 'fr-dep-' + slug(region),
      title: region, subtitle: 'Départements of ' + region,
      group: 'France', kind: 'shape', focusFill: 0.3, indent: true,
      get items() {
        return france().departments.features
          .filter(f => f.properties.region === region)
          .map(f => ({
            id: f.properties.id, name: f.properties.name, sub: f.properties.id,
            group: f.properties.region,
            facts: [['Number', f.properties.id], ['Region', f.properties.region]],
            note: (facts().frDep || {})[f.properties.id],
          }));
      },
      build() {
        const all = france().departments.features;
        return {
          projection: 'mercator',
          panels: [{
            id: 'main',
            features: all.filter(f => f.properties.region === region),
            context: all.filter(f => f.properties.region !== region),
          }],
        };
      },
    });
  }

  define({
    id: 'fr-city', title: 'Major cities', subtitle: '54 largest cities of France',
    group: 'France', kind: 'dot', focusFill: 0.2,
    get items() {
      return cities().FR.map(c => ({
        id: 'fr-' + c.name,
        name: c.name,
        group: c.parent,
        facts: [
          ['Département', c.parent],
          ['Population', num(c.pop)],
        ],
        note: (facts().frCity || {})[c.name],
      }));
    },
    build() {
      return {
        projection: 'mercator',
        dots: cities().FR.map(c => ({ id: 'fr-' + c.name, lat: c.lat, lon: c.lon })),
        panels: [{ id: 'main', features: [], context: france().departments.features }],
      };
    },
  });

  function slug(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  window.Decks = {
    all: () => registry,
    get: id => byId.get(id),
    groups: () => ['World', 'Japan', 'France'],
  };
})();
