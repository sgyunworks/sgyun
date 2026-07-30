"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StatePage.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "ko";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={styles.statePage}>
      <div className={styles.statePanel}>
        <div className={styles.datum} aria-hidden="true">
          <span>SYSTEM</span>
          <i />
          <span>RETRY</span>
        </div>
        <h1>{locale === "ko" ? "화면을 열지 못했습니다." : "The view could not open."}</h1>
        <p>
          {locale === "ko"
            ? "잠시 후 다시 시도하거나 작품 인덱스로 돌아가세요."
            : "Try again, or return to the archive index."}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={reset}>
            {locale === "ko" ? "다시 시도" : "Try again"}
          </button>
          <Link href={`/${locale}/works`}>
            {locale === "ko" ? "작품 인덱스로" : "Open archive"}
          </Link>
        </div>
      </div>
    </section>
  );
}
