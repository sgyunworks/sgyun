/** TANKS — pure, deterministic simulation (no DOM). World units: arena 1200 × 645. */
export const STEP = 1 / 240;
export const WORLD_W = 1200, WORLD_H = 645;
export const TANK_SPEED = 125, TANK_TURN = 2.6, SHELL_SPEED = 330, FIRE_COOLDOWN = .6, MAX_SHELLS = 3;
export const COUNTDOWN = 3;
export const COLOURS = ["orange", "graphite", "grey", "yellow"] as const;
export type Colour = typeof COLOURS[number];
export type ObstacleName = "block" | "cube" | "device" | "speaker" | "notebook" | "lblock" | "cable";

type FracRect = { x: number; y: number; w: number; h: number };
export type TanksArt = {
  hulls: Record<Colour, { width: number; height: number; body: FracRect; ring: { cx: number; cy: number; r: number } }>;
  turrets: Record<Colour, { width: number; height: number; cap: { cx: number; cy: number; r: number }; tip: { x: number; y: number } }>;
  shell: { width: number; height: number; body: FracRect };
  obstacles: Record<ObstacleName, { width: number; height: number; shape: string; rects?: FracRect[]; circle?: { cx: number; cy: number; r: number } }>;
};
/** Physical design sizes (world units). Everything else is derived from measured art fractions. */
export const HULL_LENGTH = 98, CAP_OVER_RING = 1.3, SHELL_LENGTH = 15;
/** The generated turret's barrel is short for a top-down read; the renderer stretches only the
 *  barrel segment (right of the cap edge) by this factor, and the muzzle follows it exactly. */
export const BARREL_STRETCH = 1.8;
export type Geometry = {
  hx: number; hy: number; pivotX: number; pivotY: number; capR: number; muzzle: number; shellR: number;
  obstacles: Record<ObstacleName, { aspect: number; rects: FracRect[]; circle: { cx: number; cy: number; r: number } | null }>;
};
export function geometryFromArt(a: TanksArt): Geometry {
  const h = a.hulls.orange, t = a.turrets.orange;
  const k = HULL_LENGTH / (h.body.w * h.width); // world units per hull pixel
  const hx = HULL_LENGTH / 2, hy = h.body.h * h.height * k / 2;
  const pivotX = (h.ring.cx - (h.body.x + h.body.w / 2)) * h.width * k, pivotY = (h.ring.cy - (h.body.y + h.body.h / 2)) * h.height * k;
  const capR = h.ring.r * h.width * k * CAP_OVER_RING, kt = capR / (t.cap.r * t.width);
  const muzzle = (t.cap.r + (t.tip.x - t.cap.cx - t.cap.r) * BARREL_STRETCH) * t.width * kt;
  const shellR = SHELL_LENGTH * (a.shell.body.h * a.shell.height) / (a.shell.body.w * a.shell.width) / 2;
  const obstacles = {} as Geometry["obstacles"];
  for (const [name, o] of Object.entries(a.obstacles) as [ObstacleName, TanksArt["obstacles"][ObstacleName]][])
    obstacles[name] = { aspect: o.height / o.width, rects: o.rects ?? [], circle: o.circle ?? null };
  return { hx, hy, pivotX, pivotY, capR, muzzle, shellR, obstacles };
}

// ---------------------------------------------------------------------------------------------
export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type Circle = { cx: number; cy: number; r: number };
/** x, y = sprite centre; w = sprite width (world); flip mirrors horizontally (shadows stay below). */
export type Placement = { name: ObstacleName; x: number; y: number; w: number; flip?: boolean };
export type Obstacle = Placement & { h: number; rects: Rect[]; circles: Circle[] };
export type Spawn = { x: number; y: number; a: number };
/** ricochet: tank ids whose shells bounce once ("ricochet" shells). Everyone else (always the
 *  player) fires normal shells that burst on their first wall/obstacle hit. */
export type StageDef = { obstacles: Placement[]; spawns: Spawn[]; ai: AiParams; ricochet: number[] };
export type AiParams = {
  reaction: number; aimError: number; lead: number; turretRate: number; fireGap: number; maxShells: number;
  dodge: number; dodgeReaction: number; bank: boolean; cover: boolean; speed: number; preferDist: number; playerBias: number;
};
const S = (name: ObstacleName, x: number, y: number, w: number, flip = false): Placement => ({ name, x, y, w, flip });
/** Hand-designed layouts. Stage 1 is point-symmetric, 2 mirror-symmetric, 3 four-corner symmetric-ish. */
export const STAGES: StageDef[] = [
  {
    obstacles: [S("block", 398, 195, 112), S("block", 802, 450, 112), S("device", 600, 102, 142), S("device", 600, 543, 142), S("speaker", 600, 322, 122), S("cube", 225, 352, 63), S("cube", 975, 292, 63)],
    spawns: [{ x: 112, y: 540, a: 0 }, { x: 1088, y: 105, a: Math.PI }], ricochet: [],
    ai: { reaction: .6, aimError: .09, lead: .3, turretRate: 1.5, fireGap: 1.5, maxShells: 1, dodge: .12, dodgeReaction: .6, bank: false, cover: false, speed: .7, preferDist: 390, playerBias: 1 },
  },
  {
    obstacles: [S("notebook", 600, 322, 103), S("lblock", 352, 188, 150, true), S("lblock", 848, 188, 150), S("block", 352, 480, 106), S("block", 848, 480, 106), S("cable", 600, 118, 112), S("device", 600, 580, 139), S("cube", 225, 322, 59), S("cube", 975, 322, 59)],
    spawns: [{ x: 105, y: 555, a: 0 }, { x: 1095, y: 555, a: Math.PI }, { x: 1095, y: 90, a: Math.PI }], ricochet: [2], // grey
    ai: { reaction: .62, aimError: .09, lead: .4, turretRate: 2.2, fireGap: 1.05, maxShells: 2, dodge: .3, dodgeReaction: .42, bank: false, cover: true, speed: .8, preferDist: 360, playerBias: .5 },
  },
  {
    obstacles: [S("speaker", 600, 322, 118), S("lblock", 338, 188, 142, true), S("lblock", 862, 188, 142), S("notebook", 338, 458, 91), S("notebook", 862, 458, 91), S("block", 600, 116, 99), S("device", 600, 543, 133), S("cube", 70, 322, 76), S("cube", 1130, 322, 76)],
    spawns: [{ x: 105, y: 559, a: 0 }, { x: 1095, y: 86, a: Math.PI }, { x: 105, y: 86, a: 0 }, { x: 1095, y: 559, a: Math.PI }], ricochet: [2, 3], // grey, yellow
    ai: { reaction: .65, aimError: .18, lead: .6, turretRate: 2.2, fireGap: 1.2, maxShells: 2, dodge: .35, dodgeReaction: .34, bank: true, cover: true, speed: .88, preferDist: 338, playerBias: 1.3 },
  },
];
/** Touch assist: aiming by tap / auto-aim button is harder than a mouse, so on touch input the
 *  AIs get slightly slower and less accurate. Factors applied to each stage's AiParams:
 *  reaction ×1.25 (later first shot), aimError ×1.3 (wider spread), turretRate ×0.85 (slower
 *  turret), fireGap ×1.15 (fewer shots), dodgeReaction ×1.15 (notice shells later).
 *  Desktop (mouse) play keeps the STAGES numbers unchanged. */
