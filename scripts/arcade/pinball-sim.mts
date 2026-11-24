// Headless verification of the pinball physics: thousands of random launches with a
// scripted flipper bot plus maximum-speed stress probes.
// usage: node --experimental-strip-types scripts/arcade/pinball-sim.mts [--overlay out.png]
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-ignore Node's type stripping resolves the source extension directly.
import { createGame, geometryFromArt, step, STEP, FLOOR, PLATE, SLOT, CREASE, flipperDistance, pointInPoly, polyDistance, plungerTip, type Game } from "../../src/components/arcade/pinballPhysics.ts";

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
assert(worstStill <= 3.01, `stuck for ${worstStill}s`);
assert(worstPen < 3, `flipper penetration ${worstPen}`);
console.log(JSON.stringify({
  games: GAMES, stressGames: STRESS, balls: normal.lifetimes.length, steps, simSeconds: Math.round(steps * STEP), wallMs: Math.round(ms),
  avgBallLifetimeS: +mean(normal.lifetimes).toFixed(2), medianBallLifetimeS: +sorted(normal.lifetimes)[normal.lifetimes.length >> 1].toFixed(2),
  avgGameScore: Math.round(mean(normal.scores)), medianGameScore: sorted(normal.scores)[normal.scores.length >> 1], maxGameScore: Math.max(...normal.scores),
  plateDrops: normal.entries, launches, combosPerGame: +(normal.combos / GAMES).toFixed(2), launchFallbacks: normal.fallbacks, ballSaves: normal.saves, antiStuckNudges: stats.nudges,
  worstFlipperPenetrationUnits: +worstPen.toFixed(3), tunnels, worstStillS: +worstStill.toFixed(2), maxMicroSteps: maxMicro,
}, null, 1));

