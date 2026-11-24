// CAR CRUSH art preparation. Measures every raw asset with sharp, aligns the five damage
// stages onto car_dmg0 (wheel centres + ground line), converts to alpha WebP and writes
// src/components/arcade/carcrush.art.json. No hand-entered geometry.
// usage: node scripts/arcade/carcrush-measure.mjs [--debug <dir>]
import sharp from "sharp";
import { writeFile, stat } from "node:fs/promises";

const raw = "_incoming_arcade/carcrush_raw", out = "public/arcade";
const debugDir = process.argv.includes("--debug") ? process.argv[process.argv.indexOf("--debug") + 1] : "";
const r4 = v => Math.round(v * 1e5) / 1e5;
async function load(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const lum = (im, x, y) => { const i = (y * im.w + x) * 3; return (im.data[i] * 299 + im.data[i + 1] * 587 + im.data[i + 2] * 114) / 1000; };
function background(im) {
  const S = 24, corners = [[0, 0], [im.w - S, 0], [0, im.h - S], [im.w - S, im.h - S]];
  const means = corners.map(([l, t]) => { const m = [0, 0, 0]; for (let y = t; y < t + S; y++) for (let x = l; x < l + S; x++) for (let c = 0; c < 3; c++) m[c] += im.data[(y * im.w + x) * 3 + c] / (S * S); return m; });
  return [0, 1, 2].map(c => means.map(m => m[c]).sort((a, b) => a - b)[1]);
}
// Object mask: pixel differs clearly from the flat background (soft shadows excluded).
function objectBox(im, bg, tol = 34) {
  let l = im.w, t = im.h, r = 0, b = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const i = (y * im.w + x) * 3;
    if (Math.abs(im.data[i] - bg[0]) + Math.abs(im.data[i + 1] - bg[1]) + Math.abs(im.data[i + 2] - bg[2]) > tol) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
  }
  return { x: l, y: t, w: r - l + 1, h: b - t + 1 };
}
/** Wheels: circular Hough transform on the luminance gradient (tyre = dark disc on lighter
 *  surroundings, so every outer-edge pixel votes for a centre at p - r·∇L/|∇L|, r in a range).
 *  The rim, tyre and arch are concentric, so their votes reinforce the hub centre.
 *  Radius/ground: the lowest tyre row below the centre (dark run under the hub). */
async function wheels(file, im, box) {
  const { data } = await sharp(file).removeAlpha().greyscale().blur(1.6).raw().toBuffer({ resolveWithObject: true });
  const W = im.w, H = im.h, acc = new Float32Array(W * H);
  // All five renders share roughly the same framing, so radii are bounded in source pixels:
  // tyre 95–140 px, rim 58–95 px (measured on car_dmg0: tyre 111, rim ≈ 80).
  const rMin = 95, rMax = 140, rimMin = 58;
  const yTop = Math.round(box.y + box.h * .3), yBot = box.y + box.h;
  for (let y = yTop; y < yBot; y++) for (let x = box.x + 1; x < box.x + box.w - 1; x++) {
    const p = y * W + x;
    const gx = (data[p - W + 1] + 2 * data[p + 1] + data[p + W + 1]) - (data[p - W - 1] + 2 * data[p - 1] + data[p + W - 1]);
    const gy = (data[p + W - 1] + 2 * data[p + W] + data[p + W + 1]) - (data[p - W - 1] + 2 * data[p - W] + data[p - W + 1]);
    const m = Math.hypot(gx, gy); if (m < 90) continue;
    const ux = gx / m, uy = gy / m;
    for (let r = rimMin; r <= rMax; r += 1) {
      const cx = Math.round(x - ux * r), cy = Math.round(y - uy * r);
      if (cx >= 0 && cy >= 0 && cx < W && cy < H) acc[cy * W + cx] += 1;
      if (r < rMin) { const ex = Math.round(x + ux * r), ey = Math.round(y + uy * r); if (ex >= 0 && ey >= 0 && ex < W && ey < H) acc[ey * W + ex] += 1; } // rim edges, either polarity
    }
  }
  // Ground line: lowest dark (tyre) row anywhere in the lower car band.
  let ground = 0;
  for (let y = yBot; y > yTop && !ground; y--) { let n = 0; for (let x = box.x; x < box.x + box.w; x++) if (lum(im, x, y) < 95) n++; if (n > box.w * .04) ground = y; }
  // Smoothed vote map and its local maxima inside the two axle windows.
  const yA = Math.round(ground - rMax), yB = Math.round(ground - rMin * .8);
  const maxima = (x0, x1) => {
    const list = [];
    for (let y = yA; y < yB; y += 2) for (let x = x0; x < x1; x += 2) {
      let v = 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) v += acc[(y + dy) * W + x + dx];
      list.push({ x, y, v });
    }
    list.sort((a, b) => b.v - a.v);
    const keep = [];
    for (const c of list) { if (keep.every(k => Math.hypot(k.x - c.x, k.y - c.y) > 24)) keep.push(c); if (keep.length >= 25) break; }
    return keep;
  };
  // Axles of this side-view GT sit near 21 % / 79 % of the body length; search ±11 % around that.
  const win = c => [Math.round(box.x + box.w * (c - .11)), Math.round(box.x + box.w * (c + .11))];
  const rears = maxima(...win(.215)), fronts = maxima(...win(.785));
  // Joint choice: strongest pair whose wheelbase is 0.55–0.61 of the body length and whose hubs
  // are level within 6 % of the body height (rejects suspension coils / torn panels).
  let best = null;
  for (const a of rears) for (const b of fronts) {
    const base = (b.x - a.x) / box.w;
    if (base < .48 || base > .61 || Math.abs(a.y - b.y) > box.h * .06) continue;
    if (!best || a.v + b.v > best.v) best = { a, b, v: a.v + b.v };
  }
  if (!best) throw new Error("wheel pair not found");
  return [best.a, best.b].map(c => ({ cx: c.x, cy: c.y, radius: ground - c.y, ground }));
}

