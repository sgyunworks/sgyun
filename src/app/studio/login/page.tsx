import Link from "next/link";
import { redirect } from "next/navigation";
import { isStudioAuthenticated, isStudioConfigured } from "@/lib/studio-auth";
import { LoginForm } from "./LoginForm";
import styles from "../studio.module.css";

export const dynamic = "force-dynamic";

export default async function StudioLoginPage() {
  if (await isStudioAuthenticated()) redirect("/studio");
  const configured = isStudioConfigured();

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginShell}>
        <div className={styles.loginInstrument} aria-hidden="true">
          <span>OWNER ACCESS</span>
          <div><i /></div>
          <small>SGYUN / STUDIO</small>
        </div>
        <div className={styles.loginCopy}>
          <span>Private publishing surface</span>
          <h1>OWNER<br />STUDIO</h1>
          <p>프로젝트를 초안으로 저장하거나 게시하고, 공개 다이얼의 순서를 한 곳에서 관리합니다.</p>
        </div>
        <LoginForm configured={configured} />
        {!configured ? (
          <p className={styles.configNote}>
            로컬과 배포 환경에 <code>SGYUN_STUDIO_PASSWORD</code>와 <code>SGYUN_STUDIO_SESSION_SECRET</code>을 설정해야 합니다.
          </p>
        ) : null}
        <Link className={styles.backLink} href="/ko">공개 사이트로 돌아가기</Link>
      </div>
    </main>
  );
}