export const TOUCH_AI_FACTORS = { reaction: 1.25, aimError: 1.3, turretRate: .85, fireGap: 1.15, dodgeReaction: 1.15 } as const;
export function touchAi(p: AiParams): AiParams {
  const f = TOUCH_AI_FACTORS;
  return { ...p, reaction: p.reaction * f.reaction, aimError: p.aimError * f.aimError, turretRate: p.turretRate * f.turretRate, fireGap: p.fireGap * f.fireGap, dodgeReaction: p.dodgeReaction * f.dodgeReaction };
}
const TOUCH_STAGE_AI = STAGES.map(d => touchAi(d.ai));
/** Switch the AI brains of a running game between desktop and touch-assist parameters. */
export function setTouchAssist(s: Game, on: boolean) {
  for (const k of s.tanks) if (k.brain && k.id !== PLAYER) k.brain.p = on ? TOUCH_STAGE_AI[s.stage] : STAGES[s.stage].ai;
}
/** The sim's stand-in for an average human: quick mouse aim, imperfect lead, human reaction. */
export const AVERAGE_PLAYER: AiParams = { reaction: .38, aimError: .065, lead: .3, turretRate: 30, fireGap: .7, maxShells: 3, dodge: .45, dodgeReaction: .4, bank: false, cover: false, speed: 1, preferDist: 320, playerBias: 1 };

export function buildObstacles(g: Geometry, list: Placement[]): Obstacle[] {
  return list.map(p => {
    const m = g.obstacles[p.name], h = p.w * m.aspect, left = p.x - p.w / 2, top = p.y - h / 2;
    const fx = (fx: number, fw: number) => p.flip ? left + (1 - fx - fw) * p.w : left + fx * p.w;
    const rects = m.rects.map(r => ({ x0: fx(r.x, r.w), y0: top + r.y * h, x1: fx(r.x, r.w) + r.w * p.w, y1: top + (r.y + r.h) * h }));
    const circles = m.circle ? [{ cx: fx(m.circle.cx, 0), cy: top + m.circle.cy * h, r: m.circle.r * p.w }] : [];
    return { ...p, h, rects, circles };
  });
}

// ---------------------------------------------------------------------------------------------
export type Brain = {
  p: AiParams; target: number; seen: number; clock: number; replan: number; goalX: number; goalY: number; hasGoal: boolean;
  noise: number; lastFire: number; cover: number; bankAngle: number; bankClock: number;
  stuck: number; lastX: number; lastY: number; reverse: number; dodgeX: number; dodgeY: number; dodgeT: number;
  dirX: number; dirY: number; aim: number; ideal: number; field: Int16Array; shellUid: Int32Array; shellSeen: Float32Array; shellDodge: Uint8Array;
};
export type Tank = {
  id: number; colour: Colour; x: number; y: number; a: number; turret: number; alive: boolean; vx: number; vy: number;
  ricochet: boolean; px: number; py: number; pa: number; throttle: number; turn: number; aimX: number; aimY: number; cooldown: number; shells: number;
  odometer: number; brain: Brain | null; killedBy: number; diedAt: number;
};
export type Shell = { active: boolean; ricochet: boolean; uid: number; x: number; y: number; dx: number; dy: number; owner: number; bounces: number; armed: boolean; travel: number };
export type Fx = { active: boolean; x: number; y: number; t: number; dur: number; size: number; rot: number };
export type Phase = "countdown" | "play" | "won" | "lost" | "complete";
export type Game = {
  g: Geometry; stage: number; obstacles: Obstacle[]; tanks: Tank[]; shells: Shell[]; fx: Fx[]; phase: Phase; timer: number; elapsed: number;
  random: number; revision: number; uid: number; fireQueued: number; free: Uint8Array; queue: Int16Array;
  /** Counters for the sim: bounces, shell-shell annihilations, kills. */
  stats: { shots: number; bounces: number; clashes: number; kills: number };
};
const SHELL_POOL = 16, FX_POOL = 24, CELL = 20, GW = Math.ceil(WORLD_W / CELL), GH = Math.ceil(WORLD_H / CELL), NAV_CLEAR = 30;
export const PLAYER = 0;
const NEIGHBOUR = [-1, 1, -GW, GW, -GW - 1, -GW + 1, GW - 1, GW + 1];
function rand(s: Game) { s.random = (Math.imul(s.random, 1664525) + 1013904223) >>> 0; return s.random / 4294967296; }
const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;

