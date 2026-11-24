// Reproducible pixel measurements and alpha preparation. No hand-entered collider coordinates.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { writeFile, stat } from "node:fs/promises";

const rawDir = "_incoming_arcade/stage1_raw", outDir = "public/arcade";
const round = v => Math.round(v * 1e7) / 1e7;
async function load(name) {
  const { data, info } = await sharp(`${rawDir}/${name}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
function components(im, predicate, roi = [0, 0, 1, 1]) {
  const { w, h, data } = im, mask = new Uint8Array(w * h), queue = new Int32Array(w * h), found = [];
  for (let y = Math.floor(roi[1] * h); y < roi[3] * h; y++) for (let x = Math.floor(roi[0] * w); x < roi[2] * w; x++) {
    const p = y * w + x, i = p * 3; if (predicate(data[i], data[i + 1], data[i + 2])) mask[p] = 1;
  }
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    let head = 0, tail = 0, left = w, top = h, right = 0, bottom = 0;
    queue[tail++] = p; mask[p] = 0;
    while (head < tail) {
      const n = queue[head++], x = n % w, y = Math.floor(n / w);
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      for (const next of [x > 0 ? n - 1 : -1, x < w - 1 ? n + 1 : -1, n - w, n + w]) if (next >= 0 && next < mask.length && mask[next]) { mask[next] = 0; queue[tail++] = next; }
    }
    if (tail > 40) found.push({ x: left, y: top, w: right - left + 1, h: bottom - top + 1, count: tail });
  }
  return found.sort((a, b) => b.count - a.count);
}
function profile(im, axis, a, b) {
  const length = axis === "x" ? im.w : im.h, other = axis === "x" ? im.h : im.w, result = new Float64Array(length);
  for (let n = 0; n < length; n++) {
    const values = [];
    for (let k = Math.floor(a * other); k < b * other; k++) { const x = axis === "x" ? n : k, y = axis === "x" ? k : n, i = (y * im.w + x) * 3; values.push((im.data[i] + im.data[i + 1] + im.data[i + 2]) / 3); }
    values.sort((a, b) => a - b); result[n] = values[values.length >> 1];
  }
  return result;
}
function extreme(p, a, b, sign = 1, derivative = false) {
  let best = -Infinity, pos = 0;
  for (let i = Math.max(2, Math.floor(a * p.length)); i < b * p.length; i++) {
    const value = sign * (derivative ? p[i] - p[i - 1] : p[i]);
    if (value > best) { best = value; pos = i; }
  }
  return pos;
}
function greenScreen(im, bottom = .46) {
  const box = components(im, (r, g, b) => r < 195 && g < 200 && g >= r * .96 && b < r - 7, [0, .08, 1, bottom])[0];
  if (!box || box.w < im.w * .3) throw new Error("LCD segmentation failed");
  return box;
}
function shell(im, ranges) {
  const xp = profile(im, "x", .44, .56), yp = profile(im, "y", .42, .58);
  // Outer moulded-shell edge is the steepest local luminance transition.
  const x = extreme(xp, ranges[0], ranges[1], 1, true), right = extreme(xp, ranges[2], ranges[3], -1, true);
  const y = extreme(yp, ranges[4], ranges[5], 1, true), bottom = extreme(yp, ranges[6], ranges[7], -1, true);
  return { x, y, w: right - x, h: bottom - y };
}
const table = await load("ah_table"), hub = await load("hub_console"), lcd = await load("lcd_panel");
const topProfile = profile(table, "y", .30, .42), sideProfile = profile(table, "x", .275, .31);
const innerTop = extreme(topProfile, .14, .22, -1);
const innerBottom = extreme(topProfile, .77, .84, 1, true) - 1;
const innerLeft = extreme(sideProfile, .085, .11, -1), innerRight = extreme(sideProfile, .89, .92, -1);
const goals = [components(table, (r, g, b) => Math.max(r, g, b) < 75, [0, .25, .2, .75])[0], components(table, (r, g, b) => Math.max(r, g, b) < 75, [.8, .25, 1, .75])[0]];
if (goals.some(b => !b || b.h < table.h * .15)) throw new Error("Goal segmentation failed");
const tiles = components(hub, (r, g, b) => r > g + 6 && g > b + 6 && g < 202, [.16, .30, .84, .85]).filter(b => b.w > hub.w * .26 && b.w < hub.w * .34 && b.h > hub.h * .18 && b.h < hub.h * .26).sort((a, b) => a.y - b.y || a.x - b.x);
if (tiles.length !== 4) throw new Error(`Expected four tile contours, got ${tiles.length}`);
const hubScreen = greenScreen(hub), lcdScreen = greenScreen(lcd, .85);
const tableShell = shell(table, [.08, .10, .90, .93, .13, .17, .82, .86]);
const hubShell = shell(hub, [.09, .16, .84, .91, .06, .13, .88, .94]);
const lcdShell = shell(lcd, [.09, .15, .85, .91, .12, .25, .78, .89]);

// Fit the inner corner radius from the rail's upper-left arc. Search the darkest seam
// in successive rows, then solve x = L+r-sqrt(r²-(y-T-r)²) by least squares.
let cornerRadius = 0, cornerError = Infinity;
const arcPoints = [];
for (let y = innerTop + 6; y < innerTop + table.h * .12; y += 4) {
  let bx = 0, bv = Infinity;
  for (let x = innerLeft; x < innerLeft + table.h * .15; x++) {
    let value = 0;
    // 3x5 smoothing suppresses individual punched air holes without erasing the seam.
    for (let dy = -2; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) {
      const i = ((y + dy) * table.w + x + dx) * 3;
      value += table.data[i] + table.data[i + 1] + table.data[i + 2];
    }
    if (value < bv) { bv = value; bx = x; }
  }
  arcPoints.push([y, bx]);
}
for (let radius = 20; radius < table.h * .22; radius++) {
  let error = 0;
  for (const [y, x] of arcPoints) {
    const expected = y >= innerTop + radius ? innerLeft : innerLeft + radius - Math.sqrt(Math.max(0, radius * radius - (y - innerTop - radius) ** 2));
    error += (x - expected) ** 2;
  }
  error /= arcPoints.length;
  if (error < cornerError) { cornerError = error; cornerRadius = radius; }
}
console.log("Source pixel detections", { tableShell, hubShell, lcdShell, innerLeft, innerRight, innerTop, innerBottom, cornerRadius, goals, hubScreen, tiles, lcdScreen });

const metadata = {};
async function prepare(name, max, im, body, radius, disc) {
  const converted = `${rawDir}/${name}.alpha.png`;
  // Preserve the supplied converter unchanged. Keep its colour-to-alpha soft shadows.
  execFileSync(process.execPath, ["scripts/arcade/paper-to-alpha.mjs", `${rawDir}/${name}.png`, converted, "--bg", "E9E6E1"], { stdio: "inherit" });
  const { data } = await sharp(converted).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = await sharp(Buffer.from(`<svg width="${im.w}" height="${im.h}"><rect x="${body.x}" y="${body.y}" width="${body.w}" height="${body.h}" rx="${radius}" fill="white"/></svg>`)).ensureAlpha().raw().toBuffer();
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const p = y * im.w + x, i = p * 4, j = p * 3, m = mask[i + 3] / 255;
    if (m > 0) {
      // Reconstitute the opaque physical object. Minimal colour-to-alpha alone would
      // incorrectly show the site's CAD grid through near-background-colour plastic.
      const a = data[i + 3] / 255, next = m + a * (1 - m);
      for (let c = 0; c < 3; c++) data[i + c] = Math.round((im.data[j + c] * m + data[i + c] * a * (1 - m)) / next);
      data[i + 3] = Math.round(next * 255);
    } else {
      // Remove tiny generative background variations; retain only neutral darkening
      // around the object as soft alpha, with a smooth fade out in the margin.
      const dx = Math.max(body.x - x, 0, x - body.x - body.w), dy = Math.max(body.y - y, 0, y - body.y - body.h);
      const distance = Math.hypot(dx, dy), fade = Math.max(0, 1 - distance / (Math.min(body.w, body.h) * .17));
      const darkness = Math.max(0, (225 - (im.data[j] + im.data[j + 1] + im.data[j + 2]) / 3) / 225);
      const a = Math.max(0, darkness - .015) * fade;
      data[i] = 37; data[i + 1] = 32; data[i + 2] = 26; data[i + 3] = Math.round(a * 255);
    }
  }
  // Trim *on alpha*, with sharp.trim(), then retain 4px of transparent shadow margin.
  const extracted = await sharp(data, { raw: { width: im.w, height: im.h, channels: 4 } }).trim({ threshold: 2 }).png().toBuffer({ resolveWithObject: true });
  const ox = -(extracted.info.trimOffsetLeft ?? 0), oy = -(extracted.info.trimOffsetTop ?? 0), pad = 4;
  const padded = sharp(extracted.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  const w = extracted.info.width + pad * 2, h = extracted.info.height + pad * 2;
  const output = `${outDir}/${name}.webp`;
  const paddedBuffer = await padded.png().toBuffer();
  await sharp(paddedBuffer).resize(w >= h ? { width: max } : { height: max }).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(output);
  const final = await sharp(output).metadata();
  metadata[name] = { width: final.width, height: final.height, sourceWidth: im.w, sourceHeight: im.h, crop: { x: ox - pad, y: oy - pad, w, h } };
  if (disc) metadata[name].disc = disc;
  console.log(output, final.width, final.height, (await stat(output)).size);
}
await prepare("ah_table", 2400, table, tableShell, cornerRadius + (innerLeft - tableShell.x));
await prepare("hub_console", 1600, hub, hubShell, hubShell.w * .16);
await prepare("lcd_panel", 900, lcd, lcdShell, lcdShell.h * .2);
for (const name of ["ah_mallet_orange", "ah_mallet_graphite", "ah_puck"]) {
  const im = await load(name);
  const b = components(im, name.endsWith("orange") ? (r, g, b) => r > 170 && g < 180 && b < 120 : (r, g, b) => Math.max(r, g, b) < 145)[0];
  if (!b || b.w < im.w * .35) throw new Error(`${name} disc segmentation failed`);
  const r = Math.min(b.w, b.h) / 2, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  // The colour mask excludes all shadows; use the measured disc itself for physics.
  await prepare(name, 512, im, b, r, { cx, cy, radius: r, radiusY: b.h / 2 });
}
function rect(name, b) { const c = metadata[name].crop; return { x: round((b.x - c.x) / c.w), y: round((b.y - c.y) / c.h), w: round(b.w / c.w), h: round(b.h / c.h) }; }
function goal(b) { const r = rect("ah_table", b); return { x: r.x, w: r.w, top: r.y, bottom: round(r.y + r.h) }; }
function sprite(name) { const m = metadata[name], c = m.crop, d = m.disc; return { width: m.width, height: m.height, cx: round((d.cx - c.x) / c.w), cy: round((d.cy - c.y) / c.h), radius: round(d.radius / c.w), radiusY: round(d.radiusY / c.h) }; }
const art = {
  version: 1,
  measurement: "sharp raw pixels: connected-component colour segmentation for LCD/tile seams/discs/goals; median luminance rail profiles; least-squares rounded-corner seam fit. Fractions reference trimmed delivered images. Disc radii exclude shadows.",
  table: { width: metadata.ah_table.width, height: metadata.ah_table.height, inner: rect("ah_table", { x: innerLeft, y: innerTop, w: innerRight - innerLeft, h: innerBottom - innerTop }), goals: { left: goal(goals[0]), right: goal(goals[1]) }, cornerRadius: round(cornerRadius / metadata.ah_table.crop.w) },
  hub: { width: metadata.hub_console.width, height: metadata.hub_console.height, lcd: rect("hub_console", hubScreen), tiles: tiles.map((b, i) => ({ id: ["pinball", "airhockey", "carcrush", "tanks"][i], label: ["PINBALL", "AIR HOCKEY", "CAR CRUSH", "TANKS"][i], ...rect("hub_console", b) })) },
  lcd: { width: metadata.lcd_panel.width, height: metadata.lcd_panel.height, screen: rect("lcd_panel", lcdScreen) },
  sprites: { orange: sprite("ah_mallet_orange"), graphite: sprite("ah_mallet_graphite"), puck: sprite("ah_puck") },
  // Deliberate game sizes relative to the image width. The detected sprite radius
  // maps each rendered disc onto these exact physical radii, independent of shadow.
  pieces: { malletDiameter: .095, puckDiameter: .043 },
  sourceMeasurements: { tableShell, hubShell, lcdShell, inner: { left: innerLeft, right: innerRight, top: innerTop, bottom: innerBottom }, cornerRadius, cornerFitRmsPixels: round(Math.sqrt(cornerError)), goals, hubScreen, tiles, lcdScreen, assets: metadata },
};
await writeFile("src/components/arcade/art.json", JSON.stringify(art, null, 2) + "\n");
