/*
 * mapview.js — SVG map with click targets, zoom/pan and inset panels.
 *
 * Panels exist because Japan does not fit in one rectangle: Okinawa sits
 * 1,000 km southwest of Kyushu, and Tokyo prefecture legally extends to the
 * Ogasawara islands 1,800 km out in the Pacific. Fitting all of that in one
 * frame leaves the mainland tiny and mostly ocean. So the map draws Okinawa in
 * its own inset box the way Japanese atlases do, and clips the far islands.
 *
 * The drawing canvas is 1000 units wide and reshapes with the viewport: a wide
 * frame on a desktop, a near-square one on a phone, sized from the map's own
 * proportions so the content always fills it. Panel rects are therefore given
 * as fractions of the canvas, never pixels.
 */
(function () {
  'use strict';

  const W = 1000;                   // canvas width in logical units; height varies
  const LANDSCAPE_H = 620;
  const PORTRAIT_MAX = 1000 / 0.72; // tallest portrait canvas we allow
  const PORTRAIT_MIN = 1000 / 1.9;  // shortest
  const NARROW = '(max-width: 860px)';
  const DOT_R = 4.5, DOT_HIT = 11;  // city marker: visible radius, click radius
  const NS = 'http://www.w3.org/2000/svg';
  // every highlight a shape can carry; listed once so adding one cannot leave
  // a stale class behind
  const STATE_CLASSES = ['is-correct', 'is-wrong', 'is-target', 'is-pending', 'is-hint', 'is-dim'];

  class MapView {
    constructor(container) {
      this.container = container;
      this.onPick = null;
      this.onZoom = null;       // k => void, for the "reset view" affordance
      // one id can own several paths: a Japanese *region* is drawn as its
      // member prefectures, all answering to the same name.
      this.paths = new Map();       // id -> <path>[]
      this.features = new Map();    // id -> feature
      this.states = new Map();      // id -> 'correct' | 'wrong' | ... (survives relayout)
      this.transform = { k: 1, x: 0, y: 0 };
      this.labelFor = null;         // id -> string, when name labels are on
      this.W = W;
      this.H = LANDSCAPE_H;
      this._build();
      this._watchViewport();
    }

    _build() {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
      svg.setAttribute('class', 'map-svg');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      this.defs = document.createElementNS(NS, 'defs');
      svg.appendChild(this.defs);

      this.zoomLayer = document.createElementNS(NS, 'g');
      svg.appendChild(this.zoomLayer);

      this.container.innerHTML = '';
      this.container.appendChild(svg);
      this.svg = svg;

      // floating name label, so you read what you clicked where you clicked it
      this.label = document.createElement('div');
      this.label.className = 'map-label';
      this.label.hidden = true;
      this.container.appendChild(this.label);

      this._wireZoom();
      this._wireLabel();
    }

    /** Re-lay out when the viewport crosses the narrow/wide boundary. */
    _watchViewport() {
      this._mq = window.matchMedia(NARROW);
      this._onMq = () => { if (this._lastRender) this.render(...this._lastRender); };
      // Safari < 14 only has the deprecated listener API
      if (this._mq.addEventListener) this._mq.addEventListener('change', this._onMq);
      else this._mq.addListener(this._onMq);
    }

    destroy() {
      if (this._endOutside) {
        window.removeEventListener('pointerup', this._endOutside);
        window.removeEventListener('pointercancel', this._endOutside);
        this._endOutside = null;
      }
      if (!this._mq) return;
      if (this._mq.removeEventListener) this._mq.removeEventListener('change', this._onMq);
      else this._mq.removeListener(this._onMq);
      this._mq = null;
    }

    /**
     * @param {Array} panels  [{ id, features, context?, bounds?, rect?, rectPortrait?, label?, frame? }]
     *   bounds  [[west,south],[east,north]] — fit to this window, clipping
     *           anything outside. Omit to fit the features themselves.
     *   rect    { x, y, w, h } as fractions of the canvas. Omit for the whole canvas.
     * @param {string} projection  'mercator' | 'naturalEarth'
     */
    render(panels, projection) {
      this._lastRender = [panels, projection];
      const portrait = this._mq.matches;
      this.H = portrait ? this._portraitHeight(panels[0], projection) : LANDSCAPE_H;
      this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
      this.svg.classList.toggle('is-portrait', portrait);

      this.zoomLayer.innerHTML = '';
      this.defs.innerHTML = '';
      this.paths.clear();
      this.features.clear();
      this.panels = panels;
      this.transform = { k: 1, x: 0, y: 0 };
      this._apply();

      for (const panel of panels) {
        const rect = this._rectOf(panel, portrait);
        const pad = panel.rect ? 6 : 14;

        const proj = projection === 'naturalEarth' ? d3.geoNaturalEarth1() : d3.geoMercator();
        const extent = [[rect.x + pad, rect.y + pad], [rect.x + rect.w - pad, rect.y + rect.h - pad]];
        proj.fitExtent(extent, this._fitTarget(panel));
        const path = d3.geoPath(proj);

        // clip to the panel rect so out-of-window islands disappear cleanly
        const clipId = 'clip-' + panel.id;
        const clip = document.createElementNS(NS, 'clipPath');
        clip.setAttribute('id', clipId);
        const cr = document.createElementNS(NS, 'rect');
        cr.setAttribute('x', rect.x); cr.setAttribute('y', rect.y);
        cr.setAttribute('width', rect.w); cr.setAttribute('height', rect.h);
        clip.appendChild(cr);
        this.defs.appendChild(clip);

        const g = document.createElementNS(NS, 'g');
        g.setAttribute('clip-path', `url(#${clipId})`);
        g.setAttribute('class', 'map-panel');

        if (panel.frame) {
          const fr = document.createElementNS(NS, 'rect');
          fr.setAttribute('x', rect.x); fr.setAttribute('y', rect.y);
          fr.setAttribute('width', rect.w); fr.setAttribute('height', rect.h);
          fr.setAttribute('class', 'map-inset-frame');
          fr.setAttribute('rx', 4);
          g.appendChild(fr);
        }

        // surrounding geography, drawn faintly so a continent quiz still shows
        // where the continent sits. Not clickable.
        for (const f of panel.context || []) {
          const d = path(f);
          if (!d) continue;
          const el = document.createElementNS(NS, 'path');
          el.setAttribute('d', d);
          el.setAttribute('class', 'map-context');
          el.setAttribute('vector-effect', 'non-scaling-stroke');
          g.appendChild(el);
        }

        for (const f of panel.features) {
          const d = path(f);
          if (!d) continue;                       // nothing inside the window
          const id = f.properties.id;
          const el = document.createElementNS(NS, 'path');
          el.setAttribute('d', d);
          el.setAttribute('class', 'map-shape');
          el.setAttribute('vector-effect', 'non-scaling-stroke');
          el.dataset.id = id;
          // Zooming uses the main landmass, not the whole shape. Tokyo owns the
          // Izu islands 300 km out to sea, so its full bounding box is mostly
          // ocean and centring on it would put the prefecture off screen.
          const core = largestPolygon(f.geometry);
          el._focusBox = core
            ? path.bounds({ type: 'Feature', properties: {}, geometry: core })
            : null;
          el.addEventListener('click', () => {
            // no stopPropagation: the svg-level listener that positions the
            // name label still needs to see this click, which is the only
            // way a touch device ever gets a label (taps have no hover).
            if (this.onPick && !this._panned && !this._locked) this.onPick(id, f);
          });
          g.appendChild(el);
          if (!this.paths.has(id)) this.paths.set(id, []);
          this.paths.get(id).push(el);
          if (!this.features.has(id)) this.features.set(id, f);
        }

        if (panel.label) {
          const t = document.createElementNS(NS, 'text');
          t.setAttribute('x', rect.x + 8);
          t.setAttribute('y', rect.y + 16);
          t.setAttribute('class', 'map-inset-label');
          t.textContent = panel.label;
          g.appendChild(t);
        }

        this.zoomLayer.appendChild(g);
        panel._proj = proj;
        panel._path = path;
        panel._rect = rect;
      }

      // city dots live above the shapes
      this.dotLayer = document.createElementNS(NS, 'g');
      this.zoomLayer.appendChild(this.dotLayer);
      if (this._lastDots) this.renderDots(this._lastDots);

      // a relayout must not wipe the highlighting of an answer in progress
      for (const [id, state] of this.states) this._paint(id, state);
    }

    _fitTarget(panel) {
      return panel.bounds
        ? windowPoints(panel.bounds, 12)
        : { type: 'FeatureCollection', features: panel.features.concat(panel.context || []) };
    }

    /**
     * Pick a portrait canvas height from the map's own proportions, by fitting
     * it into a square first and measuring what comes out. Without this a phone
     * would letterbox every map into a thin strip.
     */
    _portraitHeight(panel, projection) {
      try {
        const probe = projection === 'naturalEarth' ? d3.geoNaturalEarth1() : d3.geoMercator();
        const target = this._fitTarget(panel);
        probe.fitExtent([[0, 0], [W, W]], target);
        const b = d3.geoPath(probe).bounds(target);
        const aspect = (b[1][0] - b[0][0]) / (b[1][1] - b[0][1]);
        if (!isFinite(aspect) || aspect <= 0) return LANDSCAPE_H;
        return Math.round(Math.max(PORTRAIT_MIN, Math.min(PORTRAIT_MAX, W / aspect)));
      } catch (e) {
        return LANDSCAPE_H;
      }
    }

    /** Panel rects are fractions of the canvas; resolve to logical units. */
    _rectOf(panel, portrait) {
      const f = (portrait && panel.rectPortrait) || panel.rect;
      if (!f) return { x: 0, y: 0, w: this.W, h: this.H };
      return { x: f.x * this.W, y: f.y * this.H, w: f.w * this.W, h: f.h * this.H };
    }

    /**
     * Plot city markers. Each needs { id, lat, lon }.
     *
     * Dots hold a constant *screen* size as you zoom (their radius is divided
     * by the zoom factor). If they scaled with the map, zooming into the Kansai
     * cluster would enlarge the dots as fast as it separated them, and you
     * still could not tell Kyoto from Osaka.
     */
    renderDots(dots) {
      if (!this.dotLayer) return;
      this._lastDots = dots;
      this.dotLayer.innerHTML = '';
      this.dots = new Map();
      this.hits = [];
      for (const dot of dots) {
        const panel = this._panelFor(dot.lon, dot.lat);
        if (!panel || !panel._proj) continue;
        const xy = panel._proj([dot.lon, dot.lat]);
        if (!xy) continue;

        // invisible, generous hit target sitting under the visible dot
        const hit = document.createElementNS(NS, 'circle');
        hit.setAttribute('cx', xy[0]); hit.setAttribute('cy', xy[1]);
        hit.setAttribute('r', DOT_HIT);
        hit.setAttribute('class', 'map-dot-hit');
        hit.dataset.id = dot.id;
        hit.addEventListener('click', () => {
          if (this.onPick && !this._panned && !this._locked) this.onPick(dot.id, dot);
        });

        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', xy[0]); c.setAttribute('cy', xy[1]);
        c.setAttribute('r', DOT_R);
        c.setAttribute('class', 'map-dot');
        c.setAttribute('vector-effect', 'non-scaling-stroke');

        this.dotLayer.append(hit, c);
        this.dots.set(dot.id, c);
        this.hits.push(hit);
      }
      this._sizeDots();
    }

    _sizeDots() {
      if (!this.dots) return;
      const k = this.transform.k || 1;
      for (const c of this.dots.values()) c.setAttribute('r', DOT_R / k);
      for (const hitEl of this.hits) hitEl.setAttribute('r', DOT_HIT / k);
    }

    _panelFor(lon, lat) {
      // a point belongs to the first panel whose geographic window contains it
      for (const p of this.panels) {
        if (!p.bounds) return p;
        const [[w, s], [e, n]] = p.bounds;
        if (lon >= w && lon <= e && lat >= s && lat <= n) return p;
      }
      return null;
    }

    /* --------------------------------------------------------- appearance */
    _elems(id) {
      const p = this.paths.get(id);
      if (p) return p;
      const dot = this.dots && this.dots.get(id);
      return dot ? [dot] : [];
    }

    _paint(id, state) {
      for (const el of this._elems(id)) {
        el.classList.remove(...STATE_CLASSES);
        if (state) el.classList.add('is-' + state);
      }
    }

    setState(id, state) {
      if (state) this.states.set(id, state); else this.states.delete(id);
      this._paint(id, state);
    }

    clearStates() {
      this.states.clear();
      const strip = el => el.classList.remove(...STATE_CLASSES);
      for (const list of this.paths.values()) list.forEach(strip);
      if (this.dots) for (const el of this.dots.values()) strip(el);
    }

    /**
     * Lock out picking. Implemented as a flag rather than pointer-events:none,
     * because the reveal after an answer still wants hover to work — you should
     * be able to run the cursor over the map and read the names.
     */
    setInteractive(on) {
      this._locked = !on;
      this.svg.classList.toggle('is-locked', !on);
    }

    /* ------------------------------------------------------- name labels */
    /**
     * Turn on the floating name label. `fn` maps a feature id to the text to
     * show, or returns nothing to show nothing. Pass null to switch it off.
     *
     * This exists because reading the name of the thing you just clicked in a
     * panel on the far side of the screen means hunting for it every time.
     */
    setLabels(fn) {
      this.labelFor = fn || null;
      if (!fn) this._hideLabel();
    }

    _wireLabel() {
      const show = ev => {
        if (!this.labelFor || this._panned) return;
        const el = ev.target.closest ? ev.target.closest('[data-id]') : null;
        if (!el || !el.dataset.id) return this._hideLabel();
        const text = this.labelFor(el.dataset.id);
        if (!text) return this._hideLabel();
        this._showLabel(text, ev.clientX, ev.clientY);
      };
      this.svg.addEventListener('pointermove', show);
      // a tap has no hover, so place the label on click too
      this.svg.addEventListener('click', show);
      this.svg.addEventListener('pointerleave', () => {
        if (this._touch) return;            // let a tapped label linger
        this._hideLabel();
      });
    }

    _showLabel(text, clientX, clientY) {
      const box = this.container.getBoundingClientRect();
      this.label.textContent = text;
      this.label.hidden = false;
      const lw = this.label.offsetWidth, lh = this.label.offsetHeight;
      let x = clientX - box.left + 14;
      let y = clientY - box.top - lh - 12;
      if (x + lw > box.width - 6) x = clientX - box.left - lw - 14;
      if (y < 6) y = clientY - box.top + 20;
      this.label.style.left = Math.max(6, Math.min(x, box.width - lw - 6)) + 'px';
      this.label.style.top = Math.max(6, Math.min(y, box.height - lh - 6)) + 'px';
    }

    _hideLabel() { this.label.hidden = true; }

    /* -------------------------------------------------------- zoom & pan */
    _wireZoom() {
      const svg = this.svg;
      const active = new Map();     // pointerId -> {x, y}
      let pinch = null;             // {dist, mid} while two fingers are down
      let captured = false;

      svg.addEventListener('wheel', ev => {
        ev.preventDefault();
        const pt = this._svgPoint(ev);
        this._zoomAt(pt, ev.deltaY < 0 ? 1.18 : 1 / 1.18);
      }, { passive: false });

      svg.addEventListener('pointerdown', ev => {
        if (ev.pointerType === 'touch') this._touch = true;
        active.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        this._panned = false;
        if (active.size === 2) {
          pinch = this._pinchState(active);
          this._panned = true;      // a pinch is never a tap
        }
        // deliberately no setPointerCapture here: capturing on the <svg>
        // retargets the follow-up click away from the <path> under the cursor,
        // so every shape would stop responding to plain clicks.
      });

      svg.addEventListener('pointermove', ev => {
        if (!active.has(ev.pointerId)) return;
        const prev = active.get(ev.pointerId);
        active.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

        if (active.size >= 2) {
          if (!pinch) { pinch = this._pinchState(active); return; }
          const next = this._pinchState(active);
          const scale = this._svgScale();
          const mid = {
            x: (next.mid.x - svg.getBoundingClientRect().left) * scale.x,
            y: (next.mid.y - svg.getBoundingClientRect().top) * scale.y,
          };
          if (pinch.dist > 0) this._zoomAt(mid, next.dist / pinch.dist);
          // drag the midpoint too, so two fingers pan as well as zoom
          this.transform.x += (next.mid.x - pinch.mid.x) * scale.x;
          this.transform.y += (next.mid.y - pinch.mid.y) * scale.y;
          this._apply();
          pinch = next;
          this._hideLabel();
          return;
        }

        const dx = ev.clientX - prev.x, dy = ev.clientY - prev.y;
        // small deadzone, so a click with a shaky hand is still a click
        if (!this._panned && Math.abs(dx) + Math.abs(dy) <= 3) {
          active.set(ev.pointerId, prev);   // keep accumulating against the origin
          return;
        }
        this._panned = true;
        if (!captured) {
          try { svg.setPointerCapture(ev.pointerId); captured = true; } catch (e) { /* fine */ }
        }
        const scale = this._svgScale();
        this.transform.x += dx * scale.x;
        this.transform.y += dy * scale.y;
        this._apply();
        this._hideLabel();
      });

      const end = ev => {
        active.delete(ev.pointerId);
        if (active.size < 2) pinch = null;
        if (captured && active.size === 0) {
          try { svg.releasePointerCapture(ev.pointerId); } catch (e) { /* already gone */ }
          captured = false;
        }
        // let the click handler run before we clear the pan flag
        if (active.size === 0) setTimeout(() => { this._panned = false; }, 0);
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      svg.addEventListener('lostpointercapture', end);
      // A release that lands outside the svg — dragging off the edge, or a
      // system gesture stealing the touch — would otherwise leave the pointer
      // in `active` forever, and the next tap would be read as a second finger.
      this._endOutside = end;
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    }

    _pinchState(active) {
      const [a, b] = [...active.values()];
      return {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    }

    _svgScale() {
      const r = this.svg.getBoundingClientRect();
      return { x: this.W / r.width, y: this.H / r.height };
    }

    _svgPoint(ev) {
      const r = this.svg.getBoundingClientRect();
      return {
        x: (ev.clientX - r.left) * (this.W / r.width),
        y: (ev.clientY - r.top) * (this.H / r.height),
      };
    }

    _zoomAt(pt, factor) {
      const t = this.transform;
      const k = Math.max(1, Math.min(28, t.k * factor));
      const real = k / t.k;
      t.x = pt.x - (pt.x - t.x) * real;
      t.y = pt.y - (pt.y - t.y) * real;
      t.k = k;
      if (t.k === 1) { t.x = 0; t.y = 0; }
      this._apply();
    }

    zoomBy(factor) { this._zoomAt({ x: this.W / 2, y: this.H / 2 }, factor); }

    resetZoom() {
      this.transform = { k: 1, x: 0, y: 0 };
      this._apply();
    }

    /**
     * Zoom so one item — possibly several shapes — fills the frame.
     * `maxK` matters for city dots: their bounding box is a few pixels wide, so
     * without a ceiling every city would slam the zoom to its limit.
     */
    focus(id, fill, maxK) {
      const els = this._elems(id);
      if (!els.length) return;
      const prev = this.zoomLayer.getAttribute('transform');
      this.zoomLayer.removeAttribute('transform');
      let b = null;
      for (const el of els) {
        let r;
        if (el._focusBox) {
          const [[x0, y0], [x1, y1]] = el._focusBox;
          r = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
        } else {
          r = el.getBBox();
        }
        if (!r.width && !r.height) continue;
        b = b ? union(b, r) : r;
      }
      if (prev) this.zoomLayer.setAttribute('transform', prev);
      if (!b || !b.width || !b.height) return;
      const ceiling = maxK || 14;
      const k = Math.max(1, Math.min(ceiling,
        (fill || 0.45) * Math.min(this.W / b.width, this.H / b.height)));
      this.transform = {
        k,
        x: this.W / 2 - (b.x + b.width / 2) * k,
        y: this.H / 2 - (b.y + b.height / 2) * k,
      };
      this._apply(true);
    }

    _apply(animate) {
      const t = this.transform;
      this.zoomLayer.style.transition = animate ? 'transform .45s cubic-bezier(.4,0,.2,1)' : 'none';
      this.zoomLayer.setAttribute('transform', `translate(${t.x},${t.y}) scale(${t.k})`);
      this._sizeDots();
      if (this.onZoom) this.onZoom(t.k);
    }
  }

  /** The biggest ring of a Polygon/MultiPolygon, as its own geometry. */
  function largestPolygon(geom) {
    if (!geom) return null;
    if (geom.type === 'Polygon') return geom;
    if (geom.type !== 'MultiPolygon' || !geom.coordinates.length) return null;
    let best = null, bestArea = -1;
    for (const poly of geom.coordinates) {
      const a = ringArea(poly[0]);
      if (a > bestArea) { bestArea = a; best = poly; }
    }
    return best ? { type: 'Polygon', coordinates: best } : null;
  }

  function ringArea(ring) {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
      a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    return Math.abs(a / 2);
  }

  function union(a, b) {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return {
      x, y,
      width: Math.max(a.x + a.width, b.x + b.width) - x,
      height: Math.max(a.y + a.height, b.y + b.height) - y,
    };
  }

  /**
   * A geographic window, expressed as points sampled around its perimeter.
   *
   * Not a Polygon, deliberately. d3-geo treats polygon edges as great-circle
   * arcs, so a wide box bulges towards the pole and fits far too small — the
   * Americas window came out at 60% of the right scale. It also reads ring
   * winding as inside/outside, so a counter-clockwise ring silently means
   * "everywhere except this box". Points have neither problem.
   */
  function windowPoints(b, n) {
    const [[w, s], [e, north]] = b;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([w + (e - w) * t, s], [w + (e - w) * t, north],
               [w, s + (north - s) * t], [e, s + (north - s) * t]);
    }
    return { type: 'MultiPoint', coordinates: pts };
  }

  window.MapView = MapView;
  window.MAP_W = W;
})();