function makeBrain(p: AiParams): Brain {
  return { p, target: -1, seen: 0, clock: 0, replan: 0, goalX: 0, goalY: 0, hasGoal: false, noise: 0, lastFire: -9, cover: 0, bankAngle: NaN, bankClock: 0, stuck: 0, lastX: 0, lastY: 0, reverse: 0, dodgeX: 0, dodgeY: 0, dodgeT: 0, dirX: 0, dirY: 0, aim: 0, ideal: 0, field: new Int16Array(GW * GH), shellUid: new Int32Array(SHELL_POOL).fill(-1), shellSeen: new Float32Array(SHELL_POOL), shellDodge: new Uint8Array(SHELL_POOL) };
}
/** scripted = the player tank is also AI-driven (sim only), with the given params. */
export function createGame(g: Geometry, stage: number, seed = 1, scripted: AiParams | null = null): Game {
  const def = STAGES[stage], obstacles = buildObstacles(g, def.obstacles);
  const tanks: Tank[] = def.spawns.map((sp, i) => ({ id: i, colour: COLOURS[i], x: sp.x, y: sp.y, a: sp.a, turret: sp.a, alive: true, ricochet: i !== PLAYER && def.ricochet.includes(i), vx: 0, vy: 0, px: sp.x, py: sp.y, pa: sp.a, throttle: 0, turn: 0, aimX: sp.x + Math.cos(sp.a) * 200, aimY: sp.y, cooldown: 0, shells: 0, odometer: 0, killedBy: -1, diedAt: 0, brain: i === PLAYER ? (scripted ? makeBrain(scripted) : null) : makeBrain(def.ai) }));
  const s: Game = { g, stage, obstacles, tanks, shells: Array.from({ length: SHELL_POOL }, () => ({ active: false, ricochet: false, uid: 0, x: 0, y: 0, dx: 1, dy: 0, owner: 0, bounces: 0, armed: false, travel: 0 })), fx: Array.from({ length: FX_POOL }, () => ({ active: false, x: 0, y: 0, t: 0, dur: 1, size: 1, rot: 0 })), phase: "countdown", timer: COUNTDOWN, elapsed: 0, random: (seed >>> 0) || 1, revision: 0, uid: 1, fireQueued: 0, free: new Uint8Array(GW * GH), queue: new Int16Array(GW * GH), stats: { shots: 0, bounces: 0, clashes: 0, kills: 0 } };
  // Navigation grid: a cell is free when a disc of NAV_CLEAR around its centre touches nothing.
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = (gx + .5) * CELL, y = (gy + .5) * CELL;
    s.free[gy * GW + gx] = x > NAV_CLEAR + 4 && x < WORLD_W - NAV_CLEAR - 4 && y > NAV_CLEAR + 4 && y < WORLD_H - NAV_CLEAR - 4 && !pointBlocked(s, x, y, NAV_CLEAR) ? 1 : 0;
  }
  for (const t of tanks) if (t.brain) { t.brain.lastX = t.x; t.brain.lastY = t.y; t.brain.clock = rand(s) * .1; t.brain.noise = gauss(s) * t.brain.p.aimError; }
  return s;
}
function gauss(s: Game) { return (rand(s) + rand(s) + rand(s) - 1.5) * 1.41; }
export function pointBlocked(s: Game, x: number, y: number, r: number) {
  for (const o of s.obstacles) {
    for (const q of o.rects) { const dx = x - clamp(x, q.x0, q.x1), dy = y - clamp(y, q.y0, q.y1); if (dx * dx + dy * dy < r * r) return true; }
    for (const c of o.circles) if (Math.hypot(x - c.cx, y - c.cy) < c.r + r) return true;
  }
  return false;
}

