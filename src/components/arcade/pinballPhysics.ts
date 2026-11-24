/**
 * Pinball simulation. Pure TypeScript, no DOM, deterministic for a given seed.
 * Units: the delivered table image is 1000 units wide (y uses the same scale).
 *
 * Collision layers follow the moulded art:
 *  - FLOOR: the playfield (rim/plate crease, wire guides, posts, slingshots, bumpers, flippers)
 *  - PLATE: the raised rim plate around the arch (the launch orbit, bounded by the outer lip)
 *  - SLOT:  the recessed plunger channel
 * A launched ball rises out of the slot onto the plate, orbits the arch and drops onto the
 * playfield wherever the plate edge is clear (header edge, upper-left lane).
 *
 * Continuous collision: every 1/240 s step is split into micro-steps so that neither the ball
 * nor the fastest flipper point moves more than 3 units per micro-step, which is far below the
 * thinnest collider half-thickness (ball radius ~20 units). Contacts are resolved at each
 * micro-step against the moving flipper surface, so nothing can tunnel.
 */
export const STEP = 1 / 240;
export const FLOOR = 1, PLATE = 2, SLOT = 4;
const G = 2350;                 // table-plane gravity (units/s²)
const MAX_SPEED = 5200;
const FLIP_UP = .06, FLIP_DOWN = .085;
const REST_DEG = 27, UP_DEG = -30;
const E_WALL = .4, E_WIRE = .5, E_POST = .6, E_FLIP = .28, E_SLING = .5;
const BUMPER_KICK = 1050, SLING_KICK = 900;
export const LAUNCH_MIN = 2450, LAUNCH_MAX = 3450;
const SAVER_TIME = 5, STUCK_TIME = 3;
export const BALLS = 3;

type Pt = [number, number];
type ArtLight = { x: number; y: number; r: number };
export type PinballArt = {
  table: { width: number; height: number };
  floor: Pt[]; lip: Pt[];
  slot: { left: number; right: number; top: number; bottom: number };
  lcd: { x: number; y: number; w: number; h: number };
  posts: ArtLight[];
  wires: Record<string, { r: number; points: Pt[] }>;
  slings: { a: Pt; b: Pt; c: Pt }[];
  laneLights: ArtLight[]; targetLights: ArtLight[];
  design: { midX: number; ballR: number; bumperR: number; bumpers: { x: number; y: number }[]; flipperLength: number; flippers: { x: number; y: number }[]; flipperBaseR: number; flipperTipR: number };
  sprites: { plunger: { rodTop: Pt; springTop: number; knobTop: number; knobBottom: number; springWidth: number; knobWidth: number; width: number; height: number } };
};

export type Seg = { ax: number; ay: number; bx: number; by: number; r: number; layers: number; kind: number; e: number; index: number };
export const WALL = 0, WIRE = 1, SLING = 2, CREASE = 3, POST = 4, BUMPER = 5;
export type Circle = { x: number; y: number; r: number; layers: number; kind: number; index: number };
export type Geometry = {
  width: number; height: number; ballR: number;
  segs: Seg[]; circles: Circle[];
  grid: { cell: number; cols: number; rows: number; segs: Int32Array[]; circles: Int32Array[] };
  floorPoly: Float64Array; lipPoly: Float64Array;
  slot: { left: number; right: number; top: number; bottom: number };
  bumpers: { x: number; y: number; r: number }[];
  flippers: { px: number; py: number; side: number; L: number; r0: number; r1: number }[];
  laneLights: { x: number; y: number; r: number }[]; targetLights: { x: number; y: number; r: number }[];
  plunger: { x: number; restTip: number; pullMax: number; knobBottom: number; scale: number };
  lcd: { x: number; y: number; w: number; h: number };
  drainY: number; pivotY: number; midX: number;
};

export function pointInPoly(poly: Float64Array, x: number, y: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function segDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
export function polyDistance(poly: Float64Array, x: number, y: number) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) d = Math.min(d, segDistance(x, y, poly[j], poly[j + 1], poly[i], poly[i + 1]));
  return d;
}

