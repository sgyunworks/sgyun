"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import art from "./art.json";
import ccArt from "./carcrush.art.json";
import { createGame, layoutFromArt, step, strike, strikeKey, bonusSeconds, STEP, DURATION, MAX_DEBRIS, MAX_RINGS, SETTLED, SETTLED_LIFE, FADE, DEAD, type Game } from "./carcrushPhysics";
import styles from "./carcrush.module.css";

const L = layoutFromArt(ccArt);
const BEST_KEY = "sgyun-arcade-carcrush-best";
const CROSSFADE = .12, RING_LIFE = .32, FLASH_LIFE = .11;
// HUD placement in world units (concept: LCD + slim bar centred above the car).
const HUD = { x: 0, y: 46, lcdW: 270, gap: 34, barW: 560 };
HUD.x = (L.W - HUD.lcdW - HUD.gap - HUD.barW) / 2;
const lcdH = HUD.lcdW * art.lcd.height / art.lcd.width;

type Best = { bonus: number; damage: number };
type View = { left: number; top: number; width: number; height: number; nav: number };
type Hud = { phase: "countdown" | "play" | "done"; count: number; seconds: number; damage: number; combo: number; go: boolean };
type Result = { wrecked: boolean; time: number; bonus: number; hits: number; maxCombo: number; damage: number; best: Best; newBest: boolean };
const better = (a: Best, b: Best) => a.bonus > b.bonus || (a.bonus === b.bonus && a.damage > b.damage);
function readBest(): Best { try { const v = JSON.parse(window.localStorage.getItem(BEST_KEY) ?? "null"); if (v && Number.isFinite(v.bonus) && Number.isFinite(v.damage)) return v; } catch { /* storage unavailable */ } return { bonus: 0, damage: 0 }; }
function writeBest(b: Best) { try { window.localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch { /* storage unavailable */ } }
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** CAR CRUSH — wreck CINDER in 30 seconds. UI text is English only (arcade rule); `ko` is unused. */
export default function CarCrush({ onBack }: { ko: boolean; onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const [view, setView] = useState<View>({ left: 0, top: 200, width: 0, height: 0, nav: 72 });
  const [hud, setHud] = useState<Hud>({ phase: "countdown", count: 3, seconds: DURATION, damage: 0, combo: 0, go: false });
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const restartRef = useRef<() => void>(() => {});
  const retry = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (result) retry.current?.focus({ preventScroll: true }); }, [result]);
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
    let disposed = false, raf = 0, previous = 0, nextFrame = 0, accumulator = 0, k = 1, hidden = document.hidden, loaded = false;
    let bounds = { left: 0, top: 0, width: 1, height: 1 };
    let doneAt = -1, resultShown = false;
    let last = { phase: "", count: -1, seconds: -1, damage: -1, combo: -1, go: false };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let images: HTMLImageElement[] = [];
    // Per-resize sprite caches (device pixels). Nothing is allocated in the frame loop.
    let cars: HTMLCanvasElement[] = [], plinth: HTMLCanvasElement | null = null, pieces: HTMLCanvasElement[] = [], ring: HTMLCanvasElement | null = null, flash: HTMLCanvasElement | null = null;
    const pieceScale = 1.1; // pieces are cached at their largest spawn scale
    function offscreen(w: number, h: number) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
    const fresh = () => {
      game.current = createGame(L, (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
      doneAt = -1; resultShown = false; setResult(null); previous = 0; accumulator = 0;
    };
    restartRef.current = () => { fresh(); element.focus({ preventScroll: true }); };
    fresh();
    function resize() {
      const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 70);
      const top = nav + 70, bottom = window.innerHeight - 90;
      const width = Math.max(1, Math.min(window.innerWidth - 80, 1700, (bottom - top) * L.W / L.H));
      const height = width * L.H / L.W;
      bounds = { left: (window.innerWidth - width) / 2, top: top + Math.max(0, bottom - top - height) / 2, width, height };
      setView({ ...bounds, nav });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      element!.width = Math.round(width * dpr); element!.height = Math.round(height * dpr);
      k = element!.width / L.W;
      if (!loaded) return;
      cars = images.slice(0, 5).map(img => { const c = offscreen(L.car.w * k, L.car.h * k); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); return c; });
      plinth = offscreen(L.plinth.w * k, L.plinth.h * k); plinth.getContext("2d")!.drawImage(images[5], 0, 0, plinth.width, plinth.height);
      pieces = ccArt.debris.pieces.map((p, i) => { const c = offscreen(L.pieceW[i] * pieceScale * k, L.pieceH[i] * pieceScale * k); c.getContext("2d")!.drawImage(images[6], p.x, p.y, p.w, p.h, 0, 0, c.width, c.height); return c; });
      const rs = L.ringSize * 1.15 * k; ring = offscreen(rs, rs); ring.getContext("2d")!.drawImage(images[7], 0, 0, ring.width, ring.height);
      // Dent flash: a soft warm-white spot (a thin UI flash, drawn once here).
      const fs = 120 * k; flash = offscreen(fs, fs);
      const fc = flash.getContext("2d")!, g = fc.createRadialGradient(fs / 2, fs / 2, 0, fs / 2, fs / 2, fs / 2);
      g.addColorStop(0, "rgba(255,250,240,.95)"); g.addColorStop(.35, "rgba(255,214,176,.55)"); g.addColorStop(1, "rgba(255,170,110,0)");
      fc.fillStyle = g; fc.fillRect(0, 0, fs, fs);
      accumulator = 0; previous = 0;
    }
    const pointerdown = (event: PointerEvent) => {
      const s = game.current; if (!s || event.button !== 0) return;
      event.preventDefault();
      element.focus({ preventScroll: true });
      strike(s, (event.clientX - bounds.left) / bounds.width * L.W, (event.clientY - bounds.top) / bounds.height * L.H);
    };
    const keydown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("button, a, input, select, textarea")) return;
      if (e.code === "Space" || e.code === "KeyJ" || e.code === "KeyK") { e.preventDefault(); const s = game.current; if (s) strikeKey(s); }
    };
    const visibility = () => { hidden = document.hidden; previous = 0; accumulator = 0; };
    function frame(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (!loaded || hidden) return;
      if (previous && now < nextFrame - 1) return;
      nextFrame = previous ? Math.max(nextFrame + 1000 / 60, now) : now + 1000 / 60;
      const s = game.current!;
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
      accumulator += dt;
      while (accumulator >= STEP) { step(s); accumulator -= STEP; }
      const c = ctx!, W = element!.width, H = element!.height;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, W, H);
      // Camera shake: translate only.
      const amp = s.shake * (reduceMotion ? 3 : 11) * k;
      const ox = Math.round(amp * Math.sin(s.clock * 71)), oy = Math.round(amp * .6 * Math.sin(s.clock * 53 + 1.3));
      c.globalAlpha = 1;
      c.drawImage(plinth!, Math.round(L.plinth.x * k) + ox, Math.round(L.plinth.y * k) + oy);
      // Car: squash about the ground point under its centre + cross-fade between damage stages.
      const sq = s.squash * s.squash * (reduceMotion ? .3 : 1), sx = 1 + .016 * sq, sy = 1 - .03 * sq;
      const ax = L.car.cx * k + ox, ay = L.ground * k + oy;
      c.setTransform(sx, 0, 0, sy, ax - ax * sx, ay - ay * sy);
      const carX = Math.round(L.car.x * k) + ox, carY = Math.round(L.car.y * k) + oy;
      const t = Math.min(1, s.stageT / CROSSFADE);
      if (t < 1) { c.globalAlpha = Math.min(1, 2 * (1 - t)); c.drawImage(cars[s.stageFrom], carX, carY); c.globalAlpha = t; }
      c.drawImage(cars[s.stage], carX, carY);
      c.globalAlpha = 1;
      c.setTransform(1, 0, 0, 1, 0, 0);
      // Dent flashes and impact rings.
      for (let i = 0; i < MAX_RINGS; i++) {
        const age = s.rage[i]; if (age >= RING_LIFE) continue;
        const x = s.rx[i] * k + ox, y = s.ry[i] * k + oy;
        if (age < FLASH_LIFE) { c.globalAlpha = 1 - age / FLASH_LIFE; c.drawImage(flash!, x - flash!.width / 2, y - flash!.height / 2); }
        const p = age / RING_LIFE, e = 1 - (1 - p) * (1 - p), size = (.35 + .65 * e) * s.rpow[i] * ring!.width;
        c.globalAlpha = (1 - p) * (1 - p) * .95;
        c.drawImage(ring!, x - size / 2, y - size / 2, size, size);
      }
      c.globalAlpha = 1;
      // Debris (pooled): rotation via setTransform, settled pieces fade after 4 s.
      for (let i = 0; i < MAX_DEBRIS; i++) {
        const state = s.dstate[i]; if (state === DEAD) continue;
        const sprite = pieces[s.dpiece[i]], scale = s.dscale[i] / pieceScale, cos = Math.cos(s.drot[i]) * scale, sin = Math.sin(s.drot[i]) * scale;
        c.globalAlpha = state === SETTLED && s.dsettle[i] > SETTLED_LIFE ? Math.max(0, 1 - (s.dsettle[i] - SETTLED_LIFE) / FADE) : 1;
        c.setTransform(cos, sin, -sin, cos, s.dx[i] * k + ox, s.dy[i] * k + oy);
        c.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
      }
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      // HUD state: only push to React when a displayed value changes.
      const count = s.phase === "countdown" ? Math.ceil(s.timer) : 0;
      const seconds = s.phase === "countdown" ? DURATION : Math.ceil(s.timer - 1e-9);
      const damage = Math.floor(s.total + 1e-9), combo = s.phase === "play" && s.elapsed - s.lastHit < .6 ? s.combo : 0;
      const go = s.phase === "play" && s.elapsed < .55;
      if (s.phase !== last.phase || count !== last.count || seconds !== last.seconds || damage !== last.damage || combo !== last.combo || go !== last.go) {
        last = { phase: s.phase, count, seconds, damage, combo, go };
        setHud({ phase: s.phase, count, seconds, damage, combo, go });
      }
      if (s.phase === "done") {
        if (doneAt < 0) doneAt = s.clock;
        if (!resultShown && s.clock - doneAt > 1.4) { // let the last pieces fly first
          resultShown = true;
          const wrecked = s.wreckTime >= 0, score: Best = { bonus: Math.round(bonusSeconds(s) * 10) / 10, damage: Math.floor(s.total) };
          const best = readBest(), newBest = better(score, best);
          if (newBest) writeBest(score);
          setResult({ wrecked, time: wrecked ? s.wreckTime : DURATION, bonus: score.bonus, hits: s.hits, maxCombo: s.maxCombo, damage: score.damage, best: newBest ? score : best, newBest });
        }
      }
    }
    resize();
    window.addEventListener("resize", resize); element.addEventListener("pointerdown", pointerdown);
    window.addEventListener("keydown", keydown); document.addEventListener("visibilitychange", visibility);
    const observer = new ResizeObserver(resize); const nav = document.querySelector("nav"); if (nav) observer.observe(nav);
    const sources = ["carcrush_car0", "carcrush_car1", "carcrush_car2", "carcrush_car3", "carcrush_car4", "carcrush_plinth", "carcrush_debris", "carcrush_hit", "lcd_panel"];
    Promise.all(sources.map(name => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image(); img.onload = () => img.decode().then(() => resolve(img), reject); img.onerror = () => reject(new Error(name)); img.src = `/arcade/${name}.webp`;
    }))).then(list => {
      if (disposed) return;
      images = list; loaded = true; resize(); setReady(true); fresh(); element.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      window.removeEventListener("resize", resize); element.removeEventListener("pointerdown", pointerdown);
      window.removeEventListener("keydown", keydown); document.removeEventListener("visibilitychange", visibility);
      game.current = null;
    };
  }, []);

  const u = view.width / L.W; // css px per world unit
  const hudStyle: CSSProperties = { left: view.left + HUD.x * u, top: view.top + HUD.y * u, height: lcdH * u, gap: HUD.gap * u };
  const status = hud.phase === "countdown" ? String(hud.count) : hud.go ? "GO" : "";
  return <div className={styles.root} style={{ "--nav-bottom": `${view.nav}px` } as CSSProperties}>
    <button className={`${styles.textButton} ${styles.back}`} onClick={onBack}>← ARCADE</button>
    {failed ? <div className={styles.failure} role="alert"><p>Game images could not be loaded.</p><button className={styles.textButton} onClick={onBack}>Back to arcade</button></div> : <>
      <canvas ref={canvas} className={styles.stage} style={{ left: view.left, top: view.top, width: view.width, height: view.height }} tabIndex={0} role="application" aria-label="Car Crush. Click or tap the car to strike it; Space, J or K strike a weak point. Escape returns to the arcade." />
      {ready && <div className={styles.hud} style={hudStyle} aria-hidden="true">
        <div className={styles.lcd} style={{ width: HUD.lcdW * u, height: lcdH * u }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.asset} src="/arcade/lcd_panel.webp" width={art.lcd.width} height={art.lcd.height} alt="" draggable={false} />
          <div className={styles.lcdGlass} data-low={hud.phase === "play" && hud.seconds <= 5} style={{ left: `${art.lcd.screen.x * 100}%`, top: `${art.lcd.screen.y * 100}%`, width: `${art.lcd.screen.w * 100}%`, height: `${art.lcd.screen.h * 100}%` }}>{clock(hud.seconds)}</div>
        </div>
        <div className={styles.meter} style={{ width: HUD.barW * u, height: lcdH * u * .5 }}>
          <div className={styles.bezel} />
          <div className={styles.track}><div className={styles.fill} style={{ width: `${hud.damage}%` }} /></div>
          <div className={styles.meterLabels}><span>DAMAGE {hud.damage}%</span>{hud.combo > 1 && <span className={styles.combo}>COMBO ×{hud.combo}</span>}</div>
        </div>
      </div>}
      <p className={styles.hint} role="status" aria-live="polite">{`Damage ${hud.damage}% · Click the car · Space / J / K strike · Esc exits`}</p>
      {!ready && <div className={styles.loading} role="status">LOADING…</div>}
      {ready && status && !result && <div className={styles.status} style={{ top: view.top + 262 * u }} aria-hidden="true">{status}</div>}
      {result && <div className={styles.card} style={{ top: view.top + HUD.y * u }} role="dialog" aria-label="Result">
        <p className={styles.cardTitle}>{result.wrecked ? "WRECKED" : "TIME UP"}</p>
        <p className={styles.cardSub}>{result.wrecked ? `+${result.bonus.toFixed(1)} s BONUS` : `${result.damage}% DAMAGE`}</p>
        <div className={styles.stats}>
          <span>TIME</span><span>{result.time.toFixed(1)} s</span>
          <span>HITS</span><span>{result.hits}</span>
          <span>MAX COMBO</span><span>×{result.maxCombo}</span>
          <span>BEST</span><span className={result.newBest ? styles.newBest : undefined}>{result.best.bonus > 0 ? `+${result.best.bonus.toFixed(1)} s` : `${result.best.damage}%`}{result.newBest ? " NEW" : ""}</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.primary} ref={retry} onClick={() => restartRef.current()}>Retry</button>
          <button className={styles.primary} onClick={onBack}>← ARCADE</button>
        </div>
      </div>}
    </>}
  </div>;
}
