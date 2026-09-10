/* dom.js — two helpers used everywhere. Loaded before any view. */
(function () {
  'use strict';

  /** h('div', 'card is-link', 'text') */
  function h(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ENTITIES[c]);
  }

  /**
   * Very small markdown subset for the school copy: **bold** and *italic*.
   * Bold is substituted first so its asterisks are consumed before the italic
   * pass sees them. The source text is ours, but it still goes through esc()
   * first so a stray angle bracket in a place name can never become markup.
   */
  function rich(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  /**
   * A two-letter country chip.
   *
   * Not an emoji flag: Windows ships no glyphs for regional-indicator pairs, so
   * 🇯🇵 renders as a bare "JP" in a random font — inconsistent across the very
   * machines this runs on. A drawn chip looks the same everywhere.
   */
  function flag(code, size) {
    return '<span class="flag-chip' + (size ? ' is-' + size : '') + '">'
      + esc(String(code).slice(0, 2).toUpperCase()) + '</span>';
  }

  window.h = h;
  window.esc = esc;
  window.rich = rich;
  window.flag = flag;
})();
