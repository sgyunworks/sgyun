// Headless TANKS verification: node --experimental-strip-types scripts/arcade/tanks-sim.mts [seedsPerStage]
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-ignore Node's built-in type stripping resolves the source extension directly.
import { AVERAGE_PLAYER, STAGES, STEP, WORLD_H, WORLD_W, createGame, geometryFromArt, pointBlocked, queueFire, setPlayerInput, setTouchAssist, staticOverlap, step, tankOverlap, type Game, type AiParams } from "../../src/components/arcade/tanksPhysics.ts";

const art = JSON.parse(readFileSync(new URL("../../src/components/arcade/tanks.art.json", import.meta.url), "utf8"));
const g = geometryFromArt(art);
const SEEDS = Number(process.argv[2] ?? 120), LIMIT = 150;
console.log("geometry", { hx: +g.hx.toFixed(2), hy: +g.hy.toFixed(2), pivot: [+g.pivotX.toFixed(2), +g.pivotY.toFixed(2)], capR: +g.capR.toFixed(2), muzzle: +g.muzzle.toFixed(2), shellR: +g.shellR.toFixed(2) });

const bounceSeen = { n: 0 };
let worstStatic = 0, worstTank = 0, checks = 0;
function verify(s: Game, ctx: string) {
  checks++;
  for (const k of s.tanks) {
    assert([k.x, k.y, k.a, k.turret, k.vx, k.vy].every(Number.isFinite), `NaN tank ${ctx}`);
    if (!k.alive) continue;
    const o = staticOverlap(s, k); worstStatic = Math.max(worstStatic, o);
    assert(o <= .05, `tank ${k.id} overlaps static world by ${o} ${ctx}`);
    assert(k.x > 0 && k.x < WORLD_W && k.y > 0 && k.y < WORLD_H, `tank escaped ${ctx}`);
    for (const j of s.tanks) if (j.id > k.id && j.alive) { const t = tankOverlap(s, k, j); worstTank = Math.max(worstTank, t); assert(t <= .05, `tanks ${k.id}/${j.id} overlap ${t} ${ctx}`); }
  }
  for (const sh of s.shells) if (sh.active) {
    assert(Number.isFinite(sh.x) && Number.isFinite(sh.y) && Math.abs(Math.hypot(sh.dx, sh.dy) - 1) < 1e-6, `NaN shell ${ctx}`);
    assert(sh.x >= g.shellR - .02 && sh.x <= WORLD_W - g.shellR + .02 && sh.y >= g.shellR - .02 && sh.y <= WORLD_H - g.shellR + .02, `shell escaped ${ctx}`);
    // Swept collision: a shell centre is never inside an (inflated) obstacle → no tunnelling.
    assert(!pointBlocked(s, sh.x, sh.y, g.shellR - .05), `shell inside obstacle (tunnel) ${ctx}`);
    assert(sh.bounces <= (sh.ricochet ? 1 : 0), `${sh.ricochet ? "ricochet shell bounced twice" : "normal shell bounced"} ${ctx}`);
    assert(sh.ricochet === s.tanks[sh.owner].ricochet && !(sh.owner === 0 && sh.ricochet), `wrong shell kind ${ctx}`);
    if (sh.bounces) (sh.ricochet ? bounceSeen : null)!.n++;
    for (const k of s.tanks) if (k.alive && (sh.armed || sh.owner !== k.id)) {
      const c = Math.cos(k.a), sn = Math.sin(k.a), lx = (sh.x - k.x) * c + (sh.y - k.y) * sn, ly = -(sh.x - k.x) * sn + (sh.y - k.y) * c;
      assert(!(Math.abs(lx) < g.hx + g.shellR - .05 && Math.abs(ly) < g.hy + g.shellR - .05), `shell inside tank ${k.id} (tunnel) ${ctx}`);
    }
  }
}
// Static sanity: spawns are clear, navigation grid connects all spawns.
for (let st = 0; st < STAGES.length; st++) {
  const s = createGame(g, st, 1);
  for (const k of s.tanks) assert(staticOverlap(s, k) === 0, `stage ${st + 1} spawn ${k.id} blocked`);
  // Wall gaps are either a clear lane (> 55, tank width 46) or deliberately closed (< 40), never a trap.
  const okGap = (gap: number) => gap > 55 || gap < 40;
  for (const o of s.obstacles) {
    for (const r of o.rects) assert(okGap(r.x0) && okGap(WORLD_W - r.x1) && okGap(r.y0) && okGap(WORLD_H - r.y1), `stage ${st + 1} ${o.name} leaves a trap gap at a wall`);
    for (const c of o.circles) assert([c.cx - c.r, WORLD_W - c.cx - c.r, c.cy - c.r, WORLD_H - c.cy - c.r].every(okGap), `stage ${st + 1} ${o.name} leaves a trap gap at a wall`);
  }
}
function run(stage: number, seed: number, scripted: AiParams, touch = false) {
  const s = createGame(g, stage, seed * 7919 + stage, scripted);
  if (touch) setTouchAssist(s, true);
  const n = Math.round(LIMIT / STEP);
  for (let i = 0; i < n; i++) {
    step(s); verify(s, `stage=${stage + 1} seed=${seed} t=${s.elapsed.toFixed(3)}`);
    if (s.phase === "won" || s.phase === "lost") break;
  }
  return { s, result: s.phase === "won" ? "win" : s.phase === "lost" ? "loss" : "timeout" };
}
// Fuzz: a human-controlled tank with random keys, random aim and spam-clicking, against live AIs,
// plus point-blank fire while pressed into walls/obstacles (shell must bounce, never tunnel).
let fuzzShots = 0;
for (let stage = 0; stage < STAGES.length; stage++) for (let seed = 1; seed <= 12; seed++) {
  let state = seed * 104729 + stage; const r = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const s = createGame(g, stage, seed);
  let throttle = 0, turn = 0, ax = 600, ay = 300;
  for (let i = 0; i < 60 / STEP; i++) {
    if (i % 90 === 0) { throttle = Math.round(r() * 2 - 1); turn = Math.round(r() * 2 - 1); ax = r() * WORLD_W; ay = r() * WORLD_H; }
    // Every few seconds drive hard into the nearest wall/obstacle and fire into it point-blank.
    if (i % 1500 > 1200) { throttle = 1; turn = 0; const me = s.tanks[0]; ax = me.x + Math.cos(me.a) * 40; ay = me.y + Math.sin(me.a) * 40; }
    setPlayerInput(s, throttle, turn, ax, ay);
    if (i % 37 === 0) { queueFire(s); fuzzShots++; }
    step(s); verify(s, `fuzz stage=${stage + 1} seed=${seed} t=${s.elapsed.toFixed(3)}`);
    if (s.phase === "lost" || s.phase === "won") { if (s.timer <= 0) break; }
  }
}
console.log("fuzz (random keys/aim/spam fire, point-blank wall shots) passed;", fuzzShots, "fire requests");
// Touch stand-in: tap/auto-aim is slower and looser than a mouse.
const TOUCH_PLAYER: AiParams = { ...AVERAGE_PLAYER, reaction: AVERAGE_PLAYER.reaction + .12, aimError: AVERAGE_PLAYER.aimError * 1.4, turretRate: 12 };
// Ricochet rules: stage 1 has none; stage 2 grey only; stage 3 grey + yellow; the player never.
for (let st = 0; st < STAGES.length; st++) {
  const s = createGame(g, st, 1);
  assert.deepEqual(s.tanks.filter(k => k.ricochet).map(k => k.colour), [[], ["grey"], ["grey", "yellow"]][st], `stage ${st + 1} ricochet set`);
}
const start = performance.now(), table: Record<string, unknown>[] = [];
for (let stage = 0; stage < STAGES.length; stage++) {
  for (const [label, params, touch] of [["AI vs AI", STAGES[stage].ai, false], ["average player vs AI", AVERAGE_PLAYER, false], ["touch player vs touch-eased AI", TOUCH_PLAYER, true]] as const) {
    let win = 0, loss = 0, timeout = 0, time = 0, shots = 0, bounces = 0, clashes = 0;
    const seeds = label === "AI vs AI" ? Math.ceil(SEEDS / 3) : SEEDS;
    for (let seed = 1; seed <= seeds; seed++) {
      const { s, result } = run(stage, seed, params, touch);
      if (result === "win") win++; else if (result === "loss") loss++; else timeout++;
      time += s.elapsed; shots += s.stats.shots; bounces += s.stats.bounces; clashes += s.stats.clashes;
    }
    table.push({ stage: stage + 1, matchup: label, games: seeds, slot0WinRate: `${(win / seeds * 100).toFixed(1)}%`, losses: loss, timeouts: timeout, avgSeconds: +(time / seeds).toFixed(1), shotsPerGame: +(shots / seeds).toFixed(1), bouncesPerGame: +(bounces / seeds).toFixed(1), clashes });
  }
}
console.table(table);
console.log({ ricochetBounceSamples: bounceSeen.n, invariantChecks: checks, worstStaticOverlap: +worstStatic.toFixed(4), worstTankOverlap: +worstTank.toFixed(4), seconds: +((performance.now() - start) / 1000).toFixed(1) });
console.log("targets for the average player: ≈75% / 50% / 35%");
