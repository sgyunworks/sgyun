"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import styles from "./VaultDial.module.css";

const TICK_COUNT = 60;
const ARCHIVE_DIAL_STEP = 15;
const PAGE_DIAL_ARC = 72;
const PAGE_DIAL_STEP_MAX = 30;
const DRAG_PX_PER_STEP_MOUSE = 170;
const DRAG_PX_PER_STEP_TOUCH = 300;

type DialStyle = CSSProperties & {
  "--vault-dial-angle": string;
  "--vault-dial-step": string;
};

type TickStyle = CSSProperties & {
  "--vault-tick-index": number;
};

type MarkerStyle = CSSProperties & {
  "--vault-marker-angle": string;
  "--vault-counter-angle": string;
};

export type VaultDialItem = {
  id: string;
  number: string;
  label: string;
};

type VaultDialProps = {
  activeIndex: number;
  ariaLabel: string;
  className?: string;
  mousePixelsPerStep?: number;
  items: VaultDialItem[];
  onEngage?: () => void;
  getScrubStartIndex?: () => number;
  onScrub?: (index: number) => void;
  onScrubEnd?: (index: number) => void;
  onSelect: (index: number) => void;
  sound?: boolean;
  stepDegrees?: number;
  touchMode?: "native-scroll" | "scrub";
  touchPixelsPerStep?: number;
  visualAngle?: string;
  visualIndex?: number;
  variant?: "archive" | "page";
};

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function VaultDial({
  activeIndex,
  ariaLabel,
  className,
  getScrubStartIndex,
  items,
  mousePixelsPerStep = DRAG_PX_PER_STEP_MOUSE,
  onEngage,
  onScrub,
  onScrubEnd,
  onSelect,
  sound = true,
  stepDegrees,
  touchMode = "native-scroll",
  touchPixelsPerStep = DRAG_PX_PER_STEP_TOUCH,
  visualAngle,
  visualIndex,
  variant = "page",
}: VaultDialProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioArmedRef = useRef(false);
  const lastAudioStepRef = useRef(
    Math.round((visualIndex ?? activeIndex) * 4)
  );
  const lastHapticStepRef = useRef(
    Math.round((visualIndex ?? activeIndex) * 4)
  );
  const lastSettledHapticRef = useRef(activeIndex);
  const dragRef = useRef<{
    currentIndex: number;
    pointerId: number;
    pointerType: string;
    startIndex: number;
    startY: number;
  } | null>(null);

  const clampIndex = useCallback(
    (index: number) => Math.min(items.length - 1, Math.max(0, index)),
    [items.length]
  );

  const armAudio = useCallback(() => {
    onEngage?.();
    if (!sound || typeof window === "undefined") return;
    audioArmedRef.current = true;
    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AudioContextConstructor) return;
      audioContextRef.current = new AudioContextConstructor();
    }
    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume().catch(() => undefined);
    }
  }, [onEngage, sound]);

  const playRatchet = useCallback(() => {
    const context = audioContextRef.current;
    if (!sound || !audioArmedRef.current || !context || context.state !== "running") {
      return;
    }

    const now = context.currentTime;
    const duration = 0.021;
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      const envelope = 1 - index / sampleCount;
      channel[index] = (Math.random() * 2 - 1) * envelope;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3300 + Math.random() * 260, now);
    filter.Q.setValueAtTime(1.05, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.042, now + 0.0012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(now);
    source.stop(now + duration);
  }, [sound]);

  useEffect(() => {
    const audioStep = Math.round((visualIndex ?? activeIndex) * 4);
    if (lastAudioStepRef.current !== audioStep) {
      lastAudioStepRef.current = audioStep;
      playRatchet();
    }
  }, [activeIndex, playRatchet, visualIndex]);

  useEffect(() => {
    if (
      touchMode !== "native-scroll" ||
      !audioArmedRef.current ||
      lastSettledHapticRef.current === activeIndex
    ) {
      return;
    }
    lastSettledHapticRef.current = activeIndex;
    if (
      typeof navigator.vibrate === "function" &&
      navigator.maxTouchPoints > 0
    ) {
      navigator.vibrate(4);
    }
  }, [activeIndex, touchMode]);

  useEffect(() => {
    const arm = () => armAudio();
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    window.addEventListener("keydown", arm, { capture: true, once: true });
    window.addEventListener("touchstart", arm, { capture: true, once: true });
    window.addEventListener("wheel", arm, {
      capture: true,
      once: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("pointerdown", arm, true);
      window.removeEventListener("keydown", arm, true);
      window.removeEventListener("touchstart", arm, true);
      window.removeEventListener("wheel", arm, true);
    };
  }, [armAudio]);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      if (context && context.state !== "closed") void context.close();
    },
    []
  );

  const select = (index: number) => {
    armAudio();
    onSelect(clampIndex(Math.round(index)));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    armAudio();
    if (event.pointerType === "touch" && touchMode === "native-scroll") {
      return;
    }
    const startIndex = clampIndex(
      getScrubStartIndex?.() ?? visualIndex ?? activeIndex
    );
    dragRef.current = {
      currentIndex: startIndex,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startIndex,
      startY: event.clientY,
    };
    lastHapticStepRef.current = Math.round(startIndex * 4);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const pixelsPerStep =
      drag.pointerType === "mouse"
        ? mousePixelsPerStep
        : touchPixelsPerStep;
    const nextIndex = clampIndex(
      drag.startIndex + (drag.startY - event.clientY) / pixelsPerStep
    );
    drag.currentIndex = nextIndex;
    onScrub?.(nextIndex);
    const hapticStep = Math.round(nextIndex * 4);
    if (
      hapticStep !== lastHapticStepRef.current &&
      typeof navigator.vibrate === "function"
    ) {
      lastHapticStepRef.current = hapticStep;
      navigator.vibrate(4);
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (typeof navigator.vibrate === "function") navigator.vibrate(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onScrubEnd?.(drag.currentIndex);
  };

  const activeItem = items[activeIndex] ?? items[0];
  const dialStep =
    stepDegrees ??
    (variant === "archive"
      ? ARCHIVE_DIAL_STEP
      : Math.min(
          PAGE_DIAL_STEP_MAX,
          PAGE_DIAL_ARC / Math.max(1, items.length - 1)
        ));
  const resolvedVisualIndex = clampIndex(visualIndex ?? activeIndex);
  const resolvedVisualAngle =
    visualAngle ?? `${resolvedVisualIndex * -dialStep}deg`;

  return (
    <aside
      className={`${styles.shell} ${styles[variant]}${className ? ` ${className}` : ""}`}
      data-vault-dial={variant}
      style={
        {
          "--vault-dial-angle": resolvedVisualAngle,
          "--vault-dial-step": `${dialStep}deg`,
        } as DialStyle
      }
      aria-label={ariaLabel}
    >
      <div className={styles.scrim} aria-hidden="true" />
      <nav className={styles.rail} aria-label={ariaLabel}>
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={index === activeIndex ? styles.activeRailItem : undefined}
            aria-current={index === activeIndex ? "true" : undefined}
            aria-label={`${item.number} ${item.label}`}
            onClick={() => select(index)}
          >
            <span>{item.number}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>

      <div
        className={styles.controlHitArea}
        data-touch-mode={touchMode}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={1}
        aria-valuemax={items.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={activeItem?.label}
        aria-orientation="vertical"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={(event) => {
          armAudio();
          if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) {
            event.preventDefault();
            select(activeIndex + 1);
          }
          if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
            event.preventDefault();
            select(activeIndex - 1);
          }
          if (event.key === "Home") {
            event.preventDefault();
            select(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            select(items.length - 1);
          }
        }}
      >
        <div className={styles.control} aria-hidden="true">
          <div className={styles.track}>
            {Array.from({ length: TICK_COUNT }).map((_, index) => (
              <i
                className={styles.tick}
                key={index}
                style={{ "--vault-tick-index": index } as TickStyle}
              />
            ))}
            {items.map((item, index) => {
              const angle = -90 + index * dialStep;
              return (
                <span
                  key={item.id}
                  className={`${styles.marker} ${
                    index === activeIndex ? styles.activeMarker : ""
                  }`}
                  style={
                    {
                      "--vault-marker-angle": `${angle}deg`,
                      "--vault-counter-angle": `${-angle}deg`,
                    } as MarkerStyle
                  }
                >
                  <b>{item.number}</b>
                </span>
              );
            })}
          </div>
          <span className={styles.datum} />
        </div>
      </div>

      <div className={styles.readout} aria-hidden="true">
        <span>{activeItem?.number}</span>
        <small>{String(items.length).padStart(2, "0")}</small>
      </div>
    </aside>
  );
}