export function geometryFromArt(a: PinballArt): Geometry {
  const W = 1000, H = 1000 * a.table.height / a.table.width;
  const X = (f: number) => f * W, Y = (f: number) => f * H, R = (f: number) => f * W;
  const P = (p: Pt): Pt => [X(p[0]), Y(p[1])];
  const ballR = R(a.design.ballR);
  const segs: Seg[] = [], circles: Circle[] = [];
  const add = (p: Pt, q: Pt, r: number, layers: number, kind: number, e: number, index = 0) => segs.push({ ax: p[0], ay: p[1], bx: q[0], by: q[1], r, layers, kind, e, index });
  const slot = { left: X(a.slot.left), right: X(a.slot.right), top: Y(a.slot.top), bottom: Y(a.slot.bottom) };

  // Floor boundary loop. Its upper part (above the slot top) is the plate crease.
  const floor = a.floor.map(P);
  const floorPoly = new Float64Array(floor.flat());
  let area = 0; for (let i = 0; i < floor.length; i++) { const p = floor[i], q = floor[(i + 1) % floor.length]; area += p[0] * q[1] - q[0] * p[1]; }
  const orient = area > 0 ? 1 : -1; // with y down, area>0 = clockwise on screen
  const leftX = Math.min(...floor.map(p => p[0])), rightX = Math.max(...floor.map(p => p[0]));
  const splitY = slot.top - 12;
  const creaseCandidates: { p: Pt; q: Pt }[] = [];
  for (let i = 0; i < floor.length; i++) {
    let p = floor[i], q = floor[(i + 1) % floor.length];
    // split the long right wall at the slot top so the plate keeps a solid inner wall above it
    if ((p[1] - splitY) * (q[1] - splitY) < 0 && Math.abs(p[0] - q[0]) < 2) {
      const m: Pt = [p[0] + (q[0] - p[0]) * (splitY - p[1]) / (q[1] - p[1]), splitY];
      const upper = p[1] < q[1] ? [p, m] : [m, q], lower = p[1] < q[1] ? [m, q] : [p, m];
      creaseCandidates.push({ p: upper[0], q: upper[1] }); add(lower[0], lower[1], 0, FLOOR, WALL, E_WALL);
      continue;
    }
    const isCrease = Math.max(p[1], q[1]) <= splitY + .5 && !(p[0] <= leftX + 1.5 && q[0] <= leftX + 1.5);
    if (isCrease) creaseCandidates.push({ p, q }); else add(p, q, 0, FLOOR, WALL, E_WALL);
  }
  // Wire guides, posts, slingshots, bumpers
  for (const w of Object.values(a.wires)) { const pts = w.points.map(P); for (let i = 0; i + 1 < pts.length; i++) add(pts[i], pts[i + 1], R(w.r), FLOOR, WIRE, E_WIRE); }
  a.posts.forEach((p, i) => circles.push({ x: X(p.x), y: Y(p.y), r: R(p.r), layers: FLOOR, kind: POST, index: i }));
  a.slings.forEach((s, i) => {
    const A = P(s.a), B = P(s.b), C = P(s.c);
    add(A, C, 0, FLOOR, SLING, E_SLING, i); add(C, B, 0, FLOOR, WALL, E_WALL); add(B, A, 0, FLOOR, WALL, E_WALL);
    // seal the narrow gap between the sling's outer edge and the wall (ball slides off at 45°)
    const wallX = i === 0 ? leftX : rightX;
    const dx = wallX - A[0]; add(A, [wallX, A[1] - Math.abs(dx)], 0, FLOOR, WALL, E_WALL);
  });
  const bumpers = a.design.bumpers.map(b => ({ x: X(b.x), y: Y(b.y), r: R(a.design.bumperR) }));
  bumpers.forEach((b, i) => circles.push({ ...b, layers: FLOOR, kind: BUMPER, index: i }));

  // Plate crease: solid for the plate wherever a dropping ball would land on a guide/post
  // (or be squeezed); open where the playfield below is clear.
  const blocked = (x: number, y: number) => {
    if (!pointInPoly(floorPoly, x, y) || polyDistance(floorPoly, x, y) < ballR - .5) return true;
    for (const s of segs) if (s.layers & FLOOR && s.kind !== WALL && s.kind !== CREASE && segDistance(x, y, s.ax, s.ay, s.bx, s.by) < ballR + s.r + 2) return true;
    for (const c of circles) if (Math.hypot(x - c.x, y - c.y) < ballR + c.r + 2) return true;
    return false;
  };
  for (const { p, q } of creaseCandidates) {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    // inward (floor side) normal for the loop orientation
    const nx = -(q[1] - p[1]) / len * orient, ny = (q[0] - p[0]) / len * orient;
    let open = true;
    for (const t of [.15, .5, .85]) {
      const x = p[0] + (q[0] - p[0]) * t + nx * (ballR + 1.5), y = p[1] + (q[1] - p[1]) * t + ny * (ballR + 1.5);
      if (blocked(x, y)) { open = false; break; }
    }
    add(p, q, 0, open ? FLOOR : FLOOR | PLATE, CREASE, E_WALL);
  }
  // Outer lip of the plate, funnel into the slot, slot walls
  const lip = a.lip.map(P);
  for (let i = 0; i + 1 < lip.length; i++) add(lip[i], lip[i + 1], 0, PLATE, WALL, E_WALL);
  const lipEnd = lip[lip.length - 1];
  add(lipEnd, [slot.right, slot.top + 34], 0, PLATE | SLOT, WALL, E_WALL);
  add([rightX, splitY], [slot.left, slot.top + 34], 0, PLATE | SLOT, WALL, E_WALL);
  add([slot.right, slot.top + 34], [slot.right, slot.bottom], 0, SLOT, WALL, .2);
  add([slot.left, slot.top + 34], [slot.left, slot.bottom], 0, SLOT, WALL, .2);
  const lipPoly = new Float64Array([...lip.flat(), slot.right, slot.top + 34, slot.right, slot.bottom, slot.left, slot.bottom, slot.left, slot.top + 34, rightX, splitY]);

  // Uniform grid broad-phase (static colliders, inflated by the ball radius)
  const cell = 48, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const gs: number[][] = Array.from({ length: cols * rows }, () => []), gc: number[][] = Array.from({ length: cols * rows }, () => []);
  const box = (x0: number, y0: number, x1: number, y1: number, list: number[][], id: number) => {
    for (let cy = Math.max(0, Math.floor(y0 / cell)); cy <= Math.min(rows - 1, Math.floor(y1 / cell)); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / cell)); cx <= Math.min(cols - 1, Math.floor(x1 / cell)); cx++) list[cy * cols + cx].push(id);
  };
  segs.forEach((s, i) => { const m = s.r + ballR + 2; box(Math.min(s.ax, s.bx) - m, Math.min(s.ay, s.by) - m, Math.max(s.ax, s.bx) + m, Math.max(s.ay, s.by) + m, gs, i); });
  circles.forEach((c, i) => { const m = c.r + ballR + 2; box(c.x - m, c.y - m, c.x + m, c.y + m, gc, i); });

  const d = a.design;
  const L = R(d.flipperLength), r0 = R(d.flipperBaseR), r1 = R(d.flipperTipR);
  const flippers = d.flippers.map((f, i) => ({ px: X(f.x), py: Y(f.y), side: i === 0 ? 1 : -1, L, r0, r1 }));
  // Inlane feed: the guide wire runs past the flipper pivot cap (measured gap 3px). Bridge the
  // notch between them with a short ramp so a ball rolling down the guide feeds onto the flipper.
  flippers.forEach(f => {
    const gx = f.px - f.side * (f.r0 + 3);
    segs.push({ ax: gx, ay: f.py - f.r0 - 34, bx: f.px - f.side * 2, by: f.py - f.r0 - .5, r: 0, layers: FLOOR, kind: WALL, e: E_WALL, index: 0 });
    const s2 = segs[segs.length - 1], m = ballR + 2;
    box(Math.min(s2.ax, s2.bx) - m, Math.min(s2.ay, s2.by) - m, Math.max(s2.ax, s2.bx) + m, Math.max(s2.ay, s2.by) + m, gs, segs.length - 1);
  });
  const restRad = REST_DEG * Math.PI / 180;
  const pivotY = flippers[0].py;
  const drainY = pivotY + Math.sin(restRad) * L + r1 + ballR * .5;

  // Plunger: knob fits the slot, spring scale from the sprite's measured proportions
  const pl = a.sprites.plunger;
  const slotW = slot.right - slot.left;
  const scale = slotW * .9 / (pl.knobWidth * pl.width);         // units per sprite px
  const spriteH = pl.height * scale;
  const knobBottom = slot.bottom - 4;
  const restTip = knobBottom - (pl.knobBottom - pl.rodTop[1]) * spriteH;
  const pullMax = (pl.knobTop - pl.springTop) * spriteH * .55;

  return {
    width: W, height: H, ballR, segs, circles,
    grid: { cell, cols, rows, segs: gs.map(l => Int32Array.from(l)), circles: gc.map(l => Int32Array.from(l)) },
    floorPoly, lipPoly, slot, bumpers, flippers,
    laneLights: a.laneLights.map(l => ({ x: X(l.x), y: Y(l.y), r: R(l.r) })),
    targetLights: a.targetLights.map(l => ({ x: X(l.x), y: Y(l.y), r: R(l.r) })),
    plunger: { x: (slot.left + slot.right) / 2, restTip, pullMax, knobBottom, scale },
    lcd: { x: X(a.lcd.x), y: Y(a.lcd.y), w: R(a.lcd.w), h: Y(a.lcd.h) },
    drainY, pivotY, midX: X(d.midX),
  };
}

