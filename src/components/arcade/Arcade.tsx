"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import art from "./art.json";
import styles from "./arcade.module.css";
import { sfx } from "./sfx";
import { JetBrains_Mono } from "next/font/google";

// Arcade UI is English-only and set in JetBrains Mono (exposed to every game as --font-arcade).
const arcadeFont = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-arcade", display: "swap" });

const AirHockey = dynamic(() => import("./AirHockey"), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">LOADING…</div>,
});
const CarCrush = dynamic(() => import("./CarCrush"), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">LOADING…</div>,
});
const Tanks = dynamic(() => import("./Tanks"), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">LOADING…</div>,
});
const Pinball = dynamic(() => import("./Pinball"), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">LOADING…</div>,
});
// Games that are wired into the hub; the others still show COMING SOON.
type Screen = "hub" | "airhockey" | "carcrush" | "tanks" | "pinball";
const READY: Partial<Record<string, Screen>> = { airhockey: "airhockey", tanks: "tanks", pinball: "pinball" }; // carcrush parked: per-hit local damage needs a better art pipeline
const rectStyle = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });

/** Parent mounts this lazy module only after all desktop work windows close. */
export function Arcade({ onExit }: { ko?: boolean; onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>("hub");
  const [soon, setSoon] = useState("");
  const [sound, setSound] = useState(true);
  useEffect(() => { setSound(sfx.enabled); return sfx.subscribe(setSound); }, []);
  const root = useRef<HTMLDivElement>(null);
  const soonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow, htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden";
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, [tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || !root.current?.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !root.current?.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow;
      document.removeEventListener("keydown", trap); previous?.focus({ preventScroll: true });
      if (soonTimer.current) clearTimeout(soonTimer.current);
    };
  }, []);
  useEffect(() => {
    if (screen !== "hub") return;
    root.current?.querySelector<HTMLButtonElement>('[data-game="airhockey"]')?.focus({ preventScroll: true });
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); onExit(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [screen, onExit]);
  const comingSoon = (name: string) => {
    setSoon(name);
    if (soonTimer.current) clearTimeout(soonTimer.current);
    soonTimer.current = setTimeout(() => setSoon(""), 1900);
  };
  return <div ref={root} className={`${styles.overlay} ${arcadeFont.variable}`} role="dialog" aria-modal="true" aria-label="Hidden arcade">
    {screen === "airhockey" ? <AirHockey ko={false} onBack={() => setScreen("hub")} /> : screen === "carcrush" ? <CarCrush ko={false} onBack={() => setScreen("hub")} /> : screen === "tanks" ? <Tanks ko={false} onBack={() => setScreen("hub")} /> : screen === "pinball" ? <Pinball ko={false} onBack={() => setScreen("hub")} /> : <>
      <div className={styles.hub} style={{ aspectRatio: `${art.hub.width}/${art.hub.height}` }}>
        {/* The raster contains the model, materials and lighting; buttons only add interaction. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.asset} src="/arcade/hub_console.webp" alt="" draggable={false} width={art.hub.width} height={art.hub.height} />
        <div className={styles.hubLcd} style={rectStyle(art.hub.lcd)} role="status" aria-live="polite">
          {soon ? <><span className={styles.soonName}>{soon}</span><span className={styles.soon}>COMING SOON</span></> : <span>ARCADE</span>}
        </div>
        {art.hub.tiles.map(tile => <button key={tile.id} data-game={tile.id} className={styles.tile} style={{ ...rectStyle(tile), backgroundImage: 'url("/arcade/hub_console.webp")', backgroundSize: `${100 / tile.w}% ${100 / tile.h}%`, backgroundPosition: `${tile.x / (1 - tile.w) * 100}% ${tile.y / (1 - tile.h) * 100}%` }} aria-label={READY[tile.id] ? tile.label : `${tile.label} · coming soon`} onClick={() => { sfx.unlock(); sfx.play("tap"); const next = READY[tile.id]; if (next) setScreen(next); else comingSoon(tile.label); }} />)}
      </div>
      <div className={styles.hubBar}>
        <button className={styles.textButton} onClick={() => sfx.setEnabled(!sound)} aria-pressed={sound}>{sound ? "♪ Sound on" : "♪ Sound off"}</button>
        <span className={styles.hubDot} aria-hidden="true" />
        <button className={styles.textButton} onClick={onExit}>× Close</button>
      </div>
    </>}
  </div>;
}

export default Arcade;
