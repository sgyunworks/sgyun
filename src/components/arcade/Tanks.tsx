"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import art from "./art.json";
import tanksArt from "./tanks.art.json";
import { BARREL_STRETCH, COLOURS, HULL_LENGTH, PLAYER, SHELL_LENGTH, SHELL_SPEED, STAGES, STEP, WORLD_H, WORLD_W, createGame, geometryFromArt, lineClear, pivot, pivotX, pivotY, queueFire, setPlayerInput, setTouchAssist, step, type Colour, type Game, type TanksArt } from "./tanksPhysics";
import styles from "./tanks.module.css";
import { sfx } from "./sfx";

const ART = tanksArt as unknown as TanksArt;
const geometry = geometryFromArt(ART);
const LCD_WIDTH = 290;
type Sprite = { canvas: HTMLCanvasElement; ax: number; ay: number };
/** left/top/width/height = the canvas element's unrotated CSS box; cx/cy = arena centre on screen. */
type View = { left: number; top: number; width: number; height: number; lcdTop: number; nav: number; rotated: boolean; cx: number; cy: number; lcdLeft: number; lcdWidth: number; statusY: number };
type Hud = { stage: number; alive: boolean[]; message: string; sub: string; phase: string; blink: boolean; score: number[]; round: number };
const MATCHUP = ["1:1", "1:1:1", "1:1:1:1"];
const fractionRect = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });
const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
/** Ricochet (bouncing) shell colour: signal yellow-orange. */
const RICOCHET = "#ffb21a";
// Touch layout: control band under a rotated (portrait) arena, side gutters in landscape.
const CTRL_BAND = 156, CTRL_SIDE = 156, GUTTER = 16, STICK_DEAD = .14, TAP_HOLD = .9;
/** Touch: transient text (countdown, round results, retry) lives in its own band between the LCD
 *  row and the arena, so it never covers tanks or obstacles. */
const STATUS_BAND = 46;
/** Soft drop shadows, drawn separately so they stay screen-down-right whatever the hull angle or
 *  view rotation (world units): offset right / down, blur radius, opacity. */
const SHADOW_R = 2.6, SHADOW_D = 4.4, SHADOW_BLUR = 3.2, SHADOW_ALPHA = .34, TURRET_SHADOW = .55;
const wrapA = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
type TouchApi = { stickDown: (e: PointerEvent, el: HTMLElement) => void; stickMove: (e: PointerEvent) => void; stickUp: (e: PointerEvent) => void; fire: () => void };

