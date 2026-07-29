"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { VaultAction } from "@/components/VaultAction";
import {
  archiveCategories,
  archiveCategoryOrder,
  archiveProjects,
  localizeArchiveProject,
} from "@/lib/archive";
import styles from "./DialArchive.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DIAL_STEP = 15;
const TICK_COUNT = 55;
const RATCHET_STEPS_PER_PROJECT = 4;
const DRAG_PX_PER_PROJECT = 84;
const HAPTIC_MIN_INTERVAL_MS = 34;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type ArchiveStyle = CSSProperties & {
  "--archive-count": number;
};

type PreviewFrameStyle = CSSProperties & {
  "--preview-aspect": number;
};

type TickStyle = CSSProperties & {
  "--tick-index": number;
};

type MarkerStyle = CSSProperties & {
  "--marker-angle": string;
  "--counter-angle": string;
};

export function DialArchive({ locale }: { locale: Locale }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAudioTimeRef = useRef(0);
  const lastHapticTimeRef = useRef(0);
  const lastRatchetStepRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; y: number; index: number } | null>(
    null
  );
  const indexTriggerRef = useRef<HTMLButtonElement>(null);
  const indexCloseRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);

  const projects = useMemo(
    () => archiveProjects.map((project) => localizeArchiveProject(project, locale)),
    [locale]
  );
  const active = projects[activeIndex];

  const categorySummaries = useMemo(
    () =>
      archiveCategoryOrder.map((category) => ({
        id: category,
        ...archiveCategories[category],
        count: projects.filter((project) => project.category === category).length,
        preview: projects.find((project) => project.category === category),
      })),
    [projects]
  );

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      audioContextRef.current = new AudioContextConstructor();
    }
    return audioContextRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const context = getAudioContext();
    if (!context || context.state === "closed") return;
    if (context.state === "running") return;
    void context.resume().catch(() => undefined);
  }, [getAudioContext]);

  const playRatchetTick = useCallback(
    (intensity = 1) => {
      const context = getAudioContext();
      if (!context || context.state === "closed") return;

      const play = () => {
        if (context.state !== "running") return;
        const now = context.currentTime;
        if (now - lastAudioTimeRef.current < 0.032) return;
        lastAudioTimeRef.current = now;

        const duration = 0.024;
        const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
        const noiseBuffer = context.createBuffer(1, sampleCount, context.sampleRate);
        const noise = noiseBuffer.getChannelData(0);
        for (let index = 0; index < sampleCount; index += 1) {
          const envelope = 1 - index / sampleCount;
          noise[index] = (Math.random() * 2 - 1) * envelope;
        }

        const pitchVariation = 0.96 + Math.random() * 0.08;
        const gainVariation = 0.9 + Math.random() * 0.14;
        const noiseSource = context.createBufferSource();
        const bandpass = context.createBiquadFilter();
        const noiseGain = context.createGain();
        noiseSource.buffer = noiseBuffer;
        noiseSource.playbackRate.setValueAtTime(pitchVariation, now);
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(3450 * pitchVariation, now);
        bandpass.Q.setValueAtTime(0.9, now);
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(
          0.052 * intensity * gainVariation,
          now + 0.0014
        );
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        noiseSource.connect(bandpass).connect(noiseGain).connect(context.destination);

        const tooth = context.createOscillator();
        const toothGain = context.createGain();
        tooth.type = "triangle";
        tooth.frequency.setValueAtTime(1120 * pitchVariation, now);
        tooth.frequency.exponentialRampToValueAtTime(410, now + 0.016);
        toothGain.gain.setValueAtTime(0.019 * intensity * gainVariation, now);
        toothGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        tooth.connect(toothGain).connect(context.destination);

        noiseSource.start(now);
        noiseSource.stop(now + duration);
        tooth.start(now);
        tooth.stop(now + 0.022);
      };

      if (context.state === "running") play();
      else {
        void context
          .resume()
          .then(() => {
            play();
          })
          .catch(() => undefined);
      }
    },
    [getAudioContext]
  );

  const pulseHapticTick = useCallback((distance = 1) => {
    if (!dragRef.current || typeof navigator.vibrate !== "function") return;
    const now = window.performance.now();
    if (now - lastHapticTimeRef.current < HAPTIC_MIN_INTERVAL_MS) return;
    lastHapticTimeRef.current = now;
    navigator.vibrate(distance > 2 ? 7 : 5);
  }, []);

  const applyCursor = useCallback(
    (nextCursor: number, withSound = true) => {
      const root = rootRef.current;
      if (!root) return;

      const clamped = Math.min(projects.length - 1, Math.max(0, nextCursor));
      root.style.setProperty("--dial-angle", `${clamped * -DIAL_STEP}deg`);

      root.querySelectorAll<HTMLElement>("[data-media-index]").forEach((layer) => {
        const index = Number(layer.dataset.mediaIndex ?? 0);
        const distance = index - clamped;
        const opacity = Math.max(0, 1 - Math.abs(distance) * 1.22);
        const scale = 1 - Math.min(Math.abs(distance), 1) * 0.018;
        layer.style.opacity = `${opacity}`;
        layer.style.transform = `translate3d(${distance * 5.5}%, 0, 0) scale(${scale})`;
        layer.style.zIndex = `${projects.length - Math.round(Math.abs(distance))}`;
      });

      const rounded = Math.min(
        projects.length - 1,
        Math.max(0, Math.round(clamped))
      );
      if (activeIndexRef.current !== rounded) {
        activeIndexRef.current = rounded;
        setActiveIndex(rounded);
      }

      if (!withSound) return;
      const ratchetStep = Math.round(clamped * RATCHET_STEPS_PER_PROJECT);
      if (lastRatchetStepRef.current === null) {
        lastRatchetStepRef.current = ratchetStep;
      } else if (lastRatchetStepRef.current !== ratchetStep) {
        const distance = Math.abs(ratchetStep - lastRatchetStepRef.current);
        lastRatchetStepRef.current = ratchetStep;
        playRatchetTick(Math.min(1, 0.58 + distance * 0.09));
        pulseHapticTick(distance);
      }
    },
    [playRatchetTick, projects.length, pulseHapticTick]
  );

  useEffect(() => {
    const armAudio = () => unlockAudio();
    window.addEventListener("pointerdown", armAudio, { capture: true, once: true });
    window.addEventListener("keydown", armAudio, { capture: true, once: true });
    window.addEventListener("touchstart", armAudio, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", armAudio, true);
      window.removeEventListener("keydown", armAudio, true);
      window.removeEventListener("touchstart", armAudio, true);
    };
  }, [unlockAudio]);

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  useEffect(() => {
    if (!indexOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    indexCloseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIndexOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      indexTriggerRef.current?.focus();
    };
  }, [indexOpen]);

  useGSAP(
    () => {
      const mediaQuery = gsap.matchMedia();

      mediaQuery.add("(prefers-reduced-motion: no-preference)", () => {
        reducedMotionRef.current = false;
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(`.${styles.instrumentHeader}`, {
            y: -18,
            opacity: 0,
            duration: 0.8,
          })
          .from(
            `.${styles.projectInfo}`,
            { x: -22, opacity: 0, duration: 0.9 },
            "-=0.5"
          )
          .from(
            `.${styles.mediaStage}`,
            { scale: 0.975, opacity: 0, duration: 1.1 },
            "-=0.78"
          )
          .from(
            `.${styles.projectRail}`,
            { x: 18, opacity: 0, duration: 0.8 },
            "-=0.78"
          )
          .from(
            `.${styles.dialAssembly}`,
            { opacity: 0, duration: 0.8 },
            "<0.08"
          );

        const trigger = ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          snap: {
            snapTo: 1 / (projects.length - 1),
            duration: { min: 0.16, max: 0.34 },
            delay: 0.07,
            ease: "power2.out",
          },
          onUpdate: (self) => {
            applyCursor(self.progress * (projects.length - 1));
          },
        });

        gsap.utils.toArray<HTMLElement>(`.${styles.folder}`).forEach((folder, index) => {
          gsap.from(folder, {
            y: 72,
            scale: 0.94,
            opacity: 0,
            duration: 1.15,
            delay: index * 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: folder,
              start: "top 88%",
              once: true,
            },
          });
        });

        gsap.from(`.${styles.manifestoMedia}`, {
          scale: 0.72,
          opacity: 0,
          duration: 1.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: `.${styles.manifesto}`,
            start: "top 72%",
            once: true,
          },
        });

        applyCursor(trigger.progress * (projects.length - 1), false);
        return () => trigger.kill();
      });

      mediaQuery.add("(prefers-reduced-motion: reduce)", () => {
        reducedMotionRef.current = true;
        applyCursor(activeIndexRef.current, false);
      });

      return () => mediaQuery.revert();
    },
    {
      scope: pageRef,
      dependencies: [applyCursor, projects.length],
      revertOnUpdate: true,
    }
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const root = rootRef.current;
      if (!root) return;
      const clamped = Math.min(projects.length - 1, Math.max(0, index));

      if (reducedMotionRef.current) {
        applyCursor(clamped, false);
        return;
      }

      const available = root.offsetHeight - window.innerHeight;
      const top = root.offsetTop + (clamped / (projects.length - 1)) * available;
      window.scrollTo({ top, behavior });
    },
    [applyCursor, projects.length]
  );

  const selectFromIndex = (index: number) => {
    setIndexOpen(false);
    window.requestAnimationFrame(() => scrollToIndex(index));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    unlockAudio();
    lastHapticTimeRef.current = 0;
    dragRef.current = {
      pointerId: event.pointerId,
      y: event.clientY,
      index: activeIndexRef.current,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const cursorDelta = (drag.y - event.clientY) / DRAG_PX_PER_PROJECT;
    scrollToIndex(drag.index + cursorDelta, "auto");
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (typeof navigator.vibrate === "function") navigator.vibrate(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    unlockAudio();
    if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) {
      event.preventDefault();
      scrollToIndex(activeIndexRef.current + 1);
    }
    if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      scrollToIndex(activeIndexRef.current - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      scrollToIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      scrollToIndex(projects.length - 1);
    }
  };

  const activeHref = `/${locale}/works/${active.slug}`;
  const titleNeedsCompactScale = active.title
    .split(/\s+/)
    .some((word) => word.length >= 10);

  return (
    <div ref={pageRef} className={styles.archivePage}>
      <section
        ref={rootRef}
        className={styles.archive}
        style={{ "--archive-count": projects.length } as ArchiveStyle}
        aria-label={
          locale === "ko" ? "프로젝트 다이얼 아카이브" : "Project dial archive"
        }
      >
        <div className={styles.stage}>
          <div className={styles.ambient} aria-hidden="true" />

          <div className={styles.instrumentHeader}>
            <div className={styles.instrumentActions}>
              <button
                ref={indexTriggerRef}
                type="button"
                aria-expanded={indexOpen}
                aria-controls="archive-index"
                onClick={() => setIndexOpen(true)}
              >
                {locale === "ko" ? "전체 보기" : "Overview"}
              </button>
            </div>
          </div>

          <div className={styles.stageFrame}>
            <div className={styles.projectInfo} key={active.id} aria-live="polite">
              <div className={styles.infoTopline}>
                <span>{active.categoryText}</span>
                <span>{active.year}</span>
              </div>
              <h1
                className={`${styles.title}${
                  titleNeedsCompactScale ? ` ${styles.titleCompact}` : ""
                }`}
              >
                {active.title}
              </h1>
              <p className={styles.description}>{active.descriptionText}</p>
              <VaultAction
                className={styles.enterLink}
                href={activeHref}
                code={`${active.categoryCode}_${active.number}`}
                label={locale === "ko" ? "프로젝트 열기" : "Open project"}
              />
            </div>

            <div className={styles.mediaViewport}>
              <div
                className={styles.mediaInstrument}
                style={
                  { "--preview-aspect": active.heroAspectRatio } as PreviewFrameStyle
                }
              >
                <div className={styles.mediaTelemetry} aria-hidden="true">
                  <span className={styles.mediaIdentity}>
                    <b>{active.number}</b>
                    <span>{active.title}</span>
                  </span>
                  <i />
                  <span className={styles.mediaRatio}>
                    RATIO {active.heroAspectRatio.toFixed(3)}
                  </span>
                </div>
                <div className={styles.mediaStage}>
                  {projects.map((project, index) => (
                    <div
                      className={styles.mediaLayer}
                      data-media-index={index}
                      key={project.id}
                      aria-hidden={index !== activeIndex}
                    >
                      <Image
                        src={project.heroImage}
                        alt={index === activeIndex ? project.imageAltText : ""}
                        fill
                        priority={index === 0}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        sizes="(max-width: 900px) 94vw, (max-width: 1180px) 66vw, 68vw"
                        className={`${styles.previewImage} ${
                          project.imageTone === "light" ? styles.lightSourceImage : ""
                        }`}
                        style={{ objectPosition: project.imagePosition }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className={styles.projectRail} aria-label="Archive entries">
              <div className={styles.railList}>
                {projects.map((project, index) => (
                  <button
                    type="button"
                    key={project.id}
                    className={index === activeIndex ? styles.activeRailItem : ""}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => {
                      unlockAudio();
                      scrollToIndex(index);
                    }}
                  >
                    <span>{project.number}</span>
                    <strong>{project.title}</strong>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.dialAssembly}>
              <div
                className={styles.dialControl}
                role="slider"
                tabIndex={0}
                aria-label={
                  locale === "ko" ? "프로젝트 선택 다이얼" : "Project selection dial"
                }
                aria-description={
                  locale === "ko"
                    ? "위아래로 드래그하면 다이얼과 페이지가 함께 스크롤됩니다."
                    : "Drag vertically to move the dial and page together."
                }
                aria-valuemin={1}
                aria-valuemax={projects.length}
                aria-valuenow={activeIndex + 1}
                aria-valuetext={active.title}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
                onKeyDown={onKeyDown}
              >
                <div className={styles.dialTrack} aria-hidden="true">
                  {Array.from({ length: TICK_COUNT }).map((_, index) => (
                    <i
                      className={styles.tick}
                      key={index}
                      style={{ "--tick-index": index } as TickStyle}
                    />
                  ))}
                  {projects.map((project, index) => {
                    const angle = -90 + index * DIAL_STEP;
                    const markerStyle: MarkerStyle = {
                      "--marker-angle": `${angle}deg`,
                      "--counter-angle": `${-angle}deg`,
                    };
                    return (
                      <span
                        key={project.id}
                        className={`${styles.marker} ${
                          index === activeIndex ? styles.activeMarker : ""
                        }`}
                        style={markerStyle}
                      >
                        <b>{project.number}</b>
                      </span>
                    );
                  })}
                </div>
                <span className={styles.dialDatum} aria-hidden="true" />
              </div>
              <div className={styles.dialReadout} aria-hidden="true">
                <span>{active.number}</span>
                <small>{String(projects.length).padStart(2, "0")}</small>
              </div>
            </div>
          </div>

          {indexOpen ? (
            <div
              id="archive-index"
              className={styles.indexPanel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="archive-index-title"
            >
              <header>
                <h2 id="archive-index-title">Archive Index</h2>
                <button
                  ref={indexCloseRef}
                  type="button"
                  onClick={() => setIndexOpen(false)}
                >
                  {locale === "ko" ? "닫기" : "Close"}
                </button>
              </header>
              <div className={styles.indexGrid}>
                {projects.map((project, index) => (
                  <button
                    type="button"
                    key={project.id}
                    onClick={() => selectFromIndex(index)}
                  >
                    <span className={styles.indexThumb}>
                      <Image
                        src={project.heroImage}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 42vw, 18vw"
                        className={styles.coverImage}
                      />
                    </span>
                    <span className={styles.indexMeta}>
                      <small>
                        {project.categoryCode} / {project.year}
                      </small>
                      <strong>{project.title}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.folderField} aria-labelledby="folder-field-title">
        <div className={styles.folderIntro}>
          <h2 id="folder-field-title">
            {locale === "ko" ? "매체가 달라도, 설계 태도는 이어진다." : "Different media. One design attitude."}
          </h2>
          <div className={styles.folderIntroAside}>
            <div className={styles.folderMicro} aria-hidden="true">
              <span>ARCHIVE_FIELD</span>
              <b>{String(categorySummaries.length).padStart(2, "0")}</b>
              <i />
              <small>{String(projects.length).padStart(2, "0")}_RECORDS</small>
            </div>
            <p>
              {locale === "ko"
                ? "물성, 메커니즘, 인터페이스와 코드가 하나의 아카이브 안에서 연결된다."
                : "Material, mechanics, interface, and code share one archive."}
            </p>
          </div>
        </div>

        <div className={styles.folderStack}>
          {categorySummaries.map((category, index) => (
            <Link
              key={category.id}
              href={`/${locale}/works?category=${category.id}`}
              className={styles.folder}
              style={{ "--folder-index": index } as CSSProperties}
            >
              {category.preview ? (
                <span className={styles.folderPreview} aria-hidden="true">
                  <Image
                    src={category.preview.heroImage}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 64vw, 36vw"
                    className={styles.coverImage}
                  />
                </span>
              ) : null}
              <span className={styles.folderTab}>{category.code}</span>
              <span className={styles.folderCount}>
                {String(category.count).padStart(2, "0")}
              </span>
              <strong>{category.title[locale]}</strong>
              <p>{category.description[locale]}</p>
              <span className={styles.folderAction} aria-hidden="true">
                <i />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.manifesto} aria-labelledby="working-principle-title">
        <div className={styles.manifestoHeader} aria-hidden="true">
          <span>{locale === "ko" ? "작업 원칙" : "Working principle"}</span>
          <i />
          <b>01</b>
        </div>
        <div className={styles.manifestoGrid}>
          <div className={styles.manifestoStatement}>
            <h2 id="working-principle-title">
              <span>{locale === "ko" ? "물성과 메커니즘을" : "Material and mechanics"}</span>
              <span>{locale === "ko" ? "디지털 경험으로 잇는다." : "become digital experience."}</span>
            </h2>
            <p>
              {locale === "ko"
                ? "산업디자인, 금속공예, 웹과 앱을 하나의 작업 세계로 편집한다. 구조를 이해하고 실제로 작동하게 만든다는 태도는 같다."
                : "Industrial design, metal craft, web, and apps form one body of work. The constant is understanding structure and making it operate."}
            </p>
          </div>
          <div className={styles.manifestoVisual}>
            <div className={styles.manifestoMedia} aria-hidden="true">
              <Image
                src="/images/archive/vibey-control-console.png"
                alt=""
                fill
                sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1200px) 44vw, 560px"
                className={styles.coverImage}
              />
            </div>
            <VaultAction
              className={styles.manifestoAction}
              href={`/${locale}/about`}
              code="PROFILE_01"
              label={locale === "ko" ? "SGYUN 소개" : "About SGYUN"}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