// ---- Ray casting (shells, line of sight, shot prediction) ------------------------------------
export const hit = { t: 0, nx: 0, ny: 0, kind: 0, tank: -1 }; // kind: 0 none, 1 wall, 2 obstacle, 3 tank
function better(t: number, nx: number, ny: number, kind: number, tank: number) { if (t < hit.t) { hit.t = t; hit.nx = nx; hit.ny = ny; hit.kind = kind; hit.tank = tank; } }
function castBox(x: number, y: number, dx: number, dy: number, x0: number, y0: number, x1: number, y1: number): number {
  // Returns entry t (≥0) or Infinity; sets boxNx/boxNy. A start inside resolves as t=0 with the nearest face.
  if (x > x0 && x < x1 && y > y0 && y < y1) {
    const l = x - x0, r = x1 - x, u = y - y0, d = y1 - y, m = Math.min(l, r, u, d);
    boxNx = m === l ? -1 : m === r ? 1 : 0; boxNy = m === u ? -1 : m === d ? 1 : 0; if (boxNx && boxNy) boxNy = 0;
    return 0;
  }
  let tmin = -Infinity, tmax = Infinity, nx = 0, ny = 0;
  if (Math.abs(dx) < 1e-12) { if (x < x0 || x > x1) return Infinity; }
  else { const a = (x0 - x) / dx, b = (x1 - x) / dx, n = Math.min(a, b), f = Math.max(a, b); if (n > tmin) { tmin = n; nx = dx > 0 ? -1 : 1; ny = 0; } tmax = Math.min(tmax, f); }
  if (Math.abs(dy) < 1e-12) { if (y < y0 || y > y1) return Infinity; }
  else { const a = (y0 - y) / dy, b = (y1 - y) / dy, n = Math.min(a, b), f = Math.max(a, b); if (n > tmin) { tmin = n; ny = dy > 0 ? -1 : 1; nx = 0; } tmax = Math.min(tmax, f); }
  if (tmax < tmin || tmax < 0 || tmin < 0) return Infinity;
  boxNx = nx; boxNy = ny; return tmin;
}
let boxNx = 0, boxNy = 0;
function castCircle(x: number, y: number, dx: number, dy: number, cx: number, cy: number, R: number) {
  const fx = x - cx, fy = y - cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - R * R;
  if (c < 0) { const d = Math.hypot(fx, fy) || 1; boxNx = fx / d; boxNy = fy / d; return 0; }
  if (b > 0) return Infinity;
  const disc = b * b - c; if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc); boxNx = (fx + dx * t) / R; boxNy = (fy + dy * t) / R; return t;
}
/** Earliest hit of a disc (radius r) moving from (x,y) along unit (dx,dy) within maxT. */
export function cast(s: Game, x: number, y: number, dx: number, dy: number, maxT: number, r: number, tanks: boolean, skip: number): boolean {
  hit.t = maxT; hit.kind = 0; hit.tank = -1; hit.nx = 0; hit.ny = 0;
  // Walls (the start is always inside the inflated-inward arena).
  if (dx > 0) better((WORLD_W - r - x) / dx, -1, 0, 1, -1); else if (dx < 0) better((r - x) / dx, 1, 0, 1, -1);
  if (dy > 0) better((WORLD_H - r - y) / dy, 0, -1, 1, -1); else if (dy < 0) better((r - y) / dy, 0, 1, 1, -1);
  if (hit.t < 0) hit.t = 0;
  for (const o of s.obstacles) {
    for (const q of o.rects) { const t = castBox(x, y, dx, dy, q.x0 - r, q.y0 - r, q.x1 + r, q.y1 + r); if (t < hit.t) better(t, boxNx, boxNy, 2, -1); }
    for (const c of o.circles) { const t = castCircle(x, y, dx, dy, c.cx, c.cy, c.r + r); if (t < hit.t) better(t, boxNx, boxNy, 2, -1); }
  }
  if (tanks) for (const k of s.tanks) {
    if (!k.alive || k.id === skip) continue;
    const c = Math.cos(k.a), sn = Math.sin(k.a), lx = (x - k.x) * c + (y - k.y) * sn, ly = -(x - k.x) * sn + (y - k.y) * c;
    const ldx = dx * c + dy * sn, ldy = -dx * sn + dy * c;
    const t = castBox(lx, ly, ldx, ldy, -s.g.hx - r, -s.g.hy - r, s.g.hx + r, s.g.hy + r);
    if (t < hit.t) better(t, boxNx * c - boxNy * sn, boxNx * sn + boxNy * c, 3, k.id);
  }
  return hit.kind !== 0;
}
/** Clear straight line for a shell between two points (obstacles + walls only). */
export function lineClear(s: Game, x0: number, y0: number, x1: number, y1: number) {
  const d = Math.hypot(x1 - x0, y1 - y0); if (d < 1) return true;
  return !cast(s, x0, y0, (x1 - x0) / d, (y1 - y0) / d, d, s.g.shellR, false, -1);
}
function insideTank(s: Game, k: Tank, x: number, y: number, pad: number) {
  const c = Math.cos(k.a), sn = Math.sin(k.a), lx = (x - k.x) * c + (y - k.y) * sn, ly = -(x - k.x) * sn + (y - k.y) * c;
  return Math.abs(lx) < s.g.hx + pad && Math.abs(ly) < s.g.hy + pad;
}
export function pivot(s: Game, k: Tank) { const c = Math.cos(k.a), sn = Math.sin(k.a); pivotX = k.x + s.g.pivotX * c - s.g.pivotY * sn; pivotY = k.y + s.g.pivotX * sn + s.g.pivotY * c; }
export let pivotX = 0, pivotY = 0;
/** Which tank a shell fired now at `angle` would hit first (ignoring motion), or -1. Includes one bounce
 *  only for a ricochet shooter; a normal shell stops at the first wall/obstacle. */
export function predictShot(s: Game, k: Tank, angle: number) {
  pivot(s, k);
  let x = pivotX, y = pivotY, dx = Math.cos(angle), dy = Math.sin(angle), skip = k.id, left = 1700;
  for (let leg = 0, legs = k.ricochet ? 2 : 1; leg < legs; leg++) {
    if (!cast(s, x, y, dx, dy, left, s.g.shellR, true, skip)) return -1;
    if (hit.kind === 3) return hit.tank;
    x += dx * hit.t + hit.nx * .01; y += dy * hit.t + hit.ny * .01; left -= hit.t;
    const dot = dx * hit.nx + dy * hit.ny; dx -= 2 * dot * hit.nx; dy -= 2 * dot * hit.ny;
    skip = -1; // after a bounce the shell can return to its own tank
  }
  return -1;
}

