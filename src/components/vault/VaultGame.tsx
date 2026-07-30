"use client";

import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VaultDial } from "@/components/VaultDial";
import type { Locale } from "@/lib/i18n";
import styles from "./VaultGame.module.css";

const POSITION_COUNT = 10;
const TARGETS = [6, 1, 8] as const;
const DIRECTIONS = [1, -1, 1] as const;
const CALIBRATION_STORAGE_KEY = "sgyun:field-calibrated:v1";

type Feedback = "idle" | "set" | "miss";

function clampPosition(value: number) {
  return Math.min(POSITION_COUNT - 1, Math.max(0, value));
}

export function VaultGame({ locale }: { locale: Locale }) {
  const items = useMemo(
    () =>
      Array.from({ length: POSITION_COUNT }, (_, index) => ({
        id: `vault-${index}`,
        number: String(index + 1).padStart(2, "0"),
        label: `TUMBLER_${String(index + 1).padStart(2, "0")}`,
      })),
    []
  );
  const [access, setAccess] = useState<"checking" | "locked" | "ready">("checking");
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const cursorRef = useRef(0);
  const directionRef = useRef(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const complete = stage >= TARGETS.length;

  useEffect(() => {
    try {
      setAccess(
        window.localStorage.getItem(CALIBRATION_STORAGE_KEY) === "unlocked"
          ? "ready"
          : "locked"
      );
    } catch {
      setAccess("locked");
    }
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showFeedback = useCallback((next: Feedback) => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(next);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback("idle"), 620);
  }, []);

  const scrub = useCallback((value: number) => {
    const clamped = clampPosition(value);
    const delta = clamped - cursorRef.current;
    if (Math.abs(delta) > 0.002) directionRef.current = Math.sign(delta);
    cursorRef.current = clamped;
    setCursor(clamped);
    setActiveIndex(Math.round(clamped));
  }, []);

  const settle = useCallback(
    (value: number) => {
      const clamped = clampPosition(value);
      const directDelta = clamped - cursorRef.current;
      if (Math.abs(directDelta) > 0.002) directionRef.current = Math.sign(directDelta);
      const nextIndex = Math.round(clamped);
      cursorRef.current = nextIndex;
      setCursor(nextIndex);
      setActiveIndex(nextIndex);
      if (complete) return;

      const correctValue = nextIndex === TARGETS[stage];
      const correctDirection = directionRef.current === DIRECTIONS[stage];
      if (correctValue && correctDirection) {
        showFeedback("set");
        directionRef.current = 0;
        setStage((current) => current + 1);
        if (stage === TARGETS.length - 1 && typeof navigator.vibrate === "function") {
          navigator.vibrate([18, 36, 28]);
        }
        return;
      }

      showFeedback("miss");
      setAttempt((current) => current + 1);
      directionRef.current = 0;
    },
    [complete, showFeedback, stage]
  );

  const stepBy = (delta: number) => scrub(Math.round(cursor) + delta);

  const reset = () => {
    cursorRef.current = 0;
    directionRef.current = 0;
    setCursor(0);
    setActiveIndex(0);
    setStage(0);
    setAttempt(1);
    setFeedback("idle");
  };

  if (access === "checking") {
    return <section className={styles.loading} aria-label="VAULT_01" />;
  }

  if (access === "locked") {
    return (
      <section className={styles.locked} aria-labelledby="vault-locked-title">
        <p>VAULT_01 / ACCESS</p>
        <h1 id="vault-locked-title">FIELD NOT CALIBRATED</h1>
        <span>
          {locale === "ko"
            ? "먼저 FIELD_00의 세 지점을 정렬하세요."
            : "Align the three FIELD_00 detents first."}
        </span>
        <Link href={`/${locale}/calibration`}>RETURN TO CALIBRATION</Link>
      </section>
    );
  }

  const targetIndex = TARGETS[Math.min(stage, TARGETS.length - 1)];
  const targetDirection = DIRECTIONS[Math.min(stage, DIRECTIONS.length - 1)];
  const directionLabel = targetDirection > 0 ? "PULL UP" : "PULL DOWN";

  return (
    <section
      className={styles.page}
      data-feedback={feedback}
      data-vault-game="true"
      data-vault-open={complete ? "true" : "false"}
      data-vault-stage={stage}
      aria-labelledby="vault-title"
    >
      <div className={styles.telemetry} aria-hidden="true">
        <span>SGYUN / VAULT UNIT</span>
        <i />
        <span>01</span>
      </div>

      <div className={styles.layout}>
        <header className={styles.copy}>
          <p>VAULT_01 / THREE TUMBLERS</p>
          <h1 id="vault-title">{complete ? "VAULT OPEN" : "OPEN THE VAULT"}</h1>
          <span>
            {complete
              ? locale === "ko"
                ? "세 개의 텀블러가 정렬되었습니다."
                : "All three tumblers aligned."
              : locale === "ko"
                ? "지정된 방향으로 움직여 숫자에서 다이얼을 놓으세요."
                : "Move in the indicated direction and release at the number."}
          </span>
        </header>

        <div className={styles.chamber} aria-live="polite">
          <div className={styles.door} aria-hidden="true">
            <div className={styles.rings} />
            <div className={styles.shutter}>
              {Array.from({ length: 8 }, (_, index) => (
                <i key={index} style={{ "--blade": index } as CSSProperties} />
              ))}
            </div>
            <div className={styles.reveal}>
              <small>ACCESS / GRANTED</small>
              <strong>SGYUN</strong>
              <span>OBJECTS · INTERFACES · SYSTEMS</span>
            </div>
          </div>
          <div className={styles.target}>
            <small>{complete ? "STATUS" : `TUMBLER_${stage + 1}`}</small>
            <strong>{complete ? "OPEN" : items[targetIndex]?.number}</strong>
            <span>{complete ? "SEQUENCE COMPLETE" : directionLabel}</span>
          </div>
        </div>

        <ol className={styles.register} aria-label={locale === "ko" ? "금고 조합" : "Vault combination"}>
          {TARGETS.map((target, index) => (
            <li
              key={target}
              data-state={index < stage ? "set" : index === stage ? "active" : "waiting"}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <b>{items[target]?.number}</b>
              <span>{DIRECTIONS[index] > 0 ? "UP" : "DOWN"}</span>
              <em>{index < stage ? "SET" : index === stage && !complete ? "NOW" : "—"}</em>
            </li>
          ))}
        </ol>

        <div className={styles.controls}>
          <span>{complete ? "APERTURE RELEASED" : `ATTEMPT ${String(attempt).padStart(2, "0")}`}</span>
          <div className={styles.stepper}>
            <button type="button" aria-label={locale === "ko" ? "이전 숫자" : "Previous number"} onClick={() => stepBy(-1)}>
              −
            </button>
            <button type="button" aria-label={locale === "ko" ? "현재 값 확정" : "Set current value"} onClick={() => settle(cursor)}>
              SET
            </button>
            <button type="button" aria-label={locale === "ko" ? "다음 숫자" : "Next number"} onClick={() => stepBy(1)}>
              +
            </button>
          </div>
          {complete ? (
            <div className={styles.completeActions}>
              <Link href={`/${locale}/works`}>RETURN TO ARCHIVE</Link>
              <button type="button" onClick={reset}>REPLAY</button>
            </div>
          ) : (
            <span className={styles.feedback} aria-live="polite">
              {feedback === "set" ? "TUMBLER SET" : feedback === "miss" ? "RELEASE REJECTED" : directionLabel}
            </span>
          )}
        </div>
      </div>

      <VaultDial
        activeIndex={activeIndex}
        ariaLabel={locale === "ko" ? "VAULT 01 금고 다이얼" : "VAULT 01 safe dial"}
        className={styles.dial}
        getScrubStartIndex={() => cursorRef.current}
        items={items}
        mousePixelsPerStep={68}
        onSelect={settle}
        onScrub={scrub}
        onScrubEnd={settle}
        stepDegrees={11}
        touchMode="scrub"
        touchPixelsPerStep={44}
        visualIndex={cursor}
        variant="archive"
      />
    </section>
  );
}
