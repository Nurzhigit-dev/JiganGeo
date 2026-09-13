/*
 * freshness.js — reload the page when the app's own files have changed.
 *
 * This is a single-page app: moving between decks and rounds never reloads a
 * script. So a tab that was open before the code changed keeps running the old
 * code indefinitely, looking exactly like a fix that did not work. That is not
 * hypothetical — the "questions come in the same order every round" bug was
 * fixed on disk and still reproduced in a tab opened before the fix.
 *
 * On startup this records a stamp (Last-Modified, or failing that an ETag) for
 * every script and stylesheet the page loaded. It checks again whenever the tab
 * comes back into view and whenever a new screen or round starts, and reloads if
 * anything differs. The URL hash survives the reload, so you land on the same
 * screen, now running the current code.
 *
 * Needs an HTTP server (start.bat) to read those stamps; from file:// it does
 * nothing and a manual refresh is still required after an update.
 */
(function () {
  'use strict';

  const MIN_GAP = 2000;   // do not re-check more often than this

  if (!/^https?:$/.test(location.protocol)) {
    window.Freshness = { check: function () {} };
    return;
  }

  const urls = [...document.querySelectorAll('script[src], link[rel="stylesheet"][href]')]
    .map(n => n.src || n.href)
    .filter(u => u.startsWith(location.origin));

  async function stampOf(url) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (!res.ok) return null;
      return res.headers.get('Last-Modified') || res.headers.get('ETag') || null;
    } catch (e) {
      return null;              // server down or unreachable: never a reason to reload
    }
  }

  const snapshot = () => Promise.all(urls.map(stampOf));

  const baseline = snapshot();
  let running = false;
  let lastRun = 0;

  async function check() {
    const now = Date.now();
    if (running || now - lastRun < MIN_GAP) return;
    running = true;
    lastRun = now;
    try {
      const [before, after] = await Promise.all([baseline, snapshot()]);
      // only a stamp we could read both times counts as a change
      const changed = after.some((s, i) => s && before[i] && s !== before[i]);
      if (changed) {
        if (window.Store && window.Store.flush) window.Store.flush();
        location.reload();
      }
    } finally {
      running = false;
    }
  }

  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('focus', check);

  window.Freshness = { check: check };
})();