export type Ball = { x: number; y: number; vx: number; vy: number; layer: number; active: boolean };
export type FlipperState = { angle: number; omega: number; held: boolean };
export type Phase = "ready" | "play" | "drained" | "over";
export type Game = {
  g: Geometry; ball: Ball; flippers: FlipperState[];
  phase: Phase; timer: number; ballNumber: number; score: number;
  saver: number; saverArmed: boolean; saveUsed: boolean; launched: boolean;
  lanes: boolean[]; targets: boolean[]; combo: boolean;
  bumperLit: Float64Array; bumperCool: Float64Array; slingFlash: Float64Array; slingCool: Float64Array;
  laneInside: boolean[]; targetInside: boolean[];
  inputLeft: boolean; inputRight: boolean;
  plungerHeld: boolean; pull: number; dragPull: number; dragging: boolean; fireFrom: number;
  still: number; nudges: number; message: string; messageTimer: number;
  random: number; revision: number; elapsed: number; ballTime: number;
  lastPenetration: number; maxMicroSteps: number; drains: number; combos: number;
};
function rand(s: Game) { s.random = (Math.imul(s.random, 1664525) + 1013904223) >>> 0; return s.random / 4294967296; }
const restRad = REST_DEG * Math.PI / 180, upRad = UP_DEG * Math.PI / 180;

