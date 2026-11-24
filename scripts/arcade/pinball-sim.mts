// Headless verification of the pinball physics: thousands of random launches with a
// scripted flipper bot plus maximum-speed stress probes.
// usage: node --experimental-strip-types scripts/arcade/pinball-sim.mts [--overlay out.png]
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-ignore Node's type stripping resolves the source extension directly.
import { createGame, geometryFromArt, restart, step, STEP, FLOOR, PLATE, SLOT, CREASE, WALL, POST, BUMPER, BALLS, STUCK_TIME, POPS, POP_LIFE, flipperDistance, pointInPoly, polyDistance, plungerTip, type Game } from "../../src/components/arcade/pinballPhysics.ts";

const art = JSON.parse(readFileSync(new URL("../../src/components/arcade/pinball.art.json", import.meta.url), "utf8"));
const g = geometryFromArt(art);
const overlayAt = process.argv.indexOf("--overlay");

function local(s: Game, i: number, x: number, y: number) {
  const f = g.flippers[i], a = s.flippers[i].angle, dx = f.side * Math.cos(a), dy = Math.sin(a);
  const rx = x - f.px, ry = y - f.py; return [rx * dx + ry * dy, rx * -dy + ry * dx];
}
let launches = 0, worstPen = 0, worstStill = 0, tunnels = 0, steps = 0, maxMicro = 0;
function verify(s: Game, ctx: string) {
  const b = s.ball;
  assert([b.x, b.y, b.vx, b.vy].every(Number.isFinite), `NaN ${ctx}`);
  for (const f of s.flippers) assert(Number.isFinite(f.angle), `flipper NaN ${ctx}`);
  if (!b.active) return;
  if (b.layer === FLOOR) assert(pointInPoly(g.floorPoly, b.x, b.y) || polyDistance(g.floorPoly, b.x, b.y) < 1, `left playfield ${ctx} at ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
  else if (b.layer === PLATE) assert(pointInPoly(g.lipPoly, b.x, b.y), `left plate ${ctx} at ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
  else { assert(b.x >= g.slot.left && b.x <= g.slot.right && b.y <= g.slot.bottom, `left slot ${ctx}`); }
  if (b.layer === FLOOR) for (let i = 0; i < 2; i++) worstPen = Math.max(worstPen, g.ballR - flipperDistance(s, i, b.x, b.y));
}

function rng(seed: number) { let st = seed >>> 0; return () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; return st / 4294967296; }; }
type Stats = { lifetimes: number[]; scores: number[]; entries: { header: number; lane: number; other: number }; fallbacks: number; nudges: number; saves: number };
const stats: Stats & { combos: number } = { combos: 0, lifetimes: [], scores: [], entries: { header: 0, lane: 0, other: 0 }, fallbacks: 0, nudges: 0, saves: 0 };