const names = ["car_dmg0", "car_dmg1", "car_dmg2", "car_dmg3", "car_dmg4"];
const measured = [];
for (const n of names) {
  const im = await load(`${raw}/${n}.png`), bg = background(im), box = objectBox(im, bg);
  const [rear, front] = await wheels(`${raw}/${n}.png`, im, box);
  measured.push({ n, im, bg, box, rear, front });
  console.log(n, "box", box, "rear", [rear.cx, rear.cy, rear.radius, rear.ground].map(Math.round), "front", [front.cx, front.cy, front.radius, front.ground].map(Math.round));
}
if (debugDir) {
  for (const m of measured) {
    const svg = `<svg width="${m.im.w}" height="${m.im.h}" xmlns="http://www.w3.org/2000/svg"><rect x="${m.box.x}" y="${m.box.y}" width="${m.box.w}" height="${m.box.h}" fill="none" stroke="blue" stroke-width="2"/>${[m.rear, m.front].map(w => `<circle cx="${w.cx}" cy="${w.cy}" r="${w.radius}" fill="none" stroke="red" stroke-width="2"/><circle cx="${w.cx}" cy="${w.cy}" r="5" fill="red"/><line x1="${w.cx - 200}" x2="${w.cx + 200}" y1="${w.ground}" y2="${w.ground}" stroke="lime" stroke-width="2"/>`).join("")}</svg>`;
    await sharp(`${raw}/${m.n}.png`).composite([{ input: Buffer.from(svg) }]).png().toFile(`${debugDir}/${m.n}_wheels.png`);
  }
}

// ---- Align every stage onto car_dmg0, anchored on the ground line and the mean axle position.
// x scale = wheelbase ratio (axles coincide) clamped to 0.94–1.08; y scale = same, clamped 0.96–1.05.
// Stages 1–3 are within both clamps (exact fit). car_dmg4's crushed body has a genuinely ~15 %
// shorter wheelbase: following it fully stretches the wreck visibly (elliptical tyres), so it gets
// the clamped 1.08 / 1.05 and a residual axle offset, reported below and in the art json.
const ref = measured[0];
const refBase = ref.front.cx - ref.rear.cx, refMid = (ref.front.cx + ref.rear.cx) / 2;
for (const m of measured) {
  const base = m.front.cx - m.rear.cx;
  m.wheelbaseScale = refBase / base;
  m.sx = Math.max(.94, Math.min(1.08, m.wheelbaseScale)); m.sy = Math.max(.96, Math.min(1.05, m.wheelbaseScale));
  m.tx = refMid - m.sx * (m.front.cx + m.rear.cx) / 2;
  m.ty = ref.rear.ground - m.sy * m.rear.ground;
  console.log(m.n, "align sx", m.sx.toFixed(4), "sy", m.sy.toFixed(4), "tx", m.tx.toFixed(1), "ty", m.ty.toFixed(1));
}