// ---- Tank collision (oriented box vs boxes, discs, walls, tanks) ------------------------------
function satBox(s: Game, k: Tank, q: Rect): boolean {
  const c = Math.cos(k.a), sn = Math.sin(k.a), ex = (q.x1 - q.x0) / 2, ey = (q.y1 - q.y0) / 2, cx = (q.x0 + q.x1) / 2, cy = (q.y0 + q.y1) / 2;
  let best = Infinity, bx = 0, by = 0;
  for (let i = 0; i < 4; i++) {
    const nx = i === 0 ? 1 : i === 1 ? 0 : i === 2 ? c : -sn, ny = i === 0 ? 0 : i === 1 ? 1 : i === 2 ? sn : c;
    const ra = s.g.hx * Math.abs(c * nx + sn * ny) + s.g.hy * Math.abs(-sn * nx + c * ny), rb = ex * Math.abs(nx) + ey * Math.abs(ny);
    const d = (k.x - cx) * nx + (k.y - cy) * ny, o = ra + rb - Math.abs(d);
    if (o <= 0) return false;
    if (o < best) { best = o; bx = d < 0 ? -nx : nx; by = d < 0 ? -ny : ny; }
  }
  k.x += bx * best; k.y += by * best; return true;
}
function discPush(s: Game, k: Tank, cx: number, cy: number, r: number): boolean {
  const c = Math.cos(k.a), sn = Math.sin(k.a), lx = (cx - k.x) * c + (cy - k.y) * sn, ly = -(cx - k.x) * sn + (cy - k.y) * c;
  const qx = clamp(lx, -s.g.hx, s.g.hx), qy = clamp(ly, -s.g.hy, s.g.hy), dx = lx - qx, dy = ly - qy, d = Math.hypot(dx, dy);
  let px: number, py: number;
  if (d > 1e-9) { if (d >= r) return false; px = -dx / d * (r - d); py = -dy / d * (r - d); }
  else { const ox = s.g.hx - Math.abs(lx) + r, oy = s.g.hy - Math.abs(ly) + r; if (ox < oy) { px = lx > 0 ? -ox : ox; py = 0; } else { px = 0; py = ly > 0 ? -oy : oy; } }
  k.x += px * c - py * sn; k.y += px * sn + py * c; return true;
}
function walls(s: Game, k: Tank) {
  const c = Math.abs(Math.cos(k.a)), sn = Math.abs(Math.sin(k.a)), ex = s.g.hx * c + s.g.hy * sn, ey = s.g.hx * sn + s.g.hy * c;
  k.x = clamp(k.x, ex, WORLD_W - ex); k.y = clamp(k.y, ey, WORLD_H - ey);
}
function satTanks(s: Game, a: Tank, b: Tank, apply: boolean): number {
  const ca = Math.cos(a.a), sa = Math.sin(a.a), cb = Math.cos(b.a), sb = Math.sin(b.a), { hx, hy } = s.g;
  let best = Infinity, bx = 0, by = 0;
  for (let i = 0; i < 4; i++) {
    const nx = i === 0 ? ca : i === 1 ? -sa : i === 2 ? cb : -sb, ny = i === 0 ? sa : i === 1 ? ca : i === 2 ? sb : cb;
    const ra = hx * Math.abs(ca * nx + sa * ny) + hy * Math.abs(-sa * nx + ca * ny), rb = hx * Math.abs(cb * nx + sb * ny) + hy * Math.abs(-sb * nx + cb * ny);
    const d = (a.x - b.x) * nx + (a.y - b.y) * ny, o = ra + rb - Math.abs(d);
    if (o <= 0) return 0;
    if (o < best) { best = o; bx = d < 0 ? -nx : nx; by = d < 0 ? -ny : ny; }
  }
  if (apply) { a.x += bx * best / 2; a.y += by * best / 2; b.x -= bx * best / 2; b.y -= by * best / 2; }
  return best;
}
/** Penetration depth of a tank against the static world (0 = clear). Used by the solver and the sim. */
export function staticOverlap(s: Game, k: Tank): number {
  const sx = k.x, sy = k.y; let worst = 0;
  for (const o of s.obstacles) {
    for (const q of o.rects) { if (satBox(s, k, q)) { worst = Math.max(worst, Math.hypot(k.x - sx, k.y - sy)); k.x = sx; k.y = sy; } }
    for (const c of o.circles) { if (discPush(s, k, c.cx, c.cy, c.r)) { worst = Math.max(worst, Math.hypot(k.x - sx, k.y - sy)); k.x = sx; k.y = sy; } }
  }
  walls(s, k); worst = Math.max(worst, Math.hypot(k.x - sx, k.y - sy)); k.x = sx; k.y = sy;
  return worst;
}
export function tankOverlap(s: Game, a: Tank, b: Tank) { return satTanks(s, a, b, false); }
const EPS = .02;
function solve(s: Game) {
  const alive = s.tanks;
  for (let it = 0; it < 4; it++) {
    for (const k of alive) if (k.alive) { for (const o of s.obstacles) { for (const q of o.rects) satBox(s, k, q); for (const c of o.circles) discPush(s, k, c.cx, c.cy, c.r); } }
    for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) if (alive[i].alive && alive[j].alive) satTanks(s, alive[i], alive[j], true);
    for (const k of alive) if (k.alive) walls(s, k);
  }
  // Hard guarantee: any pose still interpenetrating reverts to its last valid pose (sliding
  // already happened above; this only bites in wedged corners). Repeat until stable.
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (const k of alive) if (k.alive && (k.x !== k.px || k.y !== k.py || k.a !== k.pa) && staticOverlap(s, k) > EPS) { k.x = k.px; k.y = k.py; k.a = k.pa; changed = true; }
    for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      if (a.alive && b.alive && satTanks(s, a, b, false) > EPS) { a.x = a.px; a.y = a.py; a.a = a.pa; b.x = b.px; b.y = b.py; b.a = b.pa; changed = true; }
    }
    if (!changed) break;
  }
}

