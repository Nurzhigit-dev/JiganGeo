/*
 * picker.js — choose which items of a deck are in play.
 *
 * Only the *questions* are narrowed. The map still draws the whole deck and
 * "Name it" still offers distractors from all of it, because a map that only
 * lets you click your five chosen départements turns Find it into a one-in-five
 * guess. Narrowing the asking, not the answering, is what makes it practice.
 */
(function () {
  'use strict';

  const el = window.h, esc = window.esc;

  /**
   * @param {object} deck      a deck from window.Decks
   * @param {function} onChange called after every change, with the new
   *                            selection (an array of ids, or null for "all")
   * @returns {HTMLElement}
   */
  function render(deck, onChange) {
    const items = deck.items;
    const allIds = items.map(i => i.id);
    // a Set of what is on; an empty picker means everything is on
    let chosen = new Set(window.Store.selection(deck.id) || allIds);
    let query = '';

    const box = el('section', 'picker');

    const head = el('div', 'picker-head');
    const title = el('h3', null, 'Choose what to practise');
    title.style.margin = '0';
    const count = el('span', 'picker-count');
    head.append(title, count);
    box.appendChild(head);

    const blurb = el('p', 'picker-blurb');
    blurb.textContent = 'Questions come only from what is switched on. The map '
      + 'still shows everything, so narrowing this makes the set shorter, not easier.';
    box.appendChild(blurb);

    /* ---------------------------------------------------------- controls */
    const tools = el('div', 'picker-tools');

    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'picker-search';
    search.placeholder = 'Filter by name…';
    search.autocomplete = 'off';
    search.oninput = () => { query = search.value.trim().toLowerCase(); paintList(); };
    tools.appendChild(search);

    const btns = el('div', 'btn-row');
    btns.append(
      quick('All', () => { chosen = new Set(allIds); commit(); }),
      quick('None', () => { chosen = new Set(); commit(); }),
      quick('Invert', () => {
        chosen = new Set(allIds.filter(id => !chosen.has(id)));
        commit();
      }),
    );
    // only worth offering once there is a history to draw on
    const leeches = window.Store.leeches(deck.id, allIds);
    if (leeches.length) {
      btns.appendChild(quick('Ones I keep missing (' + leeches.length + ')', () => {
        chosen = new Set(leeches);
        commit();
      }));
    }
    tools.appendChild(btns);
    box.appendChild(tools);

    /* -------------------------------------------------------------- list */
    const list = el('div', 'picker-groups');
    box.appendChild(list);

    function quick(text, fn) {
      const b = el('button', 'btn btn-sm btn-ghost', text);
      b.type = 'button';
      b.onclick = fn;
      return b;
    }

    /** Items bucketed by their `group`, in first-seen order. */
    function grouped() {
      const buckets = new Map();
      for (const it of items) {
        const key = it.group || '';
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(it);
      }
      return buckets;
    }

    function matches(it) {
      if (!query) return true;
      return it.name.toLowerCase().includes(query)
        || String(it.id).toLowerCase().includes(query)
        || (it.sub || '').toLowerCase().includes(query);
    }

    function paintList() {
      list.innerHTML = '';
      let shown = 0;

      for (const [group, bucket] of grouped()) {
        const visible = bucket.filter(matches);
        if (!visible.length) continue;
        shown += visible.length;

        const wrap = el('div', 'picker-group');
        if (group) {
          const on = visible.filter(it => chosen.has(it.id)).length;
          const h = el('button', 'picker-group-head');
          h.type = 'button';
          h.innerHTML = '<span>' + esc(group) + '</span>'
            + '<span class="picker-group-n">' + on + '/' + visible.length + '</span>';
          // clicking the heading turns the whole group on, or off if it is full
          h.onclick = () => {
            const all = on === visible.length;
            for (const it of visible) {
              if (all) chosen.delete(it.id); else chosen.add(it.id);
            }
            commit();
          };
          wrap.appendChild(h);
        }

        const chips = el('div', 'picker-chips');
        for (const it of visible) {
          const chip = el('button', 'picker-chip' + (chosen.has(it.id) ? ' is-on' : ''));
          chip.type = 'button';
          chip.textContent = it.name;
          chip.setAttribute('aria-pressed', chosen.has(it.id) ? 'true' : 'false');
          chip.onclick = () => {
            if (chosen.has(it.id)) chosen.delete(it.id); else chosen.add(it.id);
            commit();
          };
          chips.appendChild(chip);
        }
        wrap.appendChild(chips);
        list.appendChild(wrap);
      }

      if (!shown) {
        const none = el('p', 'answer-sub');
        none.textContent = 'Nothing matches “' + query + '”.';
        list.appendChild(none);
      }
    }

    function paintCount() {
      const n = chosen.size, total = allIds.length;
      count.textContent = n === total
        ? 'Practising all ' + total
        : (n === 0 ? 'Nothing selected' : 'Practising ' + n + ' of ' + total);
      count.classList.toggle('is-subset', n !== total && n !== 0);
      count.classList.toggle('is-empty', n === 0);
    }

    function commit() {
      // a full selection is stored as "no selection", so later additions to a
      // deck are included rather than quietly missing
      const ids = chosen.size === allIds.length ? null : [...chosen];
      window.Store.setSelection(deck.id, ids);
      paintCount();
      paintList();
      if (onChange) onChange(ids);
    }

    paintCount();
    paintList();
    return box;
  }

  window.Picker = { render: render };
})();
