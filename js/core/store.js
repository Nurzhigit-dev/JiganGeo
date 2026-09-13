/*
 * store.js — progress, spaced repetition and settings, persisted to
 * localStorage. Everything is per-item so a "deck" is just a set of item ids.
 *
 * Scheduling is a Leitner box system. A correct answer promotes an item and
 * pushes it into the future; a wrong answer drops it to box 1, which comes
 * back after a short relearning gap rather than instantly.
 *
 * That gap is the fix for a real bug. Box 1 used to have a zero interval, and a
 * first correct answer landed in box 1 exactly like a wrong one did — so every
 * item you had answered even once, right or wrong, was due again immediately,
 * and because due items are served before new ones, "Another round" replayed
 * the previous round's twenty questions every time.
 */
(function () {
  'use strict';

  const KEY = 'mygeogame.v1';
  const MIN = 60000;
  const DAY = 86400000;
  // how long until an item in each box is due again
  const INTERVALS = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 40 * DAY];
  const MAX_BOX = INTERVALS.length - 1;

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return Object.assign(blank(), parsed);
        }
      }
    } catch (e) {
      // private browsing, cleared storage, quota — fall through to a fresh state
      console.warn('Could not read saved progress:', e.message);
    }
    return blank();
  }

  function blank() {
    return {
      items: {},      // "deck:id" -> { b, d, s, c, w }
      selection: {},  // deck -> [id] when only part of a deck is in play
      settings: { mapillaryToken: '', labels: false, theme: 'auto' },
      totals: { answered: 0, correct: 0, bestStreak: 0 },
      history: {},    // "YYYY-MM-DD" -> answers that day
    };
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeNow, 250);
  }

  function writeNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save progress:', e.message);
    }
  }

  const today = () => new Date().toISOString().slice(0, 10);

  const Store = {
    /** Write any pending save now. Used before the page reloads itself. */
    flush() { if (saveTimer) writeNow(); },

    /* ------------------------------------------------------------ items */
    get(deck, id) {
      return state.items[deck + ':' + id] || null;
    },

    /** Record an answer and reschedule the item. */
    grade(deck, id, correct) {
      const key = deck + ':' + id;
      const it = state.items[key] || { b: 0, d: 0, s: 0, c: 0, w: 0 };
      it.s++;
      if (correct) {
        it.c++;
        // Right first time means you already knew it: skip the relearning box
        // and see it again tomorrow. It must not share a box with a miss.
        it.b = it.b === 0 ? 2 : Math.min(it.b + 1, MAX_BOX);
      } else {
        it.w++;
        it.b = 1;
      }
      it.d = Date.now() + INTERVALS[it.b];
      state.items[key] = it;

      state.totals.answered++;
      if (correct) state.totals.correct++;
      state.history[today()] = (state.history[today()] || 0) + 1;
      save();
      return it;
    },

    /**
     * Build one round's questions for a deck. Every id appears at most once.
     *
     * A round is made of what is due (most overdue first) and what you have
     * never seen. It is *not* topped up with items you answered recently, even
     * if that leaves it short: a round of ten new questions is better than ten
     * new ones and two you saw a minute ago, which is exactly the repetition
     * people notice. Only when nothing at all is due or unseen — you have been
     * through the whole deck and nothing has come back round yet — does it fall
     * back to the items due soonest, so there is always something to play.
     *
     * The order is shuffled either way, so a small deck that has to reuse its
     * items does not replay the last round word for word.
     */
    queue(deck, ids, size) {
      const now = Date.now();
      const due = [], fresh = [], later = [];
      for (const id of new Set(ids)) {                 // no duplicates, ever
        const it = state.items[deck + ':' + id];
        if (!it) fresh.push(id);
        else if (it.d <= now) due.push({ id, d: it.d });
        else later.push({ id, d: it.d });
      }
      due.sort((a, b) => a.d - b.d);
      later.sort((a, b) => a.d - b.d);

      const want = size || ids.length;
      const ready = due.map(x => x.id).concat(shuffle(fresh));
      const picked = shuffle((ready.length ? ready : later.map(x => x.id)).slice(0, want));
      // Flag the one case where repeats are unavoidable, so the round can say
      // so instead of looking like the old bug.
      picked.recycled = !ready.length && picked.length > 0;
      return picked;
    },

    /** Mastery summary for a deck, for the home screen. */
    progress(deck, ids) {
      let learned = 0, mastered = 0, due = 0, seen = 0;
      const now = Date.now();
      for (const id of ids) {
        const it = state.items[deck + ':' + id];
        if (!it) continue;
        seen++;
        if (it.b >= 3) learned++;
        if (it.b >= MAX_BOX) mastered++;
        if (it.d <= now) due++;
      }
      return { total: ids.length, seen, learned, mastered, due };
    },

    /** Reset a single deck without touching the rest. */
    resetDeck(deck, ids) {
      for (const id of ids) delete state.items[deck + ':' + id];
      save();
    },

    /* ------------------------------------------------------- selection */
    /**
     * Which items of a deck are in play.
     *
     * Returns null when the whole deck is, which is the default and is stored
     * as the *absence* of a selection rather than as a list of everything —
     * so adding new places to a deck later does not silently leave them out
     * of somebody's existing selection.
     */
    selection(deck) {
      const sel = state.selection && state.selection[deck];
      // an empty array is a real answer ("nothing is switched on") and must
      // round-trip as one, or turning everything off would silently mean
      // turning everything on
      return Array.isArray(sel) ? sel.slice() : null;
    },

    setSelection(deck, ids) {
      if (!state.selection) state.selection = {};
      if (ids == null) delete state.selection[deck];
      else state.selection[deck] = ids.slice();
      save();
    },

    /**
     * The items of a deck you keep getting wrong: seen, answered wrong at
     * least once, and not yet promoted out of the early boxes. Feeds the
     * picker's "just the ones I keep missing" shortcut.
     */
    leeches(deck, ids) {
      return ids.filter(id => {
        const it = state.items[deck + ':' + id];
        return it && it.w > 0 && it.b <= 2;
      });
    },

    resetAll() {
      state = blank();
      try { localStorage.removeItem(KEY); } catch (e) { /* nothing to do */ }
    },

    /* --------------------------------------------------------- totals */
    totals() { return Object.assign({}, state.totals); },

    noteStreak(n) {
      if (n > state.totals.bestStreak) { state.totals.bestStreak = n; save(); }
    },

    /** Answers per day for the last `n` days, oldest first. */
    recent(n) {
      const out = [];
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
        out.push({ date: d, count: state.history[d] || 0 });
      }
      return out;
    },

    /* ------------------------------------------------------- settings */
    setting(k, v) {
      if (v === undefined) return state.settings[k];
      state.settings[k] = v;
      save();
      return v;
    },
  };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  Store.shuffle = shuffle;
  Store.MAX_BOX = MAX_BOX;
  window.Store = Store;
})();