// ---- Firing, shells, effects -----------------------------------------------------------------
function puff(s: Game, x: number, y: number, size: number, dur: number) {
  let f = s.fx[0]; for (const e of s.fx) { if (!e.active) { f = e; break; } if (e.t / e.dur > f.t / f.dur) f = e; }
  f.active = true; f.x = x; f.y = y; f.t = 0; f.dur = dur; f.size = size; f.rot = rand(s) * Math.PI * 2;
}
function fire(s: Game, k: Tank): boolean {
  if (k.cooldown > 0 || k.shells >= (k.brain ? Math.min(MAX_SHELLS, k.brain.p.maxShells) : MAX_SHELLS)) return false;
  let sh: Shell | null = null; for (const e of s.shells) if (!e.active) { sh = e; break; }
  if (!sh) return false;
  pivot(s, k);
  sh.active = true; sh.uid = s.uid++; sh.x = pivotX; sh.y = pivotY; sh.dx = Math.cos(k.turret); sh.dy = Math.sin(k.turret);
  sh.owner = k.id; sh.ricochet = k.ricochet; sh.bounces = 0; sh.armed = false; sh.travel = 0;
  k.cooldown = FIRE_COOLDOWN; k.shells++; s.stats.shots++;
  // The shell starts at the turret pivot (never inside an obstacle) and is swept to the muzzle
  // in the same step, so a barrel poking through a wall still bounces off the wall correctly.
  moveShell(s, sh, s.g.muzzle);
  if (sh.active) puff(s, sh.x, sh.y, 16, .22);
  return true;
}
function kill(s: Game, sh: Shell) { sh.active = false; const o = s.tanks[sh.owner]; o.shells = Math.max(0, o.shells - 1); }
function moveShell(s: Game, sh: Shell, distance: number) {
  let left = distance;
  for (let i = 0; i < 4 && left > 0 && sh.active; i++) {
    const skip = sh.armed ? -1 : sh.owner;
    if (!cast(s, sh.x, sh.y, sh.dx, sh.dy, left, s.g.shellR, true, skip)) { sh.x += sh.dx * left; sh.y += sh.dy * left; sh.travel += left; break; }
    sh.x += sh.dx * hit.t; sh.y += sh.dy * hit.t; sh.travel += hit.t; left -= hit.t;
    if (hit.kind === 3) {
      const victim = s.tanks[hit.tank];
      victim.alive = false; victim.killedBy = sh.owner; victim.diedAt = s.elapsed; s.stats.kills++; s.revision++;
      puff(s, victim.x, victim.y, 120, .9); puff(s, sh.x, sh.y, 40, .4);
      kill(s, sh); return;
    }
    // Normal shells burst on their first wall/obstacle hit; ricochet shells bounce exactly once.
    if (!sh.ricochet || sh.bounces >= 1) { puff(s, sh.x, sh.y, sh.ricochet ? 34 : 26, .3); kill(s, sh); return; }
    sh.bounces++; s.stats.bounces++;
    const dot = sh.dx * hit.nx + sh.dy * hit.ny; sh.dx -= 2 * dot * hit.nx; sh.dy -= 2 * dot * hit.ny;
    const n = Math.hypot(sh.dx, sh.dy); sh.dx /= n; sh.dy /= n;
    sh.x += hit.nx * .01; sh.y += hit.ny * .01;
    puff(s, sh.x, sh.y, 18, .2);
  }
  const owner = s.tanks[sh.owner];
  if (!sh.armed && (!owner.alive || !insideTank(s, owner, sh.x, sh.y, s.g.shellR + .5))) sh.armed = true;
}

