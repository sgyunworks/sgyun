// Air hockey table drawn as vector art (crisp at any DPR, perfectly regular air holes),
// built from the same geometry the physics uses (src/components/arcade/art.json), so art and colliders match exactly.
// usage: node scripts/arcade/make-table-svg.mjs  → public/arcade/ah_table.svg (landscape)
//                                               + public/arcade/ah_table_portrait.svg (same table rotated 90° CCW for phones:
//                                                 player goal at the bottom; light and shadows stay "from above" on screen)
import fs from "node:fs";

const art = JSON.parse(fs.readFileSync("src/components/arcade/art.json", "utf8"));
const W = art.table.width, H = art.table.height;
const X0 = art.table.inner.x * W, Y0 = art.table.inner.y * H, IW = art.table.inner.w * W, IH = art.table.inner.h * H;
const X1 = X0 + IW, Y1 = Y0 + IH, CY = (Y0 + Y1) / 2, MID = (X0 + X1) / 2;
const R = art.table.cornerRadius * W;       // inner corner radius
const T = Math.min(21, Y0 - 1);             // rail width (thin)
const gl = art.table.goals.left, gr = art.table.goals.right;
const f = n => +n.toFixed(2);

// air-hole grid: perfectly regular, centred, kept clear of the rail by a margin
const S = 28, M = 30;
const gx = X0 + M + ((IW - 2 * M) % S) / 2, gy = Y0 + M + ((IH - 2 * M) % S) / 2;

