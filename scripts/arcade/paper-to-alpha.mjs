// Turn an asset rendered on the site's flat paper colour (#F3F3F1) into a transparent PNG/WebP,
// keeping soft shadows as semi-transparent darkening ("colour to alpha", per pixel).
// usage: node scripts/arcade/paper-to-alpha.mjs in.png out.webp [--crop x,y,w,h] [--bg F3F3F1]
import sharp from "sharp";
const [,, input, output, ...rest] = process.argv;
const opt = Object.fromEntries(rest.join(" ").split("--").filter(Boolean).map(s => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(" ")]; }));
let img = sharp(input).removeAlpha();
// background colour: --bg RRGGBB, or (default) the median of the four 24 px corner patches
let bg;
if (opt.bg && opt.bg !== "auto") { const hex = opt.bg.replace("#", ""); bg = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)); }
else {
  const meta = await sharp(input).metadata(), S = 24, W = meta.width, H = meta.height;
  const corners = [[0, 0], [W - S, 0], [0, H - S], [W - S, H - S]];
  const means = await Promise.all(corners.map(([left, top]) => sharp(input).removeAlpha().extract({left, top, width: S, height: S}).stats().then(st => st.channels.map(c => c.mean))));
  bg = [0, 1, 2].map(c => means.map(m => m[c]).sort((a, b) => a - b)[1]);
}
if (opt.crop) { const [left, top, width, height] = opt.crop.split(",").map(Number); img = img.extract({left, top, width, height}); }
const {data, info} = await img.raw().toBuffer({resolveWithObject: true});
const out = Buffer.alloc(info.width * info.height * 4);
for (let p = 0, q = 0; p < data.length; p += 3, q += 4) {
  // minimal alpha so that colour = alpha*fg + (1-alpha)*bg is achievable
  let a = 0;
  for (let c = 0; c < 3; c++) {
    const v = data[p + c], b = bg[c];
    const need = v < b ? (b - v) / b : v > b ? (v - b) / (255 - b) : 0;
    a = Math.max(a, need);
  }
  if (a < 0.012) a = 0; // paper noise / faint grid
  for (let c = 0; c < 3; c++) out[q + c] = a ? Math.round(Math.min(255, Math.max(0, (data[p + c] - (1 - a) * bg[c]) / a))) : 0;
  out[q + 3] = Math.round(a * 255);
}
let s = sharp(out, {raw: {width: info.width, height: info.height, channels: 4}});
if (opt.resize) s = s.resize({width: Number(opt.resize)});
await (output.endsWith(".webp") ? s.webp({quality: 92, alphaQuality: 95}) : s.png()).toFile(output);
console.log("wrote", output, info.width + "x" + info.height, "bg", bg.map(v => Math.round(v)).join(","));
