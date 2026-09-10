/*
 * pano.js — the panorama round.
 *
 * Uses the Mapillary Graph API, which is free and needs only a client token.
 * We deliberately do not load the Mapillary JS viewer: pulling a still frame
 * keeps the whole app dependency-free, and identifying a country from one
 * fixed view is exactly the skill the funnel teaches.
 *
 * Get a token at https://www.mapillary.com/dashboard/developers — create an
 * application, then copy the "Client token" (it starts with MLY|).
 */
(function () {
  'use strict';

  const el = window.h, esc = window.esc, rich = window.rich;
  const API = 'https://graph.mapillary.com/images';

  /* Search windows chosen where Mapillary actually has coverage: city and
   * near-city areas rather than the geographic middle of a country. */
  const BOXES = {
    JP: [[139.60, 35.63, 139.80, 35.73], [135.45, 34.63, 135.58, 34.72],
         [141.30, 43.02, 141.42, 43.10], [130.36, 33.56, 130.47, 33.63],
         [135.72, 34.97, 135.82, 35.05]],
    FR: [[2.28, 48.83, 2.40, 48.89], [4.80, 45.72, 4.90, 45.78],
         [-0.62, 44.81, -0.53, 44.87], [5.35, 43.27, 5.44, 43.33],
         [-1.70, 48.08, -1.62, 48.14], [7.72, 48.56, 7.79, 48.61]],
    BR: [[-46.66, -23.58, -46.60, -23.53], [-43.25, -22.93, -43.16, -22.88],
         [-47.93, -15.82, -47.85, -15.76], [-38.55, -12.99, -38.47, -12.93]],
    RU: [[37.55, 55.72, 37.68, 55.79], [30.28, 59.91, 30.40, 59.97],
         [60.55, 56.81, 60.66, 56.87], [82.88, 54.99, 82.98, 55.05]],
    US: [[-122.45, 37.74, -122.38, 37.79], [-118.30, 34.03, -118.22, 34.08],
         [-87.68, 41.86, -87.60, 41.91], [-97.78, 30.24, -97.70, 30.29],
         [-71.11, 42.34, -71.04, 42.38]],
    ZA: [[18.40, -33.94, 18.49, -33.89], [28.02, -26.22, 28.10, -26.16],
         [31.00, -29.87, 31.07, -29.82], [25.55, -33.98, 25.63, -33.93]],
  };

  const ROUND = 5;

  function view(root) {
    root.className = 'app';
    root.innerHTML = '';
    root.appendChild(crumb());

    const token = window.Store.setting('mapillaryToken');
    if (!token) return setup(root);

    root.appendChild(el('h1', null, 'Panorama round'));
    const lede = el('p', 'lede');
    lede.textContent = 'One real street view per question, from one of the six countries in '
      + 'the starter set. Work the funnel down the side before you answer.';
    root.appendChild(lede);

    if (location.protocol === 'file:') {
      const warn = el('div', 'note');
      warn.innerHTML = '<strong>Open this over a local server.</strong> You are viewing the '
        + 'page from <code>file://</code>, and browsers block requests to Mapillary from '
        + 'there. Double-click <code>start.bat</code> (or run <code>python -m http.server</code> '
        + 'in this folder) and open <code>http://localhost:8000</code>. Everything else in the '
        + 'app works fine from a file.';
      root.appendChild(warn);
    }

    const state = { i: 0, score: 0, answered: false, current: null };

    const layout = el('div', 'quiz');
    const main = el('div', 'quiz-main');
    const bar = el('div', 'quiz-bar');
    const prompt = el('div', 'prompt');
    const score = el('div', 'scorechip');
    bar.append(prompt, score);
    const frame = el('div', 'pano-frame');
    frame.style.borderRadius = '0';
    frame.style.border = '0';
    main.append(bar, frame);

    const side = el('aside');
    const panel = el('div', 'side');
    side.appendChild(panel);
    layout.append(main, side);
    root.appendChild(layout);

    // the funnel, condensed, as a working checklist beside the image
    const check = el('div', 'side');
    check.innerHTML = '<div class="eyebrow">Checklist</div>'
      + '<ol style="margin:10px 0 0;padding-left:18px;font-size:13px;line-height:1.85">'
      + window.DATA_META.funnel.map(f => '<li>' + esc(f.title) + '</li>').join('')
      + '</ol>';
    side.appendChild(check);

    ask();

    async function ask() {
      state.answered = false;
      if (state.i >= ROUND) return done();

      prompt.innerHTML = 'Which country?<span class="prompt-sub">Question '
        + (state.i + 1) + ' of ' + ROUND + '</span>';
      score.innerHTML = '<b>' + state.score + '</b>/' + state.i;
      frame.innerHTML = '<div class="pano-empty">Loading imagery…</div>';
      panel.innerHTML = '<div class="eyebrow">Look, then choose</div>';

      const code = pick(Object.keys(BOXES));
      let img;
      try {
        img = await fetchImage(token, code);
      } catch (err) {
        frame.innerHTML = '';
        const box = el('div', 'pano-empty');
        box.innerHTML = '<h3>Could not load imagery</h3><p>' + esc(err.message) + '</p>';
        const retry = el('button', 'btn', 'Try again');
        retry.onclick = ask;
        box.appendChild(retry);
        frame.appendChild(box);
        return;
      }

      state.current = { code, img };
      frame.innerHTML = '';
      const picture = document.createElement('img');
      picture.src = img.thumb;
      picture.alt = 'Street-level photograph, country hidden';
      picture.style.cssText = 'width:100%;height:auto;display:block;max-height:560px;object-fit:cover';
      frame.appendChild(picture);

      const opts = el('div', 'options');
      for (const c of window.Store.shuffle(Object.keys(BOXES))) {
        const country = window.DATA_META.countries[c];
        const b = el('button', 'option');
        b.type = 'button';
        b.innerHTML = window.flag(c) + ' ' + esc(country.name);
        b.onclick = () => {
          if (state.answered) return;
          state.answered = true;
          [...opts.children].forEach(x => { x.disabled = true; });
          const right = c === code;
          b.classList.add(right ? 'is-correct' : 'is-wrong');
          if (!right) {
            [...opts.children].forEach(x => {
              if (x.textContent.trim().endsWith(window.DATA_META.countries[code].name))
                x.classList.add('is-correct');
            });
          }
          if (right) state.score++;
          state.i++;
          reveal(right);
        };
        opts.appendChild(b);
      }
      panel.appendChild(opts);
    }

    function reveal(right) {
      const c = window.DATA_META.countries[state.current.code];
      score.innerHTML = '<b>' + state.score + '</b>/' + state.i;
      panel.innerHTML = '';
      const v = el('div', 'verdict ' + (right ? 'good' : 'bad'));
      v.innerHTML = '<span class="verdict-mark">' + (right ? '✓' : '✕') + '</span>'
        + '<span class="verdict-text">' + esc(c.name) + '</span>';
      panel.appendChild(v);

      const p = el('p', 'clue-detail');
      p.innerHTML = rich(c.summary);
      panel.appendChild(p);

      const link = el('a', 'btn btn-sm');
      link.href = 'https://www.mapillary.com/app/?pKey=' + encodeURIComponent(state.current.img.id)
        + '&focus=photo';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open on Mapillary  ↗';
      link.style.marginTop = '12px';
      panel.appendChild(link);

      const nx = el('button', 'btn btn-primary', state.i >= ROUND ? 'See results' : 'Next  →');
      nx.style.cssText = 'margin-top:10px;width:100%';
      nx.onclick = ask;
      panel.appendChild(nx);
      nx.focus();
    }

    function done() {
      prompt.innerHTML = '<strong>Round complete</strong>';
      frame.innerHTML = '<div class="pano-empty"><div class="summary-score">'
        + Math.round(state.score / ROUND * 100) + '%</div>'
        + '<div class="summary-sub">' + state.score + ' of ' + ROUND + ' correct</div></div>';
      panel.innerHTML = '';
      const again = el('button', 'btn btn-primary', 'Another round');
      again.style.cssText = 'width:100%;margin-bottom:8px';
      again.onclick = () => view(root);
      const back = el('button', 'btn btn-ghost', 'Back to Street School');
      back.style.width = '100%';
      back.onclick = () => { location.hash = '#/school'; };
      panel.append(again, back);
    }
  }

  async function fetchImage(token, code) {
    // try a few windows: any one of them can come back empty
    const boxes = window.Store.shuffle(BOXES[code].slice());
    for (const box of boxes.slice(0, 3)) {
      const url = API + '?access_token=' + encodeURIComponent(token)
        + '&fields=id,thumb_1024_url,computed_geometry'
        + '&bbox=' + box.join(',') + '&limit=40';
      let res;
      try {
        res = await fetch(url);
      } catch (e) {
        throw new Error('Network request blocked. If the address bar says file://, '
          + 'run the app from a local server instead.');
      }
      if (res.status === 401) throw new Error('Mapillary rejected the token. Check it in Settings.');
      if (!res.ok) continue;
      const json = await res.json();
      const usable = (json.data || []).filter(d => d.thumb_1024_url);
      if (usable.length) {
        const hit = pick(usable);
        return { id: hit.id, thumb: hit.thumb_1024_url, geo: hit.computed_geometry };
      }
    }
    throw new Error('No imagery came back for that area. Try again — a different area is picked each time.');
  }

  /* --------------------------------------------------------------- setup */
  function setup(root) {
    root.appendChild(el('h1', null, 'Panorama round'));

    const card = el('div', 'card');
    card.style.maxWidth = '620px';
    card.innerHTML = '<h3>Add a Mapillary token to switch this on</h3>'
      + '<p class="clue-detail">Mapillary is free, open, and does not ask for a card. '
      + 'Everything else in the app — every map deck, the funnel, the clue diagrams and the '
      + 'drill — works without it.</p>'
      + '<ol style="font-size:13.5px;line-height:1.9;color:var(--ink-soft)">'
      + '<li>Sign in at <code>mapillary.com</code></li>'
      + '<li>Open <em>Dashboard → Developers → Register application</em></li>'
      + '<li>Copy the <strong>Client token</strong> (it begins <code>MLY|</code>)</li></ol>';

    const field = el('div', 'field');
    field.innerHTML = '<label for="mly">Mapillary client token</label>';
    const input = document.createElement('input');
    input.id = 'mly';
    input.type = 'text';
    input.placeholder = 'MLY|1234567890|abcdef…';
    input.autocomplete = 'off';
    field.appendChild(input);
    card.appendChild(field);

    const row = el('div', 'btn-row');
    const save = el('button', 'btn btn-primary', 'Save and start');
    save.onclick = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      window.Store.setting('mapillaryToken', v);
      view(root);
    };
    const skip = el('button', 'btn btn-ghost', 'Not now');
    skip.onclick = () => { location.hash = '#/school'; };
    row.append(save, skip);
    card.appendChild(row);

    const note = el('div', 'note');
    note.innerHTML = 'The token is kept in this browser\'s <code>localStorage</code> and is '
      + 'only ever sent to Mapillary. Clear it any time from <em>Progress → Settings</em>.';
    card.appendChild(note);

    root.appendChild(card);
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function crumb() {
    const c = el('div', 'crumb');
    c.innerHTML = '<a href="#/school">Street School</a> <span>›</span> <strong>Panorama round</strong>';
    return c;
  }

  window.Pano = { view };
})();
