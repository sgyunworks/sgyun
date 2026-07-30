"use client";

import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import styles from "./ArchiveProjectDetail.module.css";

export function DeferredYouTube({
  youtubeId,
  poster,
  title,
  locale,
}: {
  youtubeId: string;
  poster: string;
  title: string;
  locale: "ko" | "en";
}) {
  const [playing, setPlaying] = useState(false);
  const playLabel =
    locale === "ko" ? `작동 영상 재생: ${title}` : `Play demonstration: ${title}`;

  return (
    <div className={styles.youtubeFrame} data-playing={playing ? "true" : "false"}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={playLabel}>
          <SafeImage
            src={poster}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 78vw"
            className={styles.youtubePoster}
          />
          <span className={styles.youtubeShade} aria-hidden="true" />
          <span className={styles.youtubePlay} aria-hidden="true">
            <i />
          </span>
          <span className={styles.youtubePrompt} aria-hidden="true">
            <small>PRODUCT DEMONSTRATION</small>
            <strong>{locale === "ko" ? "작동 영상 재생" : "Play film"}</strong>
          </span>
        </button>
      )}
    </div>
  );
}
