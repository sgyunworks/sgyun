"use client";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {useEffect, useRef, type PointerEvent} from "react";
import type {Locale} from "@/lib/i18n";
import styles from "./FloatingWorks.module.css";

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
};

type Body = {x:number;y:number;vx:number;vy:number;w:number;h:number;phase:number;drag:null|{id:number;dx:number;dy:number;sx:number;sy:number;t:number;lx:number;ly:number;lt:number;moved:boolean}};

// Sizes are chosen so every window carries a similar visual area.
const AREA = 0.04; // fraction of desk area per window

export function FloatingWorks({locale, works}:{locale:Locale; works:FloatingWork[]}) {
  const router = useRouter();
  const desk = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLAnchorElement|null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const z = useRef<number[]>(works.map((_, i) => i + 1));
  const top = useRef(works.length + 1);
  const ko = locale === "ko";

  useEffect(() => {
    works.forEach(w => router.prefetch(w.href));
    const el = desk.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, last = performance.now(), lastMode = "", lastScale = 1;

    // Float mode (wide screens): tall windows hold the two edges, landscape windows fill the middle (3 over 2).
    const LAND = [[0.29, 0.30], [0.5, 0.25], [0.71, 0.31], [0.38, 0.74], [0.62, 0.72], [0.5, 0.5], [0.3, 0.55]];
    const TALL = [[0.1, 0.52], [0.9, 0.54], [0.5, 0.5]];
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
        promptW = Math.ceil(ctx.measureText(prompt.textContent ?? "").width + parseFloat(ps.columnGap || "7") * 2 + 8 + parseFloat(ps.paddingLeft) + parseFloat(ps.paddingRight) + 6);
      }
      return Math.max(title, promptW);
    };
    // Same-shaped windows share one width: the widest title among them decides it.
    const groupNeed = (tall: boolean) => Math.max(0, ...works.map((w, i) => (w.ratio < 1) === tall ? titleNeed(i) : 0));

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
          ww = Math.min(Math.max(Math.sqrt(area * (w.ratio < 1 ? w.ratio : 16 / 9)), 250), Wn * 0.3);
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
            const ww = Math.max(groupNeed(works[i].ratio < 1), widths[i] * lastScale), n = nodes.current[i];
            if (n) n.style.width = `${ww}px`;
            const b = bodies.current[i]; b.x *= sx; b.y *= sy;
            place(i, b.x, b.y, {ww, hh: n?.offsetHeight ?? sizes[i].hh}, false);
          });
        } else {
          // Seed slots, then push overlapping windows (caption included) apart; shrink all if still crowded.
          const pad = 22, capH = 46, sep = 18;
          let scale = 1, fits = false, rects: {x: number; y: number; w: number; h: number}[] = [];
          for (let attempt = 0; attempt < 8; attempt++) {
            const nl = groupNeed(false), nt = groupNeed(true);
            const ws = widths.map((ww, i) => Math.max(works[i].ratio < 1 ? nt : nl, ww * scale));
            ws.forEach((ww, i) => { const n = nodes.current[i]; if (n) n.style.width = `${ww}px`; });
            const hs = works.map((_, i) => nodes.current[i]?.offsetHeight ?? 300);
            let li = 0, ti = 0;
            rects = works.map((w, i) => {
              const [fx, fy] = w.ratio < 1 ? TALL[Math.min(ti++, TALL.length - 1)] : LAND[Math.min(li++, LAND.length - 1)];
              return {x: Wn * fx - ws[i] / 2, y: H * fy - hs[i] / 2 + 14, w: ws[i], h: hs[i] + capH};
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
        const nl = groupNeed(false), nt = groupNeed(true);
        const gutterFor = (c: number) => c === 1 ? 14 : Math.max(24, Wn * 0.045);
        const colFor = (c: number) => c === 1 ? Wn : (Wn - gutterFor(c) * (c + 1)) / c;
        let fcols = Wn < 600 ? 1 : Wn >= 1000 ? 3 : 2;
        while (fcols > 1 && colFor(fcols) < nl) fcols--;
        const fg = gutterFor(fcols), fcw = colFor(fcols);
        const fw = works.map(w => {
          const tall = w.ratio < 1;
          const ww = fcols === 1 ? Wn * (tall ? 0.6 : 0.78) : fcw * (tall ? 0.78 : 1);
          return Math.min(Math.max(ww, tall ? nt : nl), Wn - 24);
        });
        fw.forEach((ww, i) => { const n = nodes.current[i]; if (n) n.style.width = `${ww}px`; });
        const fs = fw.map((ww, i) => ({ww, hh: nodes.current[i]?.offsetHeight ?? 300}));
        const capSpace = Wn < 600 ? 52 : 58, gap = Wn < 600 ? 34 : 44, top = 64;
        const pos: {x: number; y: number}[] = [];
        if (fcols === 1) {
          let y = top + capSpace;
          fs.forEach(({ww, hh}, i) => { pos.push({x: i % 2 ? Wn - ww - 14 : 14, y}); y += hh + gap + capSpace; });
          H = y;
        } else {
          const colY = Array.from({length: fcols}, (_, c) => top + capSpace + (c % 2) * 70);
          fs.forEach(({ww, hh}, i) => {
            const c = colY.indexOf(Math.min(...colY));
            const x0 = fg + c * (fcw + fg);
            const x = x0 + Math.max(0, fcw - ww) * (i % 3 === 1 ? 0.15 : i % 3 === 2 ? 0.85 : 0.5);
            pos.push({x: Math.min(x, Wn - ww - 12), y: colY[c]});
            colY[c] += hh + gap + capSpace;
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

    layout();
    el.dataset.ready = "1";
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [router, works]);

  const down = (i: number) => (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return;
    const b = bodies.current[i];
    if (!b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    b.drag = {id: e.pointerId, dx: e.clientX - b.x, dy: e.clientY - b.y, sx: e.clientX, sy: e.clientY, t: now, lx: e.clientX, ly: e.clientY, lt: now, moved: false};
    b.vx = 0; b.vy = 0;
    z.current[i] = ++top.current;
    e.currentTarget.style.zIndex = String(z.current[i]);
    e.currentTarget.dataset.dragging = "1";
  };
  const move = (i: number) => (e: PointerEvent<HTMLAnchorElement>) => {
    const b = bodies.current[i], d = b?.drag;
    if (!b || !d || d.id !== e.pointerId) return;
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
    if (!d.moved && e.type === "pointerup") router.push(w.href);
  };

  return (
    <section className={styles.desk} ref={desk} aria-labelledby="works-title">
      <h1 id="works-title" className={styles.srOnly}>Selected Works</h1>
      <p className={styles.hint} aria-hidden="true">{ko ? "창을 끌어서 옮기고, 눌러서 열어 보세요" : "Drag windows around · click to open"}</p>
      {works.map((w, i) => (
        <a
          key={w.id}
          ref={el => { nodes.current[i] = el; }}
          href={w.href}
          className={`${styles.window} ${w.kind === "terminal" ? styles.terminal : ""}`}
          style={{zIndex: i + 1}}
          draggable={false}
          onClick={e => e.preventDefault()}
          onKeyDown={e => { if (e.key === "Enter") router.push(w.href); }}
          onPointerDown={down(i)}
          onPointerMove={move(i)}
          onPointerUp={up(i, w)}
          onPointerCancel={up(i, w)}
          aria-label={`${w.number} ${w.title} — ${w.caption}`}
        >
          <span className={styles.caption} aria-hidden="true"><b>{w.number}</b>{w.caption}</span>
          <span className={styles.bar} aria-hidden="true">
            <i/><i/><i/>
            <em>{w.title}</em>
          </span>
          {w.kind === "terminal" && (
            <span className={styles.prompt} data-prompt aria-hidden="true">
              <span>sgyun@node ~ %</span> ./simulate NODE<i/>
            </span>
          )}
          <span className={styles.media} style={{aspectRatio: String(w.ratio)}}>
            <Image src={w.image} alt={w.alt} fill draggable={false} priority={i < 4} quality={88} sizes="(max-width: 700px) 62vw, 32vw"/>
          </span>
        </a>
      ))}
    </section>
  );
}
