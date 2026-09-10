/*
 * mapquiz.js — the three map modes.
 *
 *   learn     browse freely, click anything to read about it. No scoring.
 *   locate    "Find Aomori" → click it on the map.
 *   identify  a shape lights up → choose its name from a short list.
 *
 * Wrong answers are the teaching moment, so they reveal the correct shape,
 * dim everything else, and leave the facts on screen until you continue.
 */
(function () {
  'use strict';

  const SESSION = 20;         // questions per round, when the deck is big enough
  const OPTIONS = 5;          // choices offered in identify mode
  const el = window.h, esc = window.esc;

  // Each round builds a fresh map. The old one keeps a viewport listener and a
  // pair of window pointer listeners alive until it is told to let go.
  let liveMap = null;

  function start(root, deckId, mode) {
    const deck = window.Decks.get(deckId);
    if (!deck) { root.innerHTML = '<div class="empty">Unknown deck.</div>'; return; }

    const items = deck.items;
    const byId = new Map(items.map(i => [i.id, i]));
    const built = deck.build();

    const queue = mode === 'learn'
      ? []
      : window.Store.queue(deckId, items.map(i => i.id), Math.min(SESSION, items.length));

    const state = {
      idx: 0, score: 0, streak: 0, best: 0,
      missed: [],           // { item, guessed }
      answered: false,
      current: null,
    };

    /* --------------------------------------------------------------- DOM */
    root.className = 'app is-wide';
    root.innerHTML = '';
    root.appendChild(crumb(deck, mode));

    const wrap = el('div', 'quiz');
    const main = el('div', 'quiz-main');
    const bar = el('div', 'quiz-bar');
    const promptEl = el('div', 'prompt');
    const scoreEl = el('div', 'scorechip');
    // On a phone the on-map +/- buttons are hidden (pinch does the job) and
    // they overlapped real targets anyway — Corsica sits exactly under them.
    // This appears in the bar instead, and only once there is something to undo.
    const resetBtn = el('button', 'btn btn-sm reset-view', 'Reset view');
    resetBtn.type = 'button';
    resetBtn.hidden = true;
    bar.append(promptEl, resetBtn, scoreEl);

    const progress = el('div', 'progress-line');
    const progressFill = document.createElement('i');
    progress.appendChild(progressFill);

    const mapWrap = el('div', 'map-wrap');
    const mapHost = el('div', 'map-host');   // the floating label positions against this
    mapWrap.appendChild(mapHost);
    mapWrap.appendChild(mapTools());

    main.append(bar, progress, mapWrap);

    const side = el('aside');
    const panel = el('div', 'side');
    side.appendChild(panel);

    wrap.append(main, side);
    root.appendChild(wrap);

    if (liveMap) liveMap.destroy();
    const map = new window.MapView(mapHost);
    liveMap = map;
    map.render(built.panels, built.projection);
    if (built.dots) map.renderDots(built.dots);

    mapWrap.querySelector('[data-zoom-in]').onclick = () => map.zoomBy(1.4);
    mapWrap.querySelector('[data-zoom-out]').onclick = () => map.zoomBy(1 / 1.4);
    mapWrap.querySelector('[data-zoom-reset]').onclick = () => map.resetZoom();
    resetBtn.onclick = () => map.resetZoom();
    map.onZoom = k => { resetBtn.hidden = k <= 1.02; };

    map.onPick = id => onPick(id);

    /* ------------------------------------------------------------- modes */
    if (mode === 'learn') runLearn();
    else next();

    function runLearn() {
      setPrompt('<strong>Explore</strong>',
        'Hover or tap anything to see its name. Click it for the details.');
      scoreEl.textContent = items.length + ' items';
      progressFill.style.width = '100%';
      panel.innerHTML = '<div class="eyebrow">Nothing selected</div>'
        + '<p class="answer-sub" style="margin-top:8px">'
        + 'Pick something on the map. When you are ready to be tested, '
        + 'go back and choose <em>Find it</em> or <em>Name it</em>.</p>';
      showNames(true);
    }

    /** Float each shape's name under the cursor, so you read it where you look. */
    function showNames(on) {
      map.setLabels(on ? id => {
        const it = byId.get(id);
        return it ? it.name : null;
      } : null);
    }

    function setPrompt(html, sub) {
      promptEl.innerHTML = html + (sub ? '<span class="prompt-sub">' + sub + '</span>' : '');
    }

    function next() {
      state.answered = false;
      map.clearStates();
      map.setInteractive(true);
      showNames(false);            // no free answers while the question is live

      if (state.idx >= queue.length) return finish();
      const item = byId.get(queue[state.idx]);
      state.current = item;

      scoreEl.innerHTML = `<b>${state.score}</b>/${state.idx} &nbsp;·&nbsp; streak <b>${state.streak}</b>`;
      progressFill.style.width = (state.idx / queue.length * 100) + '%';

      if (mode === 'locate') askLocate(item);
      else askIdentify(item);
    }

    function askLocate(item) {
      map.resetZoom();
      promptEl.innerHTML = 'Find <strong>' + esc(item.name) + '</strong>'
        + (item.sub ? '<span class="prompt-sub">' + esc(item.sub) + '</span>' : '');
      panel.innerHTML = '<div class="eyebrow">Question ' + (state.idx + 1) + ' of ' + queue.length + '</div>'
        + '<p class="answer-sub" style="margin-top:8px">Click it on the map.</p>';
    }

    function askIdentify(item) {
      promptEl.innerHTML = 'What is <strong>highlighted</strong>?'
        + '<span class="prompt-sub">Pick the name on the right.</span>';
      map.setState(item.id, 'target');
      map.setInteractive(false);
      map.focus(item.id, deck.focusFill, deck.kind === 'dot' ? 5 : undefined);

      const choices = pickChoices(item);
      panel.innerHTML = '<div class="eyebrow">Question ' + (state.idx + 1) + ' of ' + queue.length + '</div>';
      const list = el('div', 'options');
      for (const c of choices) {
        const b = el('button', 'option');
        b.type = 'button';
        b.textContent = c.name;
        b.onclick = () => {
          if (state.answered) return;
          [...list.children].forEach(x => { x.disabled = true; });
          b.classList.add(c.id === item.id ? 'is-correct' : 'is-wrong');
          if (c.id !== item.id) {
            const right = [...list.children].find(x => x.textContent === item.name);
            if (right) right.classList.add('is-correct');
          }
          resolve(c.id);
        };
        list.appendChild(b);
      }
      panel.appendChild(list);
    }

    /** Distractors, biased toward neighbours so the choice is actually hard. */
    function pickChoices(item) {
      const sameGroup = items.filter(i => i.id !== item.id && sharesFact(i, item));
      const others = items.filter(i => i.id !== item.id && !sharesFact(i, item));
      const pool = window.Store.shuffle(sameGroup.slice()).concat(window.Store.shuffle(others.slice()));
      return window.Store.shuffle([item].concat(pool.slice(0, OPTIONS - 1)));
    }

    function sharesFact(a, b) {
      const fa = a.facts && a.facts[0], fb = b.facts && b.facts[0];
      return !!(fa && fb && fa[0] === fb[0] && fa[1] === fb[1]);
    }

    /* ------------------------------------------------------------ answer */
    function onPick(id) {
      if (mode === 'learn') { showInfo(byId.get(id) || { id, name: id, facts: [] }); return; }
      if (mode !== 'locate' || state.answered) return;
      resolve(id);
    }

    function resolve(guessId) {
      state.answered = true;
      map.setInteractive(false);
      const item = state.current;
      const correct = guessId === item.id;

      window.Store.grade(deckId, item.id, correct);
      state.idx++;
      if (correct) {
        state.score++;
        state.streak++;
        state.best = Math.max(state.best, state.streak);
        window.Store.noteStreak(state.best);
      } else {
        state.streak = 0;
        state.missed.push({ item, guessed: byId.get(guessId) });
      }

      // reveal: correct shape green, the wrong guess red, everything else faded
      for (const i of items) if (i.id !== item.id) map.setState(i.id, 'dim');
      map.setState(item.id, 'correct');
      if (!correct && guessId) map.setState(guessId, 'wrong');
      if (mode === 'locate') map.focus(item.id, deck.focusFill, deck.kind === 'dot' ? 5 : undefined);

      scoreEl.innerHTML = `<b>${state.score}</b>/${state.idx} &nbsp;·&nbsp; streak <b>${state.streak}</b>`;
      progressFill.style.width = (state.idx / queue.length * 100) + '%';
      showNames(true);             // the answer is out; let them read the map
      showVerdict(correct, item, correct ? null : byId.get(guessId));
    }

    function showVerdict(correct, item, guessed) {
      panel.innerHTML = '';
      const v = el('div', 'verdict ' + (correct ? 'good' : 'bad'));
      v.innerHTML = '<span class="verdict-mark">' + (correct ? '✓' : '✕') + '</span>'
        + '<span class="verdict-text">' + (correct ? 'Correct' : 'Not quite') + '</span>';
      panel.appendChild(v);

      if (!correct && guessed) {
        const p = el('p', 'answer-sub');
        p.innerHTML = 'You picked <strong>' + esc(guessed.name) + '</strong>. The answer is:';
        p.style.marginBottom = '2px';
        panel.appendChild(p);
      }

      panel.appendChild(factBlock(item));

      const btn = el('button', 'btn btn-primary');
      btn.style.marginTop = '14px';
      btn.style.width = '100%';
      btn.textContent = state.idx >= queue.length ? 'See results' : 'Next  →';
      btn.onclick = next;
      panel.appendChild(btn);
      btn.focus();
    }

    function showInfo(item) {
      map.clearStates();
      map.setState(item.id, 'target');
      setPrompt(esc(item.name), item.sub ? esc(item.sub) : 'Selected');
      panel.innerHTML = '';
      panel.appendChild(factBlock(item));
    }

    function factBlock(item) {
      const box = el('div');
      const name = el('div', 'answer-name');
      name.textContent = item.name;
      box.appendChild(name);
      if (item.sub) {
        const s = el('div', 'answer-sub');
        s.textContent = item.sub;
        box.appendChild(s);
      }
      if (item.facts && item.facts.length) {
        const dl = el('dl', 'facts');
        for (const [k, v] of item.facts) {
          const row = el('div', 'fact');
          const dt = document.createElement('dt'); dt.textContent = k;
          const dd = document.createElement('dd'); dd.textContent = v;
          row.append(dt, dd);
          dl.appendChild(row);
        }
        box.appendChild(dl);
      }
      return box;
    }

    /* ------------------------------------------------------------ finish */
    function finish() {
      map.clearStates();
      map.setInteractive(false);
      promptEl.innerHTML = '<strong>Round complete</strong>';
      progressFill.style.width = '100%';

      const pct = queue.length ? Math.round(state.score / queue.length * 100) : 0;
      panel.innerHTML = '';
      const score = el('div', 'summary-score');
      score.textContent = pct + '%';
      const sub = el('div', 'summary-sub');
      sub.textContent = state.score + ' of ' + queue.length + ' correct · best streak ' + state.best;
      panel.append(score, sub);

      if (state.missed.length) {
        const h = el('div', 'eyebrow');
        h.textContent = 'Review these';
        panel.appendChild(h);
        const list = el('div', 'missed');
        for (const m of state.missed) {
          const row = el('div', 'missed-row');
          row.innerHTML = '<span class="x">✕</span><span>' + esc(m.item.name) + '</span>';
          row.style.cursor = 'pointer';
          row.onclick = () => {
            map.clearStates();
            map.setState(m.item.id, 'target');
            map.focus(m.item.id, deck.focusFill, deck.kind === 'dot' ? 5 : undefined);
          };
          list.appendChild(row);
        }
        panel.appendChild(list);
      } else {
        const p = el('p', 'answer-sub');
        p.textContent = 'Clean round — nothing missed.';
        panel.appendChild(p);
      }

      const again = el('button', 'btn btn-primary');
      again.style.cssText = 'margin-top:16px;width:100%';
      again.textContent = 'Another round';
      again.onclick = () => start(root, deckId, mode);

      const back = el('button', 'btn btn-ghost');
      back.style.cssText = 'margin-top:8px;width:100%';
      back.textContent = 'Back to decks';
      back.onclick = () => { location.hash = '#/'; };

      panel.append(again, back);
    }
  }

  /* ----------------------------------------------------------- fragments */
  function crumb(deck, mode) {
    const label = { learn: 'Explore', locate: 'Find it', identify: 'Name it' }[mode];
    const c = el('div', 'crumb');
    c.innerHTML = '<a href="#/">Decks</a> <span>›</span> <span>' + esc(deck.group) + '</span> '
      + '<span>›</span> <span>' + esc(deck.title) + '</span> <span>›</span> <strong>' + label + '</strong>';
    return c;
  }

  function mapTools() {
    const t = el('div', 'map-tools');
    t.innerHTML = '<button data-zoom-in title="Zoom in">+</button>'
      + '<button data-zoom-out title="Zoom out">−</button>'
      + '<button data-zoom-reset title="Reset view">⤾</button>';
    return t;
  }

  window.MapQuiz = { start };
})();
