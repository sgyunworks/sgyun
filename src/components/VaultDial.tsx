"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {portfolioAudio} from "@/lib/portfolio-audio";
import styles from "./VaultDial.module.css";

const TICK_COUNT = 60;
const ARCHIVE_DIAL_STEP = 15;
const PAGE_DIAL_ARC = 72;
const PAGE_DIAL_STEP_MAX = 30;
const DRAG_PX_PER_STEP_MOUSE = 170;
const DRAG_PX_PER_STEP_TOUCH = 300;
const HAPTIC_INTERVAL_MS = 48;

let lastWebHapticAt = 0;

function triggerWebHaptic(proxy: HTMLInputElement | null, duration = 5) {
  if (typeof window === "undefined" || document.visibilityState !== "visible") return;
  const now = window.performance.now();
  if (now - lastWebHapticAt < HAPTIC_INTERVAL_MS) return;
  lastWebHapticAt = now;

  if (typeof navigator.vibrate === "function" && navigator.vibrate(duration)) {
    return;
  }

  if (window.matchMedia("(pointer: coarse)").matches) {
    proxy?.click();
  }
}

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
  appearance?: "classic" | "editorial";
  activeIndex: number;
  ariaLabel: string;
  className?: string;
  mousePixelsPerStep?: number;
  items: VaultDialItem[];
  onEngage?: () => void;
  getScrubStartIndex?: () => number;
  onScrub?: (index: number) => void;
  onScrubEnd?: (index: number) => void;
  onSelect?: (index: number) => void;
  sound?: boolean;
  stepDegrees?: number;
  touchMode?: "passive" | "scrub";
  touchPixelsPerStep?: number;
  tone?: "primary" | "quiet";
  visualAngle?: string;
  visualIndex?: number;
  variant?: "archive" | "page";
};

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function VaultDial({
  appearance = "classic",
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
  touchMode = "passive",
  touchPixelsPerStep = DRAG_PX_PER_STEP_TOUCH,
  tone = "primary",
  visualAngle,
  visualIndex,
  variant = "page",
}: VaultDialProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const hapticProxyRef = useRef<HTMLInputElement | null>(null);
  const audioArmedRef = useRef(false);
  const lastAudioStepRef = useRef(
    Math.round((visualIndex ?? activeIndex) * 4)
  );
  const lastHapticStepRef = useRef(
    Math.round((visualIndex ?? activeIndex) * 4)
  );
  const [isInteracting, setIsInteracting] = useState(false);
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
      audioContextRef.current = appearance === "editorial" ? portfolioAudio() : new AudioContextConstructor();
    }
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume().catch(() => undefined);
    }
  }, [onEngage, sound, appearance]);

  const setHapticProxy = useCallback((node: HTMLInputElement | null) => {
    hapticProxyRef.current = node;
    if (node) node.setAttribute("switch", "");
  }, []);

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
    gain.gain.exponentialRampToValueAtTime(appearance === "editorial" ? 0.126 : 0.042, now + 0.0012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(now);
    source.stop(now + duration);
  }, [sound, appearance]);

  useEffect(() => {
    const audioStep = Math.round((visualIndex ?? activeIndex) * 4);
    if (lastAudioStepRef.current !== audioStep) {
      lastAudioStepRef.current = audioStep;
      playRatchet();
      triggerWebHaptic(hapticProxyRef.current);
    }
  }, [activeIndex, playRatchet, visualIndex]);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      armAudio();
    }
    const arm = () => armAudio();
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    window.addEventListener("keydown", arm, { capture: true, once: true });
    window.addEventListener("touchstart", arm, { capture: true, once: true });
    window.addEventListener("wheel", arm, {
      capture: true,
      once: true,
      passive: true,
    });
    window.addEventListener("scroll", arm, {
      capture: true,
      once: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("pointerdown", arm, true);
      window.removeEventListener("keydown", arm, true);
      window.removeEventListener("touchstart", arm, true);
      window.removeEventListener("wheel", arm, true);
      window.removeEventListener("scroll", arm, true);
    };
  }, [armAudio]);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      if (appearance !== "editorial" && context && context.state !== "closed") void context.close();
    },
    [appearance]
  );

  const select = (index: number) => {
    if (!onSelect) return;
    armAudio();
    onSelect(clampIndex(Math.round(index)));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (touchMode !== "scrub") return;
    armAudio();
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
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
    setIsInteracting(true);
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
      triggerWebHaptic(hapticProxyRef.current);
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsInteracting(false);
    if (typeof navigator.vibrate === "function") navigator.vibrate(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onScrubEnd?.(drag.currentIndex);
  };

  const losePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsInteracting(false);
    if (typeof navigator.vibrate === "function") navigator.vibrate(0);
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
  const isInteractive = touchMode === "scrub";

  if (appearance === "editorial") return <aside className={styles.editorial} aria-label={ariaLabel}>
    <div className={styles.editorialKnob} role="slider" tabIndex={0} aria-label={ariaLabel} aria-valuemin={1} aria-valuemax={items.length} aria-valuenow={activeIndex+1} aria-valuetext={activeItem?.label}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endPointer} onPointerCancel={losePointer} onLostPointerCapture={losePointer}
      onKeyDown={e=>{if(["ArrowRight","ArrowDown","ArrowLeft","ArrowUp","Home","End"].includes(e.key)){e.preventDefault();select(e.key==="Home"?0:e.key==="End"?items.length-1:activeIndex+(["ArrowRight","ArrowDown"].includes(e.key)?1:-1));}}}>
      <svg viewBox="0 0 100 100" aria-hidden="true" style={{transform:`rotate(${resolvedVisualAngle})`}}>{Array.from({length:60},(_,i)=><line key={i} x1="50" y1="5" x2="50" y2={i%5===0?14:9} transform={`rotate(${i*6} 50 50)`} stroke={i%5===0?"#333":"#bcbcbc"} strokeWidth={i%5===0?1.2:.7}/>)}</svg>
      <span className={styles.editorialPointer}/><span className={styles.editorialNumber}>{activeItem?.number}</span>
    </div>
  </aside>;

  return (
    <aside
      className={`${styles.shell} ${styles[variant]}${className ? ` ${className}` : ""}`}
      data-vault-dial={variant}
      data-tone={tone}
      data-interactive={isInteractive ? "true" : "false"}
      data-interacting={isInteracting ? "true" : "false"}
      style={
        {
          "--vault-dial-angle": resolvedVisualAngle,
          "--vault-dial-step": `${dialStep}deg`,
        } as DialStyle
      }
      aria-label={
        isInteractive
          ? ariaLabel
          : `${ariaLabel}: ${activeItem?.number ?? ""} ${activeItem?.label ?? ""}`
      }
    >
      <input
        ref={setHapticProxy}
        className={styles.hapticProxy}
        data-ios-haptic-proxy="true"
        type="checkbox"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.rail} aria-hidden={!isInteractive}>
        {items.map((item, index) => (
          isInteractive ? (
            <button
              type="button"
              key={item.id}
              className={`${styles.railItem} ${
                index === activeIndex ? styles.activeRailItem : ""
              }`}
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`${item.number} ${item.label}`}
              onClick={() => select(index)}
            >
              <span>{item.number}</span>
              <strong>{item.label}</strong>
            </button>
          ) : (
            <span
              key={item.id}
              className={`${styles.railItem} ${
                index === activeIndex ? styles.activeRailItem : ""
              }`}
            >
              <span>{item.number}</span>
              <strong>{item.label}</strong>
            </span>
          )
        ))}
      </div>

      <div
        className={styles.control}
        data-vault-dial-control="true"
        aria-hidden="true"
      >
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

      {isInteractive ? (
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
          onLostPointerCapture={losePointer}
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
        />
      ) : null}

      <div className={styles.readout} aria-hidden="true">
        <span>{activeItem?.number}</span>
        <small>{String(items.length).padStart(2, "0")}</small>
      </div>
    </aside>
  );
}
