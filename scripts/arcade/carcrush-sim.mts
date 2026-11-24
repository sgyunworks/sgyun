// Headless verification for CAR CRUSH. Run: node --experimental-strip-types scripts/arcade/carcrush-sim.mts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-ignore Node's built-in type stripping resolves the source extension directly.
import { createGame, layoutFromArt, step, strike, strikeKey, stageFor, halfHeight, bonusSeconds, STEP, THRESHOLDS, MAX_DEBRIS, DEAD, FLYING, SETTLED, FALLING, DURATION, type Game } from "../../src/components/arcade/carcrushPhysics.ts";

const art = JSON.parse(readFileSync(new URL("../../src/components/arcade/carcrush.art.json", import.meta.url), "utf8"));
const L = layoutFromArt(art);
function rng(seed: number) { let state = seed >>> 0 || 1; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
// Cells of the car for "aimed" clicks (players click on what they see: the opaque car).
const carCells: number[] = []; for (let i = 0; i < L.grid.length; i++) if (L.grid[i]) carCells.push(i);

let checks = 0, maxLive = 0, maxAirTime = 0, lowestApex = Infinity;
function verify(s: Game, prev: { total: number; stage: number }, ctx: string) {
  assert(Number.isFinite(s.total) && s.total >= prev.total - 1e-12, `damage not monotonic ${ctx}`);
  assert(s.total <= 100 + 1e-9, `damage > 100 ${ctx}`);
  assert(s.stage === stageFor(s.total), `stage mismatch ${ctx}`);
  assert(s.stage >= prev.stage && s.stage <= prev.stage + 1, `stage skipped/reversed ${prev.stage}->${s.stage} ${ctx}`);
  if (s.stage > prev.stage) assert(s.total >= THRESHOLDS[s.stage - 1] && prev.total < THRESHOLDS[s.stage - 1], `threshold order ${ctx}`);
  for (let i = 0; i < 4; i++) assert(Number.isFinite(s.zone[i]) && s.zone[i] >= 0 && s.zone[i] <= 25 + 1e-9, `zone ${i} ${ctx}`);
  let live = 0;
  for (let i = 0; i < MAX_DEBRIS; i++) {
    const st = s.dstate[i]; if (st === DEAD) continue; live++;
    for (const v of [s.dx[i], s.dy[i], s.dvx[i], s.dvy[i], s.drot[i]]) assert(Number.isFinite(v), `debris NaN ${ctx}`);
    const hb = halfHeight(s, i), over = s.dx[i] >= L.plinth.left && s.dx[i] <= L.plinth.right;
    assert(s.dx[i] >= 0 && s.dx[i] <= L.W, `debris left the band horizontally ${ctx}`);
    assert(s.dy[i] - hb >= -1e-6, `debris above the band ${ctx}`);
    lowestApex = Math.min(lowestApex, s.dy[i] - hb);
    if (st === FLYING || st === SETTLED) {
      assert(s.dy[i] + hb <= s.drest[i] + 1e-6, `debris below its rest line ${ctx}`);
      assert(s.drest[i] <= L.plinth.face + 1e-6 && s.drest[i] >= L.plinth.top, `rest line off the top face ${ctx}`);
      if (s.dy[i] + hb > L.plinth.top + 1e-6) assert(over, `debris inside the plinth body ${ctx}`);
    }
    if (st === FALLING) assert(!over || s.dy[i] + hb <= L.plinth.top + 1e-6, `falling debris inside plinth ${ctx}`);
    if (st !== SETTLED) maxAirTime = Math.max(maxAirTime, s.dage[i]);
    assert(s.dage[i] < 4 + 4 + 1 + 6, `debris never retired ${ctx}`);
  }
  maxLive = Math.max(maxLive, live); checks++;
  prev.total = s.total; prev.stage = s.stage;
}
type Player = { rate: number; aim: number; jitter: number; name: string };
function play(seed: number, p: Player) {
  const r = rng(seed * 7919 + 13), s = createGame(L, seed), prev = { total: 0, stage: 0 };
  let next = 3 + .25 + r() * .3; // reaction after GO
  let time = 0, clicks = 0;
  while (s.phase !== "done" || time < s.elapsed + 3 + 12) {
    // Average clicker: mean interval 1/rate, uniform ±50 % jitter on timing; aims at the car with jitter.
    if (time >= next && s.phase !== "done") {
      clicks++;
      let x: number, y: number;
      if (r() < p.aim) { const c = carCells[Math.floor(r() * carCells.length)]; x = L.car.x + (c % L.cols + r()) * L.cell + (r() - .5) * p.jitter; y = L.car.y + (Math.floor(c / L.cols) + r()) * L.cell + (r() - .5) * p.jitter; }
      else { x = r() * L.W; y = r() * L.H; }
      strike(s, x, y);
      next = time + (1 / p.rate) * (.5 + r());
    }
    step(s); time += STEP; verify(s, prev, `seed ${seed} t=${time.toFixed(3)}`);
    if (time > 3 + DURATION + 20) break;
  }
  // after everything has played out, all debris must be retired (settled ones fade after 4 s)
  assert(s.phase === "done");
  let live = 0; for (let i = 0; i < MAX_DEBRIS; i++) if (s.dstate[i] !== DEAD) live++;
  assert.equal(live, 0, `debris left alive at end (seed ${seed})`);
  return { wreck: s.wreckTime, hits: s.hits, clicks, maxCombo: s.maxCombo, bonus: bonusSeconds(s), total: s.total };
}
const q = (a: number[], f: number) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(f * b.length))]; };
const players: Player[] = [
  { name: "average (4 clicks/s)", rate: 4, aim: .92, jitter: 40 },
  { name: "casual (3 clicks/s)", rate: 3, aim: .9, jitter: 50 },
  { name: "fast (6 clicks/s)", rate: 6, aim: .95, jitter: 30 },
];
const t0 = performance.now(), SEEDS = 200;
for (const p of players) {
  const runs = Array.from({ length: SEEDS }, (_, i) => play(i + 1, p));
  const wrecked = runs.filter(x => x.wreck >= 0), times = wrecked.map(x => x.wreck);
  console.log(`${p.name}: wrecked ${wrecked.length}/${SEEDS}; time to full wreck median ${q(times, .5)?.toFixed(1)} s (p10 ${q(times, .1)?.toFixed(1)}, p90 ${q(times, .9)?.toFixed(1)}); hits median ${q(runs.map(x => x.hits), .5)} of ${q(runs.map(x => x.clicks), .5)} clicks; max combo median ×${q(runs.map(x => x.maxCombo), .5)}; damage if not wrecked median ${q(runs.filter(x => x.wreck < 0).map(x => x.total), .5)?.toFixed(0) ?? "-"}%`);
  if (p.rate === 4) { const m = q(times, .5); assert(wrecked.length / SEEDS > .9, "average player must usually wreck the car"); assert(m >= 19 && m <= 26, `median wreck ${m} outside 19–26 s`); }
}
// keyboard-only player (Space every 0.3 s) also works
{ const s = createGame(L, 5); let t = 0, n = 0; const prev = { total: 0, stage: 0 }; while (t < 3 + DURATION) { if (s.phase === "play" && t > n) { strikeKey(s); n = t + .3; } step(s); t += STEP; verify(s, prev, "keys"); } console.log(`keyboard-only (Space every 0.30 s): ${s.wreckTime >= 0 ? `wrecked at ${s.wreckTime.toFixed(1)} s` : `damage ${s.total.toFixed(0)}%`}`); }
// holding does nothing: no clicks → no damage
{ const s = createGame(L, 9); for (let i = 0; i < (3 + DURATION) / STEP + 10; i++) step(s); assert.equal(s.total, 0); assert.equal(s.phase, "done"); }
// countdown ignores strikes
{ const s = createGame(L, 3); assert.equal(strike(s, L.car.cx, L.ground - 150), false); assert.equal(s.total, 0); }
console.log(`checks ${checks}, max live debris ${maxLive}/${MAX_DEBRIS}, longest airborne ${maxAirTime.toFixed(2)} s, highest debris top ${lowestApex.toFixed(0)} (band top 0), ${((performance.now() - t0) / 1000).toFixed(1)} s`);
console.log("ALL CAR CRUSH SIM CHECKS PASSED");
