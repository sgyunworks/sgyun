"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { IPhone17ProMockup } from "./IPhone17ProMockup";
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
  const deviceStageRef = useRef<HTMLDivElement>(null);
  const appIsOpen = state === "loading" || state === "ready";

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

  useEffect(() => {
    if (!appIsOpen) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const previousBody = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousHtmlOverflow = html.style.overflow;
    const previousOverscroll = html.style.overscrollBehavior;

    html.dataset.embeddedAppActive = "true";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      delete html.dataset.embeddedAppActive;
      html.style.overflow = previousHtmlOverflow;
      html.style.overscrollBehavior = previousOverscroll;
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.width = previousBody.width;
      body.style.overflow = previousBody.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [appIsOpen]);

  const launch = () => {
    deviceStageRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
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
      data-mobile-app-visual="true"
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

      <div ref={deviceStageRef} className={styles.deviceStage}>
        {appIsOpen ? (
          <button
            type="button"
            className={styles.deviceClose}
            onClick={close}
            aria-label={copy.close}
          >
            <span>{copy.close}</span>
            <i aria-hidden="true" />
          </button>
        ) : null}

        <IPhone17ProMockup className={styles.device} screenClassName={styles.screen}>
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
                scrolling="no"
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
        </IPhone17ProMockup>

        <div className={styles.readout} aria-hidden="true">
          <span>RECOPICK.XYZ</span>
          <i />
          <span>{state.toUpperCase()}</span>
        </div>
      </div>
    </section>
  );
}
