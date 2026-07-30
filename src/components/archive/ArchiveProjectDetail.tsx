import Link from "next/link";
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/SafeImage";
import type { ArchiveProject } from "@/lib/archive";
import {
  archiveCategories,
  getNextArchiveProject,
  localizeArchiveProject,
} from "@/lib/archive";
import type { Locale } from "@/lib/i18n";
import { ArchiveProjectStory } from "./ArchiveProjectStory";
import styles from "./ArchiveProjectDetail.module.css";

type MediaFrameStyle = CSSProperties & {
  "--media-aspect": number;
};

export function ArchiveProjectDetail({
  project,
  locale,
}: {
  project: ArchiveProject;
  locale: Locale;
}) {
  const item = localizeArchiveProject(project, locale);
  const next = localizeArchiveProject(
    getNextArchiveProject(project.slug),
    locale
  );
  const fallbackMedia = {
    src: item.heroImage,
    altText: item.imageAltText,
    fit: item.imageFit,
    tone: item.imageTone,
    position: item.imagePosition,
    aspectRatio: item.heroAspectRatio,
  };
  const storyMedia = item.detailMediaText.length
    ? item.detailMediaText
    : [fallbackMedia];
  const category = archiveCategories[item.category];

  const copy = {
    back: locale === "ko" ? "인덱스로" : "Back to index",
    premise: locale === "ko" ? "기록의 관점" : "Archive premise",
    scenes: locale === "ko" ? "장면 시스템" : "Scene system",
    next: locale === "ko" ? "다음 기록" : "Next record",
    role: locale === "ko" ? "형식" : "Format",
  };

  return (
    <article className={styles.detailPage}>
      <header id="project-overview" className={styles.projectHero}>
        <div className={styles.heroRail}>
          <Link href={`/${locale}/works`}>{copy.back}</Link>
          <span>
            {item.categoryCode} / {item.number} / {item.statusCode}
          </span>
        </div>

        <div className={styles.heroLayout}>
          <div className={styles.heroInfo}>
            <span className={styles.heroCategory}>{item.categoryText}</span>
            <h1>{item.title}</h1>
            <p>{item.descriptionText}</p>

            <dl className={styles.heroMeta}>
              <div>
                <dt>Year</dt>
                <dd>{item.year}</dd>
              </div>
              <div>
                <dt>Field</dt>
                <dd>{item.categoryText}</dd>
              </div>
              <div>
                <dt>{copy.role}</dt>
                <dd>{item.roleText}</dd>
              </div>
              <div>
                <dt>Archive</dt>
                <dd>{category.code} / {item.number}</dd>
              </div>
              <div className={styles.statusMeta}>
                <dt>Status</dt>
                <dd>{item.statusText}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroMediaViewport}>
            <div
              className={styles.heroMedia}
              style={
                { "--media-aspect": item.heroAspectRatio } as MediaFrameStyle
              }
            >
              <SafeImage
                src={item.heroImage}
                alt={item.imageAltText}
                fallbackLabel={
                  locale === "ko"
                    ? "프로젝트 미디어를 불러오지 못했습니다"
                    : "Project media unavailable"
                }
                fill
                priority
                sizes="(max-width: 900px) 100vw, 64vw"
                className={`${styles.previewImage} ${
                  item.imageTone === "light" ? styles.lightSourceImage : ""
                }`}
                style={{ objectPosition: item.imagePosition }}
              />
            </div>
          </div>
        </div>
      </header>

      <section id="project-premise" className={styles.premise}>
        <span>
          {item.categoryCode} / {copy.premise}
        </span>
        <p>{item.detailIntroText}</p>
        <small>{copy.scenes} / {String(item.chapterTexts.length).padStart(2, "0")}</small>
      </section>

      <ArchiveProjectStory
        media={storyMedia}
        chapters={item.chapterTexts}
        locale={locale}
      />

      <section id="project-next" className={styles.nextRecord}>
        <div className={styles.nextHeader}>
          <span>{copy.next}</span>
          <small>
            {next.categoryCode} / {next.number}
          </small>
        </div>
        <Link href={`/${locale}/works/${next.slug}`}>
          <span
            className={styles.nextMedia}
            style={
              { "--media-aspect": next.heroAspectRatio } as MediaFrameStyle
            }
          >
            <SafeImage
              src={next.heroImage}
              alt={next.imageAltText}
              fallbackLabel={
                locale === "ko"
                  ? "다음 기록 미디어를 불러오지 못했습니다"
                  : "Next record media unavailable"
              }
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
              className={`${styles.previewImage} ${
                next.imageTone === "light" ? styles.lightSourceImage : ""
              }`}
              style={{ objectPosition: next.imagePosition }}
            />
          </span>
          <span className={styles.nextTitle}>
            <strong>{next.title}</strong>
            <small>{next.descriptionText}</small>
            <span className={styles.nextLatch} aria-hidden="true">
              <i />
            </span>
          </span>
        </Link>
      </section>
    </article>
  );
}