export function createGame(g: Geometry, seed = 1): Game {
  const s: Game = {
    g, ball: { x: 0, y: 0, vx: 0, vy: 0, layer: SLOT, active: true },
    flippers: g.flippers.map(() => ({ angle: restRad, omega: 0, held: false })),
    phase: "ready", timer: 0, ballNumber: 1, score: 0, saver: 0, saverArmed: true, saveUsed: false, launched: false,
    lanes: g.laneLights.map(() => false), targets: g.targetLights.map(() => false), combo: false,
    bumperLit: new Float64Array(g.bumpers.length), bumperCool: new Float64Array(g.bumpers.length),
    slingFlash: new Float64Array(2), slingCool: new Float64Array(2),
    laneInside: g.laneLights.map(() => false), targetInside: g.targetLights.map(() => false),
    inputLeft: false, inputRight: false,
    plungerHeld: false, pull: 0, dragPull: 0, dragging: false, fireFrom: 0,
    still: 0, nudges: 0, message: "", messageTimer: 0,
    random: seed >>> 0, revision: 0, elapsed: 0, ballTime: 0, lastPenetration: 0, maxMicroSteps: 0, drains: 0, combos: 0,
  };
  serve(s);
  return s;
}
export function plungerTip(s: Game) { return s.g.plunger.restTip + s.pull * s.g.plunger.pullMax; }
function serve(s: Game) {
  const b = s.ball, g = s.g;
  b.x = g.plunger.x; b.y = plungerTip(s) - g.ballR; b.vx = 0; b.vy = 0; b.layer = SLOT; b.active = true;
  s.phase = "ready"; s.launched = false; s.saver = 0; s.saverArmed = !s.saveUsed; s.still = 0; s.ballTime = 0;
  s.lanes.fill(false); s.combo = false; s.revision++;
}
function say(s: Game, text: string, time = 1.6) { s.message = text; s.messageTimer = time; s.revision++; }
function addScore(s: Game, points: number) { s.score += points; s.revision++; }

