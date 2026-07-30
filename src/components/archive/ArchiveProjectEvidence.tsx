import type { CSSProperties } from "react";
import { SafeImage } from "@/components/SafeImage";
import { DeferredYouTube } from "./DeferredYouTube";
import styles from "./ArchiveProjectDetail.module.css";

type EvidenceMedia = {
  src: string;
  altText: string;
  captionText: string;
  aspectRatio: number;
  fit?: "cover" | "contain";
  position?: string;
};

type EvidenceVideo = {
  youtubeId: string;
  url: string;
  poster: string;
  titleText: string;
  captionText: string;
};

type EvidenceStyle = CSSProperties & {
  "--evidence-aspect": number;
};

export function ArchiveProjectEvidence({
  title,
  body,
  media,
  video,
  locale,
}: {
  title: string;
  body: string;
  media: EvidenceMedia[];
  video?: EvidenceVideo;
  locale: "ko" | "en";
}) {
  return (
    <section id="project-evidence" className={styles.evidence}>
      <header className={styles.evidenceHeader}>
        <span>BUILD EVIDENCE / WORKING PROTOTYPE</span>
        <div>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        <small>{String(media.length + (video ? 1 : 0)).padStart(2, "0")} RECORDS</small>
      </header>

      <div className={styles.evidenceGrid}>
        {media.map((item, index) => (
          <figure className={styles.evidenceFigure} key={`${item.src}-${index}`}>
            <span
              className={styles.evidenceImage}
              style={{ "--evidence-aspect": item.aspectRatio } as EvidenceStyle}
            >
              <SafeImage
                src={item.src}
                alt={item.altText}
                fallbackLabel={
                  locale === "ko"
                    ? "프로젝트 증거 이미지를 불러오지 못했습니다"
                    : "Project evidence unavailable"
                }
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1200px) 58vw, 62vw"
                className={item.fit === "cover" ? styles.coverImage : styles.containImage}
                style={{ objectPosition: item.position }}
              />
            </span>
            <figcaption>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <p>{item.captionText}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {video ? (
        <figure className={styles.evidenceVideo}>
          <DeferredYouTube
            youtubeId={video.youtubeId}
            poster={video.poster}
            title={video.titleText}
            locale={locale}
          />
          <figcaption>
            <span>
              <small>FILM / {String(media.length + 1).padStart(2, "0")}</small>
              <strong>{video.titleText}</strong>
            </span>
            <p>{video.captionText}</p>
            <a href={video.url} target="_blank" rel="noreferrer">
              {locale === "ko" ? "YouTube에서 보기" : "Watch on YouTube"}
              <i aria-hidden="true">↗</i>
            </a>
          </figcaption>
        </figure>
      ) : null}
    </section>
  );
}