// ---------------------------------------------------------------------------------------------
// Alpha preparation. Solid objects become fully opaque inside their silhouette; only outside it
// is the background removed "colour to alpha" (keeps the soft contact shadow, like paper-to-alpha).
async function blurred(file) { return (await sharp(file).removeAlpha().blur(.8).raw().toBuffer({ resolveWithObject: true })).data; }
/** Background region grown from the border through smooth, light pixels; complement = silhouette. */
function regionSilhouette(data, W, H, step = 5) {
  const N = W * H, seen = new Uint8Array(N), q = new Int32Array(N); let h = 0, t = 0;
  const push = p => { if (!seen[p]) { seen[p] = 1; q[t++] = p; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (h < t) {
    const p = q[h++], x = p % W, y = (p / W) | 0;
    for (const n of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
      if (n < 0 || seen[n]) continue; const a = p * 3, b = n * 3;
      const d = Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2]);
      if (d <= step && data[b] + data[b + 1] + data[b + 2] > 420) push(n);
    }
  }
  const solid = new Uint8Array(N); for (let p = 0; p < N; p++) solid[p] = seen[p] ? 0 : 1; return solid;
}
/** Candidate mask for light objects on a light ground: brighter than paper, clearly darker, or saturated. */
function candidate(im, bg) {
  const N = im.w * im.h, m = new Uint8Array(N), bl = (bg[0] + bg[1] + bg[2]) / 3;
  for (let p = 0; p < N; p++) {
    const r = im.data[p * 3], g = im.data[p * 3 + 1], b = im.data[p * 3 + 2], l = (r + g + b) / 3;
    if (l > bl + 4 || l < bl - 45 || Math.max(r, g, b) - Math.min(r, g, b) > 40) m[p] = 1;
  }
  return m;
}
function labelComponents(mask, W, H, minCount = 60) {
  const N = W * H, label = new Int32Array(N), q = new Int32Array(N), comps = []; let id = 0;
  for (let p0 = 0; p0 < N; p0++) if (mask[p0] && !label[p0]) {
    id++; let h = 0, t = 0, l = W, r = 0, top = H, bot = 0; q[t++] = p0; label[p0] = id;
    while (h < t) {
      const p = q[h++], x = p % W, y = (p / W) | 0;
      l = Math.min(l, x); r = Math.max(r, x); top = Math.min(top, y); bot = Math.max(bot, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx; if (mask[n] && !label[n]) { label[n] = id; q[t++] = n; }
      }
    }
    comps.push({ id, x: l, y: top, w: r - l + 1, h: bot - top + 1, count: t });
  }
  return { label, comps: comps.filter(c => c.count >= minCount).sort((a, b) => b.count - a.count) };
}
function dilate(mask, W, H, rad) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x])
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) out[ny * W + nx] = 1; }
  return out;
}
/** Fill of one labelled component: union of its row spans and column spans. */
function orthoFill(label, id, c, W) {
  const out = new Uint8Array(c.w * c.h), rows = new Uint8Array(c.w * c.h);
  for (let y = 0; y < c.h; y++) { let a = -1, b = -1; for (let x = 0; x < c.w; x++) if (label[(c.y + y) * W + c.x + x] === id) { if (a < 0) a = x; b = x; } for (let x = a; x >= 0 && x <= b; x++) rows[y * c.w + x] = 1; }
  for (let x = 0; x < c.w; x++) { let a = -1, b = -1; for (let y = 0; y < c.h; y++) if (label[(c.y + y) * W + c.x + x] === id) { if (a < 0) a = y; b = y; } for (let y = a; y >= 0 && y <= b; y++) out[y * c.w + x] = 1; }
  for (let i = 0; i < out.length; i++) out[i] |= rows[i]; // union of row and column spans (chips are convex)
  return out;
}
/** RGBA float image: opaque inside `solid` (feathered 1 px), colour-to-alpha outside (if keepShadow). */
function toAlpha(im, bg, solid, keepShadow) {
  const { w: W, h: H, data } = im, rgba = new Float32Array(W * H * 4);
  // Shadows fade out within 36 px of the silhouette's bounding box, and paper noise (<3 %) is
  // ramped away, so the delivered sprite has no faint rectangular veil at its crop edges.
  let bl = W, br = 0, bt = H, bb = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid[y * W + x]) { bl = Math.min(bl, x); br = Math.max(br, x); bt = Math.min(bt, y); bb = Math.max(bb, y); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x; let soft = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) { soft += solid[ny * W + nx]; n++; } }
    soft = solid[p] ? 1 : soft / n * .9;
    let a = 0;
    if (keepShadow && !solid[p]) {
      for (let c = 0; c < 3; c++) { const v = data[p * 3 + c], b = bg[c]; a = Math.max(a, v < b ? (b - v) / b : 0); } // shadows only darken
      const d = Math.hypot(Math.max(0, bl - x, x - br), Math.max(0, bt - y, y - bb));
      a = Math.max(0, (a - .03) / .97) * Math.max(0, 1 - d / 36);
      if (a < .01) a = 0;
    }
    const o = p * 4;
    if (soft >= a && soft > 0) { rgba[o] = data[p * 3]; rgba[o + 1] = data[p * 3 + 1]; rgba[o + 2] = data[p * 3 + 2]; rgba[o + 3] = soft; }
    else if (a > 0) { for (let c = 0; c < 3; c++) rgba[o + c] = Math.max(0, Math.min(255, (data[p * 3 + c] - (1 - a) * bg[c]) / a)); rgba[o + 3] = a; }
  }
  return rgba;
}
/** Premultiplied bilinear axis-aligned warp: dst(x,y) = src((x - tx)/sx, (y - ty)/sy). */
function warp(rgba, W, H, sx, sy, tx, ty) {
  const out = new Float32Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ux = (x - tx) / sx, uy = (y - ty) / sy, x0 = Math.floor(ux), y0 = Math.floor(uy), fx = ux - x0, fy = uy - y0;
    if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue;
    let r = 0, g = 0, b = 0, a = 0;
    for (const [px, py, wgt] of [[x0, y0, (1 - fx) * (1 - fy)], [x0 + 1, y0, fx * (1 - fy)], [x0, y0 + 1, (1 - fx) * fy], [x0 + 1, y0 + 1, fx * fy]]) {
      const i = (py * W + px) * 4, wa = rgba[i + 3] * wgt; r += rgba[i] * wa; g += rgba[i + 1] * wa; b += rgba[i + 2] * wa; a += wa;
    }
    const o = (y * W + x) * 4; if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; out[o + 3] = a; }
  }
  return out;
}
function alphaBox(rgba, W, H, t = .03) {
  let l = W, r = 0, top = H, b = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rgba[(y * W + x) * 4 + 3] > t) { l = Math.min(l, x); r = Math.max(r, x); top = Math.min(top, y); b = Math.max(b, y); }
  return { x: l, y: top, w: r - l + 1, h: b - top + 1 };
}
async function writeRGBA(rgba, W, box, file, width = box.w) {
  const buf = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) { const i = ((box.y + y) * W + box.x + x) * 4, o = (y * box.w + x) * 4; for (let c = 0; c < 3; c++) buf[o + c] = Math.round(rgba[i + c]); buf[o + 3] = Math.round(rgba[i + 3] * 255); }
  let img = sharp(buf, { raw: { width: box.w, height: box.h, channels: 4 } });
  if (width !== box.w) img = sharp(await img.resize({ width, kernel: "lanczos3" }).png().toBuffer());
  await img.webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(file);
  return (await stat(file)).size;
}
const sizes = {};
const pad = (b, p, W, H) => { const x = Math.max(0, b.x - p), y = Math.max(0, b.y - p); return { x, y, w: Math.min(W, b.x + b.w + p) - x, h: Math.min(H, b.y + b.h + p) - y }; };