/** Rotate flippers toward their targets; returns nothing, sets omega for this step. */
function flipperTargets(s: Game, dt: number) {
  for (const f of s.flippers) {
    const target = f.held ? upRad : restRad;
    const speed = (restRad - upRad) / (f.held ? FLIP_UP : FLIP_DOWN);
    const delta = Math.max(-speed * dt, Math.min(speed * dt, target - f.angle));
    f.omega = delta / dt;
  }
}

const n = { x: 0, y: 0 };
function collideSeg(s: Game, seg: Seg) {
  const b = s.ball, R = s.g.ballR + seg.r;
  const dx = seg.bx - seg.ax, dy = seg.by - seg.ay, l = dx * dx + dy * dy;
  const t = l > 0 ? Math.max(0, Math.min(1, ((b.x - seg.ax) * dx + (b.y - seg.ay) * dy) / l)) : 0;
  const qx = seg.ax + t * dx, qy = seg.ay + t * dy;
  let ex = b.x - qx, ey = b.y - qy; const d = Math.hypot(ex, ey);
  if (d >= R) return;
  if (d < 1e-9) { ex = -dy; ey = dx; const m = Math.hypot(ex, ey) || 1; ex /= m; ey /= m; } else { ex /= d; ey /= d; }
  b.x = qx + ex * R; b.y = qy + ey * R;
  const vn = b.vx * ex + b.vy * ey;
  if (vn < 0) {
    b.vx -= (1 + seg.e) * vn * ex; b.vy -= (1 + seg.e) * vn * ey;
    // light rolling friction on the tangent
    const tx = -ey, ty = ex, vt = b.vx * tx + b.vy * ty;
    b.vx -= vt * .02 * tx; b.vy -= vt * .02 * ty;
    if (seg.kind === SLING && -vn > 140 && s.slingCool[seg.index] <= 0) {
      b.vx += ex * SLING_KICK; b.vy += ey * SLING_KICK;
      s.slingFlash[seg.index] = .12; s.slingCool[seg.index] = .08; addScore(s, 10);
    }
  }
}
function collideCircle(s: Game, c: Circle) {
  const b = s.ball, R = s.g.ballR + c.r;
  let ex = b.x - c.x, ey = b.y - c.y; const d = Math.hypot(ex, ey);
  if (d >= R) return;
  if (d < 1e-9) { ex = 0; ey = -1; } else { ex /= d; ey /= d; }
  b.x = c.x + ex * R; b.y = c.y + ey * R;
  const vn = b.vx * ex + b.vy * ey;
  if (vn < 0) { const e = c.kind === BUMPER ? .3 : E_POST; b.vx -= (1 + e) * vn * ex; b.vy -= (1 + e) * vn * ey; }
  if (c.kind === BUMPER && s.bumperCool[c.index] <= 0) {
    b.vx += ex * BUMPER_KICK; b.vy += ey * BUMPER_KICK;
    s.bumperLit[c.index] = .15; s.bumperCool[c.index] = .05;
    addScore(s, s.combo ? 200 : 100);
  }
}
/** Ball vs tapered capsule flipper at its current angle. Returns signed surface distance. */
export function flipperDistance(s: Game, i: number, x: number, y: number, out?: { x: number; y: number }) {
  const f = s.g.flippers[i], a = s.flippers[i].angle;
  const dx = f.side * Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
  const rx = x - f.px, ry = y - f.py, u = rx * dx + ry * dy, w = rx * px + ry * py;
  const aw = Math.abs(w), sg = w < 0 ? -1 : 1;
  const sinA = (f.r0 - f.r1) / f.L, cosA = Math.sqrt(1 - sinA * sinA);
  const t = u * cosA - aw * sinA;
  let dist: number, nu: number, nw: number;
  if (t < 0) { const m = Math.hypot(u, aw) || 1e-9; dist = m - f.r0; nu = u / m; nw = aw / m; }
  else if (t > f.L * cosA) { const m = Math.hypot(u - f.L, aw) || 1e-9; dist = m - f.r1; nu = (u - f.L) / m; nw = aw / m; }
  else { dist = u * sinA + aw * cosA - f.r0; nu = sinA; nw = cosA; }
  if (out) { out.x = nu * dx + nw * sg * px; out.y = nu * dy + nw * sg * py; }
  return dist;
}
function collideFlipper(s: Game, i: number) {
  const b = s.ball, f = s.g.flippers[i], st = s.flippers[i];
  const dist = flipperDistance(s, i, b.x, b.y, n);
  if (dist >= s.g.ballR) return;
  b.x += n.x * (s.g.ballR - dist); b.y += n.y * (s.g.ballR - dist);
  // surface velocity of the rotating flipper at the contact point
  const cx = b.x - n.x * s.g.ballR - f.px, cy = b.y - n.y * s.g.ballR - f.py, w = f.side * st.omega;
  const fvx = -w * cy, fvy = w * cx;
  const vn = (b.vx - fvx) * n.x + (b.vy - fvy) * n.y;
  if (vn < 0) { b.vx -= (1 + E_FLIP) * vn * n.x; b.vy -= (1 + E_FLIP) * vn * n.y; }
}

