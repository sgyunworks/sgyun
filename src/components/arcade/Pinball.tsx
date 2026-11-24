"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import art from "./pinball.art.json";
import shared from "./art.json";
import { sfx } from "./sfx";
import { BALLS, createGame, EV_BUMPER, EV_COUNT, EV_SLING, EV_WALL, geometryFromArt, pointInPoly, POP_LIFE, POP_X2, POPS, restart as restartGame, SLING, step, STEP, type Game, type PinballArt } from "./pinballPhysics";
import styles from "./pinball.module.css";

const geometry = geometryFromArt(art as unknown as PinballArt);
const sprites = art.sprites;
const slings = geometry.segs.filter(s => s.kind === SLING).sort((a, b) => a.index - b.index);
const HIGH_KEY = "sgyun-arcade-pinball-high";
type Sprite = { canvas: HTMLCanvasElement; cx: number; cy: number };
type View = { left: number; top: number; width: number; height: number; nav: number; compact: boolean; vw: number };
// Phone layout (compact): 16 px gutters; top row = back link + LCD module, bottom row = hint + LAUNCH.
const GUTTER = 16, LAUNCH_W = 116, LAUNCH_H = 48;
const compactPanel = (vw: number) => Math.round(Math.max(150, Math.min(196, vw * .46)));
const sharedRatio = shared.lcd.height / shared.lcd.width;
type Hud = { score: number; ball: number; high: number; message: string; phase: Game["phase"]; saver: boolean; blink: boolean };
const pct = (v: number) => `${v * 100}%`;
const pad = (n: number) => String(n).padStart(6, "0");
function readHigh() { try { return Number(window.localStorage.getItem(HIGH_KEY)) || 0; } catch { return 0; } }
function writeHigh(v: number) { try { window.localStorage.setItem(HIGH_KEY, String(v)); } catch { /* storage unavailable */ } }

// Seven-segment LCD digits (vector, crisp at any size), matching the concept's score window.
const SEG_W = 12, SEG_H = 21, SEG_T = 2.3, SEG_GAP = .45, SEG_PITCH = 15.5;
function hSeg(x1: number, x2: number, y: number) { const t = SEG_T / 2; return `M${x1} ${y}L${x1 + t} ${y - t}H${x2 - t}L${x2} ${y}L${x2 - t} ${y + t}H${x1 + t}Z`; }
function vSeg(x: number, y1: number, y2: number) { const t = SEG_T / 2; return `M${x} ${y1}L${x + t} ${y1 + t}V${y2 - t}L${x} ${y2}L${x - t} ${y2 - t}V${y1 + t}Z`; }
const SEG_PATHS = (() => {
  const t = SEG_T / 2, gap = SEG_GAP, mid = SEG_H / 2;
  return [
    hSeg(t + gap, SEG_W - t - gap, t), vSeg(SEG_W - t, t + gap, mid - gap), vSeg(SEG_W - t, mid + gap, SEG_H - t - gap),
    hSeg(t + gap, SEG_W - t - gap, SEG_H - t), vSeg(t, mid + gap, SEG_H - t - gap), vSeg(t, t + gap, mid - gap), hSeg(t + gap, SEG_W - t - gap, mid),
  ];
})();
const SEG_MASKS = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f]; // bits a..g
function SevenSeg({ value }: { value: string }) {
  const n = value.length, w = (n - 1) * SEG_PITCH + SEG_W + 3;
  return <svg className={styles.seg} viewBox={`-1.5 -.5 ${w} ${SEG_H + 1.5}`} aria-label={value} role="img">
    {[...value].map((ch, i) => {
      const mask = SEG_MASKS[ch.charCodeAt(0) - 48] ?? 0;
      return <g key={i} transform={`translate(${i * SEG_PITCH + 1.6} 0) skewX(-6)`}>
        {SEG_PATHS.map((d, j) => <path key={j} d={d} className={mask & (1 << j) ? styles.segOn : styles.segOff} />)}
      </g>;
    })}
  </svg>;
}

