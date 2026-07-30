"use client";

import Link from "next/link";
import {
  type CSSProperties,
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
import { SafeImage } from "@/components/SafeImage";
import { VaultAction } from "@/components/VaultAction";
import { VaultDial } from "@/components/VaultDial";
import {
  archiveCategories,
  archiveCategoryOrder,
  archiveProjects,
  localizeArchiveProject,
  portfolioProfile,
} from "@/lib/archive";
import styles from "./DialArchive.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HOME_DIAL_ARC = 84;
const HOME_DIAL_STEP_MAX = 15;
const RATCHET_STEPS_PER_PROJECT = 4;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type ArchiveStyle = CSSProperties & {
  "--archive-count": number;
};

type PreviewFrameStyle = CSSProperties & {
  "--preview-aspect": number;
};

export function DialArchive({ locale }: { locale: Locale }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const practiceRef = useRef<HTMLElement>(null);
  const evidenceRef = useRef<HTMLElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAudioTimeRef = useRef(0);
  const lastRatchetStepRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const activeDialIndexRef = useRef(0);
  const dialCursorRef = useRef(0);
  const homeAnchorsRef = useRef<number[]>([]);
  const dialFrameRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const indexTriggerRef = useRef<HTMLButtonElement>(null);
  const indexCloseRef = useRef<HTMLButtonElement>(null);
  const indexPanelRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDialIndex, setActiveDialIndex] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);

  const projects = useMemo(
    () => archiveProjects.map((project) => localizeArchiveProject(project, locale)),
    [locale]
  );
  const active = projects[activeIndex];

  const homeDialItems = useMemo(
    () => [
      ...projects.map((project) => ({
        id: project.id,
        number: project.number,
        label: project.title,
      })),
      { id: "practice-ledger", number: "07", label: "PRACTICE" },
      { id: "profile-ledger", number: "08", label: "PROFILE" },
    ],
    [projects]
  );
  const homeDialStep = Math.min(
    HOME_DIAL_STEP_MAX,
    HOME_DIAL_ARC / Math.max(1, homeDialItems.length - 1)
  );

  const categorySummaries = useMemo(
    () =>
      archiveCategoryOrder.map((category) => ({
        id: category,
        ...archiveCategories[category],
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

  const applyDialCursor = useCallback(
    (nextCursor: number, withSound = true) => {
      const clamped = Math.min(
        homeDialItems.length - 1,
        Math.max(0, nextCursor)
      );
      dialCursorRef.current = clamped;
      pageRef.current?.style.setProperty(
        "--archive-vault-angle",
        `${clamped * -homeDialStep}deg`
      );

      const rounded = Math.min(
        homeDialItems.length - 1,
        Math.max(0, Math.round(clamped))
      );
      if (activeDialIndexRef.current !== rounded) {
        activeDialIndexRef.current = rounded;
        setActiveDialIndex(rounded);
      }

      if (!withSound) return;
      const ratchetStep = Math.round(clamped * RATCHET_STEPS_PER_PROJECT);
      if (lastRatchetStepRef.current === null) {
        lastRatchetStepRef.current = ratchetStep;
      } else if (lastRatchetStepRef.current !== ratchetStep) {
        const distance = Math.abs(ratchetStep - lastRatchetStepRef.current);
        lastRatchetStepRef.current = ratchetStep;
        playRatchetTick(Math.min(1, 0.58 + distance * 0.09));
      }
    },
    [homeDialItems.length, homeDialStep, playRatchetTick]
  );

  const applyCursor = useCallback(
    (nextCursor: number) => {
      const root = rootRef.current;
      if (!root) return;

      const clamped = Math.min(projects.length - 1, Math.max(0, nextCursor));

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
    },
    [projects.length]
  );

  useEffect(() => {
    const root = rootRef.current;
    const practice = practiceRef.current;
    const evidence = evidenceRef.current;
    if (!root || !practice || !evidence) return;

    const measureAnchors = () => {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const projectRange = Math.max(0, root.offsetHeight - window.innerHeight);
      const anchors = projects.map((_, index) =>
        Math.min(
          maxScroll,
          root.offsetTop + (index / Math.max(1, projects.length - 1)) * projectRange
        )
      );
      anchors.push(
        Math.min(maxScroll, Math.max(anchors.at(-1) ?? 0, practice.offsetTop - window.innerHeight * 0.3))
      );
      anchors.push(
        Math.min(maxScroll, Math.max(anchors.at(-1) ?? 0, evidence.offsetTop - window.innerHeight * 0.3))
      );
      homeAnchorsRef.current = anchors;
    };

    const cursorAtScroll = (scrollY: number) => {
      const anchors = homeAnchorsRef.current;
      if (anchors.length < 2 || scrollY <= anchors[0]) return 0;
      const lastIndex = anchors.length - 1;
      if (scrollY >= anchors[lastIndex]) return lastIndex;
      for (let index = 0; index < lastIndex; index += 1) {
        const start = anchors[index];
        const end = anchors[index + 1];
        if (scrollY > end) continue;
        const span = Math.max(1, end - start);
        return index + Math.min(1, Math.max(0, (scrollY - start) / span));
      }
      return lastIndex;
    };

    const syncDial = () => {
      dialFrameRef.current = null;
      applyDialCursor(cursorAtScroll(window.scrollY));
    };
    const scheduleDialSync = () => {
      if (dialFrameRef.current !== null) return;
      dialFrameRef.current = window.requestAnimationFrame(syncDial);
    };
    const handleResize = () => {
      measureAnchors();
      scheduleDialSync();
    };

    measureAnchors();
    scheduleDialSync();
    window.addEventListener("scroll", scheduleDialSync, { passive: true });
    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(handleResize);
    observer.observe(root);
    observer.observe(practice);
    observer.observe(evidence);

    return () => {
      window.removeEventListener("scroll", scheduleDialSync);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (dialFrameRef.current !== null) {
        window.cancelAnimationFrame(dialFrameRef.current);
      }
      dialFrameRef.current = null;
    };
  }, [applyDialCursor, projects]);

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
      if (event.key === "Escape") {
        event.preventDefault();
        setIndexOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const panel = indexPanelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === first || !panel.contains(activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || !panel.contains(activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
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
          .from(`.${styles.mediaTelemetry}`, {
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
            { scale: 0.992, duration: 0.9 },
            "-=0.78"
          );

        const trigger = ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            applyCursor(self.progress * (projects.length - 1));
          },
        });

        gsap.utils.toArray<HTMLElement>(`.${styles.practiceRow}`).forEach((row, index) => {
          gsap.from(row, {
            y: 34,
            opacity: 0,
            duration: 0.85,
            delay: index * 0.045,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 90%",
              once: true,
            },
          });
        });

        gsap.from(`.${styles.evidenceGrid}`, {
          y: 42,
          opacity: 0,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: `.${styles.evidenceField}`,
            start: "top 76%",
            once: true,
          },
        });

        applyCursor(trigger.progress * (projects.length - 1));
        return () => trigger.kill();
      });

      mediaQuery.add("(prefers-reduced-motion: reduce)", () => {
        reducedMotionRef.current = true;
        applyCursor(activeIndexRef.current);
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
        applyCursor(clamped);
        return;
      }

      const available = root.offsetHeight - window.innerHeight;
      const top = root.offsetTop + (clamped / (projects.length - 1)) * available;
      window.scrollTo({ top, behavior });
    },
    [applyCursor, projects.length]
  );

  const scrollToHomeCursor = useCallback(
    (cursor: number, behavior: ScrollBehavior = "smooth") => {
      const anchors = homeAnchorsRef.current;
      if (!anchors.length) return;
      const clamped = Math.min(homeDialItems.length - 1, Math.max(0, cursor));
      const lower = Math.floor(clamped);
      const upper = Math.min(homeDialItems.length - 1, Math.ceil(clamped));
      const mix = clamped - lower;
      const start = anchors[lower] ?? 0;
      const end = anchors[upper] ?? start;
      window.scrollTo({
        top: start + (end - start) * mix,
        behavior: reducedMotionRef.current ? "auto" : behavior,
      });
    },
    [homeDialItems.length]
  );

  const selectFromIndex = (index: number) => {
    setIndexOpen(false);
    window.requestAnimationFrame(() => scrollToIndex(index));
  };

  const activeHref = `/${locale}/works/${active.slug}`;
  const titleNeedsCompactScale = active.title
    .split(/\s+/)
    .some((word) => word.length >= 8);

  return (
    <div ref={pageRef} className={styles.archivePage}>
      <VaultDial
        activeIndex={activeDialIndex}
        ariaLabel={
          locale === "ko" ? "홈 아카이브 탐색 다이얼" : "Home archive navigation dial"
        }
        items={homeDialItems}
        onEngage={unlockAudio}
        getScrubStartIndex={() => dialCursorRef.current}
        onSelect={(index) => scrollToHomeCursor(Math.round(index))}
        onScrub={(index) => scrollToHomeCursor(index, "auto")}
        onScrubEnd={(index) => scrollToHomeCursor(Math.round(index))}
        sound={false}
        stepDegrees={homeDialStep}
        visualAngle="var(--archive-vault-angle, 0deg)"
        variant="archive"
      />
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
                <div className={styles.mediaTelemetry}>
                  <span className={styles.mediaIdentity}>
                    <b>{active.number}</b>
                  </span>
                  <i />
                  <button
                    ref={indexTriggerRef}
                    className={styles.mediaOverview}
                    type="button"
                    aria-expanded={indexOpen}
                    aria-controls="archive-index"
                    onClick={() => setIndexOpen(true)}
                  >
                    INDEX
                  </button>
                </div>
                <div className={styles.mediaStage}>
                  {projects.map((project, index) => (
                    <div
                      className={styles.mediaLayer}
                      data-media-index={index}
                      key={project.id}
                      aria-hidden={index !== activeIndex}
                    >
                      {Math.abs(index - activeIndex) <= 1 ? (
                        <SafeImage
                          src={project.heroImage}
                          alt={index === activeIndex ? project.imageAltText : ""}
                          fallbackLabel={
                            locale === "ko"
                              ? "프로젝트 미디어를 불러오지 못했습니다"
                              : "Project media unavailable"
                          }
                          fill
                          priority={index === 0}
                          fetchPriority={index === 0 ? "high" : "auto"}
                          sizes="(max-width: 900px) 94vw, (max-width: 1180px) 66vw, 68vw"
                          className={`${styles.previewImage} ${
                            project.imageTone === "light" ? styles.lightSourceImage : ""
                          }`}
                          style={{ objectPosition: project.imagePosition }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {indexOpen ? (
            <div
              ref={indexPanelRef}
              id="archive-index"
              className={styles.indexPanel}
              role="dialog"
              tabIndex={-1}
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
                      <SafeImage
                        src={project.heroImage}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 42vw, 18vw"
                        className={styles.coverImage}
                      />
                    </span>
                    <span className={styles.indexMeta}>
                      <small>
                        {project.categoryCode} / {project.year} / {project.statusCode}
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

      <section
        ref={practiceRef}
        className={styles.practiceField}
        aria-label={locale === "ko" ? "작업 방식" : "Practice"}
      >
        <div className={styles.sectionDatum} aria-hidden="true">
          <span>PRACTICE</span>
          <i />
        </div>

        <div className={styles.practiceRows}>
          {categorySummaries.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/works?category=${category.id}`}
              className={styles.practiceRow}
            >
              <span className={styles.practiceIdentity}>
                <small>{category.code}</small>
                <strong>{category.title[locale]}</strong>
              </span>
              <p>{category.description[locale]}</p>
              <span className={styles.practiceLatch} aria-hidden="true">
                <i />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section ref={evidenceRef} className={styles.evidenceField} aria-labelledby="profile-ledger-title">
        <div className={styles.sectionDatum} aria-hidden="true">
          <span>PROFILE</span>
          <i />
        </div>

        <div className={styles.evidenceGrid}>
          <div className={styles.profileStatement}>
            <span>{portfolioProfile.title[locale]}</span>
            <h2 id="profile-ledger-title">{portfolioProfile.name[locale]}</h2>
            <p>{portfolioProfile.summary[locale]}</p>
            <div className={styles.profileActions}>
              <VaultAction
                href={`/${locale}/about`}
                code="PROFILE_01"
                label={locale === "ko" ? "프로필 열기" : "Open profile"}
              />
              <VaultAction
                href={`/${locale}/contact`}
                code="CONTACT_01"
                label={locale === "ko" ? "연락하기" : "Contact"}
              />
            </div>
          </div>

          <div className={styles.evidenceLists}>
            <section className={styles.evidenceGroup} aria-labelledby="recognition-title">
              <header>
                <h3 id="recognition-title">{locale === "ko" ? "수상·선정" : "Recognition"}</h3>
              </header>
              <ol>
                {portfolioProfile.recognitions.map((item) => (
                  <li key={`${item.year}-${item.title.en}`}>
                    <time>{item.year}</time>
                    <span>
                      <strong>{item.title[locale]}</strong>
                      <small>{item.result[locale]}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.evidenceGroup} aria-labelledby="activity-title">
              <header>
                <h3 id="activity-title">{locale === "ko" ? "활동" : "Activities"}</h3>
              </header>
              <ol>
                {portfolioProfile.activities.map((item) => (
                  <li key={`${item.year}-${item.title.en}`}>
                    <time>{item.year}</time>
                    <span>
                      <strong>{item.title[locale]}</strong>
                      <small>{item.detail[locale]}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <Link className={styles.appendixReserve} href={`/${locale}/appendix`}>
          <span>APPENDIX</span>
          <b>{locale === "ko" ? "열기" : "Open"}</b>
        </Link>
      </section>
    </div>
  );
}