function collideStatics(s: Game) {
  const b = s.ball, g = s.g, grid = g.grid;
  const cx = Math.floor(b.x / grid.cell), cy = Math.floor(b.y / grid.cell);
  if (cx < 0 || cy < 0 || cx >= grid.cols || cy >= grid.rows) return;
  const k = cy * grid.cols + cx, sl = grid.segs[k], cl = grid.circles[k];
  for (let i = 0; i < sl.length; i++) { const seg = g.segs[sl[i]]; if (seg.layers & b.layer) collideSeg(s, seg); }
  for (let i = 0; i < cl.length; i++) { const c = g.circles[cl[i]]; if (c.layers & b.layer) collideCircle(s, c); }
}

function rollovers(s: Game) {
  const b = s.ball, g = s.g;
  if (b.layer !== FLOOR) return;
  g.laneLights.forEach((l, i) => {
    const inside = Math.hypot(b.x - l.x, b.y - l.y) < l.r + g.ballR * .55;
    // Lane lamps light only when the ball is shot UP the lane (the orbit drop rolls down it).
    if (inside && !s.laneInside[i]) {
      if (!s.lanes[i] && b.vy < 0) { s.lanes[i] = true; addScore(s, 250); if (s.lanes.every(Boolean) && !s.combo) { s.combo = true; s.combos++; say(s, "BUMPERS x2"); } }
      else addScore(s, 50);
    }
    s.laneInside[i] = inside;
  });
  g.targetLights.forEach((l, i) => {
    const inside = Math.hypot(b.x - l.x, b.y - l.y) < l.r + g.ballR * .55;
    if (inside && !s.targetInside[i]) {
      s.targets[i] = !s.targets[i]; addScore(s, 100);
      if (s.targets.every(Boolean)) { addScore(s, 1000); s.targets.fill(false); say(s, "TARGETS +1000"); }
    }
    s.targetInside[i] = inside;
  });
}

function drain(s: Game) {
  s.drains++;
  s.ball.active = false;
  if (s.saver > 0) { say(s, "BALL SAVED", 1.4); s.phase = "drained"; s.timer = .9; s.saveUsed = true; return; }
  if (s.ballNumber >= BALLS) { s.phase = "over"; s.timer = 1; say(s, "GAME OVER", 9999); return; }
  s.ballNumber++; s.saveUsed = false; s.phase = "drained"; s.timer = 1.2; s.revision++;
}

