import Link from "next/link";
import styles from "./[lang]/StatePage.module.css";

export default function GlobalNotFound() {
  return (
    <section className={styles.statePage}>
      <div className={styles.statePanel}>
        <div className={styles.datum} aria-hidden="true">
          <span>ERROR</span>
          <i />
          <span>404</span>
        </div>
        <h1>기록을 찾을 수 없습니다.</h1>
        <p>주소가 바뀌었거나 아직 공개되지 않은 기록입니다.</p>
        <div className={styles.actions}>
          <Link href="/ko/works">작품 인덱스로</Link>
          <Link href="/ko">홈으로</Link>
        </div>
      </div>
    </section>
  );
}
