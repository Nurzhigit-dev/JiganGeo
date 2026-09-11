/*
 * store.js — progress, spaced repetition and settings, persisted to
 * localStorage. Everything is per-item so a "deck" is just a set of item ids.
 *
 * Scheduling is a Leitner box system: a correct answer promotes an item one
 * box and pushes it further into the future, a wrong answer knocks it back to
 * box 1 so it returns inside the same session.
 */
(function () {
  'use strict';

  const KEY = 'mygeogame.v1';
  const DAY = 86400000;
  // days until an item in each box comes back. Box 1 is "later today".
  const INTERVALS = [0, 0, 1, 3, 7, 16, 40];
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
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('Could not save progress:', e.message);
      }
    }, 250);
  }

  const today = () => new Date().toISOString().slice(0, 10);

  const Store = {
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
        it.b = Math.min(it.b + 1, MAX_BOX);
      } else {
        it.w++;
        it.b = 1;
      }
      it.d = Date.now() + INTERVALS[it.b] * DAY;
      state.items[key] = it;

      state.totals.answered++;
      if (correct) state.totals.correct++;
      state.history[today()] = (state.history[today()] || 0) + 1;
      save();
      return it;
    },

    /**
     * Build a study queue for a deck.
     * Due items come first (most overdue first), then unseen items, then —
     * only if we still need more — the items closest to falling due.
     */
    queue(deck, ids, size) {
      const now = Date.now();
      const seen = [], fresh = [];
      for (const id of ids) {
        const it = state.items[deck + ':' + id];
        if (!it) fresh.push(id);
        else seen.push({ id, due: it.d, box: it.b });
      }
      const due = seen.filter(x => x.due <= now).sort((a, b) => a.due - b.due).map(x => x.id);
      const later = seen.filter(x => x.due > now).sort((a, b) => a.due - b.due).map(x => x.id);

      shuffle(fresh);
      const out = due.concat(fresh);
      if (out.length < size) out.push(...later);
      return out.slice(0, size || out.length);
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
