"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../studio.module.css";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(
    configured
      ? "공개 내비게이션에서 분리된 소유자 전용 편집 화면입니다."
      : "Studio 환경변수가 아직 설정되지 않았습니다."
  );
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configured || pending) return;
    setPending(true);
    setMessage("금고 인증을 확인하고 있습니다.");
    const response = await fetch("/api/studio/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setPending(false);
      setMessage(result.error ?? "로그인하지 못했습니다.");
      return;
    }
    router.push("/studio");
    router.refresh();
  };

  return (
    <form className={styles.loginForm} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="studio-password">Studio 비밀번호</label>
        <span className={styles.helper}>배포 환경에 설정한 소유자 비밀번호를 입력하세요.</span>
        <div className={styles.passwordField}>
          <input
            id="studio-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!configured || pending}
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? "숨기기" : "보기"}
          </button>
        </div>
      </div>
      <p className={styles.formMessage} aria-live="polite">{message}</p>
      <button className={styles.primaryButton} type="submit" disabled={!configured || pending}>
        <span>{pending ? "확인 중" : "Studio 열기"}</span>
        <i aria-hidden="true" />
      </button>
    </form>
  );
}
