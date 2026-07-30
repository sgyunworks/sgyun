"use client";

import { useEffect, useRef, useState } from "react";
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
  const [step, setStep] = useState(0);

  useEffect(() => {
    setVisible(false);
    setStep(0);
    if (pathname.endsWith("/calibration") || pathname.endsWith("/vault")) return;

    let stepTimer: number | undefined;
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
      stepTimer = window.setTimeout(() => setStep(1), 2200);
      closeTimer = window.setTimeout(() => setVisible(false), 5000);
    }, 700);

    return () => {
      window.clearTimeout(revealTimer);
      if (stepTimer !== undefined) window.clearTimeout(stepTimer);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [pathname]);

  if (!visible) return null;
  const message = copy[locale][step];

  return (
    <aside
      className={styles.guide}
      data-dial-guide="true"
      data-step={step}
      aria-live="polite"
    >
      <div className={styles.panel}>
        <div className={styles.meta} aria-hidden="true">
          <span>VAULT DIAL / GUIDE</span>
          <i />
          <span>{String(step + 1).padStart(2, "0")}/02</span>
        </div>
        <div className={styles.message} key={message.code}>
          <small>{message.code}</small>
          <strong>{message.title}</strong>
          <p>{message.body}</p>
        </div>
        <div className={styles.gesture} aria-hidden="true">
          <i />
        </div>
        <div className={styles.progress} aria-hidden="true">
          <i />
          <i />
        </div>
        <button
          type="button"
          aria-label={locale === "ko" ? "다이얼 안내 닫기" : "Dismiss dial guide"}
          onClick={() => setVisible(false)}
        >
          ×
        </button>
      </div>
    </aside>
  );
}
