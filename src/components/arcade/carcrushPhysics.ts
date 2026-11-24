/** CAR CRUSH pure simulation (no DOM). World units = pixels of the delivered car sprite
 *  (carcrush_car*.webp, all five stages share one frame). Deterministic for a given seed. */
export const STEP = 1 / 240;
export const DURATION = 30;
export const COUNTDOWN = 3;
export const THRESHOLDS = [20, 45, 70, 95] as const;
export const COMBO_WINDOW = .35;
export const ZONE_CAP = 25;
export const MAX_DEBRIS = 40;
export const MAX_RINGS = 8;
export const SETTLED_LIFE = 4;
export const FADE = .6;
/** Base damage (% of the car) for one un-chained strike on a fresh zone. Tuned with the sim. */
export const BASE_DAMAGE = .5;
const GRAVITY = 2600;
export const ZONES = ["front", "door", "rear", "roof"] as const;

type Frac = { x: number; y: number; r: number };
export type CarCrushArt = {
  car: { width: number; height: number; ground: number; rear: Frac; front: Frac; body: { x: number; y: number; w: number; h: number }; belt: number; grid: { cell: number; cols: number; rows: number; data: string[] } };
  plinth: { width: number; height: number; left: number; right: number; top: number; face: number; bottom: number };
  debris: { width: number; height: number; pieces: { x: number; y: number; w: number; h: number; kind: string }[] };
  hit: { width: number; height: number; ring: number };
};
export type Layout = {
  W: number; H: number; ground: number;
  car: { x: number; y: number; w: number; h: number; cx: number };
  plinth: { x: number; y: number; w: number; h: number; left: number; right: number; top: number; face: number };
  rearX: number; frontX: number; beltY: number;
  cell: number; cols: number; rows: number; grid: Uint8Array; zoneCells: Int32Array[];
  pieceW: Float64Array; pieceH: Float64Array; kindPieces: Record<string, number[]>;
  ringSize: number;
};

/** Build the world from measured art. The plinth is 1.22× the car body (concept proportion). */
export function layoutFromArt(a: CarCrushArt): Layout {
  const c = a.car, W = 1800, H = 960, ground = 770;
  const carW = c.width, carH = c.height, bodyW = c.body.w * carW;
  const carX = W / 2 - (c.body.x + c.body.w / 2) * carW, carY = ground - c.ground * carH;
  const p = a.plinth, plinthSolidW = (p.right - p.left) * p.width, ps = bodyW * 1.22 / plinthSolidW;
  const pw = p.width * ps, ph = p.height * ps;
  // The tyres stand in the middle of the plinth's visible top face.
  const contact = p.top + (p.face - p.top) * .45;
  const px = W / 2 - (p.left + p.right) / 2 * pw, py = ground - contact * ph;
  const cell = c.grid.cell, cols = c.grid.cols, rows = c.grid.rows, grid = new Uint8Array(cols * rows);
  const rearX = (c.rear.x + c.rear.r * .9) * carW, frontX = (c.front.x - c.front.r * .9) * carW, beltY = c.belt * carH;
  const zoneLists: number[][] = [[], [], [], []];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) if (c.grid.data[r][k] === "1") {
    grid[r * cols + k] = 1;
    zoneLists[zoneAt(rearX, frontX, beltY, (k + .5) * cell, (r + .5) * cell)].push(r * cols + k);
  }
  const DEBRIS_SCALE = .55; // atlas px → world units (largest chip ≈ 6 % of the car)
  const kindPieces: Record<string, number[]> = {};
  a.debris.pieces.forEach((piece, i) => { (kindPieces[piece.kind] ??= []).push(i); });
  return {
    W, H, ground,
    car: { x: carX, y: carY, w: carW, h: carH, cx: W / 2 },
    plinth: { x: px, y: py, w: pw, h: ph, left: px + p.left * pw, right: px + p.right * pw, top: py + p.top * ph, face: py + p.face * ph },
    rearX, frontX, beltY, cell, cols, rows, grid, zoneCells: zoneLists.map(l => Int32Array.from(l)),
    pieceW: Float64Array.from(a.debris.pieces.map(q => q.w * DEBRIS_SCALE)), pieceH: Float64Array.from(a.debris.pieces.map(q => q.h * DEBRIS_SCALE)), kindPieces,
    ringSize: 320,
  };
}
function zoneAt(rearX: number, frontX: number, beltY: number, lx: number, ly: number) { return lx > frontX ? 0 : lx < rearX ? 2 : ly < beltY ? 3 : 1; }

