import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
// @ts-ignore Node's built-in type stripping resolves the source extension directly.
import { createGame, geometryFromArt, insideMouth, step, STEP, type Game, type Difficulty } from "../../src/components/arcade/airHockeyPhysics.ts";

const art = JSON.parse(readFileSync(new URL("../../src/components/arcade/art.json", import.meta.url), "utf8"));
const geometry = geometryFromArt(art);
function rng(seed: number) { let state = seed >>> 0; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
let worstOverlap = 0, leftGoals = 0, rightGoals = 0;
function verify(s: Game, context: string) {
  const p = s.puck, g = s.g;
  for (const b of [p, s.player, s.ai]) assert([b.x, b.y, b.vx, b.vy, b.r].every(Number.isFinite), `NaN/Infinity ${context}`);
  assert(p.y >= g.top + p.r - .0001 && p.y <= g.bottom - p.r + .0001, `vertical escape ${context}`);
  assert(p.x >= g.left + p.r - .0001 || insideMouth(s, true), `left rail escape ${context}`);
  assert(p.x <= g.right - p.r + .0001 || insideMouth(s, false), `right rail escape ${context}`);
  assert(p.x >= g.left - p.r - 6 && p.x <= g.right + p.r + 6, `goal tunnel ${context}`);
  if (s.phase !== "goal" && s.phase !== "over") for (const b of [s.player, s.ai]) {
    const overlap = p.r + b.r - Math.hypot(p.x - b.x, p.y - b.y);
    worstOverlap = Math.max(worstOverlap, overlap);
    // 1 simulation unit is 2.4px in the delivered 2400px table. Check that stricter limit.
    assert(overlap <= 1000 / art.table.width, `mallet overlap ${overlap}px ${context}`);
    assert(b.y >= g.top + b.r - .001 && b.y <= g.bottom - b.r + .001, `mallet vertical confinement ${context}`);
    assert(b === s.player ? b.x >= g.left + b.r - .001 && b.x <= (g.left + g.right) / 2 - b.r + .001 : b.x >= (g.left + g.right) / 2 + b.r - .001 && b.x <= g.right - b.r + .001, `mallet half confinement ${context}`);
  }
}
const start = performance.now();
for (let seed = 1; seed <= 20; seed++) {
  const random = rng(seed), mid = (geometry.left + geometry.right) / 2;
  let s = createGame(geometry, "normal", seed); s.aiEnabled = false;
  for (let n = 0; n < 200_000; n++) {
    if (n % 41 === 0) {
      s.targetX = geometry.left + random() * (mid - geometry.left);
      s.targetY = geometry.top + random() * (geometry.bottom - geometry.top);
      s.aiX = mid + random() * (geometry.right - mid);
      s.aiY = geometry.top + random() * (geometry.bottom - geometry.top);
    }
    // Occasional valid maximum-speed shots probe rails, posts, corners and both goals.
    if (n % 3571 === 0 && s.phase === "play") { const angle = random() * Math.PI * 2; s.puck.vx = Math.cos(angle) * 1050; s.puck.vy = Math.sin(angle) * 1050; }
    const beforeYou = s.you, beforeAi = s.computer;
    step(s);
    leftGoals += s.computer - beforeAi; rightGoals += s.you - beforeYou;
    verify(s, `seed=${seed} step=${n}`);
    if (s.phase === "over") { s = createGame(geometry, "normal", seed + n); s.aiEnabled = false; }
  }
}
assert(leftGoals > 0 && rightGoals > 0, "Both goal mouths must be exercised");

// Explicit regressions: rail pinning, goal-post grazing, high relative velocity,
// countdown pointer movement, stopped serve after either side concedes.
for (const bottom of [false, true]) {
  const s = createGame(geometry); s.aiEnabled = false; s.phase = "play";
  s.puck.x = geometry.left + 180; s.puck.y = bottom ? geometry.bottom - s.puck.r : geometry.top + s.puck.r;
  s.player.x = s.puck.x; s.player.y = s.puck.y + (bottom ? -1 : 1) * (s.player.r + s.puck.r - 4);
  s.targetX = s.puck.x; s.targetY = bottom ? geometry.bottom : geometry.top;
  for (let n = 0; n < 2000; n++) { step(s); verify(s, "rail pinning"); }
}
for (const left of [true, false]) {
  const s = createGame(geometry); s.aiEnabled = false; s.phase = "play";
  s.puck.x = left ? geometry.left + 30 : geometry.right - 30;
  s.puck.y = (left ? geometry.goalLeftTop : geometry.goalRightTop) + s.puck.r - .01;
  s.puck.vx = left ? -1050 : 1050;
  for (let n = 0; n < 80; n++) { step(s); verify(s, "post grazing"); }
  assert(s.you + s.computer === 0, "Puck grazes the post rather than scoring through it");
  s.puck.x = left ? geometry.left + 30 : geometry.right - 30;
  s.puck.y = (geometry.top + geometry.bottom) / 2; s.puck.vx = left ? -1050 : 1050; s.puck.vy = 0;
  for (let n = 0; n < 1200; n++) { step(s); verify(s, "conceded serve"); }
  assert(s.you + s.computer === 1);
  assert.equal(s.puck.vx, 0); assert.equal(s.puck.vy, 0);
  assert(left ? s.puck.x < (geometry.left + geometry.right) / 2 : s.puck.x > (geometry.left + geometry.right) / 2);
}
{
  const s = createGame(geometry), x = s.puck.x, y = s.puck.y, old = s.player.y;
  s.targetY = geometry.top;
  for (let n = 0; n < 600; n++) step(s);
  assert.equal(s.puck.x, x); assert.equal(s.puck.y, y); assert(s.player.y < old - 20);
}

function reflected(y: number, low: number, high: number) { const span = high - low; let t = (y - low) % (span * 2); if (t < 0) t += span * 2; return low + (t < span ? t : span * 2 - t); }
function averagePlayer(s: Game, random: () => number, control: { mode: number; error: number }) {
  const { g, puck: p, player: a } = s, mid = (g.left + g.right) / 2, cy = (g.top + g.bottom) / 2;
  const mode = s.phase !== "play" ? 0 : p.vx < -35 ? 1 : p.x < mid + p.r * .9 && Math.hypot(p.vx, p.vy) < 380 ? 2 : 0;
  if (mode !== control.mode) { control.error = (random() - .5) * 170; control.mode = mode; }
  const error = control.error;
  if (s.phase !== "play") { s.targetX = g.left + 110; s.targetY = cy; return; }
  if (p.vx < -35) {
    s.targetX = g.left + 115;
    const time = Math.min(1.25, Math.max(0, (s.targetX - p.x) / p.vx));
    s.targetY = reflected(p.y + p.vy * time, g.top + p.r, g.bottom - p.r) + error;
  } else if (p.x < mid + p.r * .9 && Math.hypot(p.vx, p.vy) < 380) {
    const behind = a.r + p.r + 14;
    const behindY = p.y + (p.y - cy) / Math.max(100, g.right - p.x) * behind;
    s.targetX = p.x - (a.x < p.x - a.r * .65 && Math.abs(a.y - behindY) < a.r * .7 ? -25 : behind);
    s.targetY = behindY + error * .045;
  } else { s.targetX = g.left + 125; s.targetY = cy + (p.y - cy) * .38; }
}
const matches = [];
for (const difficulty of ["easy", "normal", "hard"] as Difficulty[]) {
  let wins = 0, losses = 0, stalled = 0, youGoals = 0, aiGoals = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = createGame(geometry, difficulty, seed * 101), random = rng(seed * 719);
    let reaction = 0; const control = { mode: 0, error: 0 };
    for (let n = 0; n < 240 * 1200 && s.phase !== "over"; n++) {
      if (--reaction <= 0) { reaction = Math.round((.15 + random() * .06) / STEP); averagePlayer(s, random, control); }
      step(s);
    }
    youGoals += s.you; aiGoals += s.computer;
    if (s.phase !== "over") { stalled++; if (stalled <= 2) console.log("Timed-out match", difficulty, seed, { puck: s.puck, player: s.player, ai: s.ai, you: s.you, computer: s.computer }); } else if (s.you === 5) wins++; else losses++;
  }
  matches.push({ difficulty, games: 60, wins, losses, stalled, playerWinRate: roundPercent(wins / Math.max(1, wins + losses)), youGoals, aiGoals });
}
function roundPercent(v: number) { return `${(v * 100).toFixed(1)}%`; }
const report = { stress: { seeds: 20, substepsPerSeed: 200_000, totalSubsteps: 4_000_000, leftGoals, rightGoals, worstOverlapWorldUnits: worstOverlap, worstOverlapDeliveredPixels: worstOverlap * art.table.width / 1000 }, regressions: "rail pinning, post grazing, conceded serves, countdown control: passed", matches, seconds: +((performance.now() - start) / 1000).toFixed(2), caveat: "Scripted player benchmark, not a human playtest or browser frame-rate measurement." };
console.log(JSON.stringify(report, null, 2));
writeFileSync(new URL("./sim-results.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
