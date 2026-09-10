/*
 * school.js — the "learn to read a street scene" half of the app.
 *
 * Four views:
 *   index    hub
 *   funnel   the order to check things in, and what each step rules out
 *   clues    diagram cards, filterable by category, and a drill built on them
 *   country  a full profile per country in the starter set
 */
(function () {
  'use strict';

  const el = window.h, esc = window.esc, rich = window.rich, flag = window.flag;
  const META = () => window.DATA_META;
  const DRILL_DECK = 'meta-clues';

  const CATEGORIES = [
    { id: 'bollard', label: 'Bollards' },
    { id: 'lines', label: 'Road lines' },
    { id: 'pole', label: 'Utility poles' },
    { id: 'plate', label: 'Licence plates' },
    { id: 'sign', label: 'Signs' },
  ];

  /* ------------------------------------------------------------- index */
  function index(root) {
    root.className = 'app';
    root.innerHTML = '';

    root.appendChild(el('h1', null, 'Street School'));
    const lede = el('p', 'lede');
    lede.textContent = 'GeoGuessr rewards guessing; this rewards knowing why. '
      + 'Work through the funnel first — it is the single idea that separates good players '
      + 'from people who stare at a tree for two minutes — then drill the diagrams.';
    root.appendChild(lede);

    const grid = el('div', 'school-grid');
    grid.append(
      linkCard('The deduction funnel', 'The order to look at things in, and how much of '
        + 'the world each step eliminates.', '#/school/funnel'),
      linkCard('Clue diagrams', 'Bollards, road lines, poles, plates and signs, drawn side '
        + 'by side so the differences are obvious.', '#/school/clues'),
      linkCard('Drill the clues', 'Flashcards on the same diagrams, scheduled so the ones '
        + 'you keep missing come back.', '#/school/drill'),
      linkCard('Panorama round', 'Real street imagery from Mapillary, with the funnel next '
        + 'to it as a checklist.', '#/school/pano'),
    );
    root.appendChild(grid);

    const head = el('div', 'section-head');
    head.innerHTML = '<h2>Country profiles</h2>'
      + '<span class="count">' + Object.keys(META().countries).length + ' in the starter set</span>';
    root.appendChild(head);

    const cgrid = el('div', 'school-grid');
    for (const [code, c] of Object.entries(META().countries)) {
      const card = el('button', 'card is-link');
      card.type = 'button';
      card.innerHTML = '<div class="profile-head">'
        + flag(code, 'lg')
        + '<div><h3 style="margin:0">' + esc(c.name) + '</h3>'
        + '<span class="profile-drive">drives ' + esc(c.drivingSide) + '</span></div></div>'
        + '<p class="clue-detail" style="margin:10px 0 0">' + rich(c.summary) + '</p>';
      card.onclick = () => { location.hash = '#/school/country/' + code; };
      cgrid.appendChild(card);
    }
    root.appendChild(cgrid);

    const note = el('div', 'note');
    note.innerHTML = '<strong>Why only six countries?</strong> They are picked for contrast, '
      + 'not coverage — two drive on the left, two use yellow centre lines, three use a '
      + 'non-obvious script. Learning the <em>method</em> on six very different countries '
      + 'transfers; memorising forty similar ones does not. Add more in '
      + '<code>data/meta.js</code> when you want them.';
    root.appendChild(note);
  }

  function linkCard(title, body, href) {
    const c = el('button', 'card is-link');
    c.type = 'button';
    c.innerHTML = '<h3>' + esc(title) + '</h3>'
      + '<p class="clue-detail" style="margin:0">' + esc(body) + '</p>';
    c.onclick = () => { location.hash = href; };
    return c;
  }

  /* ------------------------------------------------------------ funnel */
  function funnel(root) {
    root.className = 'app';
    root.innerHTML = '';
    root.appendChild(backCrumb('The deduction funnel'));

    root.appendChild(el('h1', null, 'Look in the right order'));
    const lede = el('p', 'lede');
    lede.textContent = 'Most people lose because they start with the most specific clue they '
      + 'can see. Bollards are famous, so they hunt for a bollard — which means recalling a '
      + 'hundred designs from nothing. Work top-down instead: each step below cuts the world '
      + 'down, so by the time you look at a bollard you are choosing between three countries, '
      + 'not a hundred.';
    root.appendChild(lede);

    const list = el('div', 'funnel');
    for (const step of META().funnel) {
      const s = el('div', 'funnel-step');
      s.innerHTML =
        '<div class="funnel-num"></div>'
        + '<div class="funnel-body">'
        + '<div class="funnel-title"><h3>' + esc(step.title) + '</h3>'
        + '<span class="funnel-time">' + esc(step.seconds) + '</span></div>'
        + '<div class="funnel-elim">' + esc(step.eliminates) + '</div>'
        + '<p>' + rich(step.how) + '</p>'
        + '<div class="funnel-note">' + rich(step.note) + '</div>'
        + '</div>';
      list.appendChild(s);
    }
    root.appendChild(list);

    root.appendChild(el('h2', null, 'The pairs that actually catch people'));
    const grid = el('div', 'school-grid');
    for (const c of META().confusions) {
      const names = c.pair.map(p => {
        const country = META().countries[p];
        return flag(p) + ' ' + esc(country ? country.name : p);
      }).join(' <span class="vs">vs</span> ');
      const card = el('div', 'card');
      card.innerHTML = '<h3>' + names + '</h3>'
        + '<p class="clue-detail" style="margin:0 0 9px"><em>' + rich(c.why) + '</em></p>'
        + '<div class="funnel-note"><strong>Tiebreak:</strong> ' + rich(c.tiebreak) + '</div>';
      grid.appendChild(card);
    }
    root.appendChild(grid);
  }

  /* ------------------------------------------------------------- clues */
  function clues(root) {
    root.className = 'app';
    root.innerHTML = '';
    root.appendChild(backCrumb('Clue diagrams'));
    root.appendChild(el('h1', null, 'Clue diagrams'));

    const lede = el('p', 'lede');
    lede.textContent = 'Drawn rather than photographed, so the thing that matters is the thing '
      + 'you see. Compare within a category — a French bollard only makes sense next to an '
      + 'Italian one.';
    root.appendChild(lede);

    let active = 'bollard';
    const pills = el('div', 'pill-row');
    const grid = el('div', 'clue-grid');
    grid.style.marginTop = '18px';

    for (const cat of CATEGORIES) {
      const p = el('button', 'pill');
      p.type = 'button';
      p.textContent = cat.label;
      p.onclick = () => { active = cat.id; paint(); };
      p.dataset.cat = cat.id;
      pills.appendChild(p);
    }
    root.append(pills, grid);

    function paint() {
      [...pills.children].forEach(p => p.classList.toggle('is-active', p.dataset.cat === active));
      grid.innerHTML = '';
      for (const clue of META().clues.filter(c => c.category === active)) {
        grid.appendChild(clueCard(clue));
      }
    }
    paint();

    const cta = el('div', 'btn-row');
    cta.style.marginTop = '24px';
    const b = el('button', 'btn btn-primary', 'Drill these  →');
    b.onclick = () => { location.hash = '#/school/drill'; };
    cta.appendChild(b);
    root.appendChild(cta);
  }

  function clueCard(clue) {
    const country = META().countries[clue.answer];
    const card = el('div', 'clue');
    const art = el('div', 'clue-art' + (clue.category === 'plate' || clue.category === 'lines' ? ' is-wide' : ''));
    art.innerHTML = window.DIAGRAMS[clue.svg] || '';
    const body = el('div', 'clue-body');
    // contrast-only entries (Italy next to France) are not in the profile set,
    // so they carry their own name on the clue itself
    const code = clue.answer;
    const label = country ? country.name : (clue.answerName || clue.answer);
    body.innerHTML = '<div class="clue-country">'
      + window.flag(code) + ' ' + esc(label)
      + (clue.extra ? ' <em>(contrast)</em>' : '') + '</div>'
      + '<div class="clue-title">' + esc(clue.title) + '</div>'
      + '<div class="clue-detail">' + rich(clue.detail) + '</div>';
    card.append(art, body);
    return card;
  }

  /* ------------------------------------------------------------- drill */
  function drill(root) {
    root.className = 'app';
    root.innerHTML = '';
    root.appendChild(backCrumb('Clue drill'));

    // only clues whose answer is a country we actually profile
    const pool = META().clues.filter(c => META().countries[c.answer]);
    const ids = pool.map(c => c.id);
    const byId = new Map(pool.map(c => [c.id, c]));
    const queue = window.Store.queue(DRILL_DECK, ids, Math.min(12, ids.length));

    const state = { i: 0, score: 0, missed: [] };

    const shell = el('div');
    shell.style.cssText = 'max-width:560px;margin:0 auto';
    root.appendChild(shell);
    ask();

    function ask() {
      if (state.i >= queue.length) return done();
      const clue = byId.get(queue[state.i]);
      const country = META().countries[clue.answer];

      shell.innerHTML = '';
      const bar = el('div', 'crumb');
      bar.innerHTML = '<span>Question ' + (state.i + 1) + ' of ' + queue.length + '</span>'
        + '<span style="margin-left:auto" class="scorechip"><b>' + state.score + '</b>/' + state.i + '</span>';
      shell.appendChild(bar);

      const card = el('div', 'card');
      card.style.textAlign = 'center';
      const art = el('div', 'clue-art');
      art.style.cssText = 'border-radius:10px;border:1px solid var(--line);margin-bottom:14px';
      art.innerHTML = window.DIAGRAMS[clue.svg] || '';
      art.querySelector('svg').style.maxWidth =
        (clue.category === 'plate' || clue.category === 'lines') ? '320px' : '140px';
      card.appendChild(art);

      const q = el('h3', null, 'Which country?');
      q.style.marginBottom = '12px';
      card.appendChild(q);

      const opts = el('div', 'options');
      const codes = window.Store.shuffle(Object.keys(META().countries).slice());
      const wrong = codes.filter(c => c !== clue.answer).slice(0, 3);
      for (const code of window.Store.shuffle([clue.answer].concat(wrong))) {
        const c = META().countries[code];
        const b = el('button', 'option');
        b.type = 'button';
        b.innerHTML = window.flag(code) + ' ' + esc(c.name);
        b.onclick = () => {
          [...opts.children].forEach(x => { x.disabled = true; });
          const right = code === clue.answer;
          b.classList.add(right ? 'is-correct' : 'is-wrong');
          if (!right) {
            [...opts.children].forEach(x => {
              if (x.textContent.trim().endsWith(country.name)) x.classList.add('is-correct');
            });
            state.missed.push(clue);
          } else state.score++;
          window.Store.grade(DRILL_DECK, clue.id, right);
          state.i++;
          reveal(clue, country);
        };
        opts.appendChild(b);
      }
      card.appendChild(opts);
      shell.appendChild(card);

      function reveal(clue, country) {
        const box = el('div', 'card');
        box.style.marginTop = '12px';
        box.innerHTML = '<div class="clue-country">' + window.flag(clue.answer)
          + ' ' + esc(country.name) + '</div>'
          + '<div class="clue-title">' + esc(clue.title) + '</div>'
          + '<div class="clue-detail">' + rich(clue.detail) + '</div>';
        const nx = el('button', 'btn btn-primary',
          state.i >= queue.length ? 'See results' : 'Next  →');
        nx.style.cssText = 'margin-top:14px;width:100%';
        nx.onclick = ask;
        box.appendChild(nx);
        shell.appendChild(box);
        nx.focus();
      }
    }

    function done() {
      shell.innerHTML = '';
      const card = el('div', 'card');
      card.style.textAlign = 'center';
      const pct = queue.length ? Math.round(state.score / queue.length * 100) : 0;
      card.innerHTML = '<div class="summary-score">' + pct + '%</div>'
        + '<div class="summary-sub">' + state.score + ' of ' + queue.length + ' correct</div>';
      const again = el('button', 'btn btn-primary', 'Another round');
      again.style.cssText = 'width:100%;margin-bottom:8px';
      again.onclick = () => drill(root);
      const back = el('button', 'btn btn-ghost', 'Back to Street School');
      back.style.width = '100%';
      back.onclick = () => { location.hash = '#/school'; };
      card.append(again, back);
      shell.appendChild(card);
    }
  }

  /* ----------------------------------------------------------- country */
  function country(root, code) {
    const c = META().countries[code];
    if (!c) { location.hash = '#/school'; return; }

    root.className = 'app';
    root.innerHTML = '';
    root.appendChild(backCrumb(c.name));

    const head = el('div', 'profile-head');
    head.innerHTML = flag(code, 'xl')
      + '<div><h1 style="margin:0 0 4px">' + esc(c.name) + '</h1>'
      + '<span class="profile-drive">drives on the ' + esc(c.drivingSide) + '</span>'
      + ' <span class="profile-drive">' + esc(c.domain) + '</span>'
      + ' <span class="profile-drive">' + esc(c.phone) + '</span></div>';
    root.appendChild(head);

    const lede = el('p', 'lede');
    lede.style.marginTop = '14px';
    lede.innerHTML = rich(c.summary);
    root.appendChild(lede);

    const rows = [
      ['Script', c.script], ['Road lines', c.lines], ['Bollards', c.bollards],
      ['Utility poles', c.poles], ['Licence plates', c.plates], ['Signage', c.signage],
      ['Architecture', c.architecture], ['Camera / car', c.camera],
    ];
    const dl = el('dl', 'profile-rows');
    for (const [k, v] of rows) {
      if (!v) continue;
      const row = el('div', 'profile-row');
      row.innerHTML = '<dt>' + esc(k) + '</dt><dd>' + rich(v) + '</dd>';
      dl.appendChild(row);
    }
    root.appendChild(dl);

    // the diagrams that belong to this country
    const own = META().clues.filter(x => x.answer === code);
    if (own.length) {
      root.appendChild(el('h2', null, 'Its diagrams'));
      const grid = el('div', 'clue-grid');
      own.forEach(x => grid.appendChild(clueCard(x)));
      root.appendChild(grid);
    }

    if (c.regions && c.regions.length) {
      root.appendChild(el('h2', null, 'Telling the regions apart'));
      const grid = el('div', 'school-grid');
      for (const r of c.regions) {
        const card = el('div', 'card');
        card.innerHTML = '<h3>' + esc(r.name) + '</h3>'
          + '<p class="clue-detail" style="margin:0">' + rich(r.tell) + '</p>';
        grid.appendChild(card);
      }
      root.appendChild(grid);
    }
  }

  function backCrumb(here) {
    const c = el('div', 'crumb');
    c.innerHTML = '<a href="#/school">Street School</a> <span>›</span> <strong>'
      + esc(here) + '</strong>';
    return c;
  }

  window.School = { index, funnel, clues, drill, country, DRILL_DECK };
})();
