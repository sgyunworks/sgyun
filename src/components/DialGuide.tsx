"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import styles from "./DialGuide.module.css";

const GUIDE_STORAGE_KEY = "sgyun:vault-dial-guide:v1";

const copy = {
  ko: [
    {
      code: "SCROLL_01",
      title: "스크롤과 함께 회전합니다.",
      body: "페이지를 평소처럼 스크롤해도 현재 위치를 따라갑니다.",
    },
    {
      code: "DRAG_02",
      title: "다이얼로 직접 이동할 수 있습니다.",
      body: "보이는 다이얼 면을 위아래로 천천히 끌어보세요.",
    },
  ],
  en: [
    {
      code: "SCROLL_01",
      title: "It follows the page.",
      body: "Scroll as usual and the dial tracks your position.",
    },
    {
      code: "DRAG_02",
      title: "It also controls the page.",
      body: "Drag the visible dial face slowly up or down.",
    },
  ],
} as const;

export function DialGuide({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const shownThisVisitRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const dismiss = useCallback(() => setVisible(false), []);

  useEffect(() => {
    setVisible(false);
    if (pathname.endsWith("/calibration") || pathname.endsWith("/vault")) return;

    let closeTimer: number | undefined;
    const revealTimer = window.setTimeout(() => {
      if (shownThisVisitRef.current) return;
      try {
        if (window.localStorage.getItem(GUIDE_STORAGE_KEY) === "seen") return;
      } catch {
        // A blocked storage API should not block the transient guide.
      }

      if (!document.querySelector("[data-vault-dial]")) return;

      shownThisVisitRef.current = true;
      try {
        window.localStorage.setItem(GUIDE_STORAGE_KEY, "seen");
      } catch {
        // The guide still runs once for the current mounted visit.
      }
      setVisible(true);
      closeTimer = window.setTimeout(() => setVisible(false), 4600);
    }, 700);

    return () => {
      window.clearTimeout(revealTimer);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const closeOnPointer = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest("[data-vault-dial]")) dismiss();
    };
    const closeOnKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) {
        dismiss();
      }
    };
    window.addEventListener("scroll", dismiss, { once: true, passive: true });
    document.addEventListener("pointerdown", closeOnPointer, true);
    window.addEventListener("keydown", closeOnKey, true);
    return () => {
      window.removeEventListener("scroll", dismiss);
      document.removeEventListener("pointerdown", closeOnPointer, true);
      window.removeEventListener("keydown", closeOnKey, true);
    };
  }, [dismiss, visible]);

  if (!visible) return null;
  const messages = copy[locale];

  return (
    <aside
      className={styles.guide}
      data-dial-guide="true"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.panel}>
        <div className={styles.message}>
          <small>VAULT DIAL</small>
          <strong>{messages[1].title}</strong>
        </div>
        <div className={styles.gesture} aria-hidden="true">
          <i />
        </div>
        <button
          type="button"
          aria-label={locale === "ko" ? "다이얼 안내 닫기" : "Dismiss dial guide"}
          onClick={dismiss}
        >
          ×
        </button>
      </div>
    </aside>
  );
}