function playGame(seed: number, stress: boolean) {
  const r = rng(seed), s = createGame(g, seed * 7919);
  const hold = [0, 0], cooldown = [0, 0];
  let plungerState = 0, plungerTimer = .4 + r() * .6, pullGoal = .1 + r() * .9, prevLayer = SLOT, prevActive = true, prevDrains = 0;
  let prevLocal = [[0, 0], [0, 0]], guard = 0, prevBall = s.ballNumber, launchedAt = 0;
  while (s.phase !== "over" && guard++ < 240 * 1200) {
    // plunger bot: wait, hold space until the goal pull, release
    if (s.ball.active && s.ball.layer === SLOT && Math.abs(s.ball.vy) < 1 && s.ball.y + g.ballR >= plungerTip(s) - 2) {
      if (plungerState === 0) { plungerTimer -= STEP; if (plungerTimer <= 0) { plungerState = 1; s.plungerHeld = true; } }
    }
    if (plungerState === 1 && s.pull >= pullGoal) { s.plungerHeld = false; plungerState = 2; launchedAt = s.elapsed; launches++; }
    if (plungerState === 2 && !s.plungerHeld && s.ball.layer !== SLOT) { plungerState = 0; plungerTimer = .3 + r() * .8; pullGoal = .1 + r() * .9; }
    if (plungerState === 2 && s.elapsed - launchedAt > .3 && s.ball.layer === SLOT && Math.abs(s.ball.vy) < 1) { stats.fallbacks++; plungerState = 0; plungerTimer = .2; pullGoal = .5 + r() * .5; }
    // flipper bot (average player: reacts late sometimes, misses ~12%)
    for (let i = 0; i < 2; i++) {
      const f = g.flippers[i], b = s.ball;
      cooldown[i] = Math.max(0, cooldown[i] - STEP);
      if (hold[i] > 0) { hold[i] -= STEP; if (hold[i] <= 0) cooldown[i] = .12; }
      else if (cooldown[i] <= 0 && b.active && b.layer === FLOOR && b.vy > -80 && (i === 0 ? b.x < g.midX + 15 : b.x > g.midX - 15)
        && b.y > f.py - 95 && Math.hypot(b.x - f.px, b.y - f.py) < f.L + g.ballR + 25) {
        if (r() < .88) hold[i] = .16 + r() * .12; else cooldown[i] = .35;
      }
      if (stress && r() < .004) hold[i] = .05 + r() * .3;
    }
    s.inputLeft = hold[0] > 0; s.inputRight = hold[1] > 0;
    if (stress && s.ball.active && s.ball.layer === FLOOR && r() < .002) { const a = r() * Math.PI * 2; s.ball.vx = Math.cos(a) * 5200; s.ball.vy = Math.sin(a) * 5200; }
    for (let i = 0; i < 2; i++) prevLocal[i] = local(s, i, s.ball.x, s.ball.y);
    step(s); steps++;
    const b = s.ball;
    verify(s, `seed ${seed} t=${s.elapsed.toFixed(2)}`);
    // tunnelling: the ball centre may not cross a flipper's axis between its ends in one step
    if (b.active && b.layer === FLOOR && prevLayer === FLOOR) for (let i = 0; i < 2; i++) {
      const now = local(s, i, b.x, b.y), was = prevLocal[i];
      if (Math.sign(now[1]) !== Math.sign(was[1]) && now[0] > 0 && now[0] < g.flippers[i].L && was[0] > 0 && was[0] < g.flippers[i].L) { tunnels++; assert.fail(`flipper tunnel seed ${seed}`); }
    }
    // the ball may only disappear through the drain
    if (prevActive && !b.active) assert(s.drains === prevDrains + 1 && prevLayer === FLOOR, `ball vanished without draining, seed ${seed}`);
    if (prevLayer === PLATE && b.layer === FLOOR) { if (b.y < g.slot.top - 120 && b.x > 250) stats.entries.header++; else if (b.x < 250) stats.entries.lane++; else stats.entries.other++; }
    if (prevLayer === FLOOR) assert(b.layer === FLOOR || !b.active || s.phase === "ready", `floor ball changed layer, seed ${seed}`);
    worstStill = Math.max(worstStill, s.still);
    if (s.drains !== prevDrains) { stats.lifetimes.push(s.ballTime); if (s.message === "BALL SAVED") stats.saves++; }
    prevLayer = b.layer; prevActive = b.active; prevDrains = s.drains; prevBall = s.ballNumber;
    maxMicro = Math.max(maxMicro, s.maxMicroSteps);
    if (process.env.TRACE && guard % 2400 === 0) console.log(`t=${s.elapsed.toFixed(0)} ball=${s.ballNumber} layer=${b.layer} active=${b.active} phase=${s.phase} pos=${b.x.toFixed(0)},${b.y.toFixed(0)} v=${b.vx.toFixed(0)},${b.vy.toFixed(0)} pull=${s.pull.toFixed(2)} held=${s.plungerHeld} pst=${plungerState} score=${s.score}`);
  }
  assert(s.phase === "over", `game did not finish, seed ${seed}`);
  stats.scores.push(s.score); stats.nudges += s.nudges; if (!stress) stats.combos += s.combos;
  void prevBall;
}

