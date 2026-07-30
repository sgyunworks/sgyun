"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StatePage.module.css";

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "ko";
  const copy =
    locale === "ko"
      ? {
          title: "기록을 찾을 수 없습니다.",
          body: "주소가 바뀌었거나 아직 공개되지 않은 기록입니다.",
          archive: "작품 인덱스로",
          home: "홈으로",
        }
      : {
          title: "Record not found.",
          body: "The address changed, or this record has not been published yet.",
          archive: "Open archive",
          home: "Go home",
        };

  return (
    <section className={styles.statePage}>
      <div className={styles.statePanel}>
        <div className={styles.datum} aria-hidden="true">
          <span>ERROR</span>
          <i />
          <span>404</span>
        </div>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <div className={styles.actions}>
          <Link href={`/${locale}/works`}>{copy.archive}</Link>
          <Link href={`/${locale}`}>{copy.home}</Link>
        </div>
      </div>
    </section>
  );
}
