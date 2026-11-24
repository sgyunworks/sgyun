// TANKS art preparation + measurement. Reproducible: no hand-entered collider coordinates.
// usage: node scripts/arcade/tanks-measure.mjs [--debug <dir>]
//  1. Object mask per raw image: flood-fill the flat paper background from the image border
//     through pixels with low gradient and paper-like colour; whatever the flood cannot reach
//     (bounded by the object's crisp contour) is the physical object. Soft shadows stay
//     "background" and are kept as semi-transparent darkening via paper-to-alpha.mjs.
//  2. Opaque reconstruction inside the mask (so the site's CAD grid never shows through
//     plastic), alpha trim with sharp, 4 px pad, resize to the delivered size.
//  3. Geometry from the mask: hull footprint, turret ring (circle Hough on the hull),
//     turret cap circle + barrel tip, shell box, obstacle rectangles / circles / L-shapes.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { writeFile, stat, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const rawDir = "_incoming_arcade/tanks_raw", outDir = "public/arcade";
const debugDir = process.argv.includes("--debug") ? process.argv[process.argv.indexOf("--debug") + 1] : "";
const tmpDir = await mkdtemp(join(tmpdir(), "tanks-alpha-"));
const round = v => Math.round(v * 1e5) / 1e5;

async function load(name) {
  const { data, info } = await sharp(`${rawDir}/${name}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, S = 24;
  const corner = (x0, y0) => { const m = [0, 0, 0]; for (let y = y0; y < y0 + S; y++) for (let x = x0; x < x0 + S; x++) for (let c = 0; c < 3; c++) m[c] += data[(y * w + x) * 3 + c] / (S * S); return m; };
  const cs = [corner(0, 0), corner(w - S, 0), corner(0, h - S), corner(w - S, h - S)];
  const bg = [0, 1, 2].map(c => cs.map(m => m[c]).sort((a, b) => a - b)[1]);
  return { name, data, w, h, bg };
}

/** Object mask = pixels not reachable from the border (or extra seeds) through flat paper. */
function objectMask(im, { gradient = 2.2, colour = 70, seeds = [], close = 3, convex = true } = {}) {
  const { w, h, data, bg } = im, L = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) L[p] = (data[p * 3] + data[p * 3 + 1] + data[p * 3 + 2]) / 3;
  // 5x5 box blur suppresses the generator's paper noise but keeps 1-2 px crisp contours strong.
  const B = new Float32Array(w * h), T = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -2; x < w + 2; x++) { s += L[y * w + Math.min(w - 1, Math.max(0, x + 2))] - (x - 3 >= 0 ? L[y * w + x - 3] : L[y * w]); if (x >= 0 && x < w) T[y * w + x] = s / 5; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -2; y < h + 2; y++) { s += T[Math.min(h - 1, Math.max(0, y + 2)) * w + x] - (y - 3 >= 0 ? T[(y - 3) * w + x] : T[x]); if (y >= 0 && y < h) B[y * w + x] = s / 5; } }
  const pass = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x;
    const gx = B[p + 1] - B[p - 1], gy = B[p + w] - B[p - w];
    let d = 0; for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(data[p * 3 + c] - bg[c]));
    if (Math.hypot(gx, gy) / 2 < gradient && d < colour) pass[p] = 1;
  }
  // Morphological closing: thicken the contour barrier by `close` px so faint gaps in a
  // soft-lit edge cannot leak the flood into the object; the mask is shrunk back afterwards.
  if (close > 0) { const D = distanceOutside(pass.map(v => 1 - v), w, h); for (let p = 0; p < w * h; p++) if (D[p] <= close) pass[p] = 0; }
  const reach = new Uint8Array(w * h), queue = new Int32Array(w * h); let head = 0, tail = 0;
  const push = p => { if (pass[p] && !reach[p]) { reach[p] = 1; queue[tail++] = p; } };
  const e = close + 3; // the image border itself is not passable; seed just inside the dilated frame
  for (let x = e; x < w - e; x++) { push(e * w + x); push((h - 1 - e) * w + x); }
  for (let y = e; y < h - e; y++) { push(y * w + e); push(y * w + w - 1 - e); }
  for (const [sx, sy] of seeds) push(Math.round(sy * h) * w + Math.round(sx * w));
  while (head < tail) { const p = queue[head++]; push(p - 1); push(p + 1); push(p - w); push(p + w); }
  const mask = new Uint8Array(w * h);
  const R = close > 0 ? distanceOutside(reach, w, h) : null;
  for (let y = e; y < h - e; y++) for (let x = e; x < w - e; x++) { const p = y * w + x; if (!reach[p] && (!R || R[p] > close)) mask[p] = 1; }
  // Keep only the largest connected object (drop isolated noise specks).
  const label = new Int32Array(w * h); let best = 0, bestCount = 0, id = 0;
  for (let p = 0; p < w * h; p++) if (mask[p] && !label[p]) {
    id++; head = 0; tail = 0; queue[tail++] = p; label[p] = id;
    while (head < tail) { const n = queue[head++]; for (const m of [n - 1, n + 1, n - w, n + w]) if (m >= 0 && m < w * h && mask[m] && !label[m]) { label[m] = id; queue[tail++] = m; } }
    if (tail > bestCount) { bestCount = tail; best = id; }
  }
  for (let p = 0; p < w * h; p++) mask[p] = label[p] === best ? 1 : 0;
  if (convex) {
    // Every object except the cable coil is orthogonally convex (each row and column span is
    // solid), so fill row spans ∩ column spans: removes any interior a faint edge let the flood reach.
    const r0 = new Int32Array(h).fill(w), r1 = new Int32Array(h).fill(-1), c0 = new Int32Array(w).fill(h), c1 = new Int32Array(w).fill(-1);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { r0[y] = Math.min(r0[y], x); r1[y] = Math.max(r1[y], x); c0[x] = Math.min(c0[x], y); c1[x] = Math.max(c1[x], y); }
    for (let y = 0; y < h; y++) for (let x = r0[y]; x <= r1[y]; x++) if (y >= c0[x] && y <= c1[x]) mask[y * w + x] = 1;
  }
  return { mask, grad: B };
}
function bbox(mask, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
function distanceOutside(mask, w, h) {
  // Two-pass chamfer distance (px) from the mask, used to fade shadow alpha to zero.
  const D = new Float32Array(w * h).fill(1e9);
  for (let p = 0; p < w * h; p++) if (mask[p]) D[p] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = y * w + x; if (x) D[p] = Math.min(D[p], D[p - 1] + 1); if (y) D[p] = Math.min(D[p], D[p - w] + 1); if (x && y) D[p] = Math.min(D[p], D[p - w - 1] + 1.414); if (y && x < w - 1) D[p] = Math.min(D[p], D[p - w + 1] + 1.414); }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const p = y * w + x; if (x < w - 1) D[p] = Math.min(D[p], D[p + 1] + 1); if (y < h - 1) D[p] = Math.min(D[p], D[p + w] + 1); if (x < w - 1 && y < h - 1) D[p] = Math.min(D[p], D[p + w + 1] + 1.414); if (y < h - 1 && x) D[p] = Math.min(D[p], D[p + w - 1] + 1.414); }
  return D;
}

const meta = {};
async function deliver(im, mask, max, { reconstruct = true, shadowFade = .16 } = {}) {
  const converted = `${tmpDir}/${im.name}.png`;
  const hex = im.bg.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  execFileSync(process.execPath, ["scripts/arcade/paper-to-alpha.mjs", `${rawDir}/${im.name}.png`, converted, "--bg", hex], { stdio: "ignore" });
  const { data } = await sharp(converted).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { w, h } = im;
  if (reconstruct) {
    const box = bbox(mask, w, h), D = distanceOutside(mask, w, h), reach = Math.min(box.w, box.h) * shadowFade;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4, j = p * 3;
      if (mask[p]) { for (let c = 0; c < 3; c++) data[i + c] = im.data[j + c]; data[i + 3] = 255; continue; }
      // Outside the object: keep only neutral darkening (soft shadow) with a smooth fade.
      const lum = (im.data[j] + im.data[j + 1] + im.data[j + 2]) / 3, bgl = (im.bg[0] + im.bg[1] + im.bg[2]) / 3;
      const fade = D[p] <= 1.5 ? 1 : Math.max(0, 1 - D[p] / reach);
      const a = Math.max(0, (bgl - lum) / bgl - .012) * fade * 1.15;
      data[i] = 40; data[i + 1] = 34; data[i + 2] = 28; data[i + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  const extracted = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 3 }).png().toBuffer({ resolveWithObject: true });
  const pad = 4, ox = -(extracted.info.trimOffsetLeft ?? 0) - pad, oy = -(extracted.info.trimOffsetTop ?? 0) - pad;
  const cw = extracted.info.width + pad * 2, ch = extracted.info.height + pad * 2;
  const padded = await sharp(extracted.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const output = `${outDir}/tanks_${im.name}.webp`;
  await sharp(padded).resize(cw >= ch ? { width: Math.min(max, cw) } : { height: Math.min(max, ch) }).webp({ quality: 86, alphaQuality: 88, effort: 6 }).toFile(output);
  const final = await sharp(output).metadata(), bytes = (await stat(output)).size;
  meta[im.name] = { file: `tanks_${im.name}.webp`, width: final.width, height: final.height, bytes, crop: { x: ox, y: oy, w: cw, h: ch } };
  return meta[im.name];
}
// Convert a source-pixel rect / point into fractions of the delivered (trimmed) image.
const fr = (m, r) => ({ x: round((r.x - m.crop.x) / m.crop.w), y: round((r.y - m.crop.y) / m.crop.h), w: round(r.w / m.crop.w), h: round(r.h / m.crop.h) });
const fx = (m, x) => round((x - m.crop.x) / m.crop.w), fy = (m, y) => round((y - m.crop.y) / m.crop.h);

const art = { version: 1, measurement: "tanks-measure.mjs: edge-bounded paper flood fill for object masks (shadows excluded), circle Hough on gradient for the hull turret ring, mask column profiles for turret cap/barrel, mask row/column spans for L-block, notebook and cable coil. All fractions reference the delivered trimmed WebP.", hulls: {}, turrets: {}, obstacles: {} };
const debug = [];

// ---- Hulls -------------------------------------------------------------------------------
for (const colour of ["orange", "graphite", "grey", "yellow"]) {
  const im = await load(`tank_hull_${colour}`), { mask, grad } = objectMask(im);
  const b = bbox(mask, im.w, im.h);
  // Turret ring: maximise mean gradient magnitude on a circle (coarse grid then refine).
  const g = (x, y) => { const p = Math.round(y) * im.w + Math.round(x); return Math.hypot(grad[p + 1] - grad[p - 1], grad[p + im.w] - grad[p - im.w]); };
  const N = 120, cos = Float64Array.from({ length: N }, (_, i) => Math.cos(i / N * Math.PI * 2)), sin = Float64Array.from({ length: N }, (_, i) => Math.sin(i / N * Math.PI * 2));
  let best = { s: -1, cx: 0, cy: 0, r: 0 };
  const search = (x0, x1, y0, y1, r0, r1, st) => { for (let cx = x0; cx <= x1; cx += st) for (let cy = y0; cy <= y1; cy += st) for (let r = r0; r <= r1; r += st) { let s = 0; for (let i = 0; i < N; i++) s += g(cx + cos[i] * r, cy + sin[i] * r); if (s > best.s) best = { s, cx, cy, r }; } };
  search(b.x + b.w * .3, b.x + b.w * .7, b.y + b.h * .42, b.y + b.h * .58, b.h * .2, b.h * .42, 4);
  const c = { ...best }; search(c.cx - 4, c.cx + 4, c.cy - 4, c.cy + 4, c.r - 4, c.r + 4, 1);
  // The ring has an inner and outer contour; also find the outer one (largest radius with a strong edge).
  const ring = { ...best }; let outer = ring.r;
  for (let r = ring.r + 2; r < ring.r * 1.35; r++) { let s = 0; for (let i = 0; i < N; i++) s += g(ring.cx + cos[i] * r, ring.cy + sin[i] * r); if (s > ring.s * .55) outer = r; }
  const m = await deliver(im, mask, 300);
  art.hulls[colour] = { width: m.width, height: m.height, body: fr(m, b), ring: { cx: fx(m, ring.cx), cy: fy(m, ring.cy), r: round(outer / m.crop.w), rInner: round(ring.r / m.crop.w) } };
  debug.push({ im, mask, marks: [{ circle: [ring.cx, ring.cy, ring.r] }, { circle: [ring.cx, ring.cy, outer] }, { rect: b }] });
}
// ---- Turrets -----------------------------------------------------------------------------
for (const colour of ["orange", "graphite", "grey", "yellow"]) {
  const im = await load(`tank_turret_${colour}`), { mask } = objectMask(im);
  const b = bbox(mask, im.w, im.h), col = new Int32Array(im.w), top = new Int32Array(im.w).fill(im.h), bot = new Int32Array(im.w).fill(-1);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (mask[y * im.w + x]) { col[x]++; top[x] = Math.min(top[x], y); bot[x] = Math.max(bot[x], y); }
  let capH = 0; for (let x = b.x; x < b.x + b.w; x++) capH = Math.max(capH, col[x]);
  // Cap = columns at least a third of the cap height; the barrel is much thinner.
  let cx0 = b.x, cx1 = b.x; for (let x = b.x; x < b.x + b.w; x++) if (col[x] > capH / 3) cx1 = x;
  const capX = (cx0 + cx1) / 2, mid = Math.round(capX);
  const capY = (top[mid] + bot[mid]) / 2, r = Math.max((cx1 - cx0 + 1) / 2, capH / 2) * .5 + Math.min((cx1 - cx0 + 1) / 2, capH / 2) * .5;
  const tipX = b.x + b.w - 1, bx = Math.round((cx1 + tipX) / 2), barrelHalf = col[bx] / 2, barrelY = (top[bx] + bot[bx]) / 2;
  const m = await deliver(im, mask, 300);
  art.turrets[colour] = { width: m.width, height: m.height, cap: { cx: fx(m, capX), cy: fy(m, capY), r: round(r / m.crop.w) }, tip: { x: fx(m, tipX), y: fy(m, barrelY) }, barrelHalf: round(barrelHalf / m.crop.h) };
  debug.push({ im, mask, marks: [{ circle: [capX, capY, r] }, { rect: { x: tipX - 3, y: barrelY - 3, w: 6, h: 6 } }] });
}
// ---- Shell + puff ------------------------------------------------------------------------
{
  const im = await load("tank_shell"), { mask } = objectMask(im), b = bbox(mask, im.w, im.h);
  const m = await deliver(im, mask, 128);
  art.shell = { width: m.width, height: m.height, body: fr(m, b) };
  debug.push({ im, mask, marks: [{ rect: b }] });
  const puff = await load("fx_puff");
  const pm = await deliver(puff, null, 256, { reconstruct: false });
  art.puff = { width: pm.width, height: pm.height };
}
// ---- Obstacles ---------------------------------------------------------------------------
const obstacleSpec = {
  block: { max: 360, opts: { gradient: 1.05, close: 8 } }, cube: { max: 256 }, device: { max: 400 }, speaker: { max: 380 },
  notebook: { max: 400 }, lblock: { max: 400 }, cable: { max: 380, seeds: [[.5, .45]] },
};
for (const [name, spec] of Object.entries(obstacleSpec)) {
  const im = await load(`obstacle_${name}`);
  let { mask } = objectMask(im, spec.opts ?? {});
  let b = bbox(mask, im.w, im.h);
  if (name === "cable") {
    // Open the coil's paper centre too: seed a second flood at the centre of the coil's bbox.
    ({ mask } = objectMask(im, { convex: false, seeds: [[(b.x + b.w / 2) / im.w, (b.y + b.h * .45) / im.h]] }));
    b = bbox(mask, im.w, im.h);
  }
  const rows = new Int32Array(im.h), rx0 = new Int32Array(im.h).fill(im.w), rx1 = new Int32Array(im.h).fill(-1), cols = new Int32Array(im.w);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (mask[y * im.w + x]) { rows[y]++; cols[x]++; rx0[y] = Math.min(rx0[y], x); rx1[y] = Math.max(rx1[y], x); }
  const m = await deliver(im, mask, spec.max);
  const entry = { width: m.width, height: m.height, file: m.file };
  const marks = [];
  if (name === "speaker") {
    const r = (b.w + b.h) / 4; entry.shape = "circle"; entry.circle = { cx: fx(m, b.x + b.w / 2), cy: fy(m, b.y + b.h / 2), r: round(r / m.crop.w) };
    marks.push({ circle: [b.x + b.w / 2, b.y + b.h / 2, r] });
  } else if (name === "cable") {
    // Coil = widest row extent (its row passes through the coil's centre); connectors and strap ignored.
    let wy = b.y; for (let y = b.y; y < b.y + b.h * .62; y++) if (rx1[y] - rx0[y] > rx1[wy] - rx0[wy]) wy = y;
    const r = (rx1[wy] - rx0[wy] + 1) / 2, cx = (rx0[wy] + rx1[wy]) / 2;
    entry.shape = "circle"; entry.circle = { cx: fx(m, cx), cy: fy(m, wy), r: round(r / m.crop.w) };
    marks.push({ circle: [cx, wy, r] });
  } else if (name === "lblock") {
    // Raw art is a "┐": a full-width top bar and a full-height right leg.
    let barH = 0; for (let y = b.y; y < b.y + b.h; y++) if (rows[y] > b.w * .8) barH = y - b.y + 1;
    let legW = 0; for (let x = b.x + b.w - 1; x >= b.x; x--) if (cols[x] > b.h * .8) legW = b.x + b.w - x;
    const bar = { x: b.x, y: b.y, w: b.w, h: barH }, leg = { x: b.x + b.w - legW, y: b.y, w: legW, h: b.h };
    entry.shape = "rects"; entry.rects = [fr(m, bar), fr(m, leg)];
    marks.push({ rect: bar }, { rect: leg });
  } else if (name === "notebook") {
    // Exclude the ribbon tail below the cover: rows much narrower than the cover.
    let maxW = 0; for (let y = b.y; y < b.y + b.h; y++) maxW = Math.max(maxW, rows[y]);
    let y1 = b.y; for (let y = b.y; y < b.y + b.h; y++) if (rows[y] > maxW * .5) y1 = y;
    const r = { x: b.x, y: b.y, w: b.w, h: y1 - b.y + 1 }; entry.shape = "rects"; entry.rects = [fr(m, r)]; marks.push({ rect: r });
  } else { entry.shape = "rects"; entry.rects = [fr(m, b)]; marks.push({ rect: b }); }
  art.obstacles[name] = entry;
  debug.push({ im, mask, marks });
}
art.files = Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, { file: v.file, width: v.width, height: v.height, bytes: v.bytes }]));
art.totalBytes = Object.values(meta).reduce((s, v) => s + v.bytes, 0);
art.sourceCrops = Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, v.crop]));
await writeFile("src/components/arcade/tanks.art.json", JSON.stringify(art, null, 2) + "\n");
console.log("total bytes", art.totalBytes);
for (const [k, v] of Object.entries(meta)) console.log(k.padEnd(22), `${v.width}x${v.height}`, v.bytes);

if (debugDir) {
  // Mask (tinted) + measured colliders over each raw image, for eyeballing.
  const S = 360, cols = 6, rowsN = Math.ceil(debug.length / cols), layers = [];
  for (let k = 0; k < debug.length; k++) {
    const { im, mask, marks } = debug[k], rgba = Buffer.alloc(im.w * im.h * 4);
    for (let p = 0; p < im.w * im.h; p++) { for (let c = 0; c < 3; c++) rgba[p * 4 + c] = im.data[p * 3 + c]; rgba[p * 4 + 3] = 255; if (mask[p]) { rgba[p * 4 + 1] = rgba[p * 4 + 1] * .6; rgba[p * 4 + 2] = Math.min(255, rgba[p * 4 + 2] * .6 + 90); } }
    const svg = marks.map(mk => mk.circle ? `<circle cx="${mk.circle[0]}" cy="${mk.circle[1]}" r="${mk.circle[2]}" fill="none" stroke="#ff0060" stroke-width="4"/>` : `<rect x="${mk.rect.x}" y="${mk.rect.y}" width="${mk.rect.w}" height="${mk.rect.h}" fill="none" stroke="#00a050" stroke-width="4"/>`).join("");
    const tile = await sharp(rgba, { raw: { width: im.w, height: im.h, channels: 4 } }).composite([{ input: Buffer.from(`<svg width="${im.w}" height="${im.h}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`) }]).png().toBuffer();
    layers.push({ input: await sharp(tile).resize(S, S).png().toBuffer(), left: (k % cols) * S, top: Math.floor(k / cols) * S });
  }
  await sharp({ create: { width: cols * S, height: rowsN * S, channels: 3, background: "#fff" } }).composite(layers).png().toFile(`${debugDir}/tanks-masks.png`);
  // Delivered sprites over the site paper + CAD dots.
  const names = Object.keys(meta), grid = Buffer.from(`<svg width="${cols * 300}" height="${Math.ceil(names.length / cols) * 300}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#b7b8b4"/></pattern></defs><rect width="100%" height="100%" fill="#F3F3F1"/><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const sprites = await Promise.all(names.map(async (n, k) => ({ input: await sharp(`${outDir}/${meta[n].file}`).resize(260, 260, { fit: "inside" }).png().toBuffer(), left: (k % cols) * 300 + 20, top: Math.floor(k / cols) * 300 + 20 })));
  await sharp(grid).composite(sprites).png().toFile(`${debugDir}/tanks-sprites.png`);
}