export function step(s: Game, dt = STEP) {
  s.elapsed += dt;
  s.flippers.forEach((f, i) => { f.held = i === 0 ? s.inputLeft : s.inputRight; });
  flipperTargets(s, dt);
  for (let i = 0; i < s.bumperLit.length; i++) { s.bumperLit[i] = Math.max(0, s.bumperLit[i] - dt); s.bumperCool[i] = Math.max(0, s.bumperCool[i] - dt); }
  for (let i = 0; i < 2; i++) { s.slingFlash[i] = Math.max(0, s.slingFlash[i] - dt); s.slingCool[i] = Math.max(0, s.slingCool[i] - dt); }
  if (s.messageTimer > 0) { s.messageTimer -= dt; if (s.messageTimer <= 0) { s.message = ""; s.revision++; } }

  // Plunger: hold to pull (keyboard ramps, drag maps directly); release fires.
  const g = s.g, b = s.ball;
  if (s.plungerHeld) { s.pull = s.dragging ? s.dragPull : Math.min(1, s.pull + dt / .9); s.fireFrom = s.pull; }
  else if (s.fireFrom > 0) {
    // the released rod strikes the ball anywhere within its travel
    if (b.active && b.layer === SLOT && b.y + g.ballR >= g.plunger.restTip - 8) b.vy = -(LAUNCH_MIN + (LAUNCH_MAX - LAUNCH_MIN) * s.fireFrom);
    s.fireFrom = 0;
  }
  if (!s.plungerHeld) s.pull = Math.max(0, s.pull - dt / .045);

  if (s.phase === "drained") {
    advanceFlippers(s, dt);
    s.timer -= dt; if (s.timer <= 0) serve(s);
    return;
  }
  if (s.phase === "over") { advanceFlippers(s, dt); s.timer = Math.max(0, s.timer - dt); return; }

  // Micro-steps sized by the fastest motion (ball + moving flipper surface near the ball)
  let sweep = Math.hypot(b.vx, b.vy) * dt;
  g.flippers.forEach((f, i) => { const w = Math.abs(s.flippers[i].omega); if (w > 0 && Math.hypot(b.x - f.px, b.y - f.py) < f.L + f.r0 + g.ballR + 40) sweep += w * (f.L + f.r1) * dt; });
  const steps = Math.min(32, Math.max(1, Math.ceil(sweep / 3)));
  s.maxMicroSteps = Math.max(s.maxMicroSteps, steps);
  const h = dt / steps, damp = Math.exp(-.1 * h);
  for (let k = 0; k < steps; k++) {
    for (const f of s.flippers) f.angle += f.omega * h;
    b.vy += G * h; b.vx *= damp; b.vy *= damp;
    b.x += b.vx * h; b.y += b.vy * h;
    for (let it = 0; it < 2; it++) {
      collideStatics(s);
      if (b.layer === FLOOR) for (let i = 0; i < g.flippers.length; i++) collideFlipper(s, i);
    }
    if (b.layer === SLOT) {
      const tip = plungerTip(s);
      if (b.y + g.ballR > tip) { b.y = tip - g.ballR; if (b.vy > 0) b.vy = b.vy > 120 ? -b.vy * .15 : 0; }
      if (b.y < g.slot.top + 4) b.layer = PLATE;
    } else if (b.layer === PLATE) {
      if (b.y > g.slot.top + 10 && b.x > g.slot.left && b.x < g.slot.right) b.layer = SLOT;
      else if (pointInPoly(g.floorPoly, b.x, b.y) && polyDistance(g.floorPoly, b.x, b.y) >= g.ballR - .5) b.layer = FLOOR;
    }
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_SPEED) { b.vx *= MAX_SPEED / speed; b.vy *= MAX_SPEED / speed; }
  }
  // record remaining penetration with flippers (diagnostic for the sim)
  if (b.layer === FLOOR) for (let i = 0; i < g.flippers.length; i++) s.lastPenetration = Math.max(0, g.ballR - flipperDistance(s, i, b.x, b.y));
  rollovers(s);

  if (b.layer !== SLOT && !s.launched) { s.launched = true; s.phase = "play"; if (s.saverArmed) { s.saver = SAVER_TIME; s.saverArmed = false; } s.revision++; }
  if (s.saver > 0) { const before = s.saver; s.saver = Math.max(0, s.saver - dt); if (before > 0 && s.saver === 0) s.revision++; }
  if (s.launched) s.ballTime += dt;

  // Anti-stuck: a ball resting above the flippers for 3 s gets a nudge.
  const nearHeldFlipper = g.flippers.some((f, i) => s.flippers[i].held && Math.hypot(b.x - f.px, b.y - f.py) < f.L + g.ballR + 20);
  if (b.layer !== SLOT && Math.hypot(b.vx, b.vy) < 35 && !(b.layer === FLOOR && b.y > g.pivotY - 45) && !nearHeldFlipper) {
    s.still += dt;
    if (s.still > STUCK_TIME) { b.vx = (rand(s) < .5 ? -1 : 1) * (220 + 220 * rand(s)); b.vy = -650 - 250 * rand(s); s.still = 0; s.nudges++; say(s, "NUDGE", .8); }
  } else s.still = 0;

  if (b.layer === FLOOR && b.y > g.drainY) drain(s);
}
function advanceFlippers(s: Game, dt: number) { for (const f of s.flippers) f.angle += f.omega * dt; }

export function restart(s: Game) {
  s.score = 0; s.ballNumber = 1; s.saveUsed = false; s.targets.fill(false); s.message = ""; s.messageTimer = 0; s.drains = 0; s.nudges = 0;
  serve(s);
}
