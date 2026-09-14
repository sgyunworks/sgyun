"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./Presentation.module.css";
const classes = (names: string) => names.split(/\s+/).filter(Boolean).map(name => styles[name]).join(" ");

const slideCount = 15;
const assetPrefix = "https://vesa-floating-speaker-2026.sgtyun.chatgpt.site/deck-final-f198acad";
const videoSpecs = [
  { slideIndex: 0, file: "video-01.mp4", width: 75, loop: true, volume: 0.8, audio: false },
  { slideIndex: 4, file: "video-05.mp4", width: 75.15600393700788, loop: true, volume: 0.5, audio: false },
  { slideIndex: 7, file: "video-08.mp4", width: 72.50250164041995, loop: false, volume: 0.5, audio: true },
];
const slides = Array.from(
  { length: slideCount },
  (_, index) => `${assetPrefix}/slide-${String(index + 1).padStart(2, "0")}.png`,
);

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const pointerStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 1800);
  }, []);

  const goTo = useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(slideCount - 1, index));
    setActiveIndex(nextIndex);
  }, []);

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const previous = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    let cancelled = false;
    for (const spec of videoSpecs) {
      const video = videoRefs.current[spec.slideIndex];
      if (!video) continue;
      if (activeIndex !== spec.slideIndex) {
        video.pause();
        continue;
      }
      video.currentTime = 0;
      video.volume = spec.volume;
      void video.play().catch(() => {
        if (!cancelled && spec.audio) {
          video.muted = true;
          setSoundMuted(true);
          void video.play().catch(() => undefined);
        }
      });
    }
    return () => { cancelled = true; };
  }, [activeIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(event.key)) {
        event.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) {
        event.preventDefault();
        previous();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(slideCount - 1);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen();
        } else {
          void document.exitFullscreen();
        }
      }
      showControls();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, next, previous, showControls]);

  useEffect(() => {
    hideTimer.current = setTimeout(() => setControlsVisible(false), 1800);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const onStageClick = (event: React.MouseEvent<HTMLElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX - bounds.left < bounds.width * 0.28) previous();
    else next();
  };

  return (
    <main
      className={classes(`presentation-shell ${controlsVisible ? "controls-visible" : ""}`)}
      aria-label="VESA Floating Speaker 프레젠테이션"
      onMouseMove={showControls}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <section
        className={classes("deck-stage")} 
        aria-live="polite"
        onClick={onStageClick}
        onPointerDown={(event) => {
          suppressClick.current = false;
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const distance = event.clientX - pointerStart.current;
          if (Math.abs(distance) > 70) {
            suppressClick.current = true;
            if (distance < 0) next();
            else previous();
          }
          pointerStart.current = null;
        }}
      >
        {slides.map((src, index) => {
          const video = videoSpecs.find((spec) => spec.slideIndex === index);
          const position =
            index === activeIndex ? "is-active" : index < activeIndex ? "is-before" : "is-after";

          return (
            <article
              className={classes(`slide ${position}`)}
              aria-hidden={index !== activeIndex}
              key={src}
            >
              <img
                className={classes("slide-image")} 
                src={index === 7 ? `${assetPrefix}/slide-08-background.png` : src}
                alt={`VESA Floating Speaker 발표 슬라이드 ${index + 1}`}
                draggable={false}
                loading="eager"
                decoding="async"
              />

              {index === 0 ? <p className={classes("application-label")} >← → 방향키로 페이지 이동</p> : null}

              {video ? (
                <video
                  ref={(element) => { videoRefs.current[index] = element; }}
                  className={classes("slide-video")} 
                  style={{ width: `${video.width}%` }}
                  src={`${assetPrefix}/${video.file}`}
                  poster={index === 7 ? `${assetPrefix}/video-08-poster.jpeg` : undefined}
                  muted={video.audio ? soundMuted : true}
                  loop={video.loop}
                  playsInline
                  preload="auto"
                  aria-label={`${index + 1}페이지 원본 영상`}
                />
              ) : null}
            </article>
          );
        })}

        <nav className={classes("deck-ui")}  aria-label="발표 조작">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              previous();
            }}
            disabled={activeIndex === 0}
            aria-label="이전 슬라이드"
          >
            PREV
          </button>
          <span aria-label={`${slideCount}장 중 ${activeIndex + 1}장`}>
            {String(activeIndex + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            disabled={activeIndex === slideCount - 1}
            aria-label="다음 슬라이드"
          >
            NEXT
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
              else void document.exitFullscreen();
            }}
            aria-label="전체 화면 전환"
          >
            FULLSCREEN
          </button>
          {activeIndex === 7 ? (
            <button type="button" aria-label={soundMuted ? "영상 소리 켜기" : "영상 소리 끄기"}
              onClick={(event) => {
                event.stopPropagation();
                const video = videoRefs.current[7];
                if (video) {
                  video.muted = !soundMuted;
                  void video.play().catch(() => undefined);
                }
                setSoundMuted(!soundMuted);
              }}>
              {soundMuted ? "SOUND ON" : "MUTE"}
            </button>
          ) : null}
        </nav>
      </section>
    </main>
  );
}