export type Phase = "countdown" | "play" | "done";
export type Game = {
  L: Layout; phase: Phase; timer: number; elapsed: number; random: number;
  zone: Float64Array; total: number; stage: number; stageFrom: number; stageT: number;
  combo: number; maxCombo: number; lastHit: number; hits: number; strikes: number; wreckTime: number;
  shake: number; squash: number; clock: number; revision: number;
  // debris pool (structure of arrays, no allocation after creation)
  dx: Float64Array; dy: Float64Array; dvx: Float64Array; dvy: Float64Array; drot: Float64Array; dvr: Float64Array;
  dage: Float64Array; dsettle: Float64Array; dscale: Float64Array; drest: Float64Array; dpiece: Int32Array; dstate: Uint8Array;
  // impact rings / dent flashes
  rx: Float64Array; ry: Float64Array; rage: Float64Array; rpow: Float64Array; ringHead: number;
};
export const DEAD = 0, FLYING = 1, SETTLED = 2, FALLING = 3;

export function createGame(L: Layout, seed = 1): Game {
  const f = () => new Float64Array(MAX_DEBRIS);
  const rage = new Float64Array(MAX_RINGS).fill(99);
  return {
    L, phase: "countdown", timer: COUNTDOWN, elapsed: 0, random: seed >>> 0 || 1,
    zone: new Float64Array(4), total: 0, stage: 0, stageFrom: 0, stageT: 99,
    combo: 0, maxCombo: 0, lastHit: -9, hits: 0, strikes: 0, wreckTime: -1,
    shake: 0, squash: 0, clock: 0, revision: 0,
    dx: f(), dy: f(), dvx: f(), dvy: f(), drot: f(), dvr: f(), dage: f(), dsettle: f(), dscale: f(), drest: f(), dpiece: new Int32Array(MAX_DEBRIS), dstate: new Uint8Array(MAX_DEBRIS),
    rx: new Float64Array(MAX_RINGS), ry: new Float64Array(MAX_RINGS), rage, rpow: new Float64Array(MAX_RINGS), ringHead: 0,
  };
}
export function rand(s: Game) { s.random = (Math.imul(s.random, 1664525) + 1013904223) >>> 0; return s.random / 4294967296; }
export function stageFor(total: number) { let n = 0; for (const t of THRESHOLDS) if (total >= t) n++; return n; }

/** Is the world point on the car (generous: union of all stages' silhouettes, dilated one cell)? */
export function onCar(L: Layout, wx: number, wy: number) {
  const k = Math.floor((wx - L.car.x) / L.cell), r = Math.floor((wy - L.car.y) / L.cell);
  return k >= 0 && r >= 0 && k < L.cols && r < L.rows && L.grid[r * L.cols + k] === 1;
}