// ---- Cars ----------------------------------------------------------------------------------
const W0 = ref.im.w, H0 = ref.im.h, warped = [];
for (const m of measured) {
  const solid = regionSilhouette(await blurred(`${raw}/${m.n}.png`), m.im.w, m.im.h);
  const rgba = warp(toAlpha(m.im, m.bg, solid, true), W0, H0, m.sx, m.sy, m.tx, m.ty);
  // residual after alignment (dmg0 frame, px): axle x error and ground error
  const map = (x, y) => [m.sx * x + m.tx, m.sy * y + m.ty];
  const [rx] = map(m.rear.cx, 0), [fx] = map(m.front.cx, 0), [, g] = map(0, m.rear.ground);
  m.residual = { rear: rx - ref.rear.cx, front: fx - ref.front.cx, ground: g - ref.rear.ground };
  console.log(m.n, "residual px", Object.fromEntries(Object.entries(m.residual).map(([k, v]) => [k, +v.toFixed(1)])));
  warped.push(rgba);
}
let union = null;
for (const rgba of warped) { const b = alphaBox(rgba, W0, H0); union = union ? (() => { const x = Math.min(union.x, b.x), y = Math.min(union.y, b.y); return { x, y, w: Math.max(union.x + union.w, b.x + b.w) - x, h: Math.max(union.y + union.h, b.y + b.h) - y }; })() : b; }
const crop = pad(union, 4, W0, H0);
for (let i = 0; i < 5; i++) sizes[`carcrush_car${i}.webp`] = await writeRGBA(warped[i], W0, crop, `${out}/carcrush_car${i}.webp`);
// Hit grid: union of all stages' opaque silhouettes, 12 px cells, dilated one cell (generous).
const CELL = 12, cols = Math.ceil(crop.w / CELL), rowsN = Math.ceil(crop.h / CELL);
let grid = new Uint8Array(cols * rowsN);
for (const rgba of warped) for (let y = 0; y < crop.h; y++) for (let x = 0; x < crop.w; x++) if (rgba[((crop.y + y) * W0 + crop.x + x) * 4 + 3] > .9) grid[Math.floor(y / CELL) * cols + Math.floor(x / CELL)] = 1;
grid = dilate(grid, cols, rowsN, 1);
const gridRows = []; for (let r = 0; r < rowsN; r++) gridRows.push(Array.from(grid.slice(r * cols, (r + 1) * cols)).join(""));
// Body bounds and beltline (bottom of the side glass, a dark run in the column between the axles).
const solidBox = alphaBox(warped[0], W0, H0, .9);
const midX = Math.round((ref.rear.cx + ref.front.cx) / 2);
let belt = 0, inGlass = false;
for (let y = solidBox.y; y < ref.rear.cy; y++) {
  const i = (y * W0 + midX) * 4, l = (warped[0][i] + warped[0][i + 1] + warped[0][i + 2]) / 3;
  if (warped[0][i + 3] > .9 && l < 110) { inGlass = true; belt = y; } else if (inGlass && l > 150) break;
}
if (!belt) throw new Error("beltline not found");
const fxC = (x) => r4((x - crop.x) / crop.w), fyC = (y) => r4((y - crop.y) / crop.h);
const carArt = {
  width: crop.w, height: crop.h,
  ground: fyC(ref.rear.ground),
  rear: { x: fxC(ref.rear.cx), y: fyC(ref.rear.cy), r: r4(ref.rear.radius / crop.w) },
  front: { x: fxC(ref.front.cx), y: fyC(ref.front.cy), r: r4(ref.front.radius / crop.w) },
  body: { x: fxC(solidBox.x), y: fyC(solidBox.y), w: r4(solidBox.w / crop.w), h: r4(solidBox.h / crop.h) },
  belt: fyC(belt),
  grid: { cell: CELL, cols, rows: rowsN, data: gridRows },
  stages: measured.map(m => ({ source: m.n, sx: r4(m.sx), sy: r4(m.sy), wheelbaseScale: r4(m.wheelbaseScale), tx: +m.tx.toFixed(2), ty: +m.ty.toFixed(2), residualPx: Object.fromEntries(Object.entries(m.residual).map(([k, v]) => [k, +v.toFixed(2)])) })),
};
console.log("car crop", crop, "belt", belt, "body", solidBox);

