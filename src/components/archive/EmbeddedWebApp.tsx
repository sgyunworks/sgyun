"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import styles from "./EmbeddedWebApp.module.css";

type AppState = "idle" | "loading" | "ready" | "error";

export function EmbeddedWebApp({
  locale,
  url,
  poster,
  title,
  body,
  productTitle,
}: {
  locale: Locale;
  url: string;
  poster: string;
  title: string;
  body: string;
  productTitle: string;
}) {
  const [state, setState] = useState<AppState>("idle");
  const [frameKey, setFrameKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const copy = {
    section: locale === "ko" ? "실행 가능한 프로토타입" : "Working prototype",
    launch: locale === "ko" ? "웹앱 실행" : "Run web app",
    close: locale === "ko" ? "프리뷰로 돌아가기" : "Return to preview",
    external: locale === "ko" ? "새 창에서 열기" : "Open in new window",
    loading: locale === "ko" ? "RecoPick을 연결하는 중" : "Connecting RecoPick",
    failed:
      locale === "ko"
        ? "웹앱을 연결하지 못했습니다. 새 창에서 계속할 수 있습니다."
        : "The web app could not be connected. Continue in a new window.",
    privacy:
      locale === "ko"
        ? "실행을 선택한 뒤에만 외부 웹앱을 불러옵니다."
        : "The external web app loads only after you choose to run it.",
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          document.documentElement.dataset.embeddedAppFocus = "true";
        } else {
          delete document.documentElement.dataset.embeddedAppFocus;
        }
      },
      { threshold: [0, 0.28, 0.6] }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.embeddedAppFocus;
    };
  }, []);

  useEffect(() => {
    if (state !== "loading") return;
    const timeout = window.setTimeout(() => setState("error"), 12000);
    return () => window.clearTimeout(timeout);
  }, [frameKey, state]);

  const launch = () => {
    setFrameKey((current) => current + 1);
    setState("loading");
  };

  const close = () => setState("idle");

  return (
    <section
      id="project-live-app"
      ref={sectionRef}
      className={styles.section}
      data-app-state={state}
    >
      <div className={styles.meta}>
        <span className={styles.eyebrow}>D / LIVE APP</span>
        <div>
          <small>{copy.section}</small>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>

        <div className={styles.actions}>
          {state === "idle" || state === "error" ? (
            <button type="button" onClick={launch}>
              <span>{copy.launch}</span>
              <i aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={close}>
              <span>{copy.close}</span>
              <i aria-hidden="true" />
            </button>
          )}
          <a href={url} target="_blank" rel="noreferrer">
            {copy.external}
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <p className={styles.privacy}>{copy.privacy}</p>
      </div>

      <div className={styles.deviceStage}>
        <div className={styles.device}>
          <span className={styles.sideButtonTop} aria-hidden="true" />
          <span className={styles.sideButtonBottom} aria-hidden="true" />
          <span className={styles.actionButton} aria-hidden="true" />

          <div className={styles.screen}>
            <Image
              src={poster}
              alt={`${productTitle} mobile interface`}
              fill
              sizes="(max-width: 600px) 94vw, 402px"
              className={styles.poster}
              priority={false}
            />

            {state !== "idle" ? (
              <iframe
                key={frameKey}
                src={url}
                title={`${productTitle} web app`}
                allow="geolocation"
                referrerPolicy="strict-origin-when-cross-origin"
                className={styles.frame}
                data-visible={state === "ready"}
                onLoad={() => setState("ready")}
              />
            ) : null}

            {state === "loading" ? (
              <div className={styles.loading} role="status" aria-live="polite">
                <span />
                <p>{copy.loading}</p>
              </div>
            ) : null}

            {state === "error" ? (
              <div className={styles.error} role="alert">
                <p>{copy.failed}</p>
                <a href={url} target="_blank" rel="noreferrer">
                  {copy.external} <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : null}

            <span className={styles.dynamicIsland} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.readout} aria-hidden="true">
          <span>RECOPICK.XYZ</span>
          <i />
          <span>{state.toUpperCase()}</span>
        </div>
      </div>
    </section>
  );
}