/** Pointer strike at a world point. Returns true when it landed on the car. */
export function strike(s: Game, wx: number, wy: number) {
  if (s.phase !== "play" || !onCar(s.L, wx, wy)) return false;
  s.strikes++;
  const L = s.L, z = zoneAt(L.rearX, L.frontX, L.beltY, wx - L.car.x, wy - L.car.y);
  // Chain within 0.35 s climbs to ×3; a slower hit only drops one step (generous for trackpads).
  s.combo = s.elapsed - s.lastHit <= COMBO_WINDOW ? Math.min(3, s.combo + 1) : Math.max(1, s.combo - 1);
  s.lastHit = s.elapsed; s.maxCombo = Math.max(s.maxCombo, s.combo); s.hits++;
  // Fresh panels give more (×1.3 → ×0.7 as a zone fills); overflow spills at 60 % to the others.
  let amount = BASE_DAMAGE * s.combo * (.7 + .6 * (1 - s.zone[z] / ZONE_CAP));
  const take = Math.min(amount, ZONE_CAP - s.zone[z]);
  s.zone[z] += take; amount = (amount - take) * .6;
  for (let pass = 0; pass < 3 && amount > 1e-9; pass++) {
    let open = 0; for (let i = 0; i < 4; i++) if (s.zone[i] < ZONE_CAP) open++;
    if (!open) break;
    const share = amount / open; amount = 0;
    for (let i = 0; i < 4; i++) if (s.zone[i] < ZONE_CAP) { const t = Math.min(share, ZONE_CAP - s.zone[i]); s.zone[i] += t; amount += share - t; }
  }
  s.total = Math.min(100, s.zone[0] + s.zone[1] + s.zone[2] + s.zone[3]);
  if (s.total > 99.999) s.total = 100;
  const stage = stageFor(s.total);
  if (stage !== s.stage) { s.stageFrom = s.stage; s.stage = stage; s.stageT = 0; }
  s.shake = Math.min(1, s.shake + .55 + .15 * s.combo); s.squash = 1;
  const ring = s.ringHead; s.ringHead = (s.ringHead + 1) % MAX_RINGS;
  s.rx[ring] = wx; s.ry[ring] = wy; s.rage[ring] = 0; s.rpow[ring] = .7 + .15 * s.combo;
  spawnDebris(s, wx, wy, z);
  if (s.total >= 100) { s.phase = "done"; s.wreckTime = s.elapsed; } // the timer freezes at the time left
  s.revision++;
  return true;
}
/** Keyboard strike: a random point of the least-damaged (weakest) zone. */
export function strikeKey(s: Game) {
  if (s.phase !== "play") return false;
  let z = 0; for (let i = 1; i < 4; i++) if (s.zone[i] < s.zone[z] - 1e-9 || (Math.abs(s.zone[i] - s.zone[z]) < 1e-9 && rand(s) < .5)) z = i;
  const cells = s.L.zoneCells[z]; if (!cells.length) return false;
  const cellIndex = cells[Math.floor(rand(s) * cells.length)], L = s.L;
  return strike(s, L.car.x + (cellIndex % L.cols + .5) * L.cell, L.car.y + (Math.floor(cellIndex / L.cols) + .5) * L.cell);
}
const kindByZone = [["chip", "graphite", "chip"], ["stripe", "chip", "chip"], ["chip", "graphite", "chip"], ["glass", "chip", "glass"]];
function slot(s: Game) {
  let best = -1, score = -1;
  for (let i = 0; i < MAX_DEBRIS; i++) {
    if (s.dstate[i] === DEAD) return i;
    const v = s.dstate[i] === SETTLED ? 1000 + s.dsettle[i] : s.dage[i]; // recycle settled first, oldest first
    if (v > score) { score = v; best = i; }
  }
  return best;
}
function spawnDebris(s: Game, wx: number, wy: number, z: number) {
  const L = s.L, n = 2 + Math.floor(rand(s) * 3), away = wx >= L.car.cx ? 1 : -1;
  for (let k = 0; k < n; k++) {
    const kinds = kindByZone[z], list = L.kindPieces[kinds[Math.floor(rand(s) * kinds.length)]] ?? L.kindPieces.chip;
    const i = slot(s), piece = list[Math.floor(rand(s) * list.length)];
    s.dstate[i] = FLYING; s.dpiece[i] = piece; s.dage[i] = 0; s.dsettle[i] = 0;
    s.dscale[i] = .65 + rand(s) * .45;
    s.dx[i] = wx + (rand(s) - .5) * 24; s.dy[i] = wy + (rand(s) - .5) * 24;
    s.dvx[i] = away * (120 + rand(s) * 520) + (rand(s) - .5) * 360;
    s.dvy[i] = -(480 + rand(s) * 620);
    s.drot[i] = rand(s) * Math.PI * 2; s.dvr[i] = (rand(s) - .5) * 16;
    // rest line: on the front half of the plinth's top face (in front of the tyres)
    s.drest[i] = L.ground + 4 + rand(s) * Math.max(2, L.plinth.face - L.ground - 8);
    s.dy[i] = Math.min(s.dy[i], s.drest[i] - halfHeight(s, i)); // low strikes (sill, tyres) start above the surface
  }
}
/** Half of the rotated sprite's vertical extent. */
export function halfHeight(s: Game, i: number) {
  const w = s.L.pieceW[s.dpiece[i]] * s.dscale[i], h = s.L.pieceH[s.dpiece[i]] * s.dscale[i], r = s.drot[i];
  return .5 * (Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r)));
}
function nearestFlat(r: number) { return Math.round(r / Math.PI) * Math.PI; }