// ---- Plinth --------------------------------------------------------------------------------
const pl = await load(`${raw}/car_plinth.png`), plBg = background(pl);
// Column scan: the slab starts at the lit top face (lighter than paper) and ends at its dark
// bottom seam (darkest row below); the soft shadow under the seam stays colour-to-alpha.
const plL = (pl.data.length / 3 > 0) && ((plBg[0] + plBg[1] + plBg[2]) / 3);
const colTop = new Int32Array(pl.w).fill(-1), colBot = new Int32Array(pl.w).fill(-1);
for (let x = 0; x < pl.w; x++) {
  let run = 0;
  for (let y = 0; y < pl.h - 3; y++) { if (lum(pl, x, y) > plL + 9) { if (++run === 4) { colTop[x] = y - 3; break; } } else run = 0; }
  if (colTop[x] < 0) continue;
  let best = 1e9; for (let y = colTop[x] + 20; y < Math.min(pl.h, colTop[x] + 160); y++) { const v = lum(pl, x, y); if (v < best) { best = v; colBot[x] = y; } }
}
const med = (arr, x, r) => { const v = []; for (let k = x - r; k <= x + r; k++) if (arr[k] >= 0) v.push(arr[k]); v.sort((a, b) => a - b); return v.length > r ? v[v.length >> 1] : -1; };
const plSolid = new Uint8Array(pl.w * pl.h); let plLeft = pl.w, plRight = 0;
for (let x = 6; x < pl.w - 6; x++) { const t = med(colTop, x, 6), bt = med(colBot, x, 6); if (t < 0 || bt < 0) continue; plLeft = Math.min(plLeft, x); plRight = Math.max(plRight, x); for (let y = t; y <= bt; y++) plSolid[y * pl.w + x] = 1; }
const plRGBA = toAlpha(pl, plBg, plSolid, true), plBox = pad(alphaBox(plRGBA, pl.w, pl.h, .06), 3, pl.w, pl.h);
sizes["carcrush_plinth.webp"] = await writeRGBA(plRGBA, pl.w, plBox, `${out}/carcrush_plinth.webp`);
// Top-face / front-face edge: largest drop of the median centre luminance profile.
const cx0 = Math.round((plLeft + plRight) / 2), plTopY = med(colTop, cx0, 40), plBotY = med(colBot, cx0, 40);
const prof = [];
for (let y = plTopY; y <= plBotY; y++) { const v = []; for (let x = Math.round(plLeft + (plRight - plLeft) * .3); x < plLeft + (plRight - plLeft) * .7; x += 3) v.push(lum(pl, x, y)); v.sort((a, b) => a - b); prof.push(v[v.length >> 1]); }
let face = 0, bestStep = 0;
for (let i = 3; i < prof.length * .8; i++) { const st = prof[i - 3] - prof[i]; if (st > bestStep) { bestStep = st; face = i - 1; } }
const pfx = x => r4((x - plBox.x) / plBox.w), pfy = y => r4((y - plBox.y) / plBox.h);
const plinthArt = { width: plBox.w, height: plBox.h, left: pfx(plLeft), right: pfx(plRight), top: pfy(plTopY), face: pfy(plTopY + face), bottom: pfy(plBotY) };
console.log("plinth", plBox, plinthArt);

