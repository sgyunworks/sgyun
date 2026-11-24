"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import art from "./art.json";
import { createGame, geometryFromArt, step, STEP, type Difficulty, type Game, type Body } from "./airHockeyPhysics";
import styles from "./arcade.module.css";

const geometry = geometryFromArt(art);
type Sprite = { canvas: HTMLCanvasElement; cx: number; cy: number };
type Flash = { canvas: HTMLCanvasElement; x: number; y: number };
type View = { left: number; top: number; width: number; height: number; scoreTop: number; nav: number; compact: boolean; lcdWidth: number; barTop: number };
/** Finger lift for touch control (CSS px): the mallet sits this far above the fingertip so it stays visible. */
const TOUCH_LIFT = 40;
const fractionRect = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });

export default function AirHockey({ ko, onBack }: { ko: boolean; onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [view, setView] = useState<View>({ left: 0, top: 270, width: 0, height: 0, scoreTop: 76, nav: 72, compact: false, lcdWidth: 260, barTop: 72 });
  const [hud, setHud] = useState({ you: 0, ai: 0, message: "3", phase: "countdown", blink: false });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const difficultyRef = useRef<Difficulty>(difficulty);
  useEffect(() => { difficultyRef.current = difficulty; if (game.current) { game.current.difficulty = difficulty; game.current.aiClock = 0; } }, [difficulty]);
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
    // rotated: portrait view of the unchanged landscape world. Screen (sx, sy) = (y, W - x) * scale,
    // i.e. the player's (left) goal is at the bottom and the AI's at the top.
    let rotated = false, touchId = -1, settleTimer = 0;
    let table: HTMLCanvasElement, orange: Sprite, graphite: Sprite, puck: Sprite, leftFlash: Flash, rightFlash: Flash;
    let loaded = false, hidden = document.hidden, manualPause = false, revision = -1, lastMessage = "", lastBlink = false;
    let trailHead = 0, trailClock = 0, trailCount = 0;
    const trailX = new Float64Array(6), trailY = new Float64Array(6);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const keys = new Set<string>();
    let keyboard = false;
    const fresh = () => { game.current = createGame(geometry, difficultyRef.current, (Date.now() & 0xffffffff) >>> 0); trailCount = 0; revision = -1; };
    fresh();
    function offscreen(w: number, h: number) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
    function cache(img: HTMLImageElement, diameter: number, a: { radius: number; radiusY: number; cx: number; cy: number }): Sprite {
      const width = diameter / (a.radius * 2) * scale;
      // Correct the generator's slight disc ellipticity once, so both visible axes
      // coincide with the circular physics collider rather than its drop shadow.
      const c = offscreen(width, diameter / (a.radiusY * 2) * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      return { canvas: c, cx: a.cx * c.width, cy: a.cy * c.height };
    }
    function flash(left: boolean) {
      const goal = left ? art.table.goals.left : art.table.goals.right;
      if (rotated) {
        const c = offscreen((goal.bottom - goal.top) * element!.width, goal.w * element!.height), paint = c.getContext("2d")!;
        paint.fillStyle = "#f56519";
        paint.fillRect(0, 0, c.width, c.height);
        return { canvas: c, x: Math.round(goal.top * element!.width), y: Math.round((1 - goal.x - goal.w) * element!.height) };
      }
      const c = offscreen(goal.w * element!.width, (goal.bottom - goal.top) * element!.height), paint = c.getContext("2d")!;
      paint.fillStyle = "#f56519";
      paint.fillRect(0, 0, c.width, c.height);
      return { canvas: c, x: Math.round(goal.x * element!.width), y: Math.round(goal.top * element!.height) };
    }
    let images: HTMLImageElement[] = [];
    const safeProbe = document.createElement("div");
    safeProbe.style.cssText = "position:fixed;left:0;top:0;width:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
    document.body.appendChild(safeProbe);
    function resize() {
      const vw = window.innerWidth, vh = window.innerHeight;
      rotated = vw / vh < 1 || vw < 700;
      if (rotated || vh < 560) { layoutCompact(vw, vh); return; }
      const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 70);
      const scoreHeight = 260 * art.lcd.height / art.lcd.width + 36;
      const top = Math.max(nav + 70, nav + 2 + scoreHeight + 12), bottom = window.innerHeight - 90;
      const width = Math.max(1, Math.min(window.innerWidth - 80, 1700, (bottom - top) * geometry.width / geometry.height));
      const height = width * geometry.height / geometry.width;
      bounds = { left: (window.innerWidth - width) / 2, top: top + Math.max(0, bottom - top - height) / 2, width, height };
      setView({ ...bounds, scoreTop: Math.max(nav + 2, bounds.top - scoreHeight - 12), nav, compact: false, lcdWidth: 260, barTop: nav });
      rebuild();
    }
    /** Phones, tablets in portrait and short landscape windows: one HUD row (back · LCD · difficulty), table below. */
    function layoutCompact(vw: number, vh: number) {
      const style = getComputedStyle(safeProbe), safeTop = parseFloat(style.paddingTop) || 0, safeBottom = parseFloat(style.paddingBottom) || 0;
      const nav = Math.max(0, document.querySelector("nav")?.getBoundingClientRect().bottom ?? 0, safeTop);
      const barTop = nav + 6, lcdWidth = Math.round(Math.max(124, Math.min(260, vw - 232, vh * .2 * art.lcd.width / art.lcd.height)));
      const top = barTop + Math.max(44, lcdWidth * art.lcd.height / art.lcd.width) + 10, bottom = vh - 14 - safeBottom;
      const aspect = rotated ? geometry.height / geometry.width : geometry.width / geometry.height; // screen width / height
      const width = Math.max(1, Math.min(vw - 24, (bottom - top) * aspect)), height = width / aspect;
      // The portrait art keeps the landscape image's bottom shadow margin on its right side: centre the visible table, not the image.
      const shift = rotated ? (.5 - (art.table.inner.y + art.table.inner.h / 2)) * width : 0;
      bounds = { left: (vw - width) / 2 + shift, top: top + Math.max(0, bottom - top - height) / 2, width, height };
      setView({ ...bounds, scoreTop: barTop, nav, compact: true, lcdWidth, barTop });
      rebuild();
    }
    function rebuild() {
      const width = bounds.width, height = bounds.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      element!.width = Math.round(width * dpr); element!.height = Math.round(height * dpr);
      scale = (rotated ? element!.height : element!.width) / geometry.width;
      if (!loaded) return;
      table = offscreen(element!.width, element!.height); table.getContext("2d")!.drawImage(images[rotated ? 5 : 0], 0, 0, table.width, table.height);
      orange = cache(images[1], geometry.malletRadius * 2, art.sprites.orange);
      graphite = cache(images[2], geometry.malletRadius * 2, art.sprites.graphite);
      puck = cache(images[3], geometry.puckRadius * 2, art.sprites.puck);
      leftFlash = flash(true); rightFlash = flash(false);
      // Sprite canvases are allocated only here, never in the animation loop.
      accumulator = 0; previous = 0;
    }
    function aim(s: Game, clientX: number, clientY: number) {
      const u = (clientX - bounds.left) / bounds.width, v = (clientY - bounds.top) / bounds.height;
      if (rotated) { s.targetX = (1 - v) * geometry.width; s.targetY = u * geometry.height; }
      else { s.targetX = u * geometry.width; s.targetY = v * geometry.height; }
    }
    const pointer = (event: PointerEvent) => {
      const s = game.current; if (!s) return;
      if (event.pointerType === "touch") { touch(event, s); return; }
      keyboard = false;
      aim(s, event.clientX, event.clientY);
    };
    // Touch: the first finger that lands in the player's half grabs the mallet and drives it 1:1
    // (same spring as the mouse), lifted by TOUCH_LIFT so the finger does not hide it. Other fingers are ignored.
    function touch(event: PointerEvent, s: Game) {
      if (event.type === "pointerdown") {
        if (touchId !== -1) return;
        const v = (event.clientY - bounds.top) / bounds.height, u = (event.clientX - bounds.left) / bounds.width;
        const fingerX = rotated ? (1 - v) * geometry.width : u * geometry.width;
        if (fingerX > (geometry.left + geometry.right) / 2 + geometry.malletRadius) return; // AI half: not a grab
        touchId = event.pointerId;
        try { element!.setPointerCapture(touchId); } catch { /* capture is optional */ }
      } else if (event.pointerId !== touchId) return;
      event.preventDefault();
      keyboard = false;
      aim(s, event.clientX, event.clientY - TOUCH_LIFT);
    }
    const release = (event: PointerEvent) => { if (event.pointerId === touchId) touchId = -1; };
    const stopTouch = (e: Event) => { if (e.cancelable) e.preventDefault(); }; // no scroll, pull-to-refresh or pinch while playing
    const orientation = () => { resize(); window.clearTimeout(settleTimer); settleTimer = window.setTimeout(resize, 300); }; // iOS reports the new size late
    const keydown = (e: KeyboardEvent) => {
      if (!(document.activeElement === element)) return;
      if (e.code === "Space") { e.preventDefault(); manualPause = !manualPause; setPaused(manualPause); previous = 0; accumulator = 0; return; }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) { e.preventDefault(); keyboard = true; keys.add(e.code); }
    };
    const keyup = (e: KeyboardEvent) => { keys.delete(e.code); };
    const visibility = () => { hidden = document.hidden; previous = 0; accumulator = 0; keys.clear(); setPaused(hidden || manualPause); };
    const blur = () => { keys.clear(); };
    function drawAt(sprite: Sprite, x: number, y: number) {
      if (rotated) ctx!.drawImage(sprite.canvas, Math.round(y * scale - sprite.cx), Math.round((geometry.width - x) * scale - sprite.cy));
      else ctx!.drawImage(sprite.canvas, Math.round(x * scale - sprite.cx), Math.round(y * scale - sprite.cy));
    }
    function draw(sprite: Sprite, body: Body) { drawAt(sprite, body.x, body.y); }
    function frame(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (!loaded || hidden || manualPause) return;
      // Keep 60Hz output on 120/144Hz displays too. Simulation remains at 240Hz.
      if (previous && now < nextFrame - 1) return;
      nextFrame = previous ? Math.max(nextFrame + 1000 / 60, now) : now + 1000 / 60;
      const s = game.current!;
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
      if (keyboard) {
        const right = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
        const down = (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0);
        // Keys follow the screen: in the portrait view screen-right is world +y and screen-down is world -x.
        s.targetX += (rotated ? -down : right) * 670 * dt;
        s.targetY += (rotated ? right : down) * 670 * dt;
        s.targetX = Math.max(geometry.left + s.player.r, Math.min((geometry.left + geometry.right) / 2 - s.player.r, s.targetX));
        s.targetY = Math.max(geometry.top + s.player.r, Math.min(geometry.bottom - s.player.r, s.targetY));
      }
      accumulator += dt;
      while (accumulator >= STEP) { step(s); accumulator -= STEP; }
      ctx!.clearRect(0, 0, element!.width, element!.height);
      ctx!.drawImage(table, 0, 0);
      if (s.phase === "goal" || (s.phase === "over" && s.timer > 0)) {
        const f = s.goalSide < 0 ? leftFlash : rightFlash;
        ctx!.globalAlpha = .45 * Math.min(1, s.timer * 2); ctx!.drawImage(f.canvas, f.x, f.y); ctx!.globalAlpha = 1;
      }
      if (s.phase !== "play") trailCount = 0;
      if (!reduceMotion && s.phase === "play") {
        trailClock += dt;
        if (trailClock >= 1 / 60) { trailClock %= 1 / 60; trailX[trailHead] = s.puck.x; trailY[trailHead] = s.puck.y; trailHead = (trailHead + 1) % 6; trailCount = Math.min(6, trailCount + 1); }
        for (let i = 0; i < trailCount; i++) {
          const index = (trailHead - trailCount + i + 6) % 6;
          ctx!.globalAlpha = .018 + .05 * i / 6;
          drawAt(puck, trailX[index], trailY[index]);
        }
        ctx!.globalAlpha = 1;
      }
      draw(orange, s.player); draw(graphite, s.ai); draw(puck, s.puck);
      const message = s.phase === "countdown" ? (s.timer > 2 ? "3" : s.timer > 1 ? "2" : "1") : s.phase === "play" && s.timer > 0 ? "GO" : s.phase === "goal" ? (ko ? "골!" : "GOAL") : s.phase === "over" ? (s.you === 7 ? (ko ? "승리!" : "YOU WIN") : (ko ? "AI 승리" : "AI WINS")) : "";
      const blink = (s.phase === "goal" || s.phase === "over" && s.timer > 0) && Math.floor(s.timer * 6) % 2 === 0;
      if (revision !== s.revision || message !== lastMessage || blink !== lastBlink) {
        revision = s.revision; lastMessage = message; lastBlink = blink;
        setHud({ you: s.you, ai: s.computer, message, phase: s.phase, blink });
      }
    }
    resize();
    window.addEventListener("resize", resize); element.addEventListener("pointermove", pointer); element.addEventListener("pointerdown", pointer);
    element.addEventListener("pointerup", release); element.addEventListener("pointercancel", release); element.addEventListener("lostpointercapture", release);
    window.addEventListener("orientationchange", orientation);
    document.addEventListener("touchmove", stopTouch, { passive: false }); document.addEventListener("gesturestart", stopTouch);
    const root = document.documentElement, overscroll = root.style.overscrollBehavior; root.style.overscrollBehavior = "none";
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    const observer = new ResizeObserver(resize); const nav = document.querySelector("nav"); if (nav) observer.observe(nav);
    const sources = ["ah_table", "ah_mallet_orange", "ah_mallet_graphite", "ah_puck", "lcd_panel", "ah_table_portrait"];
    Promise.all(sources.map(name => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image(); img.onload = () => img.decode().then(() => resolve(img), reject); img.onerror = () => reject(new Error(name)); img.src = name.startsWith("ah_table") ? `/arcade/${name}.svg` : `/arcade/${name}.webp`; // table is vector art
    }))).then(result => {
      if (disposed) return;
      images = result; loaded = true; resize(); setReady(true); element.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      window.removeEventListener("resize", resize); element.removeEventListener("pointermove", pointer); element.removeEventListener("pointerdown", pointer);
      element.removeEventListener("pointerup", release); element.removeEventListener("pointercancel", release); element.removeEventListener("lostpointercapture", release);
      window.removeEventListener("orientationchange", orientation); window.clearTimeout(settleTimer);
      document.removeEventListener("touchmove", stopTouch); document.removeEventListener("gesturestart", stopTouch);
      root.style.overscrollBehavior = overscroll; safeProbe.remove();
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
      game.current = null;
    };
  }, [ko]);

  const restart = () => { game.current = createGame(geometry, difficultyRef.current, (Date.now() & 0xffffffff) >>> 0); canvas.current?.focus({ preventScroll: true }); };
  const compact = view.compact; // phone / portrait layout; the desktop markup below is unchanged when false
  const difficultyControl = <div className={compact ? `${styles.difficulty} ${styles.compactDifficulty}` : styles.difficulty} style={compact ? { top: view.barTop } : undefined}><label htmlFor="arcade-difficulty" className={compact ? styles.srOnly : undefined}>{ko && !compact ? "난이도" : "Difficulty"}</label><select id="arcade-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select></div>;
  return <div className={compact ? styles.touchRoot : undefined} style={{ "--nav-bottom": `${view.nav}px` } as CSSProperties}>
    <button className={compact ? `${styles.textButton} ${styles.back} ${styles.compactBack}` : `${styles.textButton} ${styles.back}`} style={compact ? { top: view.barTop } : undefined} onClick={onBack}>← ARCADE</button>
    {failed ? <div className={styles.failure} role="alert"><p>{ko ? "게임 이미지를 불러올 수 없습니다." : "Game images could not be loaded."}</p><button className={styles.textButton} onClick={onBack}>{ko ? "아케이드로 돌아가기" : "Back to arcade"}</button></div> : <>
      <div className={compact ? `${styles.scoreboard} ${styles.compactScore}` : styles.scoreboard} style={{ top: view.scoreTop, width: view.lcdWidth }}>
        <div style={{ position: "relative", aspectRatio: `${art.lcd.width}/${art.lcd.height}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.asset} src="/arcade/lcd_panel.webp" width={art.lcd.width} height={art.lcd.height} alt="" draggable={false} />
          <div className={styles.scoreLabels} style={{ left: `${art.lcd.screen.x * 100}%`, width: `${art.lcd.screen.w * 100}%`, top: `${Math.max(.03, art.lcd.screen.y - .12) * 100}%` }} aria-hidden="true"><span>YOU</span><span>AI</span></div>
          <div className={styles.scoreGlass} style={fractionRect(art.lcd.screen)} data-blink={hud.blink} aria-hidden="true"><span>{hud.you}</span><span>:</span><span>{hud.ai}</span></div>
        </div>
        {!compact && difficultyControl}
      </div>
      {compact && difficultyControl}
      <canvas ref={canvas} className={styles.rink} style={{ left: view.left, top: view.top, width: view.width, height: view.height }} tabIndex={0} role="application" aria-label={compact ? "Air hockey. Drag a finger in your half of the table to move the orange mallet." : ko ? "에어하키. 마우스 또는 방향키로 이동, 스페이스로 일시 정지, Esc로 돌아가기." : "Air hockey. Move with pointer or arrow keys. Space pauses. Escape returns to arcade."} />
      {!ready && <div className={styles.loading} role="status">{ko ? "불러오는 중…" : "LOADING…"}</div>}
      {(hud.message || paused) && ready && <div className={compact ? `${styles.playStatus} ${styles.compactStatus}` : styles.playStatus} style={{ top: view.top + view.height / 2 }} role="status" aria-live="polite">{paused ? (ko ? "일시 정지" : "PAUSED") : hud.message}{hud.phase === "over" && <button className={styles.restart} onClick={restart}>{ko ? "다시 플레이" : "Play again"}</button>}</div>}
      <p className={compact ? styles.srOnly : styles.hint} aria-live="polite">{compact ? `${hud.you} : ${hud.ai} · First to 7 · Drag to move` : ko ? `${hud.you} : ${hud.ai} · 7점 먼저 · 마우스 / 방향키 · 스페이스 일시 정지` : `${hud.you} : ${hud.ai} · First to 7 · Pointer / arrow keys · Space to pause`}</p>
    </>}
  </div>;
}