// ---- AI --------------------------------------------------------------------------------------
function cellOf(x: number, y: number) { return clamp(Math.floor(y / CELL), 0, GH - 1) * GW + clamp(Math.floor(x / CELL), 0, GW - 1); }
function flow(s: Game, b: Brain, gx: number, gy: number) {
  const f = b.field, q = s.queue; f.fill(32767);
  let goal = cellOf(gx, gy);
  if (!s.free[goal]) { // snap the goal to the nearest free cell
    let bestD = Infinity; for (let i = 0; i < f.length; i++) if (s.free[i]) { const d = Math.hypot((i % GW + .5) * CELL - gx, (Math.floor(i / GW) + .5) * CELL - gy); if (d < bestD) { bestD = d; goal = i; } }
  }
  let head = 0, tail = 0; f[goal] = 0; q[tail++] = goal;
  while (head < tail) {
    const c = q[head++], x = c % GW, y = (c - x) / GW, d = f[c] + 1;
    if (x > 0 && s.free[c - 1] && f[c - 1] > d) { f[c - 1] = d; q[tail++] = c - 1; }
    if (x < GW - 1 && s.free[c + 1] && f[c + 1] > d) { f[c + 1] = d; q[tail++] = c + 1; }
    if (y > 0 && s.free[c - GW] && f[c - GW] > d) { f[c - GW] = d; q[tail++] = c - GW; }
    if (y < GH - 1 && s.free[c + GW] && f[c + GW] > d) { f[c + GW] = d; q[tail++] = c + GW; }
  }
}
/** Pick a waypoint a few cells downhill in the flow field; writes b.dirX/dirY (unit or 0). */
function steer(s: Game, k: Tank, b: Brain) {
  const f = b.field; let c = cellOf(k.x, k.y);
  if (f[c] === 32767) { // standing on a blocked cell (hugging an obstacle): use the best nearby cell
    let best = 32767; const cx = c % GW, cy = (c - cx) / GW;
    for (let y = Math.max(0, cy - 3); y <= Math.min(GH - 1, cy + 3); y++) for (let x = Math.max(0, cx - 3); x <= Math.min(GW - 1, cx + 3); x++) if (f[y * GW + x] < best) { best = f[y * GW + x]; c = y * GW + x; }
    if (best === 32767) { b.dirX = 0; b.dirY = 0; return; }
  }
  for (let i = 0; i < 4; i++) {
    const x = c % GW, y = (c - x) / GW; let n = c;
    for (let o = 0; o < 8; o++) {
      const m = c + NEIGHBOUR[o], mx = m % GW; if (m < 0 || m >= f.length || Math.abs(mx - x) > 1) continue;
      if (Math.abs(mx - x) === 1 && Math.abs(Math.floor(m / GW) - y) === 1 && (!s.free[y * GW + mx] || !s.free[Math.floor(m / GW) * GW + x])) continue;
      if (f[m] < f[n]) n = m;
    }
    if (n === c) break; c = n;
  }
  let tx = (c % GW + .5) * CELL, ty = (Math.floor(c / GW) + .5) * CELL;
  if (f[c] === 0) { tx = b.goalX; ty = b.goalY; }
  const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy);
  if (d < 14) { b.dirX = 0; b.dirY = 0; return; }
  b.dirX = dx / d; b.dirY = dy / d;
}
function chooseGoal(s: Game, k: Tank, b: Brain, target: Tank | null) {
  let bestS = -Infinity, bx = k.x, by = k.y;
  for (let i = 0; i < 16; i++) {
    const x = i === 0 ? k.x : clamp(k.x + (rand(s) - .5) * 600, 40, WORLD_W - 40), y = i === 0 ? k.y : clamp(k.y + (rand(s) - .5) * 600, 40, WORLD_H - 40);
    if (!s.free[cellOf(x, y)]) continue;
    let sc = -Math.hypot(x - k.x, y - k.y) / 520 + rand(s) * .35;
    if (target) {
      const d = Math.hypot(x - target.x, y - target.y), los = lineClear(s, x, y, target.x, target.y);
      sc -= Math.abs(d - b.p.preferDist) / 240;
      if (b.cover > 0) sc += los ? -1.6 : .6; else sc += los ? 1 : 0;
      if (b.p.cover) for (const o of s.tanks) if (o.alive && o !== k && o !== target && lineClear(s, x, y, o.x, o.y)) sc -= .35;
    }
    if (sc > bestS) { bestS = sc; bx = x; by = y; }
  }
  b.goalX = bx; b.goalY = by; b.hasGoal = true; flow(s, b, bx, by);
}
function think(s: Game, k: Tank, b: Brain, dt: number) {
  const p = b.p;
  // Target: nearest enemy, visible ones preferred, mild bias towards the player; hysteresis.
  let best = -1, bestScore = Infinity, cur = Infinity;
  for (const o of s.tanks) {
    if (!o.alive || o === k) continue;
    const vis = lineClear(s, k.x, k.y, o.x, o.y), sc = Math.hypot(o.x - k.x, o.y - k.y) * (vis ? .6 : 1) * (o.id === PLAYER ? p.playerBias : 1);
    if (o.id === b.target) cur = sc;
    if (sc < bestScore) { bestScore = sc; best = o.id; }
  }
  if (b.target < 0 || !s.tanks[b.target].alive || bestScore < cur * .8) { if (b.target !== best) b.seen = 0; b.target = best; }
  const target = best >= 0 && b.target >= 0 ? s.tanks[b.target] : null;
  pivot(s, k); const ox = pivotX, oy = pivotY;
  const visible = !!target && lineClear(s, ox, oy, target.x, target.y);
  b.seen = visible ? (s.phase === "play" ? b.seen + dt : 0) : 0; // reaction time starts at GO
  b.cover = Math.max(0, b.cover - dt);

  // Aim: lead a moving target by the shell time of flight, plus a per-shot human-like error.
  if (target) {
    const d = Math.hypot(target.x - ox, target.y - oy), tof = d / SHELL_SPEED;
    const ax = target.x + target.vx * tof * p.lead, ay = target.y + target.vy * tof * p.lead;
    b.ideal = Math.atan2(ay - oy, ax - ox); b.aim = b.ideal + b.noise;
    if (!visible && p.bank && k.ricochet) { // only ricochet shooters plan bounce shots
      b.bankClock -= dt;
      if (b.bankClock <= 0) {
        b.bankClock = .3; b.bankAngle = NaN; let bestTurn = Infinity;
        for (let i = 0; i < 72; i++) {
          const ang = i / 72 * Math.PI * 2, who = predictShot(s, k, ang);
          if (who === b.target) { const t = Math.abs(wrap(ang - k.turret)); if (t < bestTurn) { bestTurn = t; b.bankAngle = ang; } }
        }
      }
      if (b.bankAngle === b.bankAngle) { b.ideal = b.bankAngle; b.aim = b.bankAngle + b.noise * .5; }
    } else b.bankAngle = NaN;
  }

  // Dodge: decide once per shell (after a reaction delay) whether this pilot notices it.
  b.dodgeT = Math.max(0, b.dodgeT - dt);
  for (let i = 0; i < s.shells.length; i++) {
    const sh = s.shells[i];
    if (!sh.active || (sh.owner === k.id && !sh.armed)) continue;
    if (b.shellUid[i] !== sh.uid) { b.shellUid[i] = sh.uid; b.shellSeen[i] = 0; b.shellDodge[i] = rand(s) < p.dodge ? 1 : 0; }
    b.shellSeen[i] += dt;
    if (!b.shellDodge[i] || b.shellSeen[i] < p.dodgeReaction) continue;
    const rx = k.x - sh.x, ry = k.y - sh.y, along = rx * sh.dx + ry * sh.dy, side = rx * -sh.dy + ry * sh.dx;
    if (along > 0 && along < SHELL_SPEED * 1.1 && Math.abs(side) < s.g.hx + 16) {
      const sg = side >= 0 ? 1 : -1; b.dodgeX = -sh.dy * sg; b.dodgeY = sh.dx * sg; b.dodgeT = .3;
    }
  }

  // Movement goal.
  b.replan -= dt;
  const moved = Math.hypot(k.x - b.lastX, k.y - b.lastY);
  b.stuck = Math.abs(k.throttle) > .3 && moved < Math.abs(k.throttle) * TANK_SPEED * dt * .25 ? b.stuck + dt : 0;
  b.lastX = k.x; b.lastY = k.y;
  b.reverse = Math.max(0, b.reverse - dt);
  if (b.stuck > .7) { b.stuck = 0; b.reverse = .45; b.replan = 0; }
  if (b.replan <= 0 || (b.hasGoal && Math.hypot(b.goalX - k.x, b.goalY - k.y) < 24)) { b.replan = .55 + rand(s) * .3; chooseGoal(s, k, b, target); }
  steer(s, k, b);
}
/** Converts a desired world direction into tank controls (rotate, then drive; reverse if behind). */
function drive(k: Tank, dx: number, dy: number, speed: number) {
  if (!dx && !dy) { k.throttle = 0; k.turn = 0; return; }
  let diff = wrap(Math.atan2(dy, dx) - k.a), dir = 1;
  if (Math.abs(diff) > 1.9) { diff = wrap(diff + Math.PI); dir = -1; }
  k.turn = clamp(diff * 3, -1, 1);
  k.throttle = dir * speed * (Math.abs(diff) < .45 ? 1 : Math.abs(diff) < 1 ? .35 : 0);
}
function control(s: Game, k: Tank, b: Brain) {
  if (s.phase === "countdown" && k.id !== PLAYER) { k.throttle = 0; k.turn = 0; } // AIs hold position until GO
  else if (b.dodgeT > 0) drive(k, b.dodgeX, b.dodgeY, b.p.speed);
  else if (b.reverse > 0) { k.throttle = -b.p.speed; k.turn = .6; }
  else drive(k, b.dirX, b.dirY, b.p.speed);
  // Turret: rate-limited towards the aim.
  const d = wrap(b.aim - k.turret), m = b.p.turretRate * STEP;
  k.turret = wrap(k.turret + clamp(d, -m, m));
}
function tryAiFire(s: Game, k: Tank, b: Brain) {
  if (s.phase !== "play" || b.target < 0 || s.elapsed - b.lastFire < b.p.fireGap) return;
  if (Math.abs(wrap(b.aim - k.turret)) > .05) return;
  const bank = b.bankAngle === b.bankAngle;
  if (bank ? s.elapsed - COUNTDOWN < b.p.reaction + .4 : b.seen < b.p.reaction) return;
  // The pilot judges the shot by its intended line; the turret carries its aim error.
  const who = predictShot(s, k, b.ideal);
  if (who < 0 || who === k.id || predictShot(s, k, k.turret) === k.id) return; // never a shot back into itself
  if (fire(s, k)) { b.lastFire = s.elapsed; b.noise = gauss(s) * b.p.aimError; if (b.p.cover) { b.cover = 1.1; b.replan = 0; } }
}