// `ko` is accepted for the shared game signature; the arcade UI is English-only.
export default function Pinball({ onBack }: { ko: boolean; onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const restartRef = useRef<() => void>(() => {});
  const [view, setView] = useState<View>({ left: 0, top: 200, width: 0, height: 0, nav: 72, compact: false, vw: 1280 });
  const [knobBox, setKnobBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [hud, setHud] = useState<Hud>({ score: 0, ball: 1, high: 0, message: "", phase: "ready", saver: false, blink: false });
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onBack(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onBack]);

  useEffect(() => {
    const element = canvas.current, surface = stage.current, knobEl = knob.current;
    if (!element || !surface || !knobEl) return;
    const ctx = element.getContext("2d", { alpha: true });
    if (!ctx) { setFailed(true); return; }
    let disposed = false, raf = 0, previous = 0, nextFrame = 0, accumulator = 0, k = 1, cssPerUnit = 1, loaded = false, hidden = document.hidden;
    let high = readHigh(), revision = -1, highCheered = false, startHigh = high, lastBlink = false, savedHigh = high, clock = 0;
    const s = createGame(geometry, (Date.now() & 0xffffffff) >>> 0);
    game.current = s;
    let images: HTMLImageElement[] = [];
    let bumper: Sprite, bumperLit: Sprite, ball: Sprite, flipL: Sprite, flipR: Sprite, plunger: HTMLCanvasElement, dim: HTMLCanvasElement, glow: HTMLCanvasElement;
    let slingLit: Sprite[] = [];
    let flipOffset = 0, urgent = false;
    // score pops: glyph atlas "+0123456789x" baked per resize in JetBrains Mono; digits reused
    const POP_CHARS = "+0123456789x";
    let popAtlas: HTMLCanvasElement | null = null, popCellW = 0, popCellH = 0, popAdvance = 0, popFont = "";
    const popDigits = new Int8Array(8);
    const keys = { left: false, right: false };
    const pointers = new Map<number, number>();
    let dragStart = 0;

    function offscreen(w: number, h: number) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
    function disc(img: HTMLImageElement, meta: { c: number[]; r: number }, radius: number): Sprite {
      const scale = radius * k / (meta.r * img.naturalWidth);
      const c = offscreen(img.naturalWidth * scale, img.naturalHeight * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      return { canvas: c, cx: meta.c[0] * c.width, cy: meta.c[1] * c.height };
    }
    function radial(radius: number, stops: [number, string][]) {
      const c = offscreen(radius * 2, radius * 2), p = c.getContext("2d")!;
      const grad = p.createRadialGradient(radius, radius, 0, radius, radius, radius);
      for (const [o, col] of stops) grad.addColorStop(o, col);
      p.fillStyle = grad; p.fillRect(0, 0, c.width, c.height);
      return c;
    }
    // Lit slingshot: the table's own sling moulding recoloured as glowing orange (grille slots
    // brightest). Baked from the table raster once per resize, so it matches the art exactly.
    function bakeSling(i: number): Sprite {
      const sl = art.slings[i], pts = [sl.a, sl.b, sl.c].map(p => [p[0] * geometry.width, p[1] * geometry.height]);
      const pad = 10, x0 = Math.min(...pts.map(p => p[0])) - pad, y0 = Math.min(...pts.map(p => p[1])) - pad;
      const x1 = Math.max(...pts.map(p => p[0])) + pad, y1 = Math.max(...pts.map(p => p[1])) + pad;
      const c = offscreen((x1 - x0) * k, (y1 - y0) * k), p = c.getContext("2d", { willReadFrequently: true })!;
      const img = images[0], u = img.naturalWidth / geometry.width;
      p.drawImage(img, x0 * u, y0 * u, (x1 - x0) * u, (y1 - y0) * u, 0, 0, c.width, c.height);
      const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      const hull = new Float64Array(pts.flatMap(q => { const dx = q[0] - cx, dy = q[1] - cy, m = Math.hypot(dx, dy) || 1; return [(q[0] + dx / m * 5 - x0) * k, (q[1] + dy / m * 5 - y0) * k]; }));
      const im = p.getImageData(0, 0, c.width, c.height), d = im.data;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const o = (y * c.width + x) * 4, L = (d[o] + d[o + 1] + d[o + 2]) / 3;
        const dark = pointInPoly(hull, x + .5, y + .5) ? Math.max(0, Math.min(1, (178 - L) / 78)) : 0;
        const slot = Math.max(0, Math.min(1, (82 - L) / 40)), rim = Math.max(0, Math.min(1, (L - 92) / 50));
        d[o] = 246 + 9 * slot; d[o + 1] = 104 + 86 * slot + 60 * rim; d[o + 2] = 28 + 70 * slot + 60 * rim; d[o + 3] = 235 * dark;
      }
      p.putImageData(im, 0, 0);
      return { canvas: c, cx: -x0 * k, cy: -y0 * k };
    }
    function bakePops() {
      const family = getComputedStyle(surface!).fontFamily;
      const size = Math.max(8, Math.round(30 * k));
      popFont = `700 ${size}px ${family}`;
      const probe = offscreen(4, 4).getContext("2d")!; probe.font = popFont;
      popAdvance = Math.ceil(probe.measureText("0").width); const line = Math.ceil(size * .32);
      popCellW = popAdvance + line * 2; popCellH = Math.ceil(size * 1.2) + line * 2;
      const c = offscreen(popCellW * POP_CHARS.length, popCellH), p = c.getContext("2d")!;
      p.font = popFont; p.textAlign = "center"; p.textBaseline = "middle"; p.lineJoin = "round";
      p.lineWidth = line; p.strokeStyle = "rgba(246,244,240,.96)"; p.fillStyle = "#e9580f";
      for (let i = 0; i < POP_CHARS.length; i++) { const x = i * popCellW + popCellW / 2, y = popCellH / 2 + size * .04; p.strokeText(POP_CHARS[i], x, y); p.fillText(POP_CHARS[i], x, y); }
      popAtlas = c;
    }
    function drawPopChars(count: number, x: number, y: number, scale: number) {
      // glyphs come from popDigits (atlas indices); x,y = centre of the string in canvas px
      const adv = popAdvance * scale, w = popCellW * scale, h = popCellH * scale;
      let px = x - adv * count / 2 - (w - adv) / 2;
      for (let i = 0; i < count; i++) { ctx!.drawImage(popAtlas!, popDigits[i] * popCellW, 0, popCellW, popCellH, Math.round(px), Math.round(y - h / 2), w, h); px += adv; }
    }
    function drawPops() {
      if (!popAtlas) return;
      for (let i = 0; i < POPS; i++) {
        const age = s.popAge[i]; if (age >= POP_LIFE) continue;
        const t = age / POP_LIFE, v = s.popValue[i];
        let count = 0;
        if (v === POP_X2) { popDigits[0] = 11; popDigits[1] = 3; count = 2; }
        else { popDigits[0] = 0; let m = v, n = 0; do { n++; m = Math.floor(m / 10); } while (m > 0); m = v; for (let j = n; j >= 1; j--) { popDigits[j] = 1 + (m % 10); m = Math.floor(m / 10); } count = n + 1; }
        const big = v >= 1000 || v === POP_X2 ? 1.3 : 1;
        const scale = big * (t < .12 ? .75 + 2.1 * t : 1);
        ctx!.globalAlpha = t < .08 ? t / .08 : t > .55 ? Math.max(0, 1 - (t - .55) / .45) : 1;
        drawPopChars(count, s.popX[i] * k, (s.popY[i] - 46 * (1 - (1 - t) * (1 - t))) * k, scale);
      }
      ctx!.globalAlpha = 1;
    }
    // Sounds for the moments the simulation flagged since the last frame (never per frame).
    // index order = EV_BUMPER, EV_SLING, EV_LIGHT, EV_LAUNCH, EV_DRAIN, EV_COMBO, EV_OVER, EV_WALL
    const SOUNDS = ["bumper", "sling", "light", "launch", "drain", "win", "lose", "wall"] as const;
    function playEvents() {
      // a rail knock in the same frame as a bumper/sling kick would only muddy the kick
      if (s.events[EV_BUMPER] > 0 || s.events[EV_SLING] > 0) s.events[EV_WALL] = 0;
      for (let i = 0; i < EV_COUNT; i++) {
        const v = s.events[i]; if (v <= 0) continue;
        s.events[i] = 0; sfx.play(SOUNDS[i], v);
      }
      // a new high score (beating a stored one) gets one fanfare per game
      if (!highCheered && startHigh > 0 && s.score > startHigh) { highCheered = true; sfx.play("win"); }
    }
    function resize() {
      const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 70);
      const vw = window.innerWidth, vh = window.innerHeight;
      // Phones / portrait tablets: HUD row on top, LAUNCH bar below, table fills the width.
      const compact = vw < 760 || (vh > vw && vw < 1000);
      // compact: below the LCD module + BALL SAVER row; above the LAUNCH row
      const top = compact ? nav + 8 + compactPanel(vw) * sharedRatio + 30 : nav + 70, bottom = compact ? vh - LAUNCH_H - 30 : vh - 90;
      const height = Math.max(1, Math.min(bottom - top, (compact ? vw - 24 : vw - 560) * geometry.height / geometry.width));
      const width = height * geometry.width / geometry.height;
      const left = (vw - width) / 2, y = top + Math.max(0, bottom - top - height) / 2;
      setView({ left, top: y, width, height, nav, compact, vw });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      element!.width = Math.round(width * dpr); element!.height = Math.round(height * dpr);
      k = element!.width / geometry.width; cssPerUnit = width / geometry.width;
      const p = geometry.plunger, pl = sprites.plunger;
      const spriteTop = p.knobBottom - pl.knobBottom * pl.height * p.scale;
      const knobTopU = spriteTop + pl.knobTop * pl.height * p.scale, knobW = pl.knobWidth * pl.width * p.scale;
      // finger-sized hit area (>= 44 css px) around the knob
      const kw = Math.max(44, (knobW + 16) * cssPerUnit), kh = Math.max(56, (p.knobBottom - knobTopU + 46) * cssPerUnit);
      setKnobBox({ left: p.x * cssPerUnit - kw / 2, top: (p.knobBottom + 16) * cssPerUnit - kh, width: kw, height: kh });
      if (!loaded) return;
      // All sprite canvases are created here (on resize), never inside the animation loop.
      bumper = disc(images[1], sprites.bumper, geometry.bumpers[0].r);
      bumperLit = disc(images[2], sprites.bumperLit, geometry.bumpers[0].r);
      ball = disc(images[3], sprites.ball, geometry.ballR);
      const fl = sprites.flipper, fImg = images[4];
      const span = Math.hypot((fl.tip[0] - fl.pivot[0]) * fImg.naturalWidth, (fl.tip[1] - fl.pivot[1]) * fImg.naturalHeight);
      flipOffset = Math.atan2((fl.tip[1] - fl.pivot[1]) * fImg.naturalHeight, (fl.tip[0] - fl.pivot[0]) * fImg.naturalWidth);
      const fs = geometry.flippers[0].L * k / span, fc = offscreen(fImg.naturalWidth * fs, fImg.naturalHeight * fs);
      fc.getContext("2d")!.drawImage(fImg, 0, 0, fc.width, fc.height);
      const fm = offscreen(fc.width, fc.height), fmc = fm.getContext("2d")!;
      fmc.scale(-1, 1); fmc.drawImage(fc, -fc.width, 0);
      flipL = { canvas: fc, cx: fl.pivot[0] * fc.width, cy: fl.pivot[1] * fc.height };
      flipR = { canvas: fm, cx: (1 - fl.pivot[0]) * fm.width, cy: fl.pivot[1] * fm.height };
      const pImg = images[5], ps = p.scale * k;
      plunger = offscreen(pImg.naturalWidth * ps, pImg.naturalHeight * ps);
      plunger.getContext("2d")!.drawImage(pImg, 0, 0, plunger.width, plunger.height);
      const lr = geometry.laneLights[0].r * k;
      dim = radial(lr * 1.25, [[0, "rgba(226,222,214,.74)"], [.72, "rgba(226,222,214,.66)"], [1, "rgba(226,222,214,0)"]]);
      glow = radial(lr * 2.6, [[0, "rgba(255,150,60,.55)"], [.38, "rgba(255,120,40,.28)"], [1, "rgba(255,110,30,0)"]]);
      slingLit = [bakeSling(0), bakeSling(1)];
      bakePops();
      if (document.fonts) document.fonts.load(popFont).then(() => { if (!disposed && loaded) bakePops(); }, () => {});
      accumulator = 0; previous = 0;
    }
    const sync = () => {
      let l = keys.left, r = keys.right;
      pointers.forEach(side => { if (side === 0) l = true; else r = true; });
      // a flipper press renders on the very next animation frame (bypasses the 60 Hz cap)
      if (l !== s.inputLeft || r !== s.inputRight) urgent = true;
      if ((l && !s.inputLeft) || (r && !s.inputRight)) sfx.play("flipper");
      s.inputLeft = l; s.inputRight = r;
    };
    const releaseAll = () => { keys.left = keys.right = false; pointers.clear(); s.plungerHeld = false; s.dragging = false; setDragging(false); sync(); };
    const keydown = (e: KeyboardEvent) => {
      sfx.unlock();
      if (e.code === "ArrowLeft" || e.code === "KeyZ") { e.preventDefault(); keys.left = true; sync(); }
      else if (e.code === "ArrowRight" || e.code === "KeyM" || e.code === "Slash") { e.preventDefault(); keys.right = true; sync(); }
      else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (s.phase === "over") { if (!e.repeat && s.timer <= 0) restart(); return; }
        if (e.code === "Space" && !e.repeat) { s.dragging = false; s.plungerHeld = true; }
      }
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyZ") keys.left = false;
      else if (e.code === "ArrowRight" || e.code === "KeyM" || e.code === "Slash") keys.right = false;
      else if (e.code === "Space" && !s.dragging) s.plungerHeld = false;
      sync();
    };
    // Flippers: press anywhere; left half of the screen = left flipper. Held until release.
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault(); sfx.unlock();
      pointers.set(e.pointerId, e.clientX < window.innerWidth / 2 ? 0 : 1);
      try { surface.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      sync();
    };
    const up = (e: PointerEvent) => { if (pointers.delete(e.pointerId)) sync(); };
    // Plunger: drag the knob down (pull = launch speed), release to fire.
    const knobDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation(); sfx.unlock();
      try { knobEl.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      dragStart = e.clientY; s.dragPull = 0; s.dragging = true; s.plungerHeld = true; setDragging(true);
    };
    const knobMove = (e: PointerEvent) => { if (!s.dragging) return; s.dragPull = Math.max(0, Math.min(1, (e.clientY - dragStart) / (geometry.plunger.pullMax * cssPerUnit))); };
    const knobUp = () => { if (!s.dragging) return; s.dragging = false; s.plungerHeld = false; setDragging(false); };
    const menu = (e: Event) => e.preventDefault();
    const visibility = () => { hidden = document.hidden; previous = 0; accumulator = 0; releaseAll(); };
    function restart() { restartGame(s); revision = -1; startHigh = high; highCheered = false; surface!.focus({ preventScroll: true }); }
    restartRef.current = restart;

    function drawSprite(sp: Sprite, x: number, y: number) { ctx!.drawImage(sp.canvas, Math.round(x * k - sp.cx), Math.round(y * k - sp.cy)); }
    function drawPlunger() {
      const p = geometry.plunger, pl = sprites.plunger, H = plunger.height, W = plunger.width;
      const pullDist = s.pull * p.pullMax * k, knobShift = pullDist * .25;
      const top = (p.knobBottom - pl.knobBottom * pl.height * p.scale) * k, x = Math.round(p.x * k - W / 2);
      const springY = pl.springTop * H, knobY = pl.knobTop * H;
      // rod (moves with the tip), spring (compresses), knob (moves a little)
      ctx!.drawImage(plunger, 0, 0, W, springY, x, top + pullDist, W, springY);
      ctx!.drawImage(plunger, 0, springY, W, knobY - springY, x, top + springY + pullDist, W, knobY - springY - pullDist + knobShift);
      ctx!.drawImage(plunger, 0, knobY, W, H - knobY, x, top + knobY + knobShift, W, H - knobY);
    }
    function drawFlipper(i: number) {
      const f = geometry.flippers[i], sp = i === 0 ? flipL : flipR, a = s.flippers[i].angle;
      const rot = i === 0 ? a - flipOffset : -a + flipOffset, c = Math.cos(rot), sn = Math.sin(rot);
      ctx!.setTransform(c, sn, -sn, c, f.px * k, f.py * k);
      ctx!.drawImage(sp.canvas, -sp.cx, -sp.cy);
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
    }
    function frame(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (!loaded || hidden) return;
      // 60 Hz output on high-refresh displays; the simulation stays at 240 Hz.
      if (previous && now < nextFrame - 1 && !urgent) return;
      urgent = false;
      nextFrame = previous ? Math.max(nextFrame + 1000 / 60, now) : now + 1000 / 60;
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
      accumulator += dt; clock += dt;
      while (accumulator >= STEP) { step(s); accumulator -= STEP; }
      playEvents();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, element!.width, element!.height);
      // lane + target lights: unlit lamps are dimmed, lit lamps glow (pulse while the combo is live)
      const pulse = s.combo ? .62 + .38 * Math.sin(clock * 9) : 1;
      for (let i = 0; i < geometry.laneLights.length; i++) {
        const l = geometry.laneLights[i];
        if (s.lanes[i]) { ctx!.globalAlpha = pulse; ctx!.drawImage(glow, Math.round(l.x * k - glow.width / 2), Math.round(l.y * k - glow.height / 2)); ctx!.globalAlpha = 1; }
        else ctx!.drawImage(dim, Math.round(l.x * k - dim.width / 2), Math.round(l.y * k - dim.height / 2));
      }
      for (let i = 0; i < geometry.targetLights.length; i++) {
        const l = geometry.targetLights[i];
        if (s.targets[i]) ctx!.drawImage(glow, Math.round(l.x * k - glow.width / 2), Math.round(l.y * k - glow.height / 2));
        else ctx!.drawImage(dim, Math.round(l.x * k - dim.width / 2), Math.round(l.y * k - dim.height / 2));
      }
      // slingshot kick: the moulding lights up orange and its rubber edge flashes, bulging outward
      for (let i = 0; i < slings.length; i++) if (s.slingFlash[i] > 0) {
        const sg = slings[i], f = Math.min(1, s.slingFlash[i] / .1), sp = slingLit[i];
        ctx!.globalAlpha = .9 * f; ctx!.drawImage(sp.canvas, Math.round(-sp.cx), Math.round(-sp.cy));
        const dx = sg.bx - sg.ax, dy = sg.by - sg.ay, m = Math.hypot(dx, dy), bulge = (i === 0 ? 1 : -1) * 3.5 * f;
        const nx = dy / m * bulge, ny = -dx / m * bulge;
        ctx!.strokeStyle = "#ff7a2e"; ctx!.lineWidth = Math.max(2, 5 * k); ctx!.lineCap = "round";
        ctx!.beginPath(); ctx!.moveTo((sg.ax + dx * .06) * k, (sg.ay + dy * .06) * k);
        ctx!.quadraticCurveTo((sg.ax + dx * .5 + nx * 2) * k, (sg.ay + dy * .5 + ny * 2) * k, (sg.bx - dx * .06) * k, (sg.by - dy * .06) * k); ctx!.stroke();
        ctx!.strokeStyle = "#ffd3a8"; ctx!.lineWidth = Math.max(1, 1.6 * k);
        ctx!.beginPath(); ctx!.moveTo((sg.ax + dx * .1) * k, (sg.ay + dy * .1) * k);
        ctx!.quadraticCurveTo((sg.ax + dx * .5 + nx * 2) * k, (sg.ay + dy * .5 + ny * 2) * k, (sg.bx - dx * .1) * k, (sg.by - dy * .1) * k); ctx!.stroke();
        ctx!.globalAlpha = 1;
      }
      // bumpers: hit = full glow fading out; while BUMPERS x2 is live they breathe softly
      const idle = s.combo ? .2 + .16 * Math.sin(clock * 6) : 0;
      for (let i = 0; i < geometry.bumpers.length; i++) {
        const b = geometry.bumpers[i], lit = Math.max(idle, Math.min(1, s.bumperLit[i] / .14));
        if (lit < 1) drawSprite(bumper, b.x, b.y);
        if (lit > 0) { ctx!.globalAlpha = lit; drawSprite(bumperLit, b.x, b.y); ctx!.globalAlpha = 1; }
      }
      drawPlunger();
      drawFlipper(0); drawFlipper(1);
      if (s.ball.active) drawSprite(ball, s.ball.x, s.ball.y);
      drawPops();

      if (s.score > high) high = s.score;
      if (s.phase === "over" && high > savedHigh) { savedHigh = high; writeHigh(high); }
      // game over: the LCD alternates GAME OVER and the final score
      const blink = s.phase === "over" && Math.floor(clock / .9) % 2 === 0;
      if (revision !== s.revision || blink !== lastBlink) {
        revision = s.revision; lastBlink = blink;
        setHud({ score: s.score, ball: s.ballNumber, high, message: s.message, phase: s.phase, saver: s.saver > 0, blink });
      }
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup);
    window.addEventListener("blur", releaseAll); document.addEventListener("visibilitychange", visibility);
    surface.addEventListener("pointerdown", down); surface.addEventListener("pointerup", up); surface.addEventListener("pointercancel", up); surface.addEventListener("lostpointercapture", up);
    surface.addEventListener("contextmenu", menu);
    document.addEventListener("gesturestart", menu);
    knobEl.addEventListener("pointerdown", knobDown); knobEl.addEventListener("pointermove", knobMove); knobEl.addEventListener("pointerup", knobUp); knobEl.addEventListener("pointercancel", knobUp); knobEl.addEventListener("lostpointercapture", knobUp);
    const observer = new ResizeObserver(resize); const nav = document.querySelector("nav"); if (nav) observer.observe(nav);
    const sources = ["pb_table", "pb_bumper", "pb_bumper_lit", "pb_ball", "pb_flipper", "pb_plunger", "lcd_panel"];
    Promise.all(sources.map(name => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image(); img.onload = () => img.decode().then(() => resolve(img), reject); img.onerror = () => reject(new Error(name)); img.src = `/arcade/${name}.webp`;
    }))).then(result => {
      if (disposed) return;
      images = result; loaded = true; resize(); setReady(true); surface.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      if (high > savedHigh) writeHigh(high);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", releaseAll); document.removeEventListener("visibilitychange", visibility);
      surface.removeEventListener("pointerdown", down); surface.removeEventListener("pointerup", up); surface.removeEventListener("pointercancel", up); surface.removeEventListener("lostpointercapture", up);
      surface.removeEventListener("contextmenu", menu);
      document.removeEventListener("gesturestart", menu);
      knobEl.removeEventListener("pointerdown", knobDown); knobEl.removeEventListener("pointermove", knobMove); knobEl.removeEventListener("pointerup", knobUp); knobEl.removeEventListener("pointercancel", knobUp); knobEl.removeEventListener("lostpointercapture", knobUp);
      game.current = null;
    };
  }, []);

  const lcd = art.lcd, side = shared.lcd;
  const sideWidth = view.compact ? compactPanel(view.vw) : Math.max(190, Math.min(300, view.height * .3));
  const sideTop = view.compact ? view.nav + 8 : view.top + view.height * .06;
  const sideLeft = view.compact ? view.vw - GUTTER - sideWidth : view.left + view.width + Math.max(28, view.width * .07);
  // compact: the back link sits on the LCD module's centre line, its text on the left gutter
  const backStyle: CSSProperties = view.compact ? { top: sideTop + sideWidth * sharedRatio / 2 - 20, left: GUTTER - 8 } : { top: view.nav };
  const launchDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation(); sfx.unlock();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const s = game.current; if (!s) return;
    if (s.phase === "over") { if (s.timer <= 0) restartRef.current(); return; }
    s.dragging = false; s.plungerHeld = true;
  };
  const launchUp = () => { const s = game.current; if (s && !s.dragging) s.plungerHeld = false; };
  const lcdText = hud.message && hud.message !== "GAME OVER" ? hud.message : hud.phase === "over" && hud.blink ? "GAME OVER" : "";
  return <div className={styles.root} data-compact={view.compact} style={{ "--nav-bottom": `${view.nav}px` } as CSSProperties}>
    <div ref={stage} className={styles.stage} tabIndex={-1} role="application" aria-label="Pinball. Left flipper: left arrow, Z or press the left half of the screen. Right flipper: right arrow, M or press the right half. Hold Space or drag the plunger knob down to launch. Escape returns to the arcade." />
    <button className={`${styles.textButton} ${styles.back}`} style={backStyle} onClick={onBack}>← ARCADE</button>
    {failed ? <div className={styles.failure} role="alert"><p>Game images could not be loaded.</p><button className={styles.textButton} onClick={onBack}>Back to arcade</button></div> : <>
      <div className={styles.table} style={{ left: view.left, top: view.top, width: view.width, height: view.height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.tableArt} src="/arcade/pb_table.webp" width={art.table.width} height={art.table.height} alt="" draggable={false} />
        <div className={styles.lcd} style={{ left: pct(lcd.x), top: pct(lcd.y), width: pct(lcd.w), height: pct(lcd.h) }} aria-live="polite">
          {lcdText ? <span className={styles.lcdText}>{lcdText}</span> : <SevenSeg value={pad(hud.score)} />}
        </div>
        <canvas ref={canvas} className={styles.canvas} />
        <div ref={knob} className={styles.knob} data-dragging={dragging} style={knobBox} aria-hidden="true" />
      </div>
      <div className={styles.side} style={{ left: sideLeft, top: sideTop, width: sideWidth }}>
        <div className={styles.sidePanel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.asset} src="/arcade/lcd_panel.webp" width={side.width} height={side.height} alt="" draggable={false} />
          <div className={styles.sideGlass} style={{ left: pct(side.screen.x), top: pct(side.screen.y), width: pct(side.screen.w), height: pct(side.screen.h) }}>
            <span>BALL</span><span>{Math.min(hud.ball, BALLS)}/{BALLS}</span>
            <span>HIGH</span><span>{pad(hud.high)}</span>
          </div>
        </div>
        <div className={styles.saver} data-on={hud.saver} style={view.compact ? { paddingRight: sideWidth * (1 - side.screen.x - side.screen.w) } : undefined}><span className={styles.saverDot} />BALL SAVER</div>
        {hud.phase === "over" && !view.compact && <button className={styles.restart} onClick={() => restartRef.current()}>PLAY AGAIN</button>}
      </div>
      {!ready && <div className={styles.loading} role="status">LOADING…</div>}
      {view.compact ? <>
        <div className={styles.controls} style={{ left: GUTTER, right: GUTTER }}>
          <p className={styles.hintCompact}><span><b>TAP</b> LEFT / RIGHT HALF</span><span><b>HOLD</b> LAUNCH OR DRAG KNOB</span></p>
          <button className={styles.launch} style={{ width: LAUNCH_W, height: LAUNCH_H }} onPointerDown={launchDown} onPointerUp={launchUp} onPointerCancel={launchUp} onLostPointerCapture={launchUp} onContextMenu={e => e.preventDefault()}>{hud.phase === "over" ? "PLAY AGAIN" : "LAUNCH"}</button>
        </div>
      </> : <p className={styles.hint}>← / Z  LEFT · → / M  RIGHT · HOLD SPACE OR DRAG THE KNOB TO LAUNCH · ESC  BACK</p>}
    </>}
  </div>;
}

