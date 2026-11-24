"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import art from "./pinball.art.json";
import shared from "./art.json";
import { BALLS, createGame, geometryFromArt, restart as restartGame, SLING, step, STEP, type Game, type PinballArt } from "./pinballPhysics";
import styles from "./pinball.module.css";

const geometry = geometryFromArt(art as unknown as PinballArt);
const sprites = art.sprites;
const slings = geometry.segs.filter(s => s.kind === SLING).sort((a, b) => a.index - b.index);
const HIGH_KEY = "sgyun-arcade-pinball-high";
type Sprite = { canvas: HTMLCanvasElement; cx: number; cy: number };
type View = { left: number; top: number; width: number; height: number; nav: number; compact: boolean };
type Hud = { score: number; ball: number; high: number; message: string; phase: Game["phase"]; saver: boolean; blink: boolean };
const pct = (v: number) => `${v * 100}%`;
const pad = (n: number) => String(n).padStart(6, "0");
function readHigh() { try { return Number(window.localStorage.getItem(HIGH_KEY)) || 0; } catch { return 0; } }
function writeHigh(v: number) { try { window.localStorage.setItem(HIGH_KEY, String(v)); } catch { /* storage unavailable */ } }

// `ko` is accepted for the shared game signature; the arcade UI is English-only.
export default function Pinball({ onBack }: { ko: boolean; onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const restartRef = useRef<() => void>(() => {});
  const [view, setView] = useState<View>({ left: 0, top: 200, width: 0, height: 0, nav: 72, compact: false });
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
    let high = readHigh(), revision = -1, lastBlink = false, savedHigh = high, clock = 0;
    const s = createGame(geometry, (Date.now() & 0xffffffff) >>> 0);
    game.current = s;
    let images: HTMLImageElement[] = [];
    let bumper: Sprite, bumperLit: Sprite, ball: Sprite, flipL: Sprite, flipR: Sprite, plunger: HTMLCanvasElement, dim: HTMLCanvasElement, glow: HTMLCanvasElement;
    let flipOffset = 0;
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
    function resize() {
      const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 70);
      const vw = window.innerWidth, vh = window.innerHeight;
      // Phones / portrait tablets: HUD row on top, LAUNCH bar below, table fills the width.
      const compact = vw < 760 || (vh > vw && vw < 1000);
      const top = compact ? nav + 84 : nav + 70, bottom = compact ? vh - 76 : vh - 90;
      const height = Math.max(1, Math.min(bottom - top, (compact ? vw - 24 : vw - 560) * geometry.height / geometry.width));
      const width = height * geometry.width / geometry.height;
      const left = (vw - width) / 2, y = top + Math.max(0, bottom - top - height) / 2;
      setView({ left, top: y, width, height, nav, compact });
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
      accumulator = 0; previous = 0;
    }
    const sync = () => { s.inputLeft = keys.left || [...pointers.values()].includes(0); s.inputRight = keys.right || [...pointers.values()].includes(1); };
    const releaseAll = () => { keys.left = keys.right = false; pointers.clear(); s.plungerHeld = false; s.dragging = false; setDragging(false); sync(); };
    const keydown = (e: KeyboardEvent) => {
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
      e.preventDefault();
      pointers.set(e.pointerId, e.clientX < window.innerWidth / 2 ? 0 : 1);
      try { surface.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      sync();
    };
    const up = (e: PointerEvent) => { if (pointers.delete(e.pointerId)) sync(); };
    // Plunger: drag the knob down (pull = launch speed), release to fire.
    const knobDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      try { knobEl.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      dragStart = e.clientY; s.dragPull = 0; s.dragging = true; s.plungerHeld = true; setDragging(true);
    };
    const knobMove = (e: PointerEvent) => { if (!s.dragging) return; s.dragPull = Math.max(0, Math.min(1, (e.clientY - dragStart) / (geometry.plunger.pullMax * cssPerUnit))); };
    const knobUp = () => { if (!s.dragging) return; s.dragging = false; s.plungerHeld = false; setDragging(false); };
    const menu = (e: Event) => e.preventDefault();
    const visibility = () => { hidden = document.hidden; previous = 0; accumulator = 0; releaseAll(); };
    function restart() { restartGame(s); revision = -1; surface!.focus({ preventScroll: true }); }
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
      if (previous && now < nextFrame - 1) return;
      nextFrame = previous ? Math.max(nextFrame + 1000 / 60, now) : now + 1000 / 60;
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
      accumulator += dt; clock += dt;
      while (accumulator >= STEP) { step(s); accumulator -= STEP; }
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
      for (let i = 0; i < slings.length; i++) if (s.slingFlash[i] > 0) {
        const sg = slings[i];
        ctx!.globalAlpha = Math.min(1, s.slingFlash[i] / .08); ctx!.strokeStyle = "#f56519"; ctx!.lineWidth = Math.max(2, 3.2 * k); ctx!.lineCap = "round";
        ctx!.beginPath(); ctx!.moveTo(sg.ax * k, sg.ay * k); ctx!.lineTo(sg.bx * k, sg.by * k); ctx!.stroke(); ctx!.globalAlpha = 1;
      }
      for (let i = 0; i < geometry.bumpers.length; i++) { const b = geometry.bumpers[i]; drawSprite(s.bumperLit[i] > 0 ? bumperLit : bumper, b.x, b.y); }
      drawPlunger();
      drawFlipper(0); drawFlipper(1);
      if (s.ball.active) drawSprite(ball, s.ball.x, s.ball.y);

      if (s.score > high) high = s.score;
      if (s.phase === "over" && high > savedHigh) { savedHigh = high; writeHigh(high); }
      const blink = s.phase === "over" && Math.floor(clock * 2.2) % 2 === 0;
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
  const sideWidth = view.compact ? Math.max(150, Math.min(220, (typeof window === "undefined" ? 400 : window.innerWidth) * .26)) : Math.max(190, Math.min(300, view.height * .3));
  const sideTop = view.compact ? view.nav + 4 : view.top + view.height * .06;
  const sideLeft = view.compact ? Math.min(view.left + view.width, (typeof window === "undefined" ? 1000 : window.innerWidth) - 12) - sideWidth : view.left + view.width + Math.max(28, view.width * .07);
  const launchX = view.left + geometry.plunger.x * view.width / geometry.width;
  const launchDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const s = game.current; if (!s) return;
    if (s.phase === "over") { if (s.timer <= 0) restartRef.current(); return; }
    s.dragging = false; s.plungerHeld = true;
  };
  const launchUp = () => { const s = game.current; if (s && !s.dragging) s.plungerHeld = false; };
  const lcdText = hud.message && hud.message !== "GAME OVER" ? hud.message : hud.phase === "over" ? "GAME OVER" : "";
  return <div className={styles.root} data-compact={view.compact} style={{ "--nav-bottom": `${view.nav}px` } as CSSProperties}>
    <div ref={stage} className={styles.stage} tabIndex={-1} role="application" aria-label="Pinball. Left flipper: left arrow, Z or press the left half of the screen. Right flipper: right arrow, M or press the right half. Hold Space or drag the plunger knob down to launch. Escape returns to the arcade." />
    <button className={`${styles.textButton} ${styles.back}`} style={{ top: view.compact ? view.nav + 4 : view.nav, left: view.compact ? 8 : undefined }} onClick={onBack}>← ARCADE</button>
    {failed ? <div className={styles.failure} role="alert"><p>Game images could not be loaded.</p><button className={styles.textButton} onClick={onBack}>Back to arcade</button></div> : <>
      <div className={styles.table} style={{ left: view.left, top: view.top, width: view.width, height: view.height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.tableArt} src="/arcade/pb_table.webp" width={art.table.width} height={art.table.height} alt="" draggable={false} />
        <div className={styles.lcd} style={{ left: pct(lcd.x), top: pct(lcd.y), width: pct(lcd.w), height: pct(lcd.h) }} data-blink={hud.blink} aria-live="polite">
          {lcdText ? <span className={styles.lcdText}>{lcdText}</span> : <span className={styles.digits}><span className={styles.ghost} aria-hidden="true">888888</span>{pad(hud.score)}</span>}
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
        <div className={styles.saver} data-on={hud.saver}><span className={styles.saverDot} />BALL SAVER</div>
        {hud.phase === "over" && !view.compact && <button className={styles.restart} onClick={() => restartRef.current()}>PLAY AGAIN</button>}
      </div>
      {!ready && <div className={styles.loading} role="status">LOADING…</div>}
      {view.compact ? <>
        <p className={styles.hintCompact} style={{ left: 12, right: window.innerWidth - Math.min(window.innerWidth - 124, launchX - 56) + 10 }}>TAP LEFT / RIGHT HALF · HOLD LAUNCH OR DRAG KNOB</p>
        <button className={styles.launch} style={{ left: Math.min(window.innerWidth - 124, launchX - 56) }} onPointerDown={launchDown} onPointerUp={launchUp} onPointerCancel={launchUp} onLostPointerCapture={launchUp} onContextMenu={e => e.preventDefault()}>{hud.phase === "over" ? "PLAY AGAIN" : "LAUNCH"}</button>
      </> : <p className={styles.hint}>← / Z  LEFT · → / M  RIGHT · HOLD SPACE OR DRAG THE KNOB TO LAUNCH · ESC  BACK</p>}
    </>}
  </div>;
}

