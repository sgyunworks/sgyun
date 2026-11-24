// Static alpha/material QA only. This is deliberately not a browser render or FPS test.
import sharp from "sharp";
import { readFileSync } from "node:fs";
const art = JSON.parse(readFileSync("src/components/arcade/art.json", "utf8"));
const names = ["hub_console", "ah_table", "lcd_panel", "ah_mallet_orange", "ah_mallet_graphite", "ah_puck"];
const background = Buffer.from(`<svg width="1400" height="900" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#b7b8b4"/></pattern></defs><rect width="100%" height="100%" fill="#F3F3F1"/><rect width="100%" height="100%" fill="url(#grid)"/></svg>`);
const layers = [], boxes = [];
for (let i = 0; i < names.length; i++) {
  const im = await sharp(`public/arcade/${names[i]}.webp`).resize({ width: i === 1 ? 900 : i === 0 ? 390 : i === 2 ? 400 : 180, height: i === 1 ? 420 : i === 0 ? 570 : i === 2 ? 190 : 180, fit: "inside" }).png().toBuffer({ resolveWithObject: true });
  const left = i === 0 ? 20 : i === 1 ? 450 : i === 2 ? 450 : 450 + (i - 3) * 240, top = i < 2 ? 20 : i === 2 ? 440 : 650;
  layers.push({ input: im.data, left, top }); boxes.push({ left, top, w: im.info.width, h: im.info.height });
}
await sharp(background).composite(layers).png().toFile("scripts/arcade/qa-assets.png");
const outlines = [];
function rect(index, r, color) { const b = boxes[index]; outlines.push(`<rect x="${b.left + r.x * b.w}" y="${b.top + r.y * b.h}" width="${r.w * b.w}" height="${r.h * b.h}" fill="none" stroke="${color}" stroke-width="1"/>`); }
rect(0, art.hub.lcd, "#1487b7"); for (const r of art.hub.tiles) rect(0, r, "#1487b7");
rect(1, art.table.inner, "#1487b7");
for (const g of [art.table.goals.left, art.table.goals.right]) rect(1, { x: g.x, y: g.top, w: g.w, h: g.bottom - g.top }, "#ee5b13");
rect(2, art.lcd.screen, "#1487b7");
await sharp("scripts/arcade/qa-assets.png").composite([{ input: Buffer.from(`<svg width="1400" height="900" xmlns="http://www.w3.org/2000/svg">${outlines.join("")}</svg>`) }]).png().toFile("scripts/arcade/qa-geometry.png");
console.log("Static contact sheet and measured-region overlay written under scripts/arcade/");