export function step(s: Game) {
  const dt = STEP, L = s.L;
  s.clock += dt;
  if (s.phase === "countdown") { s.timer -= dt; if (s.timer <= 0) { s.phase = "play"; s.timer = DURATION; s.revision++; } }
  else if (s.phase === "play") { s.timer -= dt; s.elapsed += dt; if (s.timer <= 0) { s.timer = 0; s.phase = "done"; s.revision++; } }
  s.shake *= Math.exp(-dt * 9); if (s.shake < .002) s.shake = 0;
  s.squash = Math.max(0, s.squash - dt / .16);
  if (s.stageT < 99) s.stageT += dt;
  for (let i = 0; i < MAX_RINGS; i++) if (s.rage[i] < 99) s.rage[i] += dt;
  for (let i = 0; i < MAX_DEBRIS; i++) {
    const state = s.dstate[i]; if (state === DEAD) continue;
    s.dage[i] += dt;
    if (state === SETTLED) { s.dsettle[i] += dt; if (s.dsettle[i] > SETTLED_LIFE + FADE) s.dstate[i] = DEAD; continue; }
    s.dvy[i] += GRAVITY * dt; s.dvx[i] *= 1 - .15 * dt;
    s.dx[i] += s.dvx[i] * dt; s.dy[i] += s.dvy[i] * dt; s.drot[i] += s.dvr[i] * dt;
    const hb = halfHeight(s, i);
    if (s.dx[i] < 10) { s.dx[i] = 10; s.dvx[i] = Math.abs(s.dvx[i]) * .5; }
    else if (s.dx[i] > L.W - 10) { s.dx[i] = L.W - 10; s.dvx[i] = -Math.abs(s.dvx[i]) * .5; }
    if (s.dy[i] - hb < 0) { s.dy[i] = hb; s.dvy[i] = Math.abs(s.dvy[i]) * .3; }
    const over = s.dx[i] >= L.plinth.left && s.dx[i] <= L.plinth.right;
    if (state === FLYING) {
      if (!over && s.dy[i] + hb > L.plinth.top) { s.dstate[i] = FALLING; }
      else if (over && s.dy[i] + hb >= s.drest[i]) {
        // Position clamp onto the surface: a piece can never pass below the plinth top face.
        s.dy[i] = s.drest[i] - hb;
        s.dvy[i] = -s.dvy[i] * .3; s.dvx[i] *= .5; s.dvr[i] *= .45;
        s.drot[i] += (nearestFlat(s.drot[i]) - s.drot[i]) * .55;
        s.dy[i] = s.drest[i] - halfHeight(s, i); // the rotation changed the extent: re-seat it
        if (Math.abs(s.dvy[i]) < 110) { s.dstate[i] = SETTLED; s.dvy[i] = 0; s.dvx[i] = 0; s.dvr[i] = 0; s.drot[i] = nearestFlat(s.drot[i]) + (s.drot[i] - nearestFlat(s.drot[i])) * .4; s.dy[i] = s.drest[i] - halfHeight(s, i); }
      }
    } else if (state === FALLING) {
      // Off the plinth edge: the slab's end face is a wall; drop out of the play band and recycle.
      if (s.dy[i] + hb > L.plinth.top && over) {
        const mid = (L.plinth.left + L.plinth.right) / 2;
        if (s.dx[i] < mid) { s.dx[i] = L.plinth.left - .01; s.dvx[i] = -Math.abs(s.dvx[i]) * .4; } else { s.dx[i] = L.plinth.right + .01; s.dvx[i] = Math.abs(s.dvx[i]) * .4; }
      }
      if (s.dy[i] - hb > L.H) s.dstate[i] = DEAD;
    }
  }
}
/** Bonus seconds when the car was wrecked before time ran out. */
export function bonusSeconds(s: Game) { return s.wreckTime < 0 ? 0 : Math.max(0, DURATION - s.wreckTime); }
