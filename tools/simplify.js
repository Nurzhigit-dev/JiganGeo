// Douglas-Peucker simplification + coordinate quantisation for GeoJSON.
const fs = require('fs');

function perpDist(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const cx = x1 + Math.max(0, Math.min(1, t)) * dx;
  const cy = y1 + Math.max(0, Math.min(1, t)) * dy;
  return Math.hypot(x - cx, y - cy);
}

function dp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  return dp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(dp(pts.slice(idx), eps));
}

const round = (n, p) => Math.round(n * 10 ** p) / 10 ** p;

function ringArea(r) { // shoelace, degrees^2 — only used for relative size filtering
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return Math.abs(a / 2);
}

function simpRing(ring, eps, prec) {
  let out = dp(ring, eps).map(p => [round(p[0], prec), round(p[1], prec)]);
  // drop consecutive duplicates created by rounding
  out = out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
  if (out.length < 4) return null;
  const f = out[0], l = out[out.length - 1];
  if (f[0] !== l[0] || f[1] !== l[1]) out.push([f[0], f[1]]);
  return out.length >= 4 ? out : null;
}

function simpPoly(poly, eps, prec, minArea) {
  const outer = simpRing(poly[0], eps, prec);
  if (!outer || ringArea(outer) < minArea) return null;
  const rings = [outer];
  for (let i = 1; i < poly.length; i++) {
    const h = simpRing(poly[i], eps, prec);
    if (h && ringArea(h) >= minArea) rings.push(h);
  }
  return rings;
}

function simplify(fc, { eps, prec, minArea }) {
  for (const f of fc.features) {
    const g = f.geometry;
    if (g.type === 'Polygon') {
      const p = simpPoly(g.coordinates, eps, prec, minArea);
      if (p) g.coordinates = p;
    } else if (g.type === 'MultiPolygon') {
      const polys = g.coordinates.map(p => simpPoly(p, eps, prec, minArea)).filter(Boolean);
      if (polys.length === 0) { // keep the single largest even if tiny — never drop a feature entirely
        const biggest = g.coordinates.slice().sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0];
        g.coordinates = [[biggest[0].map(p => [round(p[0], prec), round(p[1], prec)])]];
      } else if (polys.length === 1) {
        f.geometry = { type: 'Polygon', coordinates: polys[0] };
      } else {
        g.coordinates = polys;
      }
    }
  }
  return fc;
}

const [, , inFile, outFile, epsS, precS, minAreaS] = process.argv;
const fc = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const before = fs.statSync(inFile).size;
simplify(fc, { eps: +epsS, prec: +precS, minArea: +minAreaS });
fs.writeFileSync(outFile, JSON.stringify(fc));
const after = fs.statSync(outFile).size;
console.log(`${inFile} -> ${outFile}: ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB (${(100-after/before*100).toFixed(1)}% smaller), ${fc.features.length} features`);
