// Pinball: reproducible pixel measurement of the generated table art + sprite preparation.
// usage: node scripts/arcade/pinball-measure.mjs [--overlay out.png]
// All colliders come from the raster: rim/plate creases (luminance scans), wire guides
// (dark-run centrelines), posts (ring-contrast circle search), slingshots (dark component
// vertices), lights / LCD / plunger slot (colour components). Play objects that the empty
// table does not contain (bumpers, flippers, plunger) are placed relative to measured features.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { writeFile, stat, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const rawDir = "_incoming_arcade/pinball_raw", outDir = "public/arcade";
const overlayArg = process.argv.indexOf("--overlay");
const overlayPath = overlayArg > 0 ? process.argv[overlayArg + 1] : null;
const work = join(tmpdir(), "pinball-measure"); await mkdir(work, { recursive: true });
const round = v => Math.round(v * 1e6) / 1e6;
const BG = [233, 230, 225]; // generator background #E9E6E1 (brief)

async function load(name) {
  const { data, info } = await sharp(`${rawDir}/${name}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const T = await load("pb_table");
const lum = (x, y) => { x = Math.max(0, Math.min(T.w - 1, Math.round(x))); y = Math.max(0, Math.min(T.h - 1, Math.round(y))); const i = (y * T.w + x) * 3; return (T.data[i] + T.data[i + 1] + T.data[i + 2]) / 3; };
const rgb = (x, y) => { const i = (Math.round(y) * T.w + Math.round(x)) * 3; return [T.data[i], T.data[i + 1], T.data[i + 2]]; };
const isOrange = (x, y) => { const [r, g, b] = rgb(x, y); return r > 170 && g < 160 && b < 110; };

function components(im, predicate, minCount = 30) {
  const { w, h, data } = im, mask = new Uint8Array(w * h), queue = new Int32Array(w * h), found = [];
  for (let p = 0; p < w * h; p++) { const i = p * 3; if (predicate(data[i], data[i + 1], data[i + 2], p % w, (p / w) | 0)) mask[p] = 1; }
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    let head = 0, tail = 0, l = w, t = h, r = 0, b = 0, sx = 0, sy = 0; const pixels = [];
    queue[tail++] = p; mask[p] = 0;
    while (head < tail) {
      const n = queue[head++], x = n % w, y = (n / w) | 0; sx += x; sy += y; pixels.push(n);
      l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
      for (const m of [x > 0 ? n - 1 : -1, x < w - 1 ? n + 1 : -1, n - w, n + w]) if (m >= 0 && m < mask.length && mask[m]) { mask[m] = 0; queue[tail++] = m; }
    }
    if (tail >= minCount) found.push({ x: l, y: t, w: r - l + 1, h: b - t + 1, n: tail, cx: sx / tail, cy: sy / tail, pixels });
  }
  return found.sort((a, b) => b.n - a.n);
}
const rayPoint = (c, deg, r) => [c[0] + Math.cos(deg * Math.PI / 180) * r, c[1] + Math.sin(deg * Math.PI / 180) * r];

// ---------- colour features ----------
const lights = components(T, (r, g, b) => r > 180 && g < 150 && b < 90, 200).map(c => ({ x: c.cx, y: c.cy, r: Math.max(c.w, c.h) / 2 })).sort((a, b) => a.y - b.y || a.x - b.x);
if (lights.length !== 5) throw new Error(`expected 5 lights, got ${lights.length}`);
const laneLights = lights.filter(l => l.y < T.h * .45).sort((a, b) => a.y - b.y);
const targetLights = lights.filter(l => l.y >= T.h * .45).sort((a, b) => a.x - b.x);
const lcdC = components(T, (r, g, b) => g > r && (r + g + b) / 3 < 150 && (r + g + b) / 3 > 90, 2000)[0];
const lcd = { x: lcdC.x, y: lcdC.y, w: lcdC.w, h: lcdC.h };
const nearLight = (x, y, pad = 5) => lights.some(l => Math.hypot(x - l.x, y - l.y) < l.r + pad);

// Plunger slot (recessed channel in the right rim band)
const slotProbeX = Math.round(T.w * .866);
let slotTop = 0, slotBottom = 0;
for (let y = Math.round(T.h * .22); y < T.h; y++) if (lum(slotProbeX, y) < 175) { slotTop = y; break; }
for (let y = slotTop + 100; y < T.h; y++) if (lum(slotProbeX, y) > 190) { slotBottom = y - 1; break; }
const slotRows = [.45, .65, .85].map(f => Math.round(T.h * f));
const slotLeft = Math.min(...slotRows.map(y => { for (let x = slotProbeX - 40; x < slotProbeX; x++) if (lum(x, y) < 175) return x; return slotProbeX; }));
const slotRight = Math.max(...slotRows.map(y => { for (let x = slotProbeX + 40; x > slotProbeX; x--) if (lum(x, y) < 175) return x; return slotProbeX; }));
const slot = { left: slotLeft, right: slotRight, top: slotTop, bottom: slotBottom };

// ---------- table silhouette (alpha mask) ----------
const silCentre = [T.w / 2, T.h * .5];
const silR = [];
for (let a = 0; a < 360; a += 1) {
  // walk inward tracking the slowly varying background (soft drop shadow); the moulded
  // edge is the first abrupt departure from it
  let found = 0, ref = -1;
  for (let r = 1100; r > 50; r--) {
    const [x, y] = rayPoint(silCentre, a, r); if (x < 2 || y < 2 || x > T.w - 3 || y > T.h - 3) continue;
    const v = lum(x, y);
    if (ref < 0) ref = v;
    if (Math.abs(v - ref) > 9) { found = r + 1; break; }
    ref = ref * .8 + v * .2;
  }
  silR.push(found);
}
// median over 11 degrees rejects shadow speckle; outlines are smooth moulded curves
const silRs = silR.map((_, i) => median(Array.from({ length: 11 }, (_, k) => silR[(i + k - 5 + 360) % 360])));
const silhouetteSmooth = silRs.map((r, a) => rayPoint(silCentre, a, r));

// ---------- outer plate wall (lip crease, collider for the raised launch orbit) ----------
const archCentre = [T.w / 2, T.h * .3];
function lipCrease(c, a) {
  // inward from outside: table edge (first strong gradient) -> lip plateau -> first drop below it
  let r = 900;
  for (; r > 40; r--) { const [x, y] = rayPoint(c, a, r), [x2, y2] = rayPoint(c, a, r - 2); if (x < 1 || y < 1 || x > T.w - 2 || y > T.h - 2) continue; if (Math.abs(lum(x2, y2) - lum(x, y)) >= 12) break; }
  r -= 5;
  const plateau = median(Array.from({ length: 8 }, (_, k) => lum(...rayPoint(c, a, r - k))));
  for (let k = 0; k < 80; k++, r--) if (lum(...rayPoint(c, a, r)) < plateau - 12) return rayPoint(c, a, r - 2);
  return null;
}
const lip = [];
for (let a = 178; a <= 362; a += 2) { const p = lipCrease(archCentre, a); if (p) lip.push(p); }

// ---------- playfield floor boundary (plate / rim edge as seen from the floor) ----------
const obstacle = (x, y) => lum(x, y) < 120 || isOrange(x, y);
const riseOut = (v, prev) => v >= 205 && prev <= v - 12;
function floorRay(c, a, rMax) {
  let start = 40;
  for (let r = 40; r < rMax; r++) { const [x, y] = rayPoint(c, a, r); if (obstacle(x, y) || nearLight(x, y, 3)) start = r + 3; }
  for (let r = start + 2; r < rMax + 40; r++) {
    const [x, y] = rayPoint(c, a, r), [px, py] = rayPoint(c, a, r - 2);
    if (riseOut(lum(x, y), lum(px, py))) return rayPoint(c, a, r - 3);
  }
  return null;
}
const floor = { bl: [], left: [], tl: [], top: [], tr: [], right: [], br: [], bottom: [] };
for (let y = Math.round(T.h * .97); y >= T.h * .29; y -= 8) {
  let start = 200; for (let x = 95; x < 300; x++) if (obstacle(x, y) || nearLight(x, y)) { start = x - 3; break; }
  for (let x = start; x > 70; x--) if (riseOut(lum(x, y), lum(x + 2, y))) { floor.left.push([x + 3, y]); break; }
}
for (let y = Math.round(T.h * .29); y <= T.h * .97; y += 8) {
  let start = 800; for (let x = slot.left - 25; x > 600; x--) if (obstacle(x, y) || nearLight(x, y)) { start = x + 3; break; }
  for (let x = start; x < slot.left; x++) if (riseOut(lum(x, y), lum(x - 2, y))) { floor.right.push([x - 3, y]); break; }
}
for (let x = Math.round(lcd.x + 4); x <= lcd.x + lcd.w - 4; x += 6) {
  for (let y = Math.round(lcd.y + lcd.h + 60); y > lcd.y + lcd.h; y--) if (riseOut(lum(x, y), lum(x, y + 2))) { floor.top.push([x, y + 3]); break; }
}
for (let x = slot.left - 12; x >= 110; x -= 8) {
  for (let y = Math.round(T.h * .9); y < T.h - 20; y++) if (lum(x, y) >= 215 && lum(x, y - 2) <= lum(x, y) - 10) { floor.bottom.push([x, y - 3]); break; }
}
const tlC = [lcd.x - 5, T.h * .29], trC = [lcd.x + lcd.w + 5, T.h * .29];
for (let a = 182; a <= 266; a += 2) { const p = floorRay(tlC, a, 300); if (p) floor.tl.push(p); }
for (let a = 274; a <= 358; a += 2) { const p = floorRay(trC, a, 300); if (p) floor.tr.push(p); }
const blC = [T.w * .15, T.h * .91], brC = [slot.left - 60, T.h * .91];
for (let a = 92; a <= 178; a += 4) { const p = floorRay(blC, a, 120); if (p) floor.bl.push(p); }
for (let a = 2; a <= 88; a += 4) { const p = floorRay(brC, a, 120); if (p) floor.br.push(p); }

// Order into one loop, keep only points that lie in each piece's own sector, then smooth.
const leftX = median(floor.left.map(p => p[0])), rightX = median(floor.right.map(p => p[0]));
const topY = median(floor.top.map(p => p[1])), bottomY = median(floor.bottom.map(p => p[1]));
function median(a) { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; }
// Straight runs are exact lines in the moulded part (medians); bottom corners are fitted
// radii; the upper corners keep their measured ray points.
function cornerRadius(pts, vx, vy, sx, sy) {
  let best = null, bd = Infinity;
  for (const p of pts) { const dx = p[0] - vx, dy = p[1] - vy, along = (dx * sx + dy * sy) / Math.SQRT2, perp = Math.abs(dx * sy - dy * sx) / Math.SQRT2; if (along > 0 && perp < bd) { bd = perp; best = along; } }
  return best ? best / (Math.SQRT2 - 1) : 30;
}
const arcPts = (cx, cy, R, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => rayPoint([cx, cy], a0 + (a1 - a0) * i / n, R));
const rBL = cornerRadius(floor.bl, leftX, bottomY, 1, -1), rBR = cornerRadius(floor.br, rightX, bottomY, -1, -1);
const tlPts = smooth(floor.tl.filter(p => p[1] < tlC[1] && p[0] < lcd.x + 4), 1, false);
const trPts = smooth(floor.tr.filter(p => p[1] < trC[1] && p[0] > lcd.x + lcd.w - 4 && p[0] < rightX + 3), 1, false);
let loop = [
  ...arcPts(leftX + rBL, bottomY - rBL, rBL, 90, 180),
  [leftX, tlPts[0][1]],
  ...tlPts,
  [lcd.x + 4, topY], [lcd.x + lcd.w - 4, topY],
  ...trPts,
  [rightX, trPts[trPts.length - 1][1]],
  ...arcPts(rightX - rBR, bottomY - rBR, rBR, 0, 90),
];

function smooth(pts, k, closed) {
  return pts.map((p, i) => {
    const xs = [], ys = [];
    for (let j = -k; j <= k; j++) { let n = i + j; if (closed) n = (n + pts.length) % pts.length; else n = Math.max(0, Math.min(pts.length - 1, n)); xs.push(pts[n][0]); ys.push(pts[n][1]); }
    return [median(xs), median(ys)];
  });
}
function simplify(pts, tol) { // Douglas-Peucker
  if (pts.length < 3) return pts;
  let idx = 0, dmax = 0; const [a, b] = [pts[0], pts[pts.length - 1]];
  for (let i = 1; i < pts.length - 1; i++) { const d = segDist(pts[i], a, b); if (d > dmax) { dmax = d; idx = i; } }
  if (dmax <= tol) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}
function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
const floorLoop = simplify([...loop, loop[0]], .8).slice(0, -1);

// Lip (outer orbit wall) runs from where it meets the left floor wall, over the arch,
// down the right band to the plunger slot. On the left it continues along the floor wall.
// The lip crease is parallel to the outer edge; take the robust median rim width from the
// ray detections and offset the (smooth) silhouette inward by it.
function nearestDist(p, poly) { let d = Infinity; for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(p, poly[i], poly[(i + 1) % poly.length])); return d; }
const lipWidth = median(lip.map(p => nearestDist(p, silhouetteSmooth)));
const n = silhouetteSmooth.length;
const lipOffset = silhouetteSmooth.map((p, i) => {
  const a = silhouetteSmooth[(i - 2 + n) % n], b = silhouetteSmooth[(i + 2) % n];
  let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
  // pick the normal pointing to the table centre
  if ((silCentre[0] - p[0]) * nx + (silCentre[1] - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
  return [p[0] + nx * lipWidth, p[1] + ny * lipWidth];
});
// from the left floor wall (below the plate junction) over the arch to the slot top on the right
const lipJoinY = tlC[1] + 60;
const lipArc = lipOffset.filter(p => p[1] < lipJoinY && !(p[0] > T.w / 2 && p[1] > slot.top + 6))
  .sort((p, q) => Math.atan2(p[1] - silCentre[1], p[0] - silCentre[0]) - Math.atan2(q[1] - silCentre[1], q[0] - silCentre[0]));
// atan2 order runs from -pi (left) through -pi/2 (top) to 0 (right); the left start may be at +pi
const lipPts = [[leftX, lipJoinY + 90], [leftX, lipJoinY], ...lipArc.filter(p => p[1] < silCentre[1]).sort((p, q) => {
  const ap = Math.atan2(p[1] - silCentre[1], p[0] - silCentre[0]), aq = Math.atan2(q[1] - silCentre[1], q[0] - silCentre[0]); return ap - aq; })];
lipPts.push([lipPts[lipPts.length - 1][0], slot.top + 6]);
const lipRight = lipPts[lipPts.length - 1][0];
const lipLine = simplify(lipPts, .8);

// ---------- posts ----------
const postSeeds = components(T, (r, g, b) => (r + g + b) / 3 > 238, 30).filter(c => c.n < 120 && c.h < 16 && c.w < 30 && !(c.cx > slot.left - 5));
function fitPost(seed) {
  let best = -Infinity, res = null;
  for (let cy = seed.cy; cy < seed.cy + 24; cy += .5) for (let cx = seed.cx - 8; cx <= seed.cx + 8; cx += .5) for (let r = 11; r <= 18; r += .5) {
    let inner = 0, ni = 0, ring = 0, nr = 0;
    for (let a = 0; a < 360; a += 12) { const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
      for (const rr of [r * .3, r * .6, r - 3.5]) { inner += lum(cx + c * rr, cy + s * rr); ni++; }
      for (const rr of [r + .5, r + 1.5]) { ring += lum(cx + c * rr, cy + s * rr); nr++; } }
    const score = inner / ni - ring / nr;
    if (score > best) { best = score; res = { x: cx, y: cy, r }; }
  }
  return res;
}
const posts = postSeeds.map(fitPost).sort((a, b) => a.y - b.y || a.x - b.x);
if (posts.length !== 8) throw new Error(`expected 8 posts, got ${posts.length}`);
const [postTopL, postTopR, postMidL, postMidR, postSlingL, postSlingR, postLowL, postLowR] = [
  ...posts.slice(0, 2).sort((a, b) => a.x - b.x), ...posts.slice(2, 4).sort((a, b) => a.x - b.x),
  ...posts.slice(4, 6).sort((a, b) => a.x - b.x), ...posts.slice(6, 8).sort((a, b) => a.x - b.x)];

// ---------- slingshots ----------
const darkComps = components(T, (r, g, b) => (r + g + b) / 3 < 110, 30);
const slingComps = darkComps.filter(c => c.n > 8000).sort((a, b) => a.cx - b.cx);
if (slingComps.length !== 2) throw new Error("slingshot segmentation failed");
function sling(c, left) {
  const rows = new Map();
  for (const p of c.pixels) { const y = (p / T.w) | 0; rows.set(y, (rows.get(y) ?? 0) + 1); }
  let last = c.y; for (let y = c.y; y < c.y + c.h; y++) if ((rows.get(y) ?? 0) >= 16) last = y;
  const px = c.pixels.map(p => [p % T.w, (p / T.w) | 0]).filter(p => p[1] <= last);
  const top = Math.min(...px.map(p => p[1])), topRow = px.filter(p => p[1] <= top + 2);
  const A = [topRow.reduce((s, p) => s + p[0], 0) / topRow.length, top];
  const tipX = left ? Math.max(...px.map(p => p[0])) : Math.min(...px.map(p => p[0]));
  const tipPx = px.filter(p => Math.abs(p[0] - tipX) <= 2), C = [tipX, tipPx.reduce((s, p) => s + p[1], 0) / tipPx.length];
  let B = px[0]; for (const p of px) if ((left ? p[1] - p[0] : p[1] + p[0]) > (left ? B[1] - B[0] : B[1] + B[0])) B = p;
  return { A, B, C, bottom: last };
}
const slingL = sling(slingComps[0], true), slingR = sling(slingComps[1], false);

// ---------- wire guides (double wires act as one guide: centreline + half thickness) ----------
const wireDark = (x, y) => lum(x, y) < 110 && !nearLight(x, y, 4);
function runs(samples) { // samples: [{pos, x, y, dark}]
  const out = []; let cur = null;
  for (const s of samples) { if (s.dark) { if (!cur) cur = { a: s, b: s }; else cur.b = s; } else if (cur) { out.push(cur); cur = null; } }
  if (cur) out.push(cur); return out;
}
function pairFrom(raw) {
  const rs = [];
  for (const r of raw) { const last = rs[rs.length - 1]; if (last && r.a.pos - last.b.pos <= 4) last.b = r.b; else rs.push({ ...r }); }
  if (!rs.length) return null;
  let a = rs[0], b = rs[0];
  if (rs[1] && rs[1].a.pos - rs[0].b.pos < 26) b = rs[1];
  const p0 = [a.a.x, a.a.y], p1 = [b.b.x, b.b.y];
  return { x: (p0[0] + p1[0]) / 2, y: (p0[1] + p1[1]) / 2, half: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2 };
}
function upperWire(c, a0, a1, endA, endB) {
  const pts = [];
  for (let a = a0; a0 < a1 ? a <= a1 : a >= a1; a += a0 < a1 ? 3 : -3) {
    const samples = []; for (let r = 50; r < 340; r++) { const [x, y] = rayPoint(c, a, r); samples.push({ pos: r, x, y, dark: wireDark(x, y) }); }
    const p = pairFrom(runs(samples));
    if (p && Math.hypot(p.x - endA.x, p.y - endA.y) > endA.r + 6 && Math.hypot(p.x - endB.x, p.y - endB.y) > endB.r + 6) pts.push(p);
  }
  return [{ x: endA.x, y: endA.y, half: 0 }, ...pts, { x: endB.x, y: endB.y, half: 0 }];
}
const degTo = (c, p) => (Math.atan2(p.y - c[1], p.x - c[0]) * 180 / Math.PI + 360) % 360;
const ulC = [(postTopL.x + postTopR.x) / 2 - 80, (postTopL.y + postMidL.y) / 2], urC = [(postTopL.x + postTopR.x) / 2 + 80, ulC[1]];
const wireUL = upperWire(ulC, degTo(ulC, postTopL), degTo(ulC, postMidL), postTopL, postMidL);
let urA0 = degTo(urC, postTopR), urA1 = degTo(urC, postMidR) + 360;
const wireUR = upperWire(urC, urA0, urA1, postTopR, postMidR);
function lowerWire(left, slingObj, lowPost) {
  const pts = [];
  for (let y = Math.round(slingObj.bottom + 4); y < lowPost.y - lowPost.r - 2; y += 6) {
    const samples = [];
    if (left) for (let x = leftX + 3; x < 330; x++) samples.push({ pos: x, x, y, dark: wireDark(x, y) });
    else for (let x = rightX - 3; x > 620; x--) samples.push({ pos: x, x, y, dark: wireDark(x, y) });
    const p = pairFrom(runs(samples)); if (p) pts.push(p);
  }
  return [...pts, { x: lowPost.x, y: lowPost.y, half: 0 }];
}
const wireLL = lowerWire(true, slingL, postLowL), wireLR = lowerWire(false, slingR, postLowR);
function wirePolyline(pts) {
  const half = median(pts.filter(p => p.half > 0).map(p => p.half));
  const good = pts.filter(p => p.half === 0 || Math.abs(p.half - half) <= 3);
  const line = simplify(smooth(good.map(p => [p.x, p.y]), 2, false), 1.0);
  return { points: line, radius: half };
}
const wires = { upperLeft: wirePolyline(wireUL), upperRight: wirePolyline(wireUR), lowerLeft: wirePolyline(wireLL), lowerRight: wirePolyline(wireLR) };

// ---------- design placement relative to measured features (source px) ----------
const midX = (postLowL.x + postLowR.x + postMidL.x + postMidR.x + postTopL.x + postTopR.x) / 6;
const slotW = slot.right - slot.left;
const ballR = Math.round(slotW * .37 * 10) / 10;
const bumperR = Math.round(ballR * 3.9);
const upperY = postTopL.y + (postMidL.y - postTopL.y) * .44;
const bumpers = [
  { x: midX - (postMidR.x - postMidL.x) * .215, y: upperY },
  { x: midX + (postMidR.x - postMidL.x) * .215, y: upperY },
  { x: midX, y: upperY + bumperR * 2.75 },
];
const flipperLength = Math.round((rightX - leftX) * .232);
const guideOuterL = Math.max(...wires.lowerLeft.points.filter(p => p[1] > postLowL.y - 140).map(p => p[0])) + wires.lowerLeft.radius;

// ---------- sprites ----------
const metadata = {};
async function prepare(name, max, maskFn, opts = {}) {
  const im = await load(name);
  const converted = join(work, `${name}.alpha.png`);
  execFileSync(process.execPath, ["scripts/arcade/paper-to-alpha.mjs", `${rawDir}/${name}.png`, converted, "--bg", "E9E6E1"], { stdio: "ignore" });
  const { data } = await sharp(converted).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = await maskFn(im);
  const fade = opts.fade ?? Math.round(im.w * .05), near = chamfer(mask, im.w, im.h);
  for (let p = 0; p < im.w * im.h; p++) {
    const i = p * 4, j = p * 3, m = mask[p];
    const a = data[i + 3] / 255;
    if (m > 0) {
      // Reconstitute the opaque object: colour-to-alpha alone would let the site's grid
      // show through near-background plastics.
      const next = m + a * (1 - m);
      for (let c = 0; c < 3; c++) data[i + c] = Math.round((im.data[j + c] * m + data[i + c] * a * (1 - m)) / next);
      data[i + 3] = Math.round(next * 255);
    } else if (!opts.keepGlow) {
      // outside: keep only neutral darkening (soft contact shadow), drop background noise
      const darkness = Math.max(0, (BG[0] + BG[1] + BG[2] - im.data[j] - im.data[j + 1] - im.data[j + 2]) / 3 / 225 - .012);
      data[i] = 40; data[i + 1] = 35; data[i + 2] = 30; data[i + 3] = Math.round(Math.min(.45, darkness * 1.6) * Math.max(0, 1 - near[p] / fade) * 255);
    } else {
      data[i + 3] = Math.round(data[i + 3] * Math.max(0, 1 - near[p] / fade));
    }
  }
  const extracted = await sharp(data, { raw: { width: im.w, height: im.h, channels: 4 } }).trim({ threshold: 3 }).png().toBuffer({ resolveWithObject: true });
  const ox = -(extracted.info.trimOffsetLeft ?? 0), oy = -(extracted.info.trimOffsetTop ?? 0), pad = 4;
  const w = extracted.info.width + pad * 2, h = extracted.info.height + pad * 2;
  const paddedBuffer = await sharp(extracted.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const output = `${outDir}/${name}.webp`;
  await sharp(paddedBuffer).resize(w >= h ? { width: Math.min(max, w) } : { height: Math.min(max, h) }).webp({ quality: opts.quality ?? 86, alphaQuality: 90, effort: 6 }).toFile(output);
  const final = await sharp(output).metadata();
  metadata[name] = { width: final.width, height: final.height, crop: { x: ox - pad, y: oy - pad, w, h }, bytes: (await stat(output)).size };
  return im;
}
function chamfer(mask, w, h) { // approximate distance (px) to the mask
  const d = new Float32Array(w * h); for (let p = 0; p < d.length; p++) d[p] = mask[p] > 0 ? 0 : 1e9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = y * w + x; if (x) d[p] = Math.min(d[p], d[p - 1] + 1); if (y) d[p] = Math.min(d[p], d[p - w] + 1); if (x && y) d[p] = Math.min(d[p], d[p - w - 1] + 1.414); if (y && x < w - 1) d[p] = Math.min(d[p], d[p - w + 1] + 1.414); }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const p = y * w + x; if (x < w - 1) d[p] = Math.min(d[p], d[p + 1] + 1); if (y < h - 1) d[p] = Math.min(d[p], d[p + w] + 1); if (x < w - 1 && y < h - 1) d[p] = Math.min(d[p], d[p + w + 1] + 1.414); if (y < h - 1 && x) d[p] = Math.min(d[p], d[p + w - 1] + 1.414); }
  return d;
}
function polygonMask(im, poly) {
  const m = new Float32Array(im.w * im.h);
  for (let y = 0; y < im.h; y++) {
    const xs = [];
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a[1] <= y + .5) !== (b[1] <= y + .5)) xs.push(a[0] + (y + .5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k])); x < Math.min(im.w, xs[k + 1]); x++) m[y * im.w + x] = 1;
  }
  return m;
}
function discMask(im, cx, cy, r) { const m = new Float32Array(im.w * im.h); for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) m[y * im.w + x] = Math.max(0, Math.min(1, r - Math.hypot(x + .5 - cx, y + .5 - cy) + .5)); return m; }
const dist = (im, p) => { const j = p * 3; return Math.max(Math.abs(im.data[j] - BG[0]), Math.abs(im.data[j + 1] - BG[1]), Math.abs(im.data[j + 2] - BG[2])); };
function objectMask(im, test, fillHoles) {
  const m = new Float32Array(im.w * im.h);
  for (let p = 0; p < m.length; p++) m[p] = (typeof test === "number" ? dist(im, p) > test : test(p)) ? 1 : 0;
  // keep the largest component only
  const comps = components(im, (r, g, b, x, y) => m[y * im.w + x] > 0, 50);
  m.fill(0); for (const p of comps[0].pixels) m[p] = 1;
  if (fillHoles) {
    const outside = new Uint8Array(m.length), q = new Int32Array(m.length); let h = 0, t = 0;
    for (let x = 0; x < im.w; x++) for (const y of [0, im.h - 1]) { const p = y * im.w + x; if (!m[p] && !outside[p]) { outside[p] = 1; q[t++] = p; } }
    for (let y = 0; y < im.h; y++) for (const x of [0, im.w - 1]) { const p = y * im.w + x; if (!m[p] && !outside[p]) { outside[p] = 1; q[t++] = p; } }
    while (h < t) { const n = q[h++], x = n % im.w; for (const k of [x > 0 ? n - 1 : -1, x < im.w - 1 ? n + 1 : -1, n - im.w, n + im.w]) if (k >= 0 && k < m.length && !m[k] && !outside[k]) { outside[k] = 1; q[t++] = k; } }
    for (let p = 0; p < m.length; p++) if (!outside[p]) m[p] = 1;
  }
  // 1px erosion keeps the anti-aliased rim soft instead of a hard halo
  const e = new Float32Array(m.length);
  for (let y = 1; y < im.h - 1; y++) for (let x = 1; x < im.w - 1; x++) { const p = y * im.w + x; e[p] = m[p] && m[p - 1] && m[p + 1] && m[p - im.w] && m[p + im.w] ? 1 : m[p] * .5; }
  return { mask: e, comps };
}
// disc measurement for round sprites: radial edge search from the object centroid
function measureDisc(im, threshold) {
  const { comps } = objectMask(im, threshold, true);
  const c = comps[0]; const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  // the contact shadow extends the bbox downwards only: use the width and the top edge
  return { cx, cy: c.y + c.w / 2, r: c.w / 2, rx: c.w / 2, ry: c.h / 2 };
}

// table
await prepare("pb_table", 1536, im => polygonMask(im, silhouetteSmooth), { quality: 88, fade: 26 });
// bumpers: off-white cap is close to the background, so find it from its contrasting rim/shadow
async function bumperDisc(name) {
  const im = await load(name);
  // centre from the orange dot
  const dot = components(im, (r, g, b) => r > 190 && g < 170 && b < 110 && r - b > 120, 200).filter(c => c.w < im.w * .2)[0];
  const cx = dot.cx, cy = dot.cy;
  // cap edge: strongest outward luminance drop along rays (cap -> rim shadow)
  const L = (x, y) => { const i = (Math.round(y) * im.w + Math.round(x)) * 3; return (im.data[i] + im.data[i + 1] + im.data[i + 2]) / 3; };
  const rs = [];
  for (let a = 0; a < 360; a += 5) {
    let best = 0, br = 0;
    for (let r = im.w * .12; r < im.w * .42; r++) { const t = a * Math.PI / 180; const d = L(cx + Math.cos(t) * (r - 2), cy + Math.sin(t) * (r - 2)) - L(cx + Math.cos(t) * (r + 2), cy + Math.sin(t) * (r + 2)); if (d > best) { best = d; br = r; } }
    rs.push(br);
  }
  return { cx, cy, r: median(rs) };
}
const bumperArt = await bumperDisc("pb_bumper"), bumperLitArt = await bumperDisc("pb_bumper_lit");
await prepare("pb_bumper", 320, im => discMask(im, bumperArt.cx, bumperArt.cy, bumperArt.r));
await prepare("pb_bumper_lit", 400, im => discMask(im, bumperLitArt.cx, bumperLitArt.cy, bumperLitArt.r), { keepGlow: true, fade: Math.round(bumperLitArt.r * .4) });
const ballImg = await load("pb_ball"); const ballArt = measureDisc(ballImg, 28);
await prepare("pb_ball", 128, im => discMask(im, ballArt.cx, ballArt.cy, ballArt.r - .5));
// flipper: orange body + graphite pivot cap
const flipImg = await load("pb_flipper");
const flipMask = objectMask(flipImg, p => { const j = p * 3, r = flipImg.data[j], g = flipImg.data[j + 1], b = flipImg.data[j + 2]; return r - b > 70 || Math.max(r, g, b) < 110; }, true);
const capC = components(flipImg, (r, g, b) => Math.max(r, g, b) < 100, 300)[0];
const pivot = { x: capC.cx, y: capC.cy, r: Math.max(capC.w, capC.h) / 2 };
const body = flipMask.comps[0];
const flipCols = new Map(); for (const p of body.pixels) { const x = p % flipImg.w, y = (p / flipImg.w) | 0; const c = flipCols.get(x) ?? [Infinity, -Infinity]; c[0] = Math.min(c[0], y); c[1] = Math.max(c[1], y); flipCols.set(x, c); }
const bodyRight = body.x + body.w - 1, bodyLeft = body.x;
const baseHalf = (flipCols.get(Math.round(pivot.x))[1] - flipCols.get(Math.round(pivot.x))[0]) / 2;
// tip circle: half-height near the rounded end, centred that far in from the extreme
let tipHalf = 0; for (let x = bodyRight - 40; x <= bodyRight; x++) { const c = flipCols.get(x); if (c) tipHalf = Math.max(tipHalf, (c[1] - c[0]) / 2); }
const tipCol = flipCols.get(Math.round(bodyRight - tipHalf));
const tip = { x: bodyRight - tipHalf, y: (tipCol[0] + tipCol[1]) / 2, r: tipHalf };
const baseCol = flipCols.get(Math.round(pivot.x)); const base = { x: pivot.x, y: (baseCol[0] + baseCol[1]) / 2, r: baseHalf };
await prepare("pb_flipper", 512, () => flipMask.mask);
// plunger: knob + spring + rod; keep coil gaps transparent (no hole filling)
const plImg = await load("pb_plunger");
const knobC = components(plImg, (r, g, b) => Math.max(r, g, b) < 95, 2000)[0];
const knobTop = knobC.y, knobBottom = knobC.y + knobC.h, knobW = knobC.w;
// steel parts are near the background tone: object = clear departure from it, above the knob's base
const plMask = objectMask(plImg, p => dist(plImg, p) > 22 && ((p / plImg.w) | 0) <= knobBottom + 1, false);
const plC = plMask.comps[0];
const plRows = new Map(); for (const p of plC.pixels) { const x = p % plImg.w, y = (p / plImg.w) | 0; const r = plRows.get(y) ?? [Infinity, -Infinity]; r[0] = Math.min(r[0], x); r[1] = Math.max(r[1], x); plRows.set(y, r); }
const plWidthAt = y => { const r = plRows.get(y); return r ? r[1] - r[0] + 1 : 0; };
const springW = median([...plRows.keys()].filter(y => y > plC.y + (knobTop - plC.y) * .3 && y < knobTop - 10).map(plWidthAt));
let springTop = plC.y; while (springTop < knobTop && plWidthAt(springTop) < springW * .75) springTop++;
await prepare("pb_plunger", 512, () => plMask.mask);
// flipper pivots: just inside the lower guide wires, above the bottom rim (mirrored on the centre line)
const flipScale = flipperLength / (tip.x - pivot.x);
const flipBaseR = base.r * flipScale, flipTipR = tip.r * flipScale;
const pivotL = { x: guideOuterL + flipBaseR + 3, y: postLowL.y - flipperLength * .36 };
const guideInnerR = Math.min(...wires.lowerRight.points.filter(p => p[1] > postLowR.y - 140).map(p => p[0])) - wires.lowerRight.radius;
const pivotR = { x: guideInnerR - flipBaseR - 3, y: pivotL.y };

// ---------- write art.json (fractions of delivered images) ----------
const tc = metadata.pb_table.crop;
const fx = x => round((x - tc.x) / tc.w), fy = y => round((y - tc.y) / tc.h), fl = l => round(l / tc.w);
const P = ([x, y]) => [fx(x), fy(y)];
const sm = (name, x, y) => { const c = metadata[name].crop; return [round((x - c.x) / c.w), round((y - c.y) / c.h)]; };
const plunger = {
  // sprite-space (fractions of delivered sprite) landmarks
  rodTop: sm("pb_plunger", plC.x + plC.w / 2, plC.y), springTop: sm("pb_plunger", 0, springTop)[1], knobTop: sm("pb_plunger", 0, knobTop)[1], knobBottom: sm("pb_plunger", 0, knobBottom)[1],
  springWidth: round(springW / metadata.pb_plunger.crop.w), knobWidth: round(knobW / metadata.pb_plunger.crop.w),
};
const art = {
  version: 1,
  measurement: "sharp raw pixels of pb_table.png (1024x1536): rim/plate creases from luminance rise scans (rows, columns, rays), wire guides from dark-run centrelines along rays/rows (double wires merged into one guide), posts by ring-contrast circle search, slingshots from dark-component extreme vertices, lights/LCD/slot from colour components. All values are fractions of the delivered trimmed images (x of width, y of height); radii are fractions of table width.",
  table: { width: metadata.pb_table.width, height: metadata.pb_table.height },
  floor: floorLoop.map(P),
  lip: lipLine.map(P),
  slot: { left: fx(slot.left), right: fx(slot.right), top: fy(slot.top), bottom: fy(slot.bottom) },
  lcd: { x: fx(lcd.x), y: fy(lcd.y), w: fl(lcd.w), h: round(lcd.h / tc.h) },
  posts: posts.map(p => ({ x: fx(p.x), y: fy(p.y), r: fl(p.r) })),
  wires: Object.fromEntries(Object.entries(wires).map(([k, w]) => [k, { r: fl(w.radius), points: w.points.map(P) }])),
  slings: [slingL, slingR].map(s => ({ a: P(s.A), b: P(s.B), c: P(s.C) })),
  laneLights: laneLights.map(l => ({ x: fx(l.x), y: fy(l.y), r: fl(l.r) })),
  targetLights: targetLights.map(l => ({ x: fx(l.x), y: fy(l.y), r: fl(l.r) })),
  design: {
    note: "placed relative to measured features: centre line from post pairs, ball from slot width, flipper pivots just inside the lower guides above the bottom rim",
    midX: fx(midX), ballR: fl(ballR), bumperR: fl(bumperR),
    bumpers: bumpers.map(b => ({ x: fx(b.x), y: fy(b.y) })),
    flipperLength: fl(flipperLength), guideOuterL: fx(guideOuterL), lowPostY: fy(postLowL.y),
    flippers: [pivotL, pivotR].map(p => ({ x: fx(p.x), y: fy(p.y) })), flipperBaseR: fl(flipBaseR), flipperTipR: fl(flipTipR),
  },
  sprites: {
    bumper: { width: metadata.pb_bumper.width, height: metadata.pb_bumper.height, c: sm("pb_bumper", bumperArt.cx, bumperArt.cy), r: round(bumperArt.r / metadata.pb_bumper.crop.w) },
    bumperLit: { width: metadata.pb_bumper_lit.width, height: metadata.pb_bumper_lit.height, c: sm("pb_bumper_lit", bumperLitArt.cx, bumperLitArt.cy), r: round(bumperLitArt.r / metadata.pb_bumper_lit.crop.w) },
    ball: { width: metadata.pb_ball.width, height: metadata.pb_ball.height, c: sm("pb_ball", ballArt.cx, ballArt.cy), r: round(ballArt.r / metadata.pb_ball.crop.w) },
    flipper: { width: metadata.pb_flipper.width, height: metadata.pb_flipper.height, pivot: sm("pb_flipper", pivot.x, pivot.y), base: sm("pb_flipper", base.x, base.y), tip: sm("pb_flipper", tip.x, tip.y), baseR: round(base.r / metadata.pb_flipper.crop.w), tipR: round(tip.r / metadata.pb_flipper.crop.w), capR: round(pivot.r / metadata.pb_flipper.crop.w) },
    plunger: { width: metadata.pb_plunger.width, height: metadata.pb_plunger.height, ...plunger },
  },
  source: { slot, lcd, ballR, bumperR, flipperLength, midX, leftX, rightX, topY, bottomY, slingL, slingR, posts, lights, bumperArt, bumperLitArt, ballArt, flipper: { pivot, base, tip }, assets: metadata },
};
await writeFile("src/components/arcade/pinball.art.json", JSON.stringify(art, null, 1) + "\n");
console.log({ lipWidth, lipRight, rBL, rBR, slot, lcd, leftX, rightX, topY, bottomY, ballR, bumperR, flipperLength, midX, guideOuterL, posts, slingL: { ...slingL }, slingR: { ...slingR }, bumperArt, bumperLitArt, ballArt, flipper: { pivot, base, tip }, plunger: { knobW, springW, knobTop, knobBottom, springTop, plC: [plC.x, plC.y, plC.w, plC.h] }, wireRadius: Object.fromEntries(Object.entries(wires).map(([k, w]) => [k, w.radius])) });
for (const [k, m] of Object.entries(metadata)) console.log(k, m.width + "x" + m.height, m.bytes);

// ---------- debug overlay (source px) ----------
if (overlayPath) {
  const pl = pts => pts.map(p => p.join(",")).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${T.w}" height="${T.h}">
  <polygon points="${pl(silhouetteSmooth)}" fill="none" stroke="#0a0" stroke-width="1"/>
  <polygon points="${pl(floorLoop)}" fill="none" stroke="#e00" stroke-width="1.5"/>
  ${floorLoop.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="1.6" fill="#e00"/>`).join("")}
  <polyline points="${pl(lipLine)}" fill="none" stroke="#06f" stroke-width="1.5"/>
  ${Object.values(wires).map(w => `<polyline points="${pl(w.points)}" fill="none" stroke="#f0f" stroke-opacity=".45" stroke-width="${w.radius * 2}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pl(w.points)}" fill="none" stroke="#f0f" stroke-width="1"/>`).join("")}
  ${posts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="none" stroke="#0cf" stroke-width="1.5"/>`).join("")}
  ${[slingL, slingR].map(s => `<polygon points="${pl([s.A, s.B, s.C])}" fill="none" stroke="#fa0" stroke-width="2"/><line x1="${s.A[0]}" y1="${s.A[1]}" x2="${s.C[0]}" y2="${s.C[1]}" stroke="#f00" stroke-width="2"/>`).join("")}
  ${lights.map(l => `<circle cx="${l.x}" cy="${l.y}" r="${l.r}" fill="none" stroke="#0f0" stroke-width="1.5"/>`).join("")}
  <rect x="${lcd.x}" y="${lcd.y}" width="${lcd.w}" height="${lcd.h}" fill="none" stroke="#0f0"/>
  <rect x="${slot.left}" y="${slot.top}" width="${slot.right - slot.left}" height="${slot.bottom - slot.top}" fill="none" stroke="#06f" stroke-dasharray="4 3"/>
  ${bumpers.map(b => `<circle cx="${b.x}" cy="${b.y}" r="${bumperR}" fill="#fff" fill-opacity=".3" stroke="#000" stroke-dasharray="5 4"/>`).join("")}
  <line x1="${midX}" y1="0" x2="${midX}" y2="${T.h}" stroke="#000" stroke-opacity=".25"/>
  <circle cx="${T.w / 2}" cy="${T.h * .55}" r="${ballR}" fill="#888"/>
  ${[[pivotL, 1], [pivotR, -1]].map(([p, s]) => [27, -30].map(deg => { const t = deg * Math.PI / 180, tx = p.x + s * Math.cos(t) * flipperLength, ty = p.y + Math.sin(t) * flipperLength; return `<line x1="${p.x}" y1="${p.y}" x2="${tx}" y2="${ty}" stroke="#f60" stroke-opacity=".5" stroke-width="${flipTipR * 2}" stroke-linecap="round"/><circle cx="${p.x}" cy="${p.y}" r="${flipBaseR}" fill="#f60" fill-opacity=".4"/>`; }).join("")).join("")}
  </svg>`;
  await sharp(`${rawDir}/pb_table.png`).composite([{ input: Buffer.from(svg) }]).png().toFile(overlayPath);
  console.log("overlay", overlayPath);
}
