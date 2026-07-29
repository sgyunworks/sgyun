"use client";

import Image from "next/image";
import { type CSSProperties, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./ArchiveProjectDetail.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type StoryMedia = {
  src: string;
  altText: string;
  aspectRatio: number;
  fit?: "cover" | "contain";
  tone?: "dark" | "light";
  position?: string;
};

type MediaFrameStyle = CSSProperties & {
  "--media-aspect": number;
};

type StoryChapter = {
  code: string;
  title: string;
  body: string;
};

export function ArchiveProjectStory({
  media,
  chapters,
  locale,
}: {
  media: StoryMedia[];
  chapters: StoryChapter[];
  locale: "ko" | "en";
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const activeMedia = activeChapter % media.length;

  useGSAP(
    () => {
      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
        () => {
          const chapterElements = gsap.utils.toArray<HTMLElement>(
            "[data-story-chapter]"
          );
          const triggers = chapterElements.map((chapter, index) =>
            ScrollTrigger.create({
              trigger: chapter,
              start: "top 58%",
              end: "bottom 42%",
              onEnter: () => setActiveChapter(index),
              onEnterBack: () => setActiveChapter(index),
            })
          );

          const stackTweens = chapterElements.slice(0, -1).map((chapter, index) =>
            gsap.to(chapter, {
              scale: 0.92 - index * 0.015,
              opacity: 0.24,
              ease: "none",
              scrollTrigger: {
                trigger: chapterElements[index + 1],
                start: "top 88%",
                end: "top 34%",
                scrub: true,
              },
            })
          );

          return () => {
            triggers.forEach((trigger) => trigger.kill());
            stackTweens.forEach((tween) => {
              tween.scrollTrigger?.kill();
              tween.kill();
            });
          };
        }
      );

      return () => matchMedia.revert();
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      className={styles.story}
      aria-label={locale === "ko" ? "프로젝트 장면" : "Project scenes"}
    >
      <div className={styles.stickyColumn}>
        <div
          className={styles.storyMedia}
          aria-live="polite"
          style={
            { "--media-aspect": media[activeMedia].aspectRatio } as MediaFrameStyle
          }
        >
          {media.map((item, index) => {
            const isActive = index === activeMedia;
            return (
              <div
                className={styles.storyMediaLayer}
                data-active={isActive ? "true" : "false"}
                aria-hidden={!isActive}
                key={`${item.src}-${index}`}
              >
                <Image
                  src={item.src}
                  alt={isActive ? item.altText : ""}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                  className={
                    item.fit === "contain"
                      ? styles.containImage
                      : styles.coverImage
                  }
                  style={{ objectPosition: item.position }}
                />
              </div>
            );
          })}
          <span className={styles.storyReadout} aria-hidden="true">
            <b>{String(activeChapter + 1).padStart(2, "0")}</b>
            <small>{String(chapters.length).padStart(2, "0")}</small>
          </span>
        </div>
      </div>

      <div className={styles.storyChapters}>
        {chapters.map((chapter, index) => {
          const item = media[index % media.length];
          const isActive = index === activeChapter;

          return (
            <article
              className={`${styles.storyChapter} ${
                isActive ? styles.activeChapter : ""
              }`}
              data-story-chapter
              key={chapter.code}
            >
              <span
                className={styles.mobileStoryMedia}
                style={
                  { "--media-aspect": item.aspectRatio } as MediaFrameStyle
                }
              >
                <Image
                  src={item.src}
                  alt={item.altText}
                  fill
                  sizes="(max-width: 900px) calc(100vw - 52px), 1px"
                  className={
                    item.fit === "contain"
                      ? styles.containImage
                      : styles.coverImage
                  }
                  style={{ objectPosition: item.position }}
                />
              </span>
              <small>{chapter.code}</small>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