// ---- Debris: 8 connected components, each its own sprite in one atlas ---------------------
const db = await load(`${raw}/debris_set.png`), dbBg = background(db);
const dbCand = candidate(db, dbBg), dbLab = labelComponents(dilate(dbCand, db.w, db.h, 3), db.w, db.h, 400);
const pieces = dbLab.comps.slice(0, 8).sort((a, b) => Math.round(a.y / 200) - Math.round(b.y / 200) || a.x - b.x);
if (pieces.length !== 8) throw new Error(`expected 8 debris pieces, got ${pieces.length}`);
const atlasPieces = []; const DS = .7; let ax = 2; const tiles = [];
for (const c of pieces) {
  // fill from the undilated candidate pixels of this component only
  const lab = new Int32Array(db.w * db.h);
  for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) { const p = y * db.w + x; if (dbLab.label[p] === c.id && dbCand[p]) lab[p] = 1; }
  const fill = orthoFill(lab, 1, c, db.w), solid = new Uint8Array(db.w * db.h);
  let n = 0, orange = 0, sr = 0, sg = 0, sb = 0;
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (fill[y * c.w + x]) {
    const p = (c.y + y) * db.w + c.x + x; solid[p] = 1; n++;
    const r = db.data[p * 3], g = db.data[p * 3 + 1], b = db.data[p * 3 + 2]; sr += r; sg += g; sb += b; if (r > 180 && r - b > 90) orange++;
  }
  const meanL = (sr + sg + sb) / 3 / n, kind = orange / n > .12 ? "stripe" : meanL < 110 ? "graphite" : meanL < 190 ? "glass" : "chip";
  console.log("piece", c.x, c.y, "meanL", meanL.toFixed(0), kind);
  const rgba = toAlpha(db, dbBg, solid, false), box = pad(alphaBox(rgba, db.w, db.h, .05), 2, db.w, db.h);
  const tmp = `${out}/.carcrush_piece.webp`;
  const buf = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) { const i = ((box.y + y) * db.w + box.x + x) * 4, o = (y * box.w + x) * 4; for (let k = 0; k < 3; k++) buf[o + k] = Math.round(rgba[i + k]); buf[o + 3] = Math.round(rgba[i + 3] * 255); }
  const w = Math.round(box.w * DS), h = Math.round(box.h * DS);
  tiles.push({ input: await sharp(buf, { raw: { width: box.w, height: box.h, channels: 4 } }).resize(w, h).png().toBuffer(), left: ax, top: 2 });
  atlasPieces.push({ x: ax, y: 2, w, h, kind });
  ax += w + 4;
}
const atlasW = ax, atlasH = Math.max(...atlasPieces.map(p => p.h)) + 4;
await sharp({ create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(tiles).webp({ quality: 88, alphaQuality: 90 }).toFile(`${out}/carcrush_debris.webp`);
sizes["carcrush_debris.webp"] = (await stat(`${out}/carcrush_debris.webp`)).size;
console.log("debris", atlasPieces.map(p => `${p.kind} ${p.w}x${p.h}`).join(", "));

// ---- Impact ring ---------------------------------------------------------------------------
const fx = await load(`${raw}/fx_hit.png`), fxBg = background(fx);
const fxRGBA = new Float32Array(fx.w * fx.h * 4);
for (let p = 0; p < fx.w * fx.h; p++) { // full colour-to-alpha (darker or more saturated than paper)
  let a = 0; for (let c = 0; c < 3; c++) { const v = fx.data[p * 3 + c], b = fxBg[c]; a = Math.max(a, v < b ? (b - v) / b : v > b ? (v - b) / (255 - b) : 0); }
  if (a < .03) a = 0; const o = p * 4;
  for (let c = 0; c < 3; c++) fxRGBA[o + c] = a ? Math.max(0, Math.min(255, (fx.data[p * 3 + c] - (1 - a) * fxBg[c]) / a)) : 0; fxRGBA[o + 3] = a;
}
const fxBox0 = alphaBox(fxRGBA, fx.w, fx.h, .12), side = Math.max(fxBox0.w, fxBox0.h) + 8;
const fxBox = { x: Math.round(fxBox0.x + fxBox0.w / 2 - side / 2), y: Math.round(fxBox0.y + fxBox0.h / 2 - side / 2), w: side, h: side };
sizes["carcrush_hit.webp"] = await writeRGBA(fxRGBA, fx.w, fxBox, `${out}/carcrush_hit.webp`, 360);
// Ring radius: strongest-alpha radius along the horizontal centre line, as a fraction of the sprite.
let ringPeak = 0, ringX = 0; const fcy = Math.round(fxBox.y + side / 2);
for (let x = Math.round(fxBox.x + side / 2); x < fxBox.x + side; x++) { const a = fxRGBA[(fcy * fx.w + x) * 4 + 3]; if (a > ringPeak) { ringPeak = a; ringX = x; } }
const hitArt = { width: 360, height: 360, ring: r4((ringX - (fxBox.x + side / 2)) / side) };

const total = Object.values(sizes).reduce((a, b) => a + b, 0);
await writeFile("src/components/arcade/carcrush.art.json", JSON.stringify({
  version: 1,
  measurement: "scripts/arcade/carcrush-measure.mjs: circular Hough (luminance gradient) axle centres per damage stage, joint wheel-pair choice, tyre-contact ground line; stages warped onto car_dmg0 (x scale = wheelbase ratio clamped 0.94–1.08, y scale = same ratio clamped 0.96–1.05, anchored on the ground line and mean axle x); region-grown silhouettes; plinth edges from median luminance profile; debris = 8 connected components. All values are fractions of the delivered images unless noted.",
  car: carArt, plinth: plinthArt, debris: { width: atlasW, height: atlasH, scale: DS, pieces: atlasPieces }, hit: hitArt, bytes: sizes,
}, null, 1) + "\n");
console.log("sizes", sizes, "total", (total / 1024).toFixed(0), "KB");
