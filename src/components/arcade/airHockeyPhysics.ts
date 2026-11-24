/** Pure simulation. Units are image pixels at a table width of 1000. */
export const STEP = 1 / 240;
export type Difficulty = "easy" | "normal" | "hard";
export type Body = { x: number; y: number; vx: number; vy: number; r: number };
export type Geometry = { width: number; height: number; left: number; right: number; top: number; bottom: number; goalLeftTop: number; goalLeftBottom: number; goalRightTop: number; goalRightBottom: number; corner: number; malletRadius: number; puckRadius: number };
export type ArtGeometry = { table: { width: number; height: number; inner: { x: number; y: number; w: number; h: number }; goals: { left: { top: number; bottom: number }; right: { top: number; bottom: number } }; cornerRadius: number }; pieces: { malletDiameter: number; puckDiameter: number } };
export function geometryFromArt(a: ArtGeometry): Geometry {
  const h = 1000 * a.table.height / a.table.width;
  const b = a.table.inner;
  return { width: 1000, height: h, left: b.x * 1000, right: (b.x + b.w) * 1000, top: b.y * h, bottom: (b.y + b.h) * h, goalLeftTop: a.table.goals.left.top * h, goalLeftBottom: a.table.goals.left.bottom * h, goalRightTop: a.table.goals.right.top * h, goalRightBottom: a.table.goals.right.bottom * h, corner: a.table.cornerRadius * 1000, malletRadius: a.pieces.malletDiameter * 500, puckRadius: a.pieces.puckDiameter * 500 };
}
export type Game = { g: Geometry; player: Body; ai: Body; puck: Body; targetX: number; targetY: number; aiX: number; aiY: number; aiClock: number; aiMode: number; aim: number; difficulty: Difficulty; random: number; you: number; computer: number; phase: "countdown" | "play" | "goal" | "over"; timer: number; elapsed: number; conceded: number; goalSide: number; revision: number; aiEnabled: boolean };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function random(s: Game) { s.random = (Math.imul(s.random, 1664525) + 1013904223) >>> 0; return s.random / 4294967296; }
const settings = { easy: { delay: .26, error: 260, speed: 350, omega: 12 }, normal: { delay: .2, error: 190, speed: 470, omega: 14 }, hard: { delay: .095, error: 145, speed: 720, omega: 20 } };
export function createGame(g: Geometry, difficulty: Difficulty = "normal", seed = 1): Game {
  const cy = (g.top + g.bottom) / 2, mid = (g.left + g.right) / 2;
  return { g, player: { x: g.left + (mid - g.left) * .35, y: cy, vx: 0, vy: 0, r: g.malletRadius }, ai: { x: g.right - (g.right - mid) * .35, y: cy, vx: 0, vy: 0, r: g.malletRadius }, puck: { x: g.left + (mid - g.left) * .63, y: cy, vx: 0, vy: 0, r: g.puckRadius }, targetX: g.left + (mid - g.left) * .35, targetY: cy, aiX: g.right - 100, aiY: cy, aiClock: 0, aiMode: 0, aim: 0, difficulty, random: seed >>> 0, you: 0, computer: 0, phase: "countdown", timer: 3, elapsed: 0, conceded: 0, goalSide: 0, revision: 0, aiEnabled: true };
}
function cap(b: Body, max: number) { const speed = Math.hypot(b.vx, b.vy); if (speed > max) { b.vx *= max / speed; b.vy *= max / speed; } }
/** Exact critically damped spring solution, followed by a bounded displacement. */
function follow(b: Body, x: number, y: number, omega: number, speed: number, dt: number) {
  const decay = Math.exp(-omega * dt), dx = b.x - x, dy = b.y - y;
  const cx = b.vx + omega * dx, cy = b.vy + omega * dy;
  const nx = x + (dx + cx * dt) * decay, ny = y + (dy + cy * dt) * decay;
  b.vx = (nx - b.x) / dt; b.vy = (ny - b.y) / dt; cap(b, speed);
  b.x += b.vx * dt; b.y += b.vy * dt;
}
function confineMallet(b: Body, g: Geometry, player: boolean) {
  const mid = (g.left + g.right) / 2;
  b.x = clamp(b.x, player ? g.left + b.r : mid + b.r, player ? mid - b.r : g.right - b.r);
  b.y = clamp(b.y, g.top + b.r, g.bottom - b.r);
  roundedCorner(b, g, false);
}
function roundedCorner(b: Body, g: Geometry, bounce: boolean) {
  const cr = g.corner, cx = clamp(b.x, g.left + cr, g.right - cr), cy = clamp(b.y, g.top + cr, g.bottom - cr);
  if (b.x === cx || b.y === cy) return;
  const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), limit = Math.max(1, cr - b.r);
  if (d <= limit) return;
  const nx = dx / d, ny = dy / d;
  b.x = cx + nx * limit; b.y = cy + ny * limit;
  const v = b.vx * nx + b.vy * ny;
  if (bounce && v > 0) { b.vx -= 1.9 * v * nx; b.vy -= 1.9 * v * ny; }
}
export function insideMouth(s: Game, left: boolean) {
  const { g, puck: p } = s;
  return p.y >= (left ? g.goalLeftTop : g.goalRightTop) + p.r && p.y <= (left ? g.goalLeftBottom : g.goalRightBottom) - p.r;
}
function rails(s: Game) {
  const { puck: p, g } = s;
  if (p.y < g.top + p.r) { p.y = g.top + p.r; p.vy = Math.abs(p.vy) * .9; }
  if (p.y > g.bottom - p.r) { p.y = g.bottom - p.r; p.vy = -Math.abs(p.vy) * .9; }
  if (!insideMouth(s, true) && p.x < g.left + p.r) { p.x = g.left + p.r; p.vx = Math.abs(p.vx) * .9; }
  if (!insideMouth(s, false) && p.x > g.right - p.r) { p.x = g.right - p.r; p.vx = -Math.abs(p.vx) * .9; }
  roundedCorner(p, g, true);
}
function collide(s: Game, b: Body, isPlayer: boolean, active: boolean) {
  const p = s.puck, rr = p.r + b.r + .001;
  let dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
  if (d >= rr) return;
  if (d < .000001) { dx = isPlayer ? 1 : -1; dy = 0; d = 1; }
  const nx = dx / d, ny = dy / d;
  if (active) {
    const rel = (p.vx - b.vx) * nx + (p.vy - b.vy) * ny;
    if (rel < 0) { p.vx -= 1.92 * rel * nx; p.vy -= 1.92 * rel * ny; }
    p.x = b.x + nx * rr; p.y = b.y + ny * rr;
    rails(s);
  }
  // If the rail prevents separation, push the mallet back, never the puck through a rail.
  dx = p.x - b.x; dy = p.y - b.y; d = Math.hypot(dx, dy);
  if (d < rr) { b.x = p.x - nx * rr; b.y = p.y - ny * rr; b.vx = 0; b.vy = 0; }
}
function reflect(y: number, lo: number, hi: number) { const span = hi - lo; let t = (y - lo) % (2 * span); if (t < 0) t += 2 * span; return lo + (t <= span ? t : 2 * span - t); }
export function updateAI(s: Game, dt: number) {
  const { g, puck: p, ai: a } = s, cfg = settings[s.difficulty], mid = (g.left + g.right) / 2;
  s.aiClock -= dt;
  if (s.aiClock > 0) return;
  s.aiClock = cfg.delay * (.9 + random(s) * .2);
  const speed = Math.hypot(p.vx, p.vy), cy = (g.top + g.bottom) / 2;
  const mode = s.phase !== "play" ? 0 : p.vx > 35 ? 1 : p.x > mid - p.r * .9 && speed < 380 ? 2 : 0;
  // A stable per-shot error prevents perfect saves without frame-to-frame jitter.
  if (mode !== s.aiMode) { s.aim = (random(s) - .5) * cfg.error; s.aiMode = mode; }
  if (s.phase !== "play") { s.aiX = g.right - 115; s.aiY = cy; return; }
  if (p.vx > 35) {
    s.aiX = g.right - 115;
    const t = Math.min(1.25, Math.max(0, (s.aiX - p.x) / p.vx));
    s.aiY = reflect(p.y + p.vy * t, g.top + p.r, g.bottom - p.r) + s.aim;
  } else if (p.x > mid - p.r * .9 && speed < 380) {
    // Approach from behind, then strike towards the opposing goal with a varied angle.
    const behind = a.r + p.r + 14;
    const behindY = p.y + (p.y - cy) / Math.max(100, p.x - g.left) * behind;
    s.aiX = p.x + (a.x > p.x + a.r * .65 && Math.abs(a.y - behindY) < a.r * .7 ? -25 : behind);
    s.aiY = behindY + s.aim * .045;
  } else { s.aiX = g.right - 125; s.aiY = cy + (p.y - cy) * .38; }
  s.aiX = clamp(s.aiX, mid + a.r, g.right - a.r - 6);
  s.aiY = clamp(s.aiY, g.top + a.r + 15, g.bottom - a.r - 15);
}
function serve(s: Game) {
  const { g, puck: p } = s, mid = (g.left + g.right) / 2;
  p.x = s.conceded === 0 ? g.left + (mid - g.left) * .63 : g.right - (g.right - mid) * .63;
  p.y = (g.top + g.bottom) / 2; p.vx = 0; p.vy = 0;
  collide(s, s.player, true, false); collide(s, s.ai, false, false);
  s.phase = "countdown"; s.timer = 3; s.revision++;
}
function score(s: Game, left: boolean) {
  if (left) s.computer++; else s.you++;
  s.conceded = left ? 0 : 1; s.goalSide = left ? -1 : 1;
  s.puck.vx = 0; s.puck.vy = 0; s.timer = 1;
  s.phase = s.you === 7 || s.computer === 7 ? "over" : "goal"; s.revision++;
}
export function step(s: Game, dt = STEP) {
  s.elapsed += dt;
  if (s.phase === "over") { s.timer = Math.max(0, s.timer - dt); return; }
  if (s.aiEnabled) updateAI(s, dt);
  const { g, player: a, ai: b, puck: p } = s, cfg = settings[s.difficulty];
  // Targets are also bounded, so an off-table pointer never winds up the spring.
  const mid = (g.left + g.right) / 2;
  follow(a, clamp(s.targetX, g.left + a.r, mid - a.r), clamp(s.targetY, g.top + a.r, g.bottom - a.r), 95, 6000, dt); // near 1:1 with the pointer (no perceptible lag)
  follow(b, s.aiX, s.aiY, cfg.omega, cfg.speed, dt);
  confineMallet(a, g, true); confineMallet(b, g, false);
  if (s.phase === "goal") { s.timer -= dt; if (s.timer <= 0) serve(s); return; }
  if (s.phase === "countdown") {
    collide(s, a, true, false); collide(s, b, false, false);
    s.timer -= dt;
    if (s.timer <= 0) { s.phase = "play"; s.timer = .45; s.revision++; }
    return;
  }
  s.timer = Math.max(0, s.timer - dt);
  cap(p, 1050);
  // At the bounded speeds, each substep travels < 1/3 of a puck radius.
  // Four spatial subdivisions also cover relative mallet motion at maximum speed.
  for (let i = 0; i < 4; i++) {
    p.x += p.vx * dt / 4; p.y += p.vy * dt / 4;
    rails(s);
    for (let j = 0; j < 3; j++) { collide(s, a, true, true); collide(s, b, false, true); rails(s); }
    cap(p, 1050);
    if (insideMouth(s, true) && p.x < g.left - p.r) { score(s, true); return; }
    if (insideMouth(s, false) && p.x > g.right + p.r) { score(s, false); return; }
  }
  const friction = Math.exp(-.045 * dt); p.vx *= friction; p.vy *= friction;
}