// In the portrait file everything is drawn in landscape coordinates inside a rotate(-90) group
// (screen x' = y, y' = W - x); gradients are re-aimed so they still run top→bottom on screen,
// and the page shadows are drawn outside the group so they still fall downwards.
const VGRAD_L = 'x1="0" y1="0" x2="0" y2="1"', VGRAD_P = 'x1="1" y1="0" x2="0" y2="0"';
function shadowsPortrait() {
  const x = Y0 - T, y = W - X1 - T, w = IH + 2 * T, h = IW + 2 * T;
  return `<rect x="${f(x + 14)}" y="${f(y + 30)}" width="${f(w - 28)}" height="${f(h - 10)}" rx="${f(R + T)}" fill="#3C3024" fill-opacity=".17" filter="url(#drop)"/>
<rect x="${f(x + 2)}" y="${f(y + 5)}" width="${f(w - 4)}" height="${f(h)}" rx="${f(R + T)}" fill="#3C3024" fill-opacity=".22" filter="url(#contact)"/>`;
}
const build = portrait => `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? H : W}" height="${portrait ? W : H}" viewBox="0 0 ${portrait ? H : W} ${portrait ? W : H}">
<defs>
  <filter id="drop" x="-10%" y="-20%" width="120%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
  <filter id="contact" x="-5%" y="-10%" width="110%" height="130%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
  <linearGradient id="rail" ${portrait ? VGRAD_P : VGRAD_L}>
    <stop offset="0" stop-color="#F7F5F1"/><stop offset=".55" stop-color="#EEEBE5"/><stop offset="1" stop-color="#E1DDD6"/>
  </linearGradient>
  <linearGradient id="lip" ${portrait ? VGRAD_P : VGRAD_L}>
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".45" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="field" ${portrait ? VGRAD_P : VGRAD_L}>
    <stop offset="0" stop-color="#F3F1EC"/><stop offset="1" stop-color="#ECE9E3"/>
  </linearGradient>
  <radialGradient id="lamp" ${portrait ? 'cx=".72" cy=".5"' : 'cx=".5" cy=".28"'} r=".75">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <pattern id="holes" patternUnits="userSpaceOnUse" x="${f(gx - S / 2)}" y="${f(gy - S / 2)}" width="${S}" height="${S}">
    <circle cx="${portrait ? S / 2 - 1.3 : S / 2}" cy="${portrait ? S / 2 : S / 2 + 1.3}" r="2.5" fill="#FFFFFF" fill-opacity=".9"/>
    <circle cx="${S / 2}" cy="${S / 2}" r="2.15" fill="#8E877D" fill-opacity=".62"/>
  </pattern>
  <clipPath id="fieldClip"><rect x="${f(X0)}" y="${f(Y0)}" width="${f(IW)}" height="${f(IH)}" rx="${f(R)}"/></clipPath>
  <linearGradient id="slot" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1F1F21"/><stop offset=".5" stop-color="#2C2C2F"/><stop offset="1" stop-color="#1F1F21"/>
  </linearGradient>
</defs>

<!-- shadows on the page -->
${portrait ? shadowsPortrait() : `<rect x="${f(X0 - T + 14)}" y="${f(Y0 - T + 30)}" width="${f(IW + 2 * T - 28)}" height="${f(IH + 2 * T - 10)}" rx="${f(R + T)}" fill="#3C3024" fill-opacity=".17" filter="url(#drop)"/>
<rect x="${f(X0 - T + 2)}" y="${f(Y0 - T + 5)}" width="${f(IW + 2 * T - 4)}" height="${f(IH + 2 * T)}" rx="${f(R + T)}" fill="#3C3024" fill-opacity=".22" filter="url(#contact)"/>`}
${portrait ? `<g transform="translate(0 ${W}) rotate(-90)">` : ""}
<!-- thin rounded rail -->
<rect x="${f(X0 - T)}" y="${f(Y0 - T)}" width="${f(IW + 2 * T)}" height="${f(IH + 2 * T)}" rx="${f(R + T)}" fill="url(#rail)"/>
<rect x="${f(X0 - T + 1.5)}" y="${f(Y0 - T + 1.5)}" width="${f(IW + 2 * T - 3)}" height="${f(IH + 2 * T - 3)}" rx="${f(R + T - 1.5)}" fill="none" stroke="url(#lip)" stroke-width="2.5"/>

<!-- recessed playing surface -->
<rect x="${f(X0)}" y="${f(Y0)}" width="${f(IW)}" height="${f(IH)}" rx="${f(R)}" fill="url(#field)"/>
<g clip-path="url(#fieldClip)">
  <rect x="${f(X0)}" y="${f(Y0)}" width="${f(IW)}" height="${f(IH)}" fill="url(#lamp)"/>
  <rect x="${f(X0 + M - S / 2)}" y="${f(Y0 + M - S / 2)}" width="${f(IW - 2 * M + S)}" height="${f(IH - 2 * M + S)}" rx="${f(Math.max(0, R - M))}" fill="url(#holes)"/>
  <!-- printed markings -->
  <line x1="${f(MID)}" y1="${f(Y0)}" x2="${f(MID)}" y2="${f(Y1)}" stroke="#F05A1E" stroke-width="4"/>
  <circle cx="${f(MID)}" cy="${f(CY)}" r="${f(IH * 0.165)}" fill="none" stroke="#9C968D" stroke-width="3"/>
  <circle cx="${f(X0)}" cy="${f(CY)}" r="${f(IH * 0.2)}" fill="none" stroke="#9C968D" stroke-width="3"/>
  <circle cx="${f(X1)}" cy="${f(CY)}" r="${f(IH * 0.2)}" fill="none" stroke="#9C968D" stroke-width="3"/>
  <!-- ambient occlusion where the surface meets the rail (stronger at the top: light from above) -->
  <rect ${portrait ? `x="${f(X0 - 10)}" y="${f(Y0 - 10)}" width="${f(IW + 14)}" height="${f(IH + 20)}"` : `x="${f(X0 - 10)}" y="${f(Y0 - 4)}" width="${f(IW + 20)}" height="${f(IH + 14)}"`} rx="${f(R + 10)}" fill="none" stroke="#4A3B2C" stroke-opacity=".3" stroke-width="22" filter="url(#soft)"/>
</g>

<!-- goal slots -->
${[gl, gr].map(g => `<rect x="${f(g.x * W)}" y="${f(g.top * H)}" width="${f(g.w * W)}" height="${f((g.bottom - g.top) * H)}" rx="${f(g.w * W / 2)}" fill="url(#slot)"/>
<rect x="${f(g.x * W + 1)}" y="${f(g.top * H + 1)}" width="${f(g.w * W - 2)}" height="${f((g.bottom - g.top) * H - 2)}" rx="${f(g.w * W / 2 - 1)}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2"/>`).join("\n")}${portrait ? "\n</g>" : ""}
</svg>`;
fs.writeFileSync("public/arcade/ah_table.svg", build(false));
fs.writeFileSync("public/arcade/ah_table_portrait.svg", build(true));
console.log("wrote public/arcade/ah_table.svg", W + "x" + H, "and ah_table_portrait.svg", H + "x" + W, "holes", Math.floor((IW - 2 * M) / S) + 1, "x", Math.floor((IH - 2 * M) / S) + 1);
