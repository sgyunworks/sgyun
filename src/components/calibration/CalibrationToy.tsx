"use client";

import { useCallback, useMemo, useState } from "react";
import { VaultDial } from "@/components/VaultDial";
import type { Locale } from "@/lib/i18n";
import styles from "./CalibrationToy.module.css";

const TARGETS = [2, 7, 4] as const;
const POSITION_COUNT = 10;

function clampPosition(value: number) {
  return Math.min(POSITION_COUNT - 1, Math.max(0, value));
}

export function CalibrationToy({ locale }: { locale: Locale }) {
  const items = useMemo(
    () =>
      Array.from({ length: POSITION_COUNT }, (_, index) => ({
        id: `calibration-${index}`,
        number: String(index + 1).padStart(2, "0"),
        label: `DETENT_${String(index + 1).padStart(2, "0")}`,
      })),
    [locale]
  );
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const complete = stage >= TARGETS.length;

  const scrub = useCallback((value: number) => {
    const clamped = clampPosition(value);
    setCursor(clamped);
    setActiveIndex(Math.round(clamped));
  }, []);

  const settle = useCallback(
    (value: number) => {
      const nextIndex = Math.round(clampPosition(value));
      setCursor(nextIndex);
      setActiveIndex(nextIndex);
      if (complete) return;

      if (nextIndex === TARGETS[stage]) {
        setStage((current) => current + 1);
      } else {
        setAttempt((current) => current + 1);
      }
    },
    [complete, stage]
  );

  const reset = () => {
    setCursor(0);
    setActiveIndex(0);
    setStage(0);
    setAttempt(0);
  };

  const stepBy = (delta: number) => {
    scrub(Math.round(cursor) + delta);
  };

  const currentTarget = TARGETS[Math.min(stage, TARGETS.length - 1)];
  const currentValue = items[activeIndex]?.number ?? "01";

  return (
    <section
      className={styles.page}
      data-complete={complete ? "true" : "false"}
      aria-labelledby="calibration-title"
    >
      <div className={styles.telemetry} aria-hidden="true">
        <span>SGYUN / FIELD UNIT</span>
        <i />
        <span>00</span>
      </div>

      <div className={styles.instrument}>
        <div className={styles.copy}>
          <p>FIELD_00</p>
          <h1 id="calibration-title">CALIBRATION</h1>
          <span>
            {complete
              ? locale === "ko"
                ? "세 개의 detent가 정렬되었습니다."
                : "Three detents aligned."
              : locale === "ko"
                ? "표시된 값에서 다이얼을 놓으세요."
                : "Release the dial at the indicated value."}
          </span>
        </div>

        <div className={styles.field} aria-live="polite">
          <div className={styles.fieldFace} aria-hidden="true">
            <i className={styles.scan} />
            <i className={styles.core} />
          </div>
          <div className={styles.value}>
            <small>{complete ? "STATUS" : `TARGET_${stage + 1}`}</small>
            <strong>
              {complete
                ? "LOCKED"
                : items[currentTarget]?.number ?? "--"}
            </strong>
            <span>ACTUAL&nbsp;&nbsp;{currentValue}</span>
          </div>
        </div>

        <ol className={styles.register} aria-label={locale === "ko" ? "목표 순서" : "Target sequence"}>
          {TARGETS.map((target, index) => (
            <li
              key={target}
              data-state={index < stage ? "set" : index === stage ? "active" : "waiting"}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <b>{items[target]?.number}</b>
              <span>{index < stage ? "SET" : index === stage && !complete ? "NOW" : "—"}</span>
            </li>
          ))}
        </ol>

        <div className={styles.instructions}>
          <span>
            {locale === "ko"
              ? "DRAG · 숫자 선택 · 방향키"
              : "DRAG · SELECT NUMBER · ARROW KEYS"}
          </span>
          <div className={styles.stepper}>
            <button
              type="button"
              aria-label={locale === "ko" ? "이전 숫자" : "Previous number"}
              onClick={() => stepBy(-1)}
            >
              −
            </button>
            <button
              type="button"
              aria-label={locale === "ko" ? "현재 값 확정" : "Set current value"}
              onClick={() => settle(cursor)}
            >
              SET
            </button>
            <button
              type="button"
              aria-label={locale === "ko" ? "다음 숫자" : "Next number"}
              onClick={() => stepBy(1)}
            >
              +
            </button>
          </div>
          {complete ? (
            <button type="button" onClick={reset}>
              RESET
            </button>
          ) : (
            <span key={attempt}>ATTEMPT&nbsp;&nbsp;{String(attempt + 1).padStart(2, "0")}</span>
          )}
        </div>
      </div>

      <VaultDial
        activeIndex={activeIndex}
        ariaLabel={
          locale === "ko" ? "FIELD 00 캘리브레이션 다이얼" : "FIELD 00 calibration dial"
        }
        className={styles.dial}
        getScrubStartIndex={() => cursor}
        items={items}
        mousePixelsPerStep={68}
        onSelect={(index) => settle(index)}
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
