"use client";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent} from "react";
import type {Locale} from "@/lib/i18n";
import styles from "./FloatingWorks.module.css";
import dynamic from "next/dynamic";
import {ARCADE_EVENT} from "./YPull";
// Easter egg arcade: only downloaded when every window on the desk is closed.
const Arcade = dynamic(() => import("../arcade/Arcade").then(m => m.Arcade), {ssr: false});

export type FloatingWork = {
  id: string;
  number: string;
  title: string;
  caption: string;
  href: string;
  image: string;
  alt: string;
  ratio: number;
  kind: "window" | "terminal";
  tier: 1 | 2 | 3;
  tags?: string;
  clip?: {src: string; poster: string; ratio: number; href: string; label: string};
};

type Body = {x:number;y:number;vx:number;vy:number;w:number;h:number;phase:number;drag:null|{id:number;dx:number;dy:number;sx:number;sy:number;t:number;lx:number;ly:number;lt:number;moved:boolean;player:boolean}};

// Sizes are chosen so every window carries a similar visual area.
const AREA = 0.04; // fraction of desk area per window
const TIER = {1: 1.45, 2: 1, 3: 0.8} as const; // width factor per importance tier

export function FloatingWorks({locale, works}:{locale:Locale; works:FloatingWork[]}) {
  const router = useRouter();
  const desk = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLAnchorElement|null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const z = useRef<number[]>(works.map((w, i) => (4 - w.tier) * 20 + works.length - i));
  const top = useRef(100);
  const ko = locale === "ko";
  // Builder cues (build tags + NODE build log). Local comparison: ?builder=0 turns them off.
  const [builder, setBuilder] = useState(true);
  useEffect(() => { if (new URLSearchParams(location.search).get("builder") === "0") setBuilder(false); }, []);

  // Mac window controls: red closes, yellow minimizes to the Dock, green opens full screen.
  const [hidden, setHidden] = useState<Record<number, "closed" | "min">>({});
  const [full, setFull] = useState<null | {i: number; video: boolean}>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const fullVideo = useRef<HTMLVideoElement>(null);

  const hide = useCallback((i: number, how: "closed" | "min") => {
    const n = nodes.current[i];
    if (n) {
      const r = n.getBoundingClientRect();
      // fly toward the Dock (bottom centre of the viewport)
      const tx = window.innerWidth / 2 - (r.left + r.width / 2), ty = window.innerHeight - 36 - (r.top + r.height / 2);
      n.dataset.anim = "1"; void n.offsetWidth; // promote to a layer before the animation starts
      n.style.translate = how === "min" ? `${tx}px ${ty}px` : "";
      n.style.scale = how === "min" ? "0.06" : "0.86";
      n.dataset.hidden = how;
      window.setTimeout(() => delete n.dataset.anim, 650);
      n.querySelectorAll("video").forEach(v => v.pause());
    }
    setHidden(h => ({...h, [i]: how}));
  }, []);
  const restore = useCallback((i: number) => {
    const n = nodes.current[i];
    if (n) {
      n.dataset.anim = "1"; void n.offsetWidth;
      n.style.translate = ""; n.style.scale = "";
      delete n.dataset.hidden;
      window.setTimeout(() => delete n.dataset.anim, 650);
      z.current[i] = ++top.current; n.style.zIndex = String(z.current[i]);
      const v = n.querySelector("video"); v?.play().catch(() => {});
    }
    setHidden(h => { const c = {...h}; delete c[i]; return c; });
  }, []);
  const restoreAll = useCallback(() => { setPulled(false); works.forEach((_, i) => restore(i)); }, [works, restore]);
  const control = (i: number, act: "close" | "min" | "full", video = false) => (e: RMouseEvent | PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (e.type !== "click") return;
    if (act === "full") setFull({i, video});
    else hide(i, act === "close" ? "closed" : "min");
  };
  const stop = (e: PointerEvent) => e.stopPropagation();
  // Window controls only where there is a real mouse (desktop); touch screens keep plain decorative dots.
  const [mouse, setMouse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const on = () => setMouse(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (mouse) return;
    setFull(null);
    Object.keys(hidden).forEach(k => restore(Number(k)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mouse]);
  // desktop: every window closed · mobile: header Y pulled (YPull dispatches ARCADE_EVENT)
  const [pulled, setPulled] = useState(false);
  useEffect(() => { const on = () => setPulled(true); window.addEventListener(ARCADE_EVENT, on); return () => window.removeEventListener(ARCADE_EVENT, on); }, []);
  const arcadeOpen = pulled || (mouse && works.length > 0 && works.every((_, i) => hidden[i]));
  const btn = (i: number, act: "close" | "min" | "full", label: string, video = false) =>
    mouse ? {role: "button", "aria-label": label, title: label, "data-btn": "", onPointerDown: stop, onClick: control(i, act, video)} : {};

  useEffect(() => {
    if (!full) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(null); };
    window.addEventListener("keydown", key);
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.documentElement.style.overflow = ""; };
  }, [full]);

  useEffect(() => {
    works.forEach(w => router.prefetch(w.href));
    const el = desk.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, last = performance.now(), lastMode = "", lastScale = 1;

    // Float mode (wide screens): tall windows hold the two edges, landscape windows fill the middle (3 over 2).
    // Slots are taken in tier order, so the first ones are the most central.
    const LAND = [[0.42, 0.47], [0.24, 0.2], [0.88, 0.24], [0.27, 0.8], [0.88, 0.76], [0.6, 0.85], [0.5, 0.15]];
    const TALL = [[0.665, 0.52], [0.07, 0.5], [0.5, 0.5]];
    let canvas: HTMLCanvasElement | null = null;
    // Width a window needs so its whole title fits in the title bar (no ellipsis).
    const titleNeed = (i: number) => {
      const em = nodes.current[i]?.querySelector("em");
      if (!em) return 0;
      canvas ??= document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;
      const cs = getComputedStyle(em);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const bar = em.parentElement as HTMLElement;
      const dots = (em.offsetLeft || 64);
      const title = Math.ceil(ctx.measureText(em.textContent ?? "").width + dots + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(getComputedStyle(bar).paddingRight) + 4);
      const prompt = nodes.current[i]?.querySelector<HTMLElement>("[data-prompt]");
      let promptW = 0;
      if (prompt) {
        const ps = getComputedStyle(prompt);
        ctx.font = `${ps.fontWeight} ${ps.fontSize} ${ps.fontFamily}`;
        // text + two flex gaps + cursor + side padding
        promptW = Math.ceil(ctx.measureText(prompt.dataset.longest ?? prompt.textContent ?? "").width + parseFloat(ps.columnGap || "7") * 2 + 8 + parseFloat(ps.paddingLeft) + parseFloat(ps.paddingRight) + 6);
      }
      return Math.max(title, promptW);
    };
    // Same-shaped windows share one width: the widest title among them decides it.
    // How far the docked player window sticks out past the main window (right, bottom).
    const ext = (i: number) => {
      const n = nodes.current[i], p = n?.querySelector<HTMLElement>("[data-player]");
      if (!n || !p) return {r: 0, b: 0};
      return {r: Math.max(0, p.offsetLeft + p.offsetWidth - n.offsetWidth), b: Math.max(0, p.offsetTop + p.offsetHeight - n.offsetHeight)};
    };
    const groupNeed = (k: number) => Math.max(0, ...works.map((w, i) => (w.ratio < 1) === (works[k].ratio < 1) && w.tier === works[k].tier ? titleNeed(i) : 0));

    const layout = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const first = !W || !bodies.current.length;
      const deskH = Math.max(540, r.bottom > 0 ? vh - (r.top + window.scrollY) : vh);
      const float = r.width >= 900 && deskH >= 540 && r.width / deskH >= 1.15;
      const widthChanged = Math.abs(r.width - W) > 1;
      const Wn = r.width;
      const cols = float ? 0 : Wn < 600 ? 1 : 2;
      const gutter = cols === 2 ? Math.max(24, Wn * 0.05) : 14;
      const colW = cols === 2 ? (Wn - gutter * 3) / 2 : Wn;
      // 1) widths
      const widths = works.map((w, i) => {
        let ww: number;
        if (float) {
          const area = Wn * deskH * AREA;
          ww = Math.min(Math.max(Math.sqrt(area * (w.ratio < 1 ? w.ratio : 16 / 9)), 250), Wn * 0.3) * TIER[w.tier];
        } else if (cols === 1) ww = Wn * (w.ratio < 1 ? 0.6 : 0.78);
        else ww = colW * (w.ratio < 1 ? 0.78 : 1);
        return Math.min(Math.max(ww, titleNeed(i)), Wn - 24);
      });
      widths.forEach((ww, i) => { const n = nodes.current[i]; if (n) n.style.width = `${ww}px`; });
      // 2) measured heights (title may wrap only when the screen is narrower than the title)
      const heights = works.map((_, i) => nodes.current[i]?.offsetHeight ?? 300);
      const sizes = widths.map((ww, i) => ({ww, hh: heights[i]}));
      let floated = false;
      if (float) {
        const h = deskH;
        const sx = W ? Wn / W : 1, sy = H ? h / H : 1;
        H = h;
        const keep = !first && !widthChanged && lastMode === "float" && bodies.current.length === works.length;
        if (keep) {
          floated = true; el.style.height = "";
          works.forEach((_, i) => {
            const ww = Math.max(groupNeed(i), widths[i] * lastScale), n = nodes.current[i];
            if (n) n.style.width = `${ww}px`;
            const b = bodies.current[i]; b.x *= sx; b.y *= sy;
            place(i, b.x, b.y, {ww, hh: n?.offsetHeight ?? sizes[i].hh}, false);
          });
        } else {
          // Seed slots, then push overlapping windows (caption included) apart; shrink all if still crowded.
          const pad = 22, sep = 18;
          const capH = Math.max(46, ...works.map((_, i) => (nodes.current[i]?.querySelector<HTMLElement>("[data-cap]")?.offsetHeight ?? 0) + 14));
          let scale = 1, fits = false, rects: {x: number; y: number; w: number; h: number}[] = [];
          for (let attempt = 0; attempt < 8; attempt++) {
            const ws = widths.map((ww, i) => Math.max(groupNeed(i), ww * scale));
            ws.forEach((ww, i) => { const n = nodes.current[i]; if (n) n.style.width = `${ww}px`; });
            const hs = works.map((_, i) => nodes.current[i]?.offsetHeight ?? 300);
            let li = 0, ti = 0;
            rects = works.map((w, i) => {
              const [fx, fy] = w.ratio < 1 ? TALL[Math.min(ti++, TALL.length - 1)] : LAND[Math.min(li++, LAND.length - 1)];
              const e = ext(i);
              return {x: Wn * fx - ws[i] / 2, y: H * fy - hs[i] / 2 + 14, w: ws[i] + e.r, h: hs[i] + capH + e.b};
            });
            const bound = (q: typeof rects[0]) => {
              q.x = Math.min(Math.max(q.x, pad), Wn - q.w - pad);
              q.y = Math.min(Math.max(q.y, 6), H - q.h - 40);
            };
            rects.forEach(bound);
            let worst = 0;
            for (let it = 0; it < 240; it++) {
              worst = 0;
              for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
                const A = rects[i], B = rects[j];
                const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x) + sep;
                const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y) + sep;
                if (ox <= 0 || oy <= 0) continue;
                worst = Math.max(worst, Math.min(ox, oy));
                if (ox < oy) { const d = ox / 2 * (A.x + A.w / 2 < B.x + B.w / 2 ? -1 : 1); A.x += d; B.x -= d; }
                else { const d = oy / 2 * (A.y + A.h / 2 < B.y + B.h / 2 ? -1 : 1); A.y += d; B.y -= d; }
                bound(A); bound(B);
              }
              if (!worst) break;
            }
            sizes.forEach((sz, i) => { sz.ww = ws[i]; sz.hh = hs[i]; });
            fits = worst <= sep;
            if (fits || scale < 0.62) break;
            scale *= 0.93;
          }
          if (fits) { floated = true; lastScale = scale; el.style.height = ""; works.forEach((_, i) => place(i, rects[i].x, rects[i].y + capH, sizes[i], true)); }
        }
      }
      if (!floated) {
        // Flow mode (phones, tablets, foldables, small laptops): scrolling columns; windows still drag and float.
        const nl = Math.max(0, ...works.map((w, i) => w.ratio >= 1 && w.tier > 1 ? titleNeed(i) : 0));
        const gutterFor = (c: number) => c === 1 ? 14 : Math.max(24, Wn * 0.045);
        const colFor = (c: number) => c === 1 ? Wn : (Wn - gutterFor(c) * (c + 1)) / c;
        let fcols = Wn < 600 ? 1 : Wn >= 1000 ? 3 : 2;
        while (fcols > 1 && colFor(fcols) < nl) fcols--;
        const fg = gutterFor(fcols), fcw = colFor(fcols);
        // Tier 1 landscape windows span two columns; tier 3 windows are narrower.
        const span = (i: number) => fcols >= 2 && works[i].tier === 1 && works[i].ratio >= 1 ? 2 : 1;
        const ONE = {1: [0.92, 0.74], 2: [0.78, 0.6], 3: [0.64, 0.5]} as const;
        const fw = works.map((w, i) => {
          const tall = w.ratio < 1;
          const ww = fcols === 1 ? Wn * ONE[w.tier][tall ? 1 : 0]
            : span(i) === 2 ? fcw * 2 + fg
            : fcw * (tall ? (w.tier === 1 ? 0.96 : w.tier === 2 ? 0.78 : 0.66) : (w.tier === 3 ? 0.82 : 1));
          return Math.min(Math.max(ww, groupNeed(i)), Wn - 24);
        });
        fw.forEach((ww, i) => { const n = nodes.current[i]; if (n) n.style.width = `${ww}px`; });
        // Leave room for the docked player so it never runs off the screen edge.
        fw.forEach((ww, i) => {
          const r = ext(i).r, max = Wn - 52 - r;
          if (ww > max) { fw[i] = Math.max(groupNeed(i), max); const n = nodes.current[i]; if (n) n.style.width = `${fw[i]}px`; }
        });
        const fs = fw.map((ww, i) => ({ww, hh: nodes.current[i]?.offsetHeight ?? 300}));
        const fe = works.map((_, i) => ext(i));
        const fitX = (x: number, i: number) => Math.max(18, Math.min(x, Wn - fw[i] - fe[i].r - 30));
        const capMeasured = Math.max(0, ...works.map((_, i) => (nodes.current[i]?.querySelector<HTMLElement>("[data-cap]")?.offsetHeight ?? 0) + 14));
        const capSpace = Math.max(Wn < 600 ? 52 : 58, capMeasured), gap = Wn < 600 ? 34 : 44, top = 64;
        const pos: {x: number; y: number}[] = [];
        if (fcols === 1) {
          let y = top + capSpace;
          fs.forEach(({ww, hh}, i) => { pos.push({x: fitX(i % 2 ? Wn - ww - 14 - fe[i].r : 14, i), y}); y += hh + fe[i].b + gap + capSpace; });
          H = y;
        } else {
          const colY = Array.from({length: fcols}, (_, c) => top + capSpace + (c % 2) * 70);
          fs.forEach(({ww, hh}, i) => {
            if (span(i) === 2) {
              // pick the pair of neighbouring columns whose lower top is highest
              let c = 0, best = Infinity;
              for (let k = 0; k < fcols - 1; k++) { const y = Math.max(colY[k], colY[k + 1]); if (y < best) { best = y; c = k; } }
              pos.push({x: fitX(fg + c * (fcw + fg), i), y: best});
              colY[c] = colY[c + 1] = best + hh + fe[i].b + gap + capSpace;
              return;
            }
            const c = colY.indexOf(Math.min(...colY));
            const x0 = fg + c * (fcw + fg);
            const x = x0 + Math.max(0, fcw - ww) * (i % 3 === 1 ? 0.15 : i % 3 === 2 ? 0.85 : 0.5);
            pos.push({x: fitX(x, i), y: colY[c]});
            colY[c] += hh + fe[i].b + gap + capSpace;
          });
          H = Math.max(...colY);
        }
        H += 10;
        el.style.height = `${H}px`;
        works.forEach((_, i) => place(i, pos[i].x, pos[i].y, fs[i], first || lastMode !== "flow" || widthChanged));
      }
      lastMode = floated ? "float" : "flow";
      el.dataset.mode = lastMode;
      W = Wn;
    };
    const place = (i: number, x: number, y: number, s: {ww: number; hh: number}, reset: boolean) => {
      const b = bodies.current[i];
      if (reset || !b) bodies.current[i] = {x, y, vx: 0, vy: 0, w: s.ww, h: s.hh, phase: i * 1.7, drag: null};
      else { b.w = s.ww; b.h = s.hh; }
    };

    const clamp = (b: Body) => {
      const keepX = b.w * 0.35, keepY = 60;
      const minX = -b.w + keepX, maxX = W - keepX, minY = 34, maxY = H - keepY;
      if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.5; }
      if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * 0.5; }
    };

    const tick = (now: number) => {
      // arcade open: the windows are hidden, so skip the float animation entirely
      if (el.hasAttribute("data-arcade")) { last = now; raf = requestAnimationFrame(tick); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      bodies.current.forEach((b, i) => {
        const node = nodes.current[i];
        if (!node) return;
        let fx = 0, fy = 0, rot = 0;
        if (!b.drag) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          const f = Math.exp(-2.6 * dt);
          b.vx *= f; b.vy *= f;
          clamp(b);
          if (!reduce) {
            fx = Math.sin(t * 0.42 + b.phase) * 9 + Math.sin(t * 0.17 + b.phase * 2) * 6;
            fy = Math.cos(t * 0.36 + b.phase * 1.3) * 11;
            rot = Math.sin(t * 0.3 + b.phase) * 0.9 + Math.max(-6, Math.min(6, b.vx * 0.004));
          }
        } else {
          rot = Math.max(-6, Math.min(6, b.vx * 0.006));
        }
        node.style.transform = `translate3d(${b.x + fx}px,${b.y + fy}px,0) rotate(${rot}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };

    // Players: muted loops that play only while on screen (and never with reduced motion or data saver).
    const saveData = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData;
    const vids = Array.from(el.querySelectorAll<HTMLVideoElement>("video"));
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      const v = en.target as HTMLVideoElement;
      if (en.isIntersecting && !reduce && !saveData) { v.preload = "auto"; v.play().catch(() => {}); }
      else v.pause();
    }), {threshold: 0.25});
    // start the film clips only after the page (cover images, fonts) has finished loading, then when idle
    let idleId = 0;
    const startVideos = () => { idleId = window.setTimeout(() => vids.forEach(v => io.observe(v)), 600); };
    if (document.readyState === "complete") startVideos(); else window.addEventListener("load", startVideos, {once: true});
    // Safety net: a release anywhere (or leaving the page) always ends a drag.
    const release = () => bodies.current.forEach((b, i) => { if (b?.drag) { b.drag = null; delete nodes.current[i]?.dataset.dragging; } });
    window.addEventListener("pointerup", release);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);

    layout();
    el.dataset.ready = "1";
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.clearTimeout(idleId); window.removeEventListener("load", startVideos);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
    };
  }, [router, works]);

  const down = (i: number) => (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return;
    const b = bodies.current[i];
    if (!b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    const player = !!(e.target as HTMLElement).closest("[data-player]");
    b.drag = {id: e.pointerId, dx: e.clientX - b.x, dy: e.clientY - b.y, sx: e.clientX, sy: e.clientY, t: now, lx: e.clientX, ly: e.clientY, lt: now, moved: false, player};
    b.vx = 0; b.vy = 0;
    z.current[i] = ++top.current;
    e.currentTarget.style.zIndex = String(z.current[i]);
    e.currentTarget.dataset.dragging = "1";
  };
  const move = (i: number) => (e: PointerEvent<HTMLAnchorElement>) => {
    const b = bodies.current[i], d = b?.drag;
    if (!b || !d || d.id !== e.pointerId) return;
    // Mouse button already released (missed pointerup): stop following the cursor.
    if (e.pointerType === "mouse" && e.buttons === 0) { b.drag = null; delete e.currentTarget.dataset.dragging; return; }
    const now = performance.now(), dt = Math.max(1, now - d.lt) / 1000;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
    const vx = (e.clientX - d.lx) / dt, vy = (e.clientY - d.ly) / dt;
    b.vx = b.vx * 0.6 + vx * 0.4; b.vy = b.vy * 0.6 + vy * 0.4;
    d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
    b.x = e.clientX - d.dx; b.y = e.clientY - d.dy;
  };
  const up = (i: number, w: FloatingWork) => (e: PointerEvent<HTMLAnchorElement>) => {
    const b = bodies.current[i], d = b?.drag;
    if (!b || !d || d.id !== e.pointerId) return;
    b.drag = null;
    delete e.currentTarget.dataset.dragging;
    if (performance.now() - d.lt > 80) { b.vx = 0; b.vy = 0; }
    const cap = 2600, s = Math.hypot(b.vx, b.vy);
    if (s > cap) { b.vx *= cap / s; b.vy *= cap / s; }
    if (!d.moved && e.type === "pointerup") router.push(d.player && w.clip ? w.clip.href : w.href);
  };

  return (
    <section className={styles.desk} ref={desk} aria-labelledby="works-title" data-arcade={arcadeOpen ? "" : undefined}>
      <h1 id="works-title" className={styles.srOnly}>Selected Works</h1>
      <p className={styles.hint} aria-hidden="true">{ko ? "창을 끌어서 옮기고, 눌러서 열어 보세요" : "Drag windows around · click to open"}</p>
      {works.map((w, i) => (
        <a
          key={w.id}
          ref={el => { nodes.current[i] = el; }}
          href={w.href}
          className={`${styles.window} ${w.kind === "terminal" ? styles.terminal : ""}`}
          style={{zIndex: z.current[i]}}
          data-tier={w.tier}
          draggable={false}
          onClick={e => e.preventDefault()}
          onKeyDown={e => { if (e.key === "Enter") router.push(w.href); }}
          onPointerDown={down(i)}
          onPointerMove={move(i)}
          onPointerUp={up(i, w)}
          onPointerCancel={up(i, w)}
          onLostPointerCapture={up(i, w)}
          aria-label={`${w.number} ${w.title} — ${w.caption}`}
        >
          <span className={styles.caption} aria-hidden="true" data-cap>
            <span className={styles.capMain}><b>{w.number}</b>{w.caption}</span>
            {builder && w.tags && <code className={styles.tags}>{w.tags}</code>}
          </span>
          <span className={styles.bar} data-ctl={mouse ? "" : undefined}>
            <i {...btn(i, "close", ko ? "닫기" : "Close")}/>
            <i {...btn(i, "min", ko ? "최소화" : "Minimize")}/>
            <i {...btn(i, "full", ko ? "전체 화면" : "Full screen")}/>
            <em>{w.title}</em>
          </span>
          {w.kind === "terminal" && (
            <BuildLog live={builder}/>
          )}
          <span className={styles.media} style={{aspectRatio: String(w.ratio)}}>
            <Image src={w.image} alt={w.alt} fill draggable={false} priority={i < 4} quality={88} sizes="(max-width: 700px) 62vw, 32vw"/>
          </span>
          {w.clip && (
            <span className={styles.player} data-player data-tall={w.clip.ratio < 1 ? "1" : undefined} aria-hidden="true">
              <span className={styles.pbar}><i/><i/><i {...btn(i, "full", ko ? "영상 전체 화면" : "Full screen film", true)}/></span>
              <span className={styles.pmedia} style={{aspectRatio: String(w.clip.ratio)}}>
                <video src={w.clip.src} poster={w.clip.poster} muted loop playsInline preload="none" disablePictureInPicture tabIndex={-1}/>
                <b className={styles.play}/>
              </span>
            </span>
          )}
        </a>
      ))}
      {arcadeOpen && <Arcade ko={ko} onExit={restoreAll}/>}
      <div className={styles.dock} ref={dockRef} data-show={Object.keys(hidden).length && !arcadeOpen ? "1" : undefined}>
        {works.map((w, i) => hidden[i] && (
          <button key={w.id} type="button" className={styles.dockItem} onClick={() => restore(i)} title={w.title} aria-label={`${w.title} ${ko ? "다시 열기" : "restore"}`} data-min={hidden[i] === "min" ? "1" : undefined}>
            <Image src={w.image} alt="" width={96} height={96} draggable={false}/>
          </button>
        ))}
      </div>
      {full && (() => {
        const w = works[full.i], showVideo = full.video && w.clip;
        return (
          <div className={styles.fullBack} onClick={() => setFull(null)} role="dialog" aria-modal="true" aria-label={w.title}>
            <div className={`${styles.fullWin} ${w.kind === "terminal" ? styles.terminal : ""}`} onClick={e => e.stopPropagation()}>
              <span className={styles.bar}>
                <i role="button" aria-label={ko ? "닫기" : "Close"} onClick={() => { setFull(null); hide(full.i, "closed"); }}/>
                <i role="button" aria-label={ko ? "최소화" : "Minimize"} onClick={() => { setFull(null); hide(full.i, "min"); }}/>
                <i role="button" aria-label={ko ? "전체 화면 끝내기" : "Exit full screen"} onClick={() => setFull(null)}/>
                <em>{w.title}</em>
              </span>
              <div className={styles.fullBody}>
                {showVideo ? (
                  <video ref={fullVideo} src={w.clip!.src} poster={w.clip!.poster} muted loop playsInline autoPlay controls controlsList="nodownload noplaybackrate" disablePictureInPicture className={styles.fullMedia}/>
                ) : (
                  <span className={styles.fullMedia}><Image src={w.image} alt={w.alt} fill sizes="92vw" quality={90} style={{objectFit: "contain"}}/></span>
                )}
              </div>
              <div className={styles.fullFoot}>
                <span><b>{w.number}</b>{w.caption}</span>
                <span className={styles.fullActions}>
                  {w.clip && <button type="button" onClick={() => setFull({i: full.i, video: !showVideo})}>{showVideo ? (ko ? "이미지 보기" : "Image") : (ko ? "영상 보기" : "Film")}</button>}
                  <button type="button" className={styles.fullOpen} onClick={() => router.push(w.href)}>{ko ? "작품 보기" : "Open project"} ↗</button>
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

// NODE terminal as a live build log: types build commands one after another.
const LOG = ["./build vesa", "./render wishbone", "./simulate NODE", "deploy sgyun.kr"];
const PS1 = "sgyun@node ~ %";
function BuildLog({live}: {live: boolean}) {
  const out = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = out.current;
    if (!el) return;
    if (!live || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = "./simulate NODE"; return; }
    let line = 2, ch = LOG[2].length, del = false, t = 0;
    const step = () => {
      const cmd = LOG[line];
      if (!del) {
        if (ch < cmd.length) { ch++; t = window.setTimeout(step, 55 + Math.random() * 70); }
        else { del = true; t = window.setTimeout(step, 2600); }
      } else if (ch > 0) { ch--; t = window.setTimeout(step, 22); }
      else { del = false; line = (line + 1) % LOG.length; t = window.setTimeout(step, 380); }
      el.textContent = cmd.slice(0, ch);
    };
    el.textContent = LOG[2];
    t = window.setTimeout(step, 2600);
    return () => window.clearTimeout(t);
  }, [live]);
  const longest = LOG.reduce((a, b) => (b.length > a.length ? b : a));
  return (
    <span className={styles.prompt} data-prompt data-longest={`${PS1} ${longest}`} aria-hidden="true">
      <span>{PS1}</span> <b ref={out}>./simulate NODE</b><i/>
    </span>
  );
}