// ko is accepted for the shared game signature; the arcade UI is English-only by design.
export default function Tanks({ onBack }: { ko: boolean; onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const action = useRef<() => void>(() => {});
  const root = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const touchApi = useRef<TouchApi>({ stickDown() {}, stickMove() {}, stickUp() {}, fire() {} });
  const [touch, setTouch] = useState(false);
  const [view, setView] = useState<View>({ left: 0, top: 270, width: 0, height: 0, lcdTop: 120, nav: 72, rotated: false, cx: 0, cy: 270, lcdLeft: 0, lcdWidth: LCD_WIDTH, statusY: 270 });
  const [hud, setHud] = useState<Hud>({ stage: 0, alive: [true, true], message: "3", sub: "", phase: "countdown", blink: false, score: [0, 0], round: 0 });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onBack(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onBack]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext("2d", { alpha: true });
    if (!ctx) { setFailed(true); return; }
    let disposed = false, raf = 0, previous = 0, nextFrame = 0, accumulator = 0, scale = 1, bounds = { left: 0, top: 0, width: 1, height: 1 };
    let loaded = false, hidden = document.hidden, manualPause = false;
    let images: Record<string, HTMLImageElement> = {};
    const hulls = {} as Record<Colour, Sprite>, turrets = {} as Record<Colour, Sprite>, hullShadows = {} as Record<Colour, Sprite>, turretShadows = {} as Record<Colour, Sprite>;
    let shell: Sprite, ricoShell: Sprite, ricoHalo: HTMLCanvasElement, ricoTrail: HTMLCanvasElement, puff: HTMLCanvasElement, staticLayer: HTMLCanvasElement, tracks: HTMLCanvasElement, trackCtx: CanvasRenderingContext2D, glow: HTMLCanvasElement, streak: HTMLCanvasElement;
    let layoutStage = -1, layoutRound = -1, fadeClock = 0, shadowX = SHADOW_R, shadowY = SHADOW_D;
    // Sound: event counters already voiced (diffed against Game.stats each frame), last phase.
    let heardShots = 0, heardPlayerShots = 0, heardBounces = 0, heardBursts = 0, heardKills = 0, heardPhase = "", unlocked = false;
    const unlockSound = () => { if (!unlocked) { unlocked = true; sfx.unlock(); } };
    // Nothing sounds before the first user gesture (browsers would refuse the audio context anyway).
    const play = (name: Parameters<typeof sfx.play>[0], intensity?: number) => { if (unlocked) sfx.play(name, intensity); };
    let lastRevision = -1, lastMessage = "", lastBlink = false, lastPhase = "";
    const lastOdo = new Float64Array(4), wasAlive = [true, true, true, true];
    const keys = new Set<string>();
    let pointerX = -1, pointerY = -1;
    // Screen ↔ world mapping. `rotated`: portrait touch view, canvas shown with CSS rotate(-90deg)
    // (world +x points up the screen, the player's spawn sits at the bottom near the controls).
    let turnedView = false, centreX = 0, centreY = 0, worldX = 0, worldY = 0;
    function toWorld(px: number, py: number) {
      if (!turnedView) { worldX = (px - bounds.left) / bounds.width * WORLD_W; worldY = (py - bounds.top) / bounds.height * WORLD_H; return; }
      const lx = -(py - centreY), ly = px - centreX;
      worldX = (lx / bounds.width + .5) * WORLD_W; worldY = (ly / bounds.height + .5) * WORLD_H;
    }
    // Touch state (all mutable scalars; no allocation in the loop).
    const coarse = window.matchMedia("(pointer: coarse)");
    let touchMode = coarse.matches, stickId = -1, stickCX = 0, stickCY = 0, stickR = 1, stickX = 0, stickY = 0, stickMag = 0, reversing = false;
    let tapX = 0, tapY = 0, tapHold = 0, unlock: (() => void) | null = null;
    const fresh = (stage: number) => {
      game.current = createGame(geometry, stage, (Date.now() & 0xffffffff) >>> 0); setTouchAssist(game.current, touchMode); layoutStage = -1; lastRevision = -1; previous = 0; accumulator = 0;
      heardShots = heardPlayerShots = heardBounces = heardBursts = heardKills = 0; heardPhase = "";
    };
    fresh(0);
    action.current = () => {
      const s = game.current; if (!s) return;
      if (s.phase === "lost" && s.timer <= 0) fresh(s.stage);
      else if (s.phase === "complete") fresh(0);
      unlockSound(); element.focus({ preventScroll: true });
    };
    function offscreen(w: number, h: number) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
    /** Pre-scale an image so that `worldWidth` world units of the full image map to canvas pixels. */
    function sprite(img: HTMLImageElement, worldWidth: number, ax: number, ay: number): Sprite {
      const c = offscreen(worldWidth * scale, worldWidth * scale * img.naturalHeight / img.naturalWidth);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      return { canvas: c, ax: ax * c.width, ay: ay * c.height };
    }
    /** Turret: cap drawn as-is, barrel segment (right of the cap edge) stretched by BARREL_STRETCH. */
    function turretSprite(img: HTMLImageElement, worldWidth: number, ax: number, ay: number, split: number): Sprite {
      const w = worldWidth * scale, h = w * img.naturalHeight / img.naturalWidth, sx = split * img.naturalWidth;
      const c = offscreen(w * (split + (1 - split) * BARREL_STRETCH), h), g = c.getContext("2d")!;
      g.drawImage(img, 0, 0, sx, img.naturalHeight, 0, 0, split * w, h);
      g.drawImage(img, sx, 0, img.naturalWidth - sx, img.naturalHeight, split * w - .5, 0, (1 - split) * w * BARREL_STRETCH + .5, h);
      return { canvas: c, ax: ax * w, ay: ay * h };
    }
    /** Soft drop shadow of a sprite: its silhouette box-blurred (3 passes ≈ Gaussian) into an
     *  offscreen canvas. Built on resize / stage change only, never in the animation loop. */
    function shadowOf(src: HTMLCanvasElement, ax: number, ay: number, blur: number, alpha: number): Sprite {
      const r = Math.max(1, Math.round(blur * scale)), pad = r * 3 + 2;
      const c = offscreen(src.width + pad * 2, src.height + pad * 2), g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(src, pad, pad);
      const img = g.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width, h = c.height, n = 2 * r + 1;
      const a = new Float32Array(w * h), b = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
      for (let pass = 0; pass < 3; pass++) {
        for (let y = 0; y < h; y++) {
          const row = y * w; let sum = 0;
          for (let x = -r; x <= r; x++) sum += a[row + Math.min(w - 1, Math.max(0, x))];
          for (let x = 0; x < w; x++) { b[row + x] = sum / n; sum += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)]; }
        }
        for (let x = 0; x < w; x++) {
          let sum = 0;
          for (let y = -r; y <= r; y++) sum += b[Math.min(h - 1, Math.max(0, y)) * w + x];
          for (let y = 0; y < h; y++) { a[y * w + x] = sum / n; sum += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x]; }
        }
      }
      for (let i = 0; i < w * h; i++) { d[i * 4] = 38; d[i * 4 + 1] = 33; d[i * 4 + 2] = 27; d[i * 4 + 3] = a[i] * alpha; }
      g.putImageData(img, 0, 0);
      return { canvas: c, ax: ax + pad, ay: ay + pad };
    }
    function clearTracks() {
      const s = game.current!;
      trackCtx.setTransform(1, 0, 0, 1, 0, 0); trackCtx.clearRect(0, 0, tracks.width, tracks.height);
      for (let i = 0; i < 4; i++) { lastOdo[i] = 0; wasAlive[i] = true; }
      layoutRound = s.round;
    }
    function buildStatic() {
      const s = game.current!;
      staticLayer = offscreen(element!.width, element!.height);
      const g = staticLayer.getContext("2d")!;
      // Thin, faint arena border (code-drawn UI detail only).
      g.strokeStyle = "rgba(46, 51, 43, 0.22)"; g.lineWidth = Math.max(1, scale * 1.2);
      const inset = g.lineWidth / 2, r = 14 * scale;
      g.beginPath(); g.roundRect(inset, inset, staticLayer.width - inset * 2, staticLayer.height - inset * 2, r); g.stroke();
      // Obstacles: soft shadows first (screen-down-right, same as the tanks'), then the objects.
      for (let pass = 0; pass < 2; pass++) for (const o of s.obstacles) {
        const img = images[`obstacle_${o.name}`], w = o.w * scale, h = o.h * scale;
        if (pass === 0) {
          const art = offscreen(w, h); art.getContext("2d")!.drawImage(img, 0, 0, art.width, art.height);
          const sh = shadowOf(art, w / 2, h / 2, SHADOW_BLUR * 1.25, SHADOW_ALPHA);
          g.setTransform(o.flip ? -1 : 1, 0, 0, 1, (o.x + shadowX * 1.15) * scale, (o.y + shadowY * 1.15) * scale);
          g.drawImage(sh.canvas, -sh.ax, -sh.ay);
        } else {
          g.setTransform(o.flip ? -1 : 1, 0, 0, 1, o.x * scale, o.y * scale);
          g.drawImage(img, -w / 2, -h / 2, w, h);
        }
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      clearTracks();
      layoutStage = s.stage;
    }
    function resize() {
      let width: number, height: number;
      if (!touchMode) {
        const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 70);
        const lcdHeight = LCD_WIDTH * art.lcd.height / art.lcd.width;
        const top = Math.max(nav + 70, nav + 2 + lcdHeight + 10), bottom = window.innerHeight - 90;
        width = Math.max(1, Math.min(window.innerWidth - 80, 1700, (bottom - top) * WORLD_W / WORLD_H));
        height = width * WORLD_H / WORLD_W;
        bounds = { left: (window.innerWidth - width) / 2, top: top + Math.max(0, bottom - top - height) / 2, width, height };
        turnedView = false; centreX = bounds.left + width / 2; centreY = bounds.top + height / 2;
        // Transient text sits in the strip right of the LCD, above the arena (never over the arena).
        const lcdTop = Math.max(nav + 2, bounds.top - lcdHeight - 10);
        setView({ ...bounds, lcdTop, nav, rotated: turnedView, cx: centreX, cy: centreY, lcdLeft: bounds.left, lcdWidth: LCD_WIDTH, statusY: lcdTop + lcdHeight / 2 });
      } else {
        // Touch: back button + compact LCD on one row, arena below, controls at the bottom (portrait)
        // or in the side gutters (landscape). Portrait screens rotate the view when that is larger.
        const iw = window.innerWidth, ih = window.innerHeight, portrait = ih > iw;
        const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 0);
        const lcdWidth = Math.max(140, Math.min(portrait ? 190 : 220, iw - 2 * GUTTER - 120)), lcdHeight = lcdWidth * art.lcd.height / art.lcd.width;
        const lcdTop = nav + 6, bandTop = lcdTop + lcdHeight + 2, top = bandTop + STATUS_BAND + 4;
        const availW = iw - 2 * GUTTER - (portrait ? 0 : 2 * CTRL_SIDE), availH = Math.max(60, ih - top - (portrait ? CTRL_BAND : GUTTER));
        const normal = Math.max(1, Math.min(availW, availH * WORLD_W / WORLD_H, 1700));
        const turned = portrait ? Math.max(1, Math.min(availH, (iw - 2 * GUTTER) * WORLD_W / WORLD_H)) : 0;
        turnedView = turned > normal * 1.15;
        width = turnedView ? turned : normal; height = width * WORLD_H / WORLD_W;
        const boxW = turnedView ? height : width, boxH = turnedView ? width : height;
        centreX = iw / 2; centreY = top + Math.max(0, availH - boxH) / 2 + boxH / 2;
        bounds = { left: centreX - width / 2, top: centreY - height / 2, width, height };
        setView({ ...bounds, lcdTop, nav, rotated: turnedView, cx: centreX, cy: centreY, lcdLeft: iw - GUTTER - lcdWidth, lcdWidth, statusY: centreY - boxH / 2 - STATUS_BAND / 2 - 2 }); // band hugs the arena's top edge
        stickRelease();
      }
      // Screen-down-right in world units: the portrait view shows the canvas rotated -90°, where
      // screen down = world -x and screen right = world +y.
      shadowX = turnedView ? -SHADOW_D : SHADOW_R; shadowY = turnedView ? SHADOW_R : SHADOW_D;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      element!.width = Math.round(width * dpr); element!.height = Math.round(height * dpr);
      scale = element!.width / WORLD_W;
      if (!loaded) return;
      // All sprite canvases are allocated here (on resize), never in the animation loop.
      for (const c of COLOURS) {
        const h = ART.hulls[c], t = ART.turrets[c];
        hulls[c] = sprite(images[`tank_hull_${c}`], HULL_LENGTH / h.body.w, h.body.x + h.body.w / 2, h.body.y + h.body.h / 2);
        turrets[c] = turretSprite(images[`tank_turret_${c}`], geometry.capR / t.cap.r, t.cap.cx, t.cap.cy, t.cap.cx + t.cap.r);
        hullShadows[c] = shadowOf(hulls[c].canvas, hulls[c].ax, hulls[c].ay, SHADOW_BLUR, SHADOW_ALPHA);
        turretShadows[c] = shadowOf(turrets[c].canvas, turrets[c].ax, turrets[c].ay, SHADOW_BLUR * .7, SHADOW_ALPHA * .8);
      }
      shell = sprite(images.tank_shell, SHELL_LENGTH / ART.shell.body.w, ART.shell.body.x + ART.shell.body.w / 2, ART.shell.body.y + ART.shell.body.h / 2);
      // Ricochet shell: the same raster shell tinted signal yellow-orange (cached, no filters),
      // a baked bright ring halo, and a longer dashed trail.
      ricoShell = sprite(images.tank_shell, SHELL_LENGTH * 1.12 / ART.shell.body.w, ART.shell.body.x + ART.shell.body.w / 2, ART.shell.body.y + ART.shell.body.h / 2);
      { const g = ricoShell.canvas.getContext("2d")!; g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(255, 178, 26, 0.78)"; g.fillRect(0, 0, ricoShell.canvas.width, ricoShell.canvas.height);
        g.fillStyle = "rgba(255, 250, 235, 0.35)"; g.fillRect(0, ricoShell.canvas.height * .3, ricoShell.canvas.width, ricoShell.canvas.height * .22); }
      ricoHalo = offscreen(30 * scale, 30 * scale);
      { const g = ricoHalo.getContext("2d")!, c = ricoHalo.width / 2, gr = g.createRadialGradient(c, c, 0, c, c, c);
        gr.addColorStop(0, "rgba(255, 236, 180, 0.55)"); gr.addColorStop(.45, "rgba(255, 178, 26, 0.25)"); gr.addColorStop(1, "rgba(255, 178, 26, 0)"); g.fillStyle = gr; g.fillRect(0, 0, ricoHalo.width, ricoHalo.height);
        g.strokeStyle = "rgba(245, 120, 10, 0.9)"; g.lineWidth = Math.max(1, 1.3 * scale); g.beginPath(); g.arc(c, c, 10.5 * scale, 0, Math.PI * 2); g.stroke(); }
      ricoTrail = offscreen(78 * scale, Math.max(2, 3.4 * scale));
      { const g = ricoTrail.getContext("2d")!, gr = g.createLinearGradient(0, 0, ricoTrail.width, 0), dash = 7 * scale;
        gr.addColorStop(0, "rgba(255, 178, 26, 0)"); gr.addColorStop(1, "rgba(245, 120, 10, 0.85)"); g.fillStyle = gr;
        for (let x = ricoTrail.width - dash; x > -dash; x -= dash * 1.7) g.fillRect(x, 0, dash, ricoTrail.height); }
      puff = offscreen(140 * scale, 140 * scale); puff.getContext("2d")!.drawImage(images.fx_puff, 0, 0, puff.width, puff.height);
      glow = offscreen(150 * scale, 150 * scale);
      { const g = glow.getContext("2d")!, gr = g.createRadialGradient(glow.width / 2, glow.height / 2, 0, glow.width / 2, glow.height / 2, glow.width / 2);
        gr.addColorStop(0, "rgba(245, 101, 25, 0.30)"); gr.addColorStop(.55, "rgba(245, 101, 25, 0.10)"); gr.addColorStop(1, "rgba(245, 101, 25, 0)"); g.fillStyle = gr; g.fillRect(0, 0, glow.width, glow.height); }
      streak = offscreen(46 * scale, Math.max(2, 3.2 * scale));
      { const g = streak.getContext("2d")!, gr = g.createLinearGradient(0, 0, streak.width, 0);
        gr.addColorStop(0, "rgba(60, 58, 54, 0)"); gr.addColorStop(1, "rgba(60, 58, 54, 0.32)"); g.fillStyle = gr; g.fillRect(0, 0, streak.width, streak.height); }
      tracks = offscreen(element!.width, element!.height); trackCtx = tracks.getContext("2d")!;
      buildStatic();
      accumulator = 0; previous = 0;
    }
    const isUi = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "BUTTON" || t.tagName === "SELECT" || t.tagName === "INPUT");
    function lockPage() {
      if (unlock) return;
      const html = document.documentElement, body = document.body, prev = [html.style.overscrollBehavior, body.style.overflow, body.style.overscrollBehavior];
      html.style.overscrollBehavior = "none"; body.style.overflow = "hidden"; body.style.overscrollBehavior = "none";
      const block = (e: Event) => { if (e.cancelable) e.preventDefault(); };
      const el = root.current;
      el?.addEventListener("touchmove", block, { passive: false }); document.addEventListener("gesturestart", block);
      unlock = () => { html.style.overscrollBehavior = prev[0]; body.style.overflow = prev[1]; body.style.overscrollBehavior = prev[2]; el?.removeEventListener("touchmove", block); document.removeEventListener("gesturestart", block); };
    }
    function setTouchMode(on: boolean) {
      if (touchMode === on && (!on || unlock)) return;
      touchMode = on; setTouch(on); if (game.current) setTouchAssist(game.current, on);
      if (on) lockPage(); else { unlock?.(); unlock = null; }
      resize();
    }
    function stickRelease() { stickId = -1; stickX = 0; stickY = 0; stickMag = 0; reversing = false; if (knob.current) knob.current.style.transform = ""; }
    function stickUpdate(e: PointerEvent) {
      const dx = e.clientX - stickCX, dy = e.clientY - stickCY, len = Math.hypot(dx, dy), m = Math.min(1, len / stickR), k = len > stickR ? stickR / len : 1;
      if (knob.current) knob.current.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      stickMag = m <= STICK_DEAD ? 0 : (m - STICK_DEAD) / (1 - STICK_DEAD);
      stickX = len > 0 ? dx / len : 0; stickY = len > 0 ? dy / len : 0;
    }
    touchApi.current = {
      stickDown(e, el) {
        if (stickId !== -1) return;
        setTouchMode(true); unlockSound();
        const ring = el.firstElementChild as HTMLElement, r = ring.getBoundingClientRect();
        stickId = e.pointerId; stickCX = r.left + r.width / 2; stickCY = r.top + r.height / 2; stickR = r.width * .28;
        el.setPointerCapture(e.pointerId); stickUpdate(e);
      },
      stickMove(e) { if (e.pointerId === stickId) stickUpdate(e); },
      stickUp(e) { if (e.pointerId === stickId) stickRelease(); },
      fire() {
        setTouchMode(true); unlockSound();
        const s = game.current; if (!s) return;
        if (s.phase === "play") queueFire(s); else action.current();
      },
    };
    const pointermove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (touchMode && e.pointerType === "mouse" && !coarse.matches) setTouchMode(false);
      pointerX = e.clientX; pointerY = e.clientY;
    };
    const pointerdown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || (e.pointerType === "pen" && touchMode)) {
        // Tap on the arena: aim the turret at that point and fire (or continue/retry between rounds).
        e.preventDefault(); setTouchMode(true); unlockSound();
        const s = game.current; if (!s) return;
        toWorld(e.clientX, e.clientY); tapX = worldX; tapY = worldY; tapHold = TAP_HOLD;
        if (s.phase === "play") queueFire(s); else action.current();
        return;
      }
      if (e.button !== 0) return;
      unlockSound(); pointerX = e.clientX; pointerY = e.clientY;
      const s = game.current; if (!s) return;
      element.focus({ preventScroll: true });
      if (s.phase === "play") queueFire(s); else action.current();
    };
    const keydown = (e: KeyboardEvent) => {
      if (isUi(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = game.current; if (!s) return;
      unlockSound();
      if (MOVE_KEYS.has(e.code)) { e.preventDefault(); keys.add(e.code); return; }
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (e.repeat) return; if (s.phase === "play" && e.code === "Space") queueFire(s); else action.current(); return; }
      if (e.code === "KeyP") { manualPause = !manualPause; setPaused(manualPause || hidden); previous = 0; accumulator = 0; keys.clear(); }
    };
    const keyup = (e: KeyboardEvent) => { keys.delete(e.code); };
    const visibility = () => { hidden = document.hidden; previous = 0; accumulator = 0; keys.clear(); stickRelease(); setPaused(hidden || manualPause); };
    const blur = () => { keys.clear(); stickRelease(); };
    let orientTimer = 0;
    const orientation = () => { resize(); window.clearTimeout(orientTimer); orientTimer = window.setTimeout(resize, 300); }; // iOS reports the new size late
    function rotated(target: CanvasRenderingContext2D, img: HTMLCanvasElement, ax: number, ay: number, x: number, y: number, angle: number) {
      const c = Math.cos(angle), sn = Math.sin(angle);
      target.setTransform(c, sn, -sn, c, x * scale, y * scale); target.drawImage(img, -ax, -ay);
    }
    function stampTracks(s: Game, dt: number) {
      fadeClock += dt;
      if (fadeClock > .25) {
        // Slow fade of the persistent track layer (one full-canvas fill every 250 ms).
        fadeClock = 0; trackCtx.setTransform(1, 0, 0, 1, 0, 0);
        trackCtx.globalCompositeOperation = "destination-out"; trackCtx.fillStyle = "rgba(0, 0, 0, 0.05)"; trackCtx.fillRect(0, 0, tracks.width, tracks.height);
        trackCtx.globalCompositeOperation = "source-over";
      }
      trackCtx.fillStyle = "rgba(78, 74, 67, 0.13)";
      for (const k of s.tanks) {
        if (!k.alive) {
          if (wasAlive[k.id]) { // scorch mark where a tank was destroyed
            wasAlive[k.id] = false; trackCtx.globalAlpha = .22;
            rotated(trackCtx, puff, puff.width / 2, puff.height / 2, k.x, k.y, k.a); trackCtx.globalAlpha = 1;
          }
          continue;
        }
        if (k.odometer - lastOdo[k.id] < 7) continue;
        lastOdo[k.id] = k.odometer;
        const c = Math.cos(k.a), sn = Math.sin(k.a), off = geometry.hy * .74 * scale;
        trackCtx.setTransform(c, sn, -sn, c, k.x * scale, k.y * scale);
        trackCtx.fillRect(-2.2 * scale, -off - 2.6 * scale, 4.4 * scale, 5.2 * scale);
        trackCtx.fillRect(-2.2 * scale, off - 2.6 * scale, 4.4 * scale, 5.2 * scale);
      }
      trackCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    function frame(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (!loaded || hidden || manualPause) return;
      // 60 Hz output on 120/144 Hz displays; simulation stays at 240 Hz.
      if (previous && now < nextFrame - 1) return;
      nextFrame = previous ? Math.max(nextFrame + 1000 / 60, now) : now + 1000 / 60;
      let s = game.current!;
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
      // Direct 1:1 input: keys set throttle/turn, the pointer is the exact aim point.
      let throttle = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      let turn = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      const me = s.tanks[PLAYER];
      let aimX: number, aimY: number;
      if (!touchMode) {
        aimX = pointerX < 0 ? me.x + Math.cos(me.turret) * 100 : (pointerX - bounds.left) / bounds.width * WORLD_W;
        aimY = pointerY < 0 ? me.y + Math.sin(me.turret) * 100 : (pointerY - bounds.top) / bounds.height * WORLD_H;
      } else {
        // Joystick = desired heading (screen direction → world direction): rotate the hull toward
        // it, throttle by stick magnitude, reverse (with hysteresis) when it points mostly backward.
        if (stickMag > 0) {
          const hx = turnedView ? -stickY : stickX, hy = turnedView ? stickX : stickY;
          const diff = wrapA(Math.atan2(hy, hx) - me.a), ad = Math.abs(diff);
          if (!reversing && ad > 2.2) reversing = true; else if (reversing && ad < 1.2) reversing = false;
          const d = reversing ? wrapA(diff + Math.PI) : diff;
          turn = Math.max(-1, Math.min(1, d * 3));
          throttle = (reversing ? -1 : 1) * stickMag * Math.max(0, Math.cos(d));
        }
        // Turret: a tapped point for a moment, otherwise auto-aim at the nearest visible enemy
        // (mild lead); with nobody in sight the turret holds its angle.
        tapHold = Math.max(0, tapHold - dt);
        pivot(s, me);
        if (tapHold > 0) { aimX = tapX; aimY = tapY; }
        else {
          let best = -1, bestD = Infinity;
          for (const k of s.tanks) if (k.alive && k.id !== PLAYER) {
            const dd = (k.x - me.x) * (k.x - me.x) + (k.y - me.y) * (k.y - me.y);
            if (dd < bestD && lineClear(s, pivotX, pivotY, k.x, k.y)) { bestD = dd; best = k.id; }
          }
          if (best >= 0) { const k = s.tanks[best], tof = Math.sqrt(bestD) / SHELL_SPEED * .35; aimX = k.x + k.vx * tof; aimY = k.y + k.vy * tof; }
          else { aimX = pivotX + Math.cos(me.turret) * 100; aimY = pivotY + Math.sin(me.turret) * 100; }
        }
      }
      setPlayerInput(s, me.alive ? throttle : 0, me.alive ? turn : 0, aimX, aimY);
      accumulator += dt;
      while (accumulator >= STEP) { step(s); accumulator -= STEP; }
      if (s.phase === "won") {
        if (s.timer <= 0) {
          if (s.stage < STAGES.length - 1) { fresh(s.stage + 1); s = game.current!; }
          else { s.phase = "complete"; s.revision++; }
        }
      }
      if (layoutStage !== s.stage) buildStatic();
      else if (layoutRound !== s.round) clearTracks(); // fresh floor for every round
      // Sound effects for this frame's simulation events (each voiced once; sfx also rate-limits).
      const st = s.stats;
      if (st.playerShots > heardPlayerShots) play("fire");
      if (st.shots - st.playerShots > heardShots - heardPlayerShots) play("fire", .6);
      if (st.bounces > heardBounces) play("ricochet");
      if (st.bursts > heardBursts) play("hit", .5);
      if (st.kills > heardKills) play("boom");
      heardShots = st.shots; heardPlayerShots = st.playerShots; heardBounces = st.bounces; heardBursts = st.bursts; heardKills = st.kills;
      if (s.phase !== heardPhase) {
        if (s.phase === "won" || (s.phase === "round" && s.roundWinner === 0)) play("win");
        else if (s.phase === "lost" || (s.phase === "round" && s.roundWinner === 1)) play("lose");
        heardPhase = s.phase;
      }
      stampTracks(s, dt);
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, element!.width, element!.height);
      ctx!.drawImage(tracks, 0, 0);
      ctx!.drawImage(staticLayer, 0, 0);
      if (me.alive) { ctx!.globalAlpha = .9; ctx!.drawImage(glow, me.x * scale - glow.width / 2, me.y * scale - glow.height / 2); ctx!.globalAlpha = 1; }
      // Shadows rotate with their sprite's shape but are offset in screen space (down-right):
      // hull shadows on the floor, then hulls, then turret shadows (cast on the hull), then turrets.
      for (const k of s.tanks) if (k.alive) { const h = hullShadows[k.colour]; rotated(ctx!, h.canvas, h.ax, h.ay, k.x + shadowX, k.y + shadowY, k.a); }
      for (const k of s.tanks) if (k.alive) rotated(ctx!, hulls[k.colour].canvas, hulls[k.colour].ax, hulls[k.colour].ay, k.x, k.y, k.a);
      for (let pass = 0; pass < 2; pass++) for (const k of s.tanks) if (k.alive) {
        const c = Math.cos(k.a), sn = Math.sin(k.a), px = k.x + geometry.pivotX * c - geometry.pivotY * sn, py = k.y + geometry.pivotX * sn + geometry.pivotY * c;
        if (pass === 0) { const t = turretShadows[k.colour]; rotated(ctx!, t.canvas, t.ax, t.ay, px + shadowX * TURRET_SHADOW, py + shadowY * TURRET_SHADOW, k.turret); }
        else rotated(ctx!, turrets[k.colour].canvas, turrets[k.colour].ax, turrets[k.colour].ay, px, py, k.turret);
      }
      for (const sh of s.shells) if (sh.active) {
        const a = Math.atan2(sh.dy, sh.dx);
        if (sh.ricochet) {
          ctx!.setTransform(1, 0, 0, 1, 0, 0); ctx!.drawImage(ricoHalo, sh.x * scale - ricoHalo.width / 2, sh.y * scale - ricoHalo.height / 2);
          rotated(ctx!, ricoTrail, ricoTrail.width + ricoShell.ax * .4, ricoTrail.height / 2, sh.x, sh.y, a);
          rotated(ctx!, ricoShell.canvas, ricoShell.ax, ricoShell.ay, sh.x, sh.y, a);
        } else {
          rotated(ctx!, streak, streak.width + shell.ax * .4, streak.height / 2, sh.x, sh.y, a);
          rotated(ctx!, shell.canvas, shell.ax, shell.ay, sh.x, sh.y, a);
        }
      }
      if (touchMode && tapHold > 0 && s.phase === "play") { // thin tap marker (UI detail)
        ctx!.setTransform(1, 0, 0, 1, 0, 0); ctx!.globalAlpha = tapHold / TAP_HOLD; ctx!.strokeStyle = "#f56519"; ctx!.lineWidth = Math.max(1, 1.4 * scale);
        ctx!.beginPath(); ctx!.arc(tapX * scale, tapY * scale, 13 * scale, 0, Math.PI * 2); ctx!.stroke(); ctx!.globalAlpha = 1;
      }
      for (const f of s.fx) if (f.active) {
        const k = f.t / f.dur, size = f.size * (.55 + .65 * k) * scale;
        ctx!.globalAlpha = Math.max(0, 1 - k * k);
        const c = Math.cos(f.rot), sn = Math.sin(f.rot);
        ctx!.setTransform(c, sn, -sn, c, f.x * scale, f.y * scale);
        ctx!.drawImage(puff, -size / 2, -size / 2, size, size);
      }
      ctx!.globalAlpha = 1; ctx!.setTransform(1, 0, 0, 1, 0, 0);
      const playTime = s.elapsed - s.playStart;
      const message = s.phase === "countdown" ? String(Math.max(1, Math.ceil(s.timer))) : s.phase === "play" && playTime < .6 ? "GO"
        : s.phase === "round" ? `ROUND ${s.round + 1} · ${s.roundWinner === 0 ? "YOU" : "CPU"}` : s.phase === "won" ? "STAGE CLEAR" : s.phase === "lost" ? "DESTROYED" : s.phase === "complete" ? "ALL CLEAR" : "";
      const blink = (s.phase === "won" || s.phase === "lost") && Math.floor(s.elapsed * 5) % 2 === 0;
      const phaseKey: string = s.phase === "lost" && s.timer <= 0 ? "lost-ready" : s.phase;
      if (s.revision !== lastRevision || message !== lastMessage || blink !== lastBlink || phaseKey !== lastPhase) {
        if (message !== lastMessage) { if (message === "GO") play("go"); else if (s.phase === "countdown") play("count"); }
        lastRevision = s.revision; lastMessage = message; lastBlink = blink; lastPhase = phaseKey;
        const score = `YOU ${s.score[0]} – ${s.score[1]} CPU`;
        const sub = s.phase === "countdown" ? (s.round === 0 ? (touchMode ? "Stick drives · tap to fire" : "Best of 3 rounds — aim, drive, fire on GO") : `Round ${s.round + 1} · ${score}`)
          : s.phase === "round" ? score : s.phase === "won" && s.stage < STAGES.length - 1 ? `${score} · next: stage ${s.stage + 2}, ${MATCHUP[s.stage + 1]}`
          : s.phase === "won" || s.phase === "lost" ? score : s.phase === "complete" ? "Three stages cleared" : "";
        setHud({ stage: s.stage, alive: s.tanks.map(k => k.alive), message, sub, phase: lastPhase, blink, score: [s.score[0], s.score[1]], round: s.round });
      }
    }
    if (touchMode) { setTouch(true); setTouchAssist(game.current!, true); lockPage(); }
    resize();
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", orientation); window.visualViewport?.addEventListener("resize", resize); window.addEventListener("pointermove", pointermove); element.addEventListener("pointerdown", pointerdown);
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    const observer = new ResizeObserver(resize); const nav = document.querySelector("nav"); if (nav) observer.observe(nav);
    const names = [...COLOURS.flatMap(c => [`tank_hull_${c}`, `tank_turret_${c}`]), "tank_shell", "fx_puff", ...Object.keys(ART.obstacles).map(o => `obstacle_${o}`)];
    Promise.all(names.map(name => new Promise<[string, HTMLImageElement]>((resolve, reject) => {
      const img = new Image(); img.onload = () => img.decode().then(() => resolve([name, img]), reject); img.onerror = () => reject(new Error(name)); img.src = `/arcade/tanks_${name}.webp`;
    }))).then(result => {
      if (disposed) return;
      images = Object.fromEntries(result); loaded = true; resize(); setReady(true); element.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect(); window.clearTimeout(orientTimer); unlock?.(); unlock = null;
      window.removeEventListener("resize", resize); window.removeEventListener("orientationchange", orientation); window.visualViewport?.removeEventListener("resize", resize); window.removeEventListener("pointermove", pointermove); element.removeEventListener("pointerdown", pointerdown);
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
      game.current = null;
    };
  }, []);

  const showButton = hud.phase === "lost-ready" || hud.phase === "complete";
  return <div ref={root} className={styles.root} data-touch={touch || undefined} style={{ "--nav-bottom": `${view.nav}px` } as CSSProperties}>
    <button className={`${styles.textButton} ${styles.back}`} style={touch ? { left: GUTTER - 6, top: view.lcdTop + view.lcdWidth * art.lcd.height / art.lcd.width / 2, transform: "translateY(-50%)" } : undefined} onClick={onBack}>← ARCADE</button>
    {failed ? <div className={styles.failure} role="alert"><p>Game images could not be loaded.</p><button className={styles.textButton} onClick={onBack}>Back to arcade</button></div> : <>
      <div className={styles.lcd} style={{ left: view.lcdLeft, top: view.lcdTop, width: view.lcdWidth }}>
        <div style={{ position: "relative", aspectRatio: `${art.lcd.width}/${art.lcd.height}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.asset} src="/arcade/lcd_panel.webp" width={art.lcd.width} height={art.lcd.height} alt="" draggable={false} />
          <div className={styles.lcdGlass} style={fractionRect(art.lcd.screen)} data-blink={hud.blink} role="status" aria-label={`Stage ${hud.stage + 1}, ${MATCHUP[hud.stage]}, round ${hud.round + 1}, rounds won ${hud.score[0]} to ${hud.score[1]}, ${hud.alive.filter(Boolean).length} tanks left`}>
            <div className={styles.lcdRow}><span>STAGE {hud.stage + 1}</span><span className={styles.pips}>{hud.alive.map((a, i) => <span key={i} className={styles.pip} data-alive={a} />)}</span></div>
            <div className={styles.lcdRow}>
              <span className={styles.rounds}><span className={styles.pipLabel}>YOU</span>{[0, 1].map(i => <span key={i} className={styles.roundPip} data-won={hud.score[0] > i} />)}</span>
              <span className={styles.rounds}>{[1, 0].map(i => <span key={i} className={styles.roundPip} data-won={hud.score[1] > i} />)}<span className={styles.pipLabel}>CPU</span></span>
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvas} className={styles.arena} style={{ left: view.left, top: view.top, width: view.width, height: view.height, transform: view.rotated ? "rotate(-90deg)" : undefined }} tabIndex={0} role="application" aria-label={touch ? "Tanks. The joystick drives, tap the arena to aim and fire, the fire button shoots at the nearest enemy." : "Tanks. W A S D or arrow keys drive, the pointer aims the turret, click or Space fires, P pauses, Escape returns to the arcade."} />
      {!ready && <div className={styles.loading} role="status">LOADING…</div>}
      {(hud.message || paused) && ready && <div className={styles.status} style={{ top: view.statusY }} role="status" aria-live="polite">
        <div className={styles.statusText}>{paused ? "PAUSED" : hud.message}{!paused && hud.sub && <small>{hud.sub}</small>}</div>
        {!paused && showButton && <button className={styles.restart} onClick={() => action.current()}>{hud.phase === "complete" ? "Play again" : "Retry stage"}</button>}
      </div>}
      {hud.stage > 0 && <p className={styles.legend}><span style={{ color: RICOCHET }}>◆</span> bouncing shell</p>}
      {touch ? <>
        <div className={styles.stick} onPointerDown={e => touchApi.current.stickDown(e.nativeEvent, e.currentTarget)} onPointerMove={e => touchApi.current.stickMove(e.nativeEvent)} onPointerUp={e => touchApi.current.stickUp(e.nativeEvent)} onPointerCancel={e => touchApi.current.stickUp(e.nativeEvent)} onLostPointerCapture={e => touchApi.current.stickUp(e.nativeEvent)} aria-hidden="true">
          <div className={styles.stickRing}><div ref={knob} className={styles.stickKnob} /></div>
        </div>
        <button className={styles.fire} onPointerDown={e => { e.preventDefault(); touchApi.current.fire(); }} onContextMenu={e => e.preventDefault()} aria-label="Fire at the nearest enemy">FIRE</button>
      </> : <p className={styles.hint}>WASD / arrows drive · pointer aims · click / space fires · P pause · Esc back</p>}
    </>}
  </div>;
}
