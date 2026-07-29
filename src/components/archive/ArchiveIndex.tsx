import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import {
  type ArchiveCategory,
  archiveCategories,
  archiveCategoryOrder,
  archiveProjects,
  localizeArchiveProject,
} from "@/lib/archive";
import styles from "./ArchiveIndex.module.css";

type MediaFrameStyle = CSSProperties & {
  "--media-aspect": number;
};

export function ArchiveIndex({
  locale,
  activeCategory,
}: {
  locale: Locale;
  activeCategory?: ArchiveCategory;
}) {
  const projects = archiveProjects
    .filter((project) => !activeCategory || project.category === activeCategory)
    .map((project) => localizeArchiveProject(project, locale));

  const copy = {
    index: locale === "ko" ? "작품 인덱스" : "Work index",
    statement:
      locale === "ko"
        ? "오브젝트, 인터페이스, 실험과 검증 기록을 하나의 작업 세계로 편집한다."
        : "Objects, interfaces, experiments, and evidence are edited as one body of work.",
    instruction:
      locale === "ko"
        ? "유형을 고르거나 전체 기록을 훑은 뒤 각 항목의 장면으로 진입한다."
        : "Choose a type or scan the complete archive, then enter each record.",
    all: locale === "ko" ? "전체" : "All",
    open: locale === "ko" ? "기록 열기" : "Open record",
  };

  return (
    <div className={styles.indexPage}>
      <header className={styles.indexHero}>
        <div className={styles.controlLine}>
          <span>SGYUN / ARCHIVE</span>
          <span>
            {String(projects.length).padStart(2, "0")} / {copy.index}
          </span>
        </div>

        <div className={styles.heroComposition}>
          <h1>ARCHIVE INDEX</h1>
          <div className={styles.heroCopy}>
            <p>{copy.statement}</p>
            <span>{copy.instruction}</span>
          </div>
        </div>

        <nav className={styles.filters} aria-label={copy.index}>
          <Link
            href={`/${locale}/works`}
            className={!activeCategory ? styles.activeFilter : undefined}
            aria-current={!activeCategory ? "page" : undefined}
          >
            <span>{copy.all}</span>
            <small>{String(archiveProjects.length).padStart(2, "0")}</small>
          </Link>
          {archiveCategoryOrder.map((category) => {
            const definition = archiveCategories[category];
            const count = archiveProjects.filter(
              (project) => project.category === category
            ).length;
            const isActive = activeCategory === category;

            return (
              <Link
                key={category}
                href={`/${locale}/works?category=${category}`}
                className={isActive ? styles.activeFilter : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{definition.title[locale]}</span>
                <small>{String(count).padStart(2, "0")}</small>
              </Link>
            );
          })}
        </nav>
      </header>

      <section className={styles.contactSheet} aria-label={copy.index}>
        {projects.map((project) => (
          <Link
            href={`/${locale}/works/${project.slug}`}
            className={styles.record}
            key={project.id}
          >
            <span
              className={styles.mediaFrame}
              style={
                { "--media-aspect": project.heroAspectRatio } as MediaFrameStyle
              }
            >
              <Image
                src={project.heroImage}
                alt={project.imageAltText}
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1200px) 58vw, 62vw"
                className={styles.naturalImage}
                style={{ objectPosition: project.imagePosition }}
              />
            </span>
            <span className={styles.recordIdentity}>
              <span className={styles.recordDatum}>
                <small>{project.number}</small>
                <small>{project.categoryCode}</small>
              </span>
              <strong>{project.title}</strong>
              <small>{project.year}</small>
            </span>
            <span className={styles.recordFoot}>
              <span>{project.descriptionText}</span>
              <b>
                <span>{copy.open}</span>
                <i aria-hidden="true" />
              </b>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
