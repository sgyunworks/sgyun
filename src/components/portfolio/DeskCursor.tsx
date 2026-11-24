"use client";
import {useEffect, useRef} from "react";
import styles from "./Portfolio.module.css";

// CAD-style crosshair with screen coordinates that follows a real mouse (hidden on touch screens).
export function DeskCursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0, x = 0, y = 0;
    const paint = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`);
      if (label.current) label.current.textContent = `X ${String(Math.round(x)).padStart(4, "0")}  Y ${String(Math.round(y + window.scrollY)).padStart(4, "0")}`;
    };
    const mv = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; x = e.clientX; y = e.clientY; el.dataset.on = "1"; if (!raf) raf = requestAnimationFrame(paint); };
    const lv = () => { delete el.dataset.on; };
    window.addEventListener("pointermove", mv, {passive: true});
    document.documentElement.addEventListener("pointerleave", lv);
    return () => { window.removeEventListener("pointermove", mv); document.documentElement.removeEventListener("pointerleave", lv); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={root} className={styles.deskCursor} aria-hidden="true"><i/><i/><span ref={label}/></div>;
}
