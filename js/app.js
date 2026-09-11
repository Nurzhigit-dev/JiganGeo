/*
 * app.js — hash router, deck index, and the progress screen.
 */
(function () {
  'use strict';

  const el = window.h, esc = window.esc;
  const root = document.getElementById('app');

  /* ------------------------------------------------------------- theme */
  function applyTheme() {
    const pref = window.Store.setting('theme') || 'auto';
    const dark = pref === 'dark'
      || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  document.getElementById('theme-toggle').onclick = () => {
    const cur = window.Store.setting('theme') || 'auto';
    window.Store.setting('theme', cur === 'dark' ? 'light' : 'dark');
    applyTheme();
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  applyTheme();

  /* ------------------------------------------------------------ router */
  const routes = [
    [/^\/?$/, () => home()],
    [/^\/deck\/([^/]+)$/, m => deckView(m[1])],
    [/^\/play\/([^/]+)\/([^/]+)$/, m => window.MapQuiz.start(root, m[1], m[2])],
    [/^\/school$/, () => window.School.index(root)],
    [/^\/school\/funnel$/, () => window.School.funnel(root)],
    [/^\/school\/clues$/, () => window.School.clues(root)],
    [/^\/school\/drill$/, () => window.School.drill(root)],
    [/^\/school\/pano$/, () => window.Pano.view(root)],
    [/^\/school\/country\/([A-Z]{2})$/, m => window.School.country(root, m[1])],
    [/^\/progress$/, () => progress()],
  ];

  function route() {
    const path = (location.hash || '#/').slice(1) || '/';
    root.className = 'app';
    window.scrollTo(0, 0);
    for (const [re, fn] of routes) {
      const m = path.match(re);
      if (m) { markNav(path); fn(m); return; }
    }
    root.innerHTML = '<div class="empty">Nothing here. <a href="#/">Back to the decks</a>.</div>';
  }

  function markNav(path) {
    for (const a of document.querySelectorAll('.topnav a')) {
      const target = a.getAttribute('href').slice(1);
      const active = target === '/'
        ? (path === '/' || path.startsWith('/deck') || path.startsWith('/play'))
        : path.startsWith(target);
      a.classList.toggle('is-active', active);
    }
  }

  window.addEventListener('hashchange', route);

  /* -------------------------------------------------------------- home */
  function home() {
    root.innerHTML = '';
    root.appendChild(el('h1', null, 'What are we learning today?'));
    const lede = el('p', 'lede');
    lede.textContent = 'Pick a set. Everything you answer is scheduled — anything you get '
      + 'wrong comes back soon, anything you keep getting right comes back much later.';
    root.appendChild(lede);

    for (const group of window.Decks.groups()) {
      const decks = window.Decks.all().filter(d => d.group === group);
      if (!decks.length) continue;

      const head = el('div', 'section-head');
      head.innerHTML = '<h2>' + esc(group) + '</h2>';
      const due = decks.reduce((n, d) =>
        n + window.Store.progress(d.id, d.items.map(i => i.id)).due, 0);
      const count = el('span', 'count');
      count.textContent = due ? due + ' due for review' : decks.length + ' sets';
      head.appendChild(count);
      root.appendChild(head);

      const grid = el('div', 'deck-grid');
      for (const d of decks) grid.appendChild(deckCard(d));
      root.appendChild(grid);
    }

    const head = el('div', 'section-head');
    head.innerHTML = '<h2>Street School</h2>';
    root.appendChild(head);
    const g = el('div', 'deck-grid');
    const card = el('button', 'deck');
    card.type = 'button';
    card.innerHTML = '<div class="ring-wrap" style="display:grid;place-items:center;'
      + 'font-size:22px">🛣️</div>'
      + '<div class="deck-body"><div class="deck-title">Read a street scene</div>'
      + '<div class="deck-sub">The funnel, clue diagrams and drills</div></div>';
    card.onclick = () => { location.hash = '#/school'; };
    g.appendChild(card);
    root.appendChild(g);
  }

  function deckCard(deck) {
    const ids = deck.items.map(i => i.id);
    const p = window.Store.progress(deck.id, ids);
    const pct = p.total ? Math.round(p.learned / p.total * 100) : 0;

    const card = el('button', 'deck' + (deck.indent ? ' is-sub' : ''));
    card.type = 'button';
    card.appendChild(ring(pct));

    const sel = window.Store.selection(deck.id);
    const body = el('div', 'deck-body');
    body.innerHTML = '<div class="deck-title">' + esc(deck.title) + '</div>'
      + '<div class="deck-sub">' + esc(deck.subtitle) + ' · ' + p.total + '</div>'
      + (sel
        ? '<div class="deck-subset">practising ' + sel.length + ' of ' + p.total + '</div>'
        : '')
      + (p.due ? '<div class="deck-due">' + p.due + ' due for review</div>' : '');
    card.appendChild(body);
    card.onclick = () => { location.hash = '#/deck/' + deck.id; };
    return card;
  }

  function ring(pct) {
    const R = 17, C = 2 * Math.PI * R;
    const wrap = el('div', 'ring-wrap');
    wrap.innerHTML = '<svg class="ring" viewBox="0 0 40 40">'
      + '<circle class="bg" cx="20" cy="20" r="' + R + '"/>'
      + '<circle class="fg" cx="20" cy="20" r="' + R + '" stroke-dasharray="'
      + (C * pct / 100).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg>'
      + '<span class="ring-label">' + pct + '</span>';
    return wrap;
  }

  /* --------------------------------------------------------- deck view */
  function deckView(id) {
    const deck = window.Decks.get(id);
    if (!deck) { location.hash = '#/'; return; }
    const ids = deck.items.map(i => i.id);
    const p = window.Store.progress(id, ids);

    root.innerHTML = '';
    const c = el('div', 'crumb');
    c.innerHTML = '<a href="#/">Decks</a> <span>›</span> <span>' + esc(deck.group)
      + '</span> <span>›</span> <strong>' + esc(deck.title) + '</strong>';
    root.appendChild(c);

    root.appendChild(el('h1', null, deck.title));
    const lede = el('p', 'lede');
    lede.textContent = deck.subtitle + ' — ' + p.total + ' items. '
      + (p.seen ? p.learned + ' learned, ' + p.due + ' due for review.' : 'Not started yet.');
    root.appendChild(lede);

    // reflects the current selection, and stays in step as it is edited
    const scope = el('div', 'note');
    scope.style.margin = '0 0 18px';
    root.appendChild(scope);

    const grid = el('div', 'school-grid');
    grid.append(
      modeCard('Explore', 'Browse the map freely and read about anything you click. '
        + 'Start here if the set is new to you.', () => go(id, 'learn')),
      modeCard('Find it', 'A name appears; you click it on the map, then confirm. This is '
        + 'the mode that builds real spatial memory.', () => go(id, 'locate')),
      modeCard('Name it', 'A shape lights up; you choose its name. Tests recall in the '
        + 'opposite direction.', () => go(id, 'identify')),
    );
    root.appendChild(grid);

    root.appendChild(window.Picker.render(deck, paintScope));
    paintScope(window.Store.selection(id));

    function paintScope(sel) {
      const n = sel ? sel.length : ids.length;
      if (!sel) {
        scope.innerHTML = 'Practising <strong>all ' + ids.length + '</strong>. '
          + 'Pick a subset below to drill just those.';
      } else if (!n) {
        scope.innerHTML = '<strong>Nothing is selected</strong>, so a round has nothing '
          + 'to ask. Switch some back on below.';
      } else {
        scope.innerHTML = 'Practising <strong>' + n + ' of ' + ids.length + '</strong> — '
          + 'the rest are still drawn on the map, they just will not be asked about.';
      }
      // Explore ignores the selection: browsing a cut-down map makes no sense
      grid.children[0].classList.toggle('is-muted', !!sel);
    }

    const row = el('div', 'btn-row');
    row.style.marginTop = '22px';
    const reset = el('button', 'btn btn-ghost btn-sm', 'Reset progress for this set');
    reset.onclick = () => {
      if (!confirm('Forget all progress for "' + deck.title + '"? This cannot be undone.')) return;
      window.Store.resetDeck(id, ids);
      deckView(id);
    };
    row.appendChild(reset);
    root.appendChild(row);
  }

  function go(id, mode) { location.hash = '#/play/' + id + '/' + mode; }

  function modeCard(title, body, onclick) {
    const c = el('button', 'card is-link');
    c.type = 'button';
    c.innerHTML = '<h3>' + esc(title) + '</h3>'
      + '<p class="clue-detail" style="margin:0">' + esc(body) + '</p>';
    c.onclick = onclick;
    return c;
  }

  /* ---------------------------------------------------------- progress */
  function progress() {
    root.innerHTML = '';
    root.appendChild(el('h1', null, 'Progress'));

    const t = window.Store.totals();
    const acc = t.answered ? Math.round(t.correct / t.answered * 100) : 0;
    const grid = el('div', 'stat-grid');
    grid.append(
      stat(t.answered.toLocaleString('en-US'), 'questions answered'),
      stat(acc + '%', 'lifetime accuracy'),
      stat(t.bestStreak, 'best streak'),
      stat(dueTotal(), 'due for review now'),
    );
    root.appendChild(grid);

    // last three weeks of activity
    const days = window.Store.recent(21);
    const max = Math.max(1, ...days.map(d => d.count));
    const card = el('div', 'card');
    card.style.marginTop = '12px';
    card.innerHTML = '<div class="eyebrow">Last 21 days</div>';
    const spark = el('div', 'spark');
    for (const d of days) {
      const b = document.createElement('i');
      b.style.height = Math.max(2, d.count / max * 46) + 'px';
      if (!d.count) b.className = 'is-empty';
      b.title = d.date + ': ' + d.count;
      spark.appendChild(b);
    }
    card.appendChild(spark);
    root.appendChild(card);

    root.appendChild(el('h2', null, 'Mastery by set'));
    const list = el('div', 'mastery-list');
    for (const d of window.Decks.all()) {
      const ids = d.items.map(i => i.id);
      const p = window.Store.progress(d.id, ids);
      if (!p.seen) continue;
      const pct = Math.round(p.learned / p.total * 100);
      const row = el('div', 'mastery');
      row.innerHTML = '<span>' + esc(d.group) + ' · ' + esc(d.title) + '</span>'
        + '<span class="bar"><i style="width:' + pct + '%"></i></span>'
        + '<span class="pct">' + pct + '%</span>';
      list.appendChild(row);
    }
    if (!list.children.length) {
      const p = el('p', 'lede');
      p.textContent = 'Nothing studied yet — pick a set from the Maps tab.';
      list.appendChild(p);
    }
    root.appendChild(list);

    /* settings */
    root.appendChild(el('h2', null, 'Settings'));
    const s = el('div', 'card');

    const tokenField = el('div', 'field');
    tokenField.innerHTML = '<label for="tok">Mapillary client token '
      + '(only used by the panorama round)</label>';
    const input = document.createElement('input');
    input.id = 'tok';
    input.type = 'text';
    input.value = window.Store.setting('mapillaryToken') || '';
    input.placeholder = 'MLY|…';
    tokenField.appendChild(input);
    s.appendChild(tokenField);

    const row = el('div', 'btn-row');
    const saveTok = el('button', 'btn btn-sm', 'Save token');
    saveTok.onclick = () => {
      window.Store.setting('mapillaryToken', input.value.trim());
      saveTok.textContent = 'Saved ✓';
      setTimeout(() => { saveTok.textContent = 'Save token'; }, 1400);
    };
    const wipe = el('button', 'btn btn-ghost btn-sm', 'Erase all progress');
    wipe.onclick = () => {
      if (!confirm('Erase every score, schedule and setting? This cannot be undone.')) return;
      window.Store.resetAll();
      location.hash = '#/';
      location.reload();
    };
    row.append(saveTok, wipe);
    s.appendChild(row);
    root.appendChild(s);
  }

  function dueTotal() {
    let n = 0;
    for (const d of window.Decks.all())
      n += window.Store.progress(d.id, d.items.map(i => i.id)).due;
    return n;
  }

  function stat(num, label) {
    const c = el('div', 'stat');
    c.innerHTML = '<div class="stat-num">' + esc(num) + '</div>'
      + '<div class="stat-label">' + esc(label) + '</div>';
    return c;
  }

  route();
})();