if (overlayAt > 0) {
  // Debug overlay from the physics geometry itself (as built from pinball.art.json)
  const { default: sharp } = await import("sharp");
  const tw = art.table.width, k = tw / 1000;
  const colour = (l: number, kind: number) => kind === CREASE ? (l & PLATE ? "#c00" : "#0a0") : l === PLATE ? "#06f" : l & SLOT ? "#08f" : kind === 1 ? "#f0f" : kind === 2 ? "#f80" : "#e00";
  const segSvg = g.segs.map(sg => `<line x1="${sg.ax * k}" y1="${sg.ay * k}" x2="${sg.bx * k}" y2="${sg.by * k}" stroke="${colour(sg.layers, sg.kind)}" stroke-opacity="${sg.r ? .45 : 1}" stroke-width="${Math.max(1.5, sg.r * 2 * k)}" stroke-linecap="round"/>`).join("");
  const circ = g.circles.map(c => `<circle cx="${c.x * k}" cy="${c.y * k}" r="${c.r * k}" fill="none" stroke="#0cf" stroke-width="1.5"/>`).join("");
  const s = createGame(g, 1);
  const flips = g.flippers.map((f, i) => { const pts: string[] = []; for (let a = 0; a < 360; a += 4) { for (let rr = 0; rr < 200; rr += .5) { const x = f.px + Math.cos(a * Math.PI / 180) * rr, y = f.py + Math.sin(a * Math.PI / 180) * rr; if (flipperDistance(s, i, x, y) > 0) { pts.push(`${x * k},${y * k}`); break; } } } return `<polygon points="${pts.join(" ")}" fill="#f60" fill-opacity=".45"/>`; }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${art.table.height}">${segSvg}${circ}${flips}
    <line x1="0" y1="${g.drainY * k}" x2="${tw}" y2="${g.drainY * k}" stroke="#000" stroke-dasharray="6 4"/>
    <circle cx="${g.plunger.x * k}" cy="${(g.plunger.restTip - g.ballR) * k}" r="${g.ballR * k}" fill="#777"/>
    <line x1="${g.slot.left * k}" y1="${g.plunger.restTip * k}" x2="${g.slot.right * k}" y2="${g.plunger.restTip * k}" stroke="#000"/>
    <line x1="${g.slot.left * k}" y1="${(g.plunger.restTip + g.plunger.pullMax) * k}" x2="${g.slot.right * k}" y2="${(g.plunger.restTip + g.plunger.pullMax) * k}" stroke="#000" stroke-dasharray="2 2"/></svg>`;
  await sharp("public/arcade/pb_table.webp").composite([{ input: Buffer.from(svg) }]).png().toFile(process.argv[overlayAt + 1]);
  console.log("overlay", process.argv[overlayAt + 1]);
}

const t0 = performance.now();
const GAMES = Number(process.env.GAMES ?? 800), STRESS = Number(process.env.STRESS ?? 150);
if (overlayAt < 0 || GAMES > 0) for (let seed = 1; seed <= GAMES; seed++) playGame(seed, false);
const normal = { ...stats, lifetimes: [...stats.lifetimes], scores: [...stats.scores] };
for (let seed = 10001; seed < 10001 + STRESS; seed++) playGame(seed, true);
const ms = performance.now() - t0;
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const sorted = (a: number[]) => [...a].sort((x, y) => x - y);
assert(worstStill <= STUCK_TIME + .01, `stuck for ${worstStill}s`);
assert(worstPen < 3, `flipper penetration ${worstPen}`);
console.log(JSON.stringify({
  games: GAMES, stressGames: STRESS, balls: normal.lifetimes.length, steps, simSeconds: Math.round(steps * STEP), wallMs: Math.round(ms),
  avgBallLifetimeS: +mean(normal.lifetimes).toFixed(2), medianBallLifetimeS: +sorted(normal.lifetimes)[normal.lifetimes.length >> 1].toFixed(2),
  avgGameScore: Math.round(mean(normal.scores)), medianGameScore: sorted(normal.scores)[normal.scores.length >> 1], maxGameScore: Math.max(...normal.scores),
  plateDrops: normal.entries, launches, combosPerGame: +(normal.combos / GAMES).toFixed(2), launchFallbacks: normal.fallbacks, ballSaves: normal.saves, antiStuckNudges: stats.nudges,
  worstFlipperPenetrationUnits: +worstPen.toFixed(3), tunnels, worstStillS: +worstStill.toFixed(2), maxMicroSteps: maxMicro,
}, null, 1));

// ---------------------------------------------------------------------------------------------
// Anti-stuck: put the ball AT REST on plausible trap spots and require that it is free (moved
// more than 60 units from the spot, drained, or back on the plunger) within 4 s.
function placed(x: number, y: number, layer: number, seed: number) {
  const s = createGame(g, seed);
  s.phase = "play"; s.launched = true; s.saverArmed = false; s.saver = 0;
  Object.assign(s.ball, { x, y, vx: 0, vy: 0, layer, active: true });
  s.anchorX = x; s.anchorY = y;
  return s;
}
function freeTime(s: Game, x0: number, y0: number, limit: number) {
  for (let t = 0; t < limit; t += STEP) {
    step(s);
    const b = s.ball;
    verify(s, `anti-stuck @${x0.toFixed(0)},${y0.toFixed(0)}`);
    if (!b.active || b.layer === SLOT || Math.hypot(b.x - x0, b.y - y0) > 60) return t;
  }
  return Infinity;
}
const fx = (seg: { ax: number; ay: number; bx: number; by: number }) => seg;
const topOf = (x: number, y: number, r: number): [number, number] => [x, y - r - g.ballR - .05];
const posts = g.circles.filter(c => c.kind === POST), bumpers = g.circles.filter(c => c.kind === BUMPER);
const slingTops = art.slings.map((sl: { a: number[] }) => [sl.a[0] * 1000, sl.a[1] * g.height]);
const spots: { name: string; x: number; y: number; layer: number }[] = [];
bumpers.forEach((c, i) => { const [x, y] = topOf(c.x, c.y, c.r); spots.push({ name: `bumper ${i} crown`, x, y, layer: FLOOR }); spots.push({ name: `bumper ${i} shoulder`, x: c.x + (c.r + g.ballR) * Math.sin(.5), y: c.y - (c.r + g.ballR) * Math.cos(.5) - .05, layer: FLOOR }); });
posts.forEach((c, i) => { const [x, y] = topOf(c.x, c.y, c.r); spots.push({ name: `post ${i} top`, x, y, layer: FLOOR }); });
slingTops.forEach(([x, y]: number[], i: number) => spots.push({ name: `sling ${i} top`, x: x + (i ? -6 : 6), y: y - g.ballR - 2, layer: FLOOR }));
posts.forEach((c, i) => [-1, 1].forEach(side => spots.push({ name: `against post ${i} ${side < 0 ? "left" : "right"}`, x: c.x + side * (c.r + g.ballR + .05), y: c.y, layer: FLOOR })));
spots.push({ name: "plunger lane mouth (plate)", x: g.plunger.x, y: g.slot.top - 2, layer: PLATE });
spots.push({ name: "plunger lane mouth (rim side)", x: g.slot.left - g.ballR - 4, y: g.slot.top - g.ballR - 8, layer: PLATE });
// Natural rest spots: drop the ball at rest on a grid over the whole playfield and keep every
// place where it stayed put (within 40 units for 1.5 s) — guide crooks, post
// pockets, rim corners. Each becomes a trap spot for the test below.
const probe = createGame(g, 1);
const slingTris = art.slings.map((sl: { a: number[]; b: number[]; c: number[] }) => new Float64Array([sl.a, sl.b, sl.c].flatMap(p => [p[0] * 1000, p[1] * g.height])));
const clear = (x: number, y: number) => {
  if (!pointInPoly(g.floorPoly, x, y) || polyDistance(g.floorPoly, x, y) < g.ballR + 1) return false;
  for (const sg of g.segs) if (sg.layers & FLOOR) { const dx = sg.bx - sg.ax, dy = sg.by - sg.ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((x - sg.ax) * dx + (y - sg.ay) * dy) / l)) : 0; if (Math.hypot(x - sg.ax - t * dx, y - sg.ay - t * dy) < g.ballR + sg.r + 1) return false; }
  for (const c of g.circles) if (Math.hypot(x - c.x, y - c.y) < g.ballR + c.r + 1) return false;
  for (let i = 0; i < 2; i++) if (flipperDistance(probe, i, x, y) < g.ballR + 1) return false;
  for (const t of slingTris) if (pointInPoly(t, x, y)) return false;
  return true;
};
const found: { x: number; y: number }[] = [];
let gridStarts = 0, worstDwell = 0, worstAt = "";
for (let y = 60; y < g.height; y += 16) for (let x = 20; x < g.width; x += 16) {
  if (!clear(x, y)) continue;
  gridStarts++;
  const s = placed(x, y, FLOOR, gridStarts);
  let ax = x, ay = y, dwell = 0;
  for (let t = 0; t < 9 && s.ball.active && s.ball.layer !== SLOT; t += STEP) {
    step(s); verify(s, `grid ${x},${y}`);
    const b = s.ball;
    // independent dwell meter (40-unit window): how long the ball stays put anywhere
    if (Math.hypot(b.x - ax, b.y - ay) > 40) { ax = b.x; ay = b.y; dwell = 0; continue; }
    dwell += STEP;
    if (dwell > worstDwell) { worstDwell = dwell; worstAt = `start ${x},${y} -> ${b.x.toFixed(0)},${b.y.toFixed(0)} nudges ${s.nudges}`; }
    // a natural rest spot: still in place after 1.5 s (recorded once per 24-unit neighbourhood)
    if (dwell >= 1.5 && dwell < 1.5 + STEP && !found.some(p => Math.hypot(p.x - b.x, p.y - b.y) < 24)) found.push({ x: b.x, y: b.y });
  }
}
// guide crooks: the ball laid on top of every wire-guide joint (both upper arcs and the inlane guides)
Object.entries(art.wires as Record<string, { r: number; points: number[][] }>).forEach(([name, w]) => w.points.forEach((p, j) => {
  if (j === 0 || j === w.points.length - 1) return;
  const x = p[0] * 1000, y = p[1] * g.height - w.r * 1000 - g.ballR - .05;
  if (clear(x, y)) spots.push({ name: `guide ${name} joint ${j}`, x, y, layer: FLOOR });
}));
// a FLOOR spot must lie on the playfield (posts at the header crease have their tops on the rim plate)
for (let i = spots.length - 1; i >= 0; i--) { const sp = spots[i]; if (sp.layer === FLOOR && !(pointInPoly(g.floorPoly, sp.x, sp.y) && polyDistance(g.floorPoly, sp.x, sp.y) >= g.ballR - .5)) { console.log(`  (skip ${sp.name}: not on the playfield)`); spots.splice(i, 1); } }
console.log(`grid: ${gridStarts} starts, ${found.length} rest spots, ${Math.round(performance.now() - t0)} ms`);
found.forEach((p, i) => spots.push({ name: `natural rest ${i} @${p.x.toFixed(0)},${p.y.toFixed(0)}`, x: p.x, y: p.y, layer: FLOOR }));
// Two checks per spot (24 seeds each):
//  natural - the ball is simply put down at rest; physics alone usually frees it at once.
//  pinned  - the ball is held exactly in place (as if caught on a rubber) until the anti-stuck
//            nudge fires; then it is let go. It must be clear of the spot within 4 s of being
//            put down, i.e. the nudge itself frees it and it does not roll straight back.
const results: { name: string; natural: number; pinned: number; nudgeAt: number }[] = [];
for (const sp of spots) {
  let natural = 0, pinned = 0, nudgeAt = 0;
  for (let seed = 1; seed <= 24; seed++) {
    natural = Math.max(natural, freeTime(placed(sp.x, sp.y, sp.layer, seed * 131), sp.x, sp.y, 8));
    const s = placed(sp.x, sp.y, sp.layer, seed * 977 + 3);
    let t = 0;
    for (; t < 8 && s.nudges === 0; t += STEP) { step(s); Object.assign(s.ball, { x: sp.x, y: sp.y, vx: s.nudges ? s.ball.vx : 0, vy: s.nudges ? s.ball.vy : 0, layer: sp.layer }); }
    assert(s.nudges === 1, `no nudge at ${sp.name}`);
    nudgeAt = Math.max(nudgeAt, t);
    pinned = Math.max(pinned, t + freeTime(s, sp.x, sp.y, 8));
  }
  results.push({ name: sp.name, natural: +natural.toFixed(2), pinned: +pinned.toFixed(2), nudgeAt: +nudgeAt.toFixed(2) });
  assert(natural <= 4 && pinned <= 4, `ball stuck at ${sp.name}: natural ${natural}s, pinned ${pinned}s`);
}
assert(worstDwell <= 4, `grid dwell ${worstDwell} ${worstAt}`);
console.log(JSON.stringify({ antiStuck: { gridStarts, naturalRestSpots: found.length, worstGridDwellS: +worstDwell.toFixed(2), worstGridDwellAt: worstAt, spots: results.length, worstNaturalFreeS: Math.max(...results.map(r => r.natural)), worstPinnedFreeS: Math.max(...results.map(r => r.pinned)) } }));
for (const r of results) console.log(`  ${r.name.padEnd(30)} natural free ${r.natural.toFixed(2)} s | pinned: nudge at ${r.nudgeAt.toFixed(2)} s, free at ${r.pinned.toFixed(2)} s`);

// Cradle: a held flipper holds a ball still; release + re-flip shoots it up the table.
for (let i = 0; i < 2; i++) {
  const f = g.flippers[i], s = createGame(g, 77 + i);
  s.phase = "play"; s.launched = true; s.saverArmed = false;
  if (i === 0) s.inputLeft = true; else s.inputRight = true;
  for (let t = 0; t < .2; t += STEP) step(s);              // flipper up
  Object.assign(s.ball, { x: f.px + f.side * f.L * .7, y: f.py - 140, vx: 0, vy: 0, layer: FLOOR, active: true });
  for (let t = 0; t < 4; t += STEP) step(s);
  const b = s.ball, speed = Math.hypot(b.vx, b.vy), d = flipperDistance(s, i, b.x, b.y);
  assert(b.active && speed < 5 && d < g.ballR + 2, `flipper ${i} does not cradle (speed ${speed.toFixed(1)}, gap ${(d - g.ballR).toFixed(1)})`);
  assert(s.nudges === 0, "cradled ball was nudged");
  const rest = { x: b.x, y: b.y };
  if (i === 0) s.inputLeft = false; else s.inputRight = false;   // drop the ball onto the lowered flipper
  let shotSpeed = 0, tr = 0;
  for (; tr < .6; tr += STEP) { step(s); if (Math.hypot(s.ball.x - f.px, s.ball.y - f.py) > f.L * .45) break; }
  if (i === 0) s.inputLeft = true; else s.inputRight = true;
  for (let t = 0; t < .25; t += STEP) { step(s); shotSpeed = Math.max(shotSpeed, -s.ball.vy); }
  assert(shotSpeed > 1500, `flipper ${i} cradle shot too weak ${shotSpeed}`);
  console.log(`cradle ${i ? "right" : "left"}: rests at ${rest.x.toFixed(0)},${rest.y.toFixed(0)} (speed ${speed.toFixed(2)}), release ${tr.toFixed(2)} s + flip -> up-speed ${shotSpeed.toFixed(0)}`);
}

// Flipper response: the flipper moves on the very first physics step after the input goes down.
{
  const s = createGame(g, 5); const a0 = s.flippers[0].angle;
  s.inputLeft = true; step(s);
  assert(s.flippers[0].angle < a0 - .01, "left flipper did not move on the first step");
  let t = STEP; while (s.flippers[0].angle > -30 * Math.PI / 180 + 1e-4 && t < 1) { step(s); t += STEP; }
  assert(t < .1, `flipper too slow ${t}`);
  console.log(`flipper response: moves on step 1, fully up after ${(t * 1000).toFixed(1)} ms`);
}

// Game loop: three balls -> over -> restart resets score/ball and the playfield.
{
  const s = createGame(g, 9);
  let drains = 0;
  for (let n = 0; n < BALLS * 3 && s.phase !== "over"; n++) {
    for (let t = 0; t < 3 && s.phase !== "ready"; t += STEP) step(s);
    for (let t = 0; t < 3 && s.phase !== "play"; t += STEP) { s.plungerHeld = t < .5; step(s); }
    for (let t = 0; t < 120 && s.phase === "play"; t += STEP) step(s);
    drains++;
  }
  assert(s.phase === "over" && s.ballNumber === BALLS && s.score > 0, `loop did not reach game over (${s.phase})`);
  for (let t = 0; t < 1.1; t += STEP) step(s);
  restart(s);
  assert(s.score === 0 && s.ballNumber === 1 && s.phase === "ready" && s.ball.layer === SLOT && !s.combo && s.targets.every(v => !v) && s.message === "", "restart not clean");
  assert(s.popAge.every(a => a >= POP_LIFE) && s.popAge.length === POPS, "pops not cleared");
  console.log(`game loop: ${drains} serves -> GAME OVER -> restart clean`);
}
void fx; void WALL;
