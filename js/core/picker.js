/*
 * picker.js — choose what to practise by clicking it on the map.
 *
 * The whole point of the app is that these places live somewhere, so the set
 * you want to drill is a shape on a map, not a row in a list. Click to switch
 * a place off and it fades; click again and it comes back.
 *
 * Only the *asking* narrows. The map in a round still draws the whole deck and
 * "Name it" still pulls distractors from all of it, because a map that only let
 * you click your five chosen departments would turn Find it into a one-in-five
 * guess. Narrowing the asking, not the answering, is what makes it practice.
 */
(function () {
  'use strict';

  const el = window.h, esc = window.esc;

  /**
   * @param {object} deck        a deck from window.Decks
   * @param {function} onChange  called after every change with the new
   *                             selection (an array of ids, or null for "all")
   * @returns {HTMLElement}
   */
  function render(deck, onChange) {
    const items = deck.items;
    const allIds = items.map(i => i.id);
    const byId = new Map(items.map(i => [i.id, i]));
    // a Set of what is on; no stored selection means everything is on
    let chosen = new Set(window.Store.selection(deck.id) || allIds);

    const box = el('section', 'picker');

    const head = el('div', 'picker-head');
    const title = el('h3', null, 'Choose what to practise');
    title.style.margin = '0';
    const count = el('span', 'picker-count');
    head.append(title, count);
    box.appendChild(head);

    const blurb = el('p', 'picker-blurb');
    blurb.textContent = 'Click a place to switch it off; click it again to bring it back. '
      + 'Only the questions narrow — a round still draws the whole map, so this makes '
      + 'the set shorter rather than easier.';
    box.appendChild(blurb);

    /* ---------------------------------------------------------- shortcuts */
    const tools = el('div', 'btn-row');
    tools.style.margin = '0 0 12px';
    tools.append(
      quick('Select all', () => { chosen = new Set(allIds); commit(); }),
      quick('Clear all', () => { chosen = new Set(); commit(); }),
      quick('Invert', () => {
        chosen = new Set(allIds.filter(id => !chosen.has(id)));
        commit();
      }),
    );
    // only worth offering once there is a history to draw on
    const leeches = window.Store.leeches(deck.id, allIds);
    if (leeches.length) {
      tools.appendChild(quick('Just the ones I keep missing (' + leeches.length + ')', () => {
        chosen = new Set(leeches);
        commit();
      }));
    }
    box.appendChild(tools);

    /* ---------------------------------------------------------------- map */
    const mapWrap = el('div', 'map-wrap picker-map');
    const mapHost = el('div', 'map-host');
    mapWrap.appendChild(mapHost);
    mapWrap.appendChild(tools3());
    box.appendChild(mapWrap);

    const built = deck.build();
    const map = new window.MapView(mapHost);
    map.render(built.panels, built.projection);
    if (built.dots) map.renderDots(built.dots);

    mapWrap.querySelector('[data-zoom-in]').onclick = () => map.zoomBy(1.4);
    mapWrap.querySelector('[data-zoom-out]').onclick = () => map.zoomBy(1 / 1.4);
    mapWrap.querySelector('[data-zoom-reset]').onclick = () => map.resetZoom();

    // names on hover, because you cannot choose what you cannot identify
    map.setLabels(id => {
      const it = byId.get(id);
      if (!it) return null;
      return it.name + (chosen.has(id) ? '' : '  · off');
    });

    map.onPick = id => {
      if (!byId.has(id)) return;
      if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
      commit();
    };

    /* ------------------------------------------------------------- footer */
    const footer = el('div', 'picker-foot');
    const label = el('span', 'picker-foot-label', 'Practise these:');
    const play = el('div', 'btn-row');
    const find = el('button', 'btn btn-primary btn-sm', 'Find it  →');
    find.onclick = () => { location.hash = '#/play/' + deck.id + '/locate'; };
    const name = el('button', 'btn btn-sm', 'Name it  →');
    name.onclick = () => { location.hash = '#/play/' + deck.id + '/identify'; };
    play.append(find, name);
    footer.append(label, play);
    box.appendChild(footer);

    function quick(text, fn) {
      const b = el('button', 'btn btn-sm btn-ghost', text);
      b.type = 'button';
      b.onclick = fn;
      return b;
    }

    function tools3() {
      const t = el('div', 'map-tools');
      t.innerHTML = '<button data-zoom-in title="Zoom in">+</button>'
        + '<button data-zoom-out title="Zoom out">−</button>'
        + '<button data-zoom-reset title="Reset view">⤾</button>';
      return t;
    }

    /** Paint every item: on is the plain map colour, off is faded. */
    function paintMap() {
      for (const id of allIds) map.setState(id, chosen.has(id) ? null : 'off');
    }

    function paintCount() {
      const n = chosen.size, total = allIds.length;
      count.textContent = n === total
        ? 'All ' + total + ' in play'
        : (n === 0 ? 'Nothing selected' : n + ' of ' + total + ' in play');
      count.classList.toggle('is-subset', n !== total && n !== 0);
      count.classList.toggle('is-empty', n === 0);
      find.disabled = n === 0;
      name.disabled = n === 0;
    }

    function commit() {
      // a full selection is stored as "no selection", so places added to a deck
      // later are included rather than quietly missing
      const ids = chosen.size === allIds.length ? null : [...chosen];
      window.Store.setSelection(deck.id, ids);
      paintCount();
      paintMap();
      if (onChange) onChange(ids);
    }

    paintCount();
    paintMap();
    return box;
  }

  window.Picker = { render: render };
})();
