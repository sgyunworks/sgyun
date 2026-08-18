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
import { ArchiveProjectEvidence } from "./ArchiveProjectEvidence";
import { ArchiveProjectStory } from "./ArchiveProjectStory";
import { EmbeddedWebApp } from "./EmbeddedWebApp";
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
    premise: locale === "ko" ? "프로젝트 노트" : "Project note",
    summary: locale === "ko" ? "요약" : "Summary",
    description: locale === "ko" ? "설명" : "Description",
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
        <div className={styles.premiseMeta}>
          <span>{item.categoryCode} / {copy.premise}</span>
          <small>
            {copy.scenes} / {String(item.chapterTexts.length).padStart(2, "0")}
          </small>
        </div>
        <div className={styles.premiseSummary}>
          <span className={styles.premiseLabel}>{copy.summary}</span>
          <p>{item.detailSummaryText}</p>
        </div>
        {item.detailDescriptionText ? (
          <div className={styles.premiseDescription}>
            <span className={styles.premiseLabel}>{copy.description}</span>
            <p>{item.detailDescriptionText}</p>
          </div>
        ) : null}
      </section>

      {item.liveAppText ? (
        <EmbeddedWebApp
          locale={locale}
          url={item.liveAppText.url}
          poster={item.liveAppText.poster}
          title={item.liveAppText.titleText}
          body={item.liveAppText.bodyText}
          productTitle={item.title}
        />
      ) : null}

      <ArchiveProjectStory
        media={storyMedia}
        chapters={item.chapterTexts}
        locale={locale}
      />

      {item.evidenceText ? (
        <ArchiveProjectEvidence
          title={item.evidenceText.titleText}
          body={item.evidenceText.bodyText}
          media={item.evidenceText.media}
          video={item.evidenceText.video}
          locale={locale}
        />
      ) : null}

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
