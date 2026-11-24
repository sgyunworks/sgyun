"use client";
import {useEffect, useRef, useState, type PointerEvent} from "react";
import styles from "./Portfolio.module.css";

// Mobile easter-egg trigger: on the Works page, pull the header's "Y" down and release (like the landing page)
// to open the hidden arcade. Desktop keeps the plain wordmark (it opens the arcade by closing every window).
export const ARCADE_EVENT = "sgyun:open-arcade";
const OPEN_AT = 60, MAX = 96;

export function YPull({enabled}: {enabled: boolean}) {
  const [touch, setTouch] = useState(false);
  const [dy, setDy] = useState(0);
  const [held, setHeld] = useState(false);
  const drag = useRef<null | {id: number; y0: number; x0: number; moved: boolean}>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const on = () => setTouch(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const live = enabled && touch;

  const down = (e: PointerEvent<HTMLSpanElement>) => {
    if (!live) return;
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {id: e.pointerId, y0: e.clientY, x0: e.clientX, moved: false};
    setHeld(true);
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const raw = Math.max(0, e.clientY - d.y0);
    if (raw > 6 || Math.abs(e.clientX - d.x0) > 6) d.moved = true;
    setDy(MAX * Math.tanh(raw / MAX)); // elastic, like the landing page wire
  };
  const up = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    drag.current = null; setHeld(false);
    if (dy >= OPEN_AT) {
      navigator.vibrate?.(12);
      window.dispatchEvent(new CustomEvent(ARCADE_EVENT));
    }
    setDy(0);
  };

  return (
    <span
      className={styles.yPull}
      data-live={live ? "" : undefined}
      data-held={held ? "" : undefined}
      data-ready={dy >= OPEN_AT ? "" : undefined}
      style={{transform: dy ? `translateY(${dy}px) scaleY(${1 + dy / 400})` : undefined}}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onClick={e => { if (live) { e.preventDefault(); e.stopPropagation(); } }}
      aria-hidden="true"
    >Y</span>
  );
}
