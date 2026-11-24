"use client";
import {useEffect} from "react";

// Light copy deterrents. A website cannot truly stop someone who wants its code or images
// (the browser already downloaded them); this only blocks the easy routes for casual visitors.
export function SiteGuard() {
  useEffect(() => {
    if (location.pathname.startsWith("/studio")) return; // editor keeps normal browser tools
    const editable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input,textarea,select,[contenteditable=true]");
    // Right-click / long-press save on images, videos and canvases.
    const menu = (e: MouseEvent) => {
      if (editable(e.target)) return;
      if (e.target instanceof Element && e.target.closest("img,picture,video,canvas,svg,[data-player],[class*=media]")) e.preventDefault();
    };
    // DevTools, view-source and save-page shortcuts.
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase(), mod = e.metaKey || e.ctrlKey;
      const devtools = k === "f12" || (mod && (e.shiftKey || e.altKey) && ["i", "j", "c"].includes(k));
      const source = mod && (k === "u" || k === "s");
      if (devtools || source) { e.preventDefault(); e.stopPropagation(); }
    };
    const drag = (e: DragEvent) => { if (e.target instanceof Element && e.target.closest("img,video")) e.preventDefault(); };
    document.addEventListener("contextmenu", menu);
    window.addEventListener("keydown", key, true);
    document.addEventListener("dragstart", drag);
    console.log("%cSGYUN © 2026", "font:600 22px sans-serif;color:#111");
    console.log("%c이 사이트의 디자인·이미지·영상·코드는 저작권으로 보호됩니다. 무단 복제와 재사용을 금합니다.\nAll design, images, films and code on this site are protected by copyright. Do not copy or reuse without permission.", "font:13px sans-serif;color:#555");
    return () => {
      document.removeEventListener("contextmenu", menu);
      window.removeEventListener("keydown", key, true);
      document.removeEventListener("dragstart", drag);
    };
  }, []);
  return null;
}