// ---- Step -----------------------------------------------------------------------------------
/** Player intent from the UI. throttle/turn ∈ [-1,1]; aim is a world point; fireQueued>0 = buffered click. */
export function setPlayerInput(s: Game, throttle: number, turn: number, aimX: number, aimY: number) {
  const p = s.tanks[PLAYER]; p.throttle = clamp(throttle, -1, 1); p.turn = clamp(turn, -1, 1); p.aimX = aimX; p.aimY = aimY;
}
export function queueFire(s: Game) { if (s.phase === "play") s.fireQueued = .15; }
export function step(s: Game, dt = STEP) {
  s.elapsed += dt;
  if (s.phase === "countdown") { s.timer -= dt; if (s.timer <= 0) { s.phase = "play"; s.timer = 0; s.revision++; } }
  else if (s.phase === "won" || s.phase === "lost") s.timer = Math.max(0, s.timer - dt);
  for (const e of s.fx) if (e.active) { e.t += dt; if (e.t >= e.dur) e.active = false; }
  if (s.phase === "complete") return;
  // AI thinks at 30 Hz; steering and turret run every step.
  for (const k of s.tanks) {
    if (!k.alive) continue;
    k.cooldown = Math.max(0, k.cooldown - dt);
    const b = k.brain;
    if (b) {
      b.clock -= dt;
      if (b.clock <= 0) { think(s, k, b, 1 / 30 - b.clock); b.clock += 1 / 30; }
      control(s, k, b);
      tryAiFire(s, k, b);
    } else {
      // Direct 1:1 control: turret points exactly at the pointer.
      pivot(s, k); k.turret = Math.atan2(k.aimY - pivotY, k.aimX - pivotX);
      if (s.fireQueued > 0) { if (s.phase !== "play") s.fireQueued = 0; else if (fire(s, k)) s.fireQueued = 0; else s.fireQueued -= dt; }
    }
  }
  for (const k of s.tanks) {
    k.px = k.x; k.py = k.y; k.pa = k.a;
    if (!k.alive) continue;
    k.a = wrap(k.a + k.turn * TANK_TURN * dt);
    const v = k.throttle * TANK_SPEED;
    k.x += Math.cos(k.a) * v * dt; k.y += Math.sin(k.a) * v * dt;
  }
  solve(s);
  for (const k of s.tanks) {
    if (!k.alive) { k.vx = 0; k.vy = 0; continue; }
    const vx = (k.x - k.px) / dt, vy = (k.y - k.py) / dt;
    k.vx += (vx - k.vx) * .1; k.vy += (vy - k.vy) * .1; // smoothed, for AI lead only
    k.odometer += Math.hypot(k.x - k.px, k.y - k.py);
  }
  if (s.phase === "play" || s.phase === "won" || s.phase === "lost") {
    for (const sh of s.shells) if (sh.active) moveShell(s, sh, SHELL_SPEED * dt);
    for (let i = 0; i < s.shells.length; i++) {
      const a = s.shells[i]; if (!a.active) continue;
      for (let j = i + 1; j < s.shells.length; j++) {
        const b = s.shells[j]; if (!b.active) continue;
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (2 * s.g.shellR) ** 2) { puff(s, (a.x + b.x) / 2, (a.y + b.y) / 2, 30, .3); kill(s, a); kill(s, b); s.stats.clashes++; break; }
      }
    }
  }
  if (s.phase === "play") {
    const player = s.tanks[PLAYER];
    let others = 0; for (const k of s.tanks) if (k.alive && k.id !== PLAYER) others++;
    if (!player.alive) { s.phase = "lost"; s.timer = 1.2; s.revision++; }
    else if (others === 0) { s.phase = "won"; s.timer = 2.2; s.revision++; }
  }
}
export function aliveCount(s: Game) { let n = 0; for (const k of s.tanks) if (k.alive) n++; return n; }
