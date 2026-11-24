// Arcade sound effects, synthesised with Web Audio (no audio files to download).
// Short and restrained: only key moments get a sound. Shared by every game; toggled from the hub.
// Usage: import { sfx } from "./sfx"; sfx.play("puck", 0.8);

export type Sfx =
  | "tap" | "count" | "go" | "win" | "lose"
  | "puck" | "wall" | "goal" | "concede"
  | "flipper" | "bumper" | "sling" | "launch" | "drain" | "light"
  | "fire" | "ricochet" | "hit" | "boom";

const KEY = "sgyun-arcade-sound";
let ctx: AudioContext | null = null, master: GainNode | null = null, noise: AudioBuffer | null = null;
let enabled = true;
try { enabled = localStorage.getItem(KEY) !== "off"; } catch {}
const last = new Map<Sfx, number>();
const listeners = new Set<(on: boolean) => void>();

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({latencyHint: "interactive"});
    master = ctx.createGain(); master.gain.value = 0.2;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// one oscillator note with a fast attack / exponential decay
function tone(a: AudioContext, t: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType = "square") {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!); o.start(t); o.stop(t + dur + 0.02);
}
// filtered noise burst
function hiss(a: AudioContext, t: number, dur: number, gain: number, f0: number, f1: number, q = 0.8) {
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noise; f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master!); s.start(t); s.stop(t + dur + 0.02);
}

const MIN_GAP: Partial<Record<Sfx, number>> = {wall: 0.05, puck: 0.04, bumper: 0.05, sling: 0.06, light: 0.08, ricochet: 0.05, hit: 0.05};

export const sfx = {
  get enabled() { return enabled; },
  setEnabled(on: boolean) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch {}
    listeners.forEach(l => l(on));
    if (on) { audio(); sfx.play("tap"); }
  },
  subscribe(l: (on: boolean) => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Call once from a user gesture (click/tap/key) so browsers allow sound. */
  unlock() { if (enabled) audio(); },
  play(name: Sfx, intensity = 1) {
    if (!enabled) return;
    const a = audio(); if (!a || !master) return;
    const t = a.currentTime, k = Math.max(0.2, Math.min(1, intensity));
    const gap = MIN_GAP[name] ?? 0.03, prev = last.get(name) ?? -1;
    if (t - prev < gap) return;
    last.set(name, t);
    switch (name) {
      case "tap": tone(a, t, 880, 880, 0.035, 0.25); break;
      case "count": tone(a, t, 660, 660, 0.09, 0.35); break;
      case "go": tone(a, t, 990, 990, 0.16, 0.4); break;
      case "win": [523, 659, 784, 1047].forEach((f, i) => tone(a, t + i * 0.09, f, f, 0.12, 0.35)); break;
      case "lose": [392, 330, 262].forEach((f, i) => tone(a, t + i * 0.12, f, f, 0.16, 0.3, "triangle")); break;
      case "puck": tone(a, t, 260 + 240 * k, 180 + 120 * k, 0.05, 0.25 + 0.35 * k, "triangle"); hiss(a, t, 0.03, 0.2 * k, 2400, 1200, 1.2); break;
      case "wall": tone(a, t, 180 + 80 * k, 150, 0.035, 0.12 + 0.18 * k, "triangle"); break;
      case "goal": [784, 1175].forEach((f, i) => tone(a, t + i * 0.1, f, f, 0.14, 0.4)); break;
      case "concede": [330, 247].forEach((f, i) => tone(a, t + i * 0.11, f, f, 0.15, 0.3, "triangle")); break;
      case "flipper": tone(a, t, 140, 90, 0.06, 0.35, "triangle"); hiss(a, t, 0.025, 0.15, 900, 500); break;
      case "bumper": tone(a, t, 1300, 650, 0.09, 0.35); break;
      case "sling": tone(a, t, 520, 300, 0.06, 0.3); break;
      case "light": tone(a, t, 1568, 1568, 0.05, 0.22, "triangle"); break;
      case "launch": hiss(a, t, 0.28, 0.35 * k + 0.1, 300, 2800, 1.4); tone(a, t, 200, 600, 0.22, 0.12, "triangle"); break;
      case "drain": tone(a, t, 440, 110, 0.45, 0.3, "triangle"); break;
      case "fire": hiss(a, t, 0.12, 0.45, 1600, 300, 0.9); tone(a, t, 150, 60, 0.12, 0.35, "triangle"); break;
      case "ricochet": tone(a, t, 1800, 2600, 0.09, 0.22, "sine"); hiss(a, t, 0.05, 0.12, 4000, 3000, 2); break;
      case "hit": hiss(a, t, 0.06, 0.25 * k, 900, 400, 1); break;
      case "boom": hiss(a, t, 0.5, 0.6, 700, 60, 0.7); tone(a, t, 90, 35, 0.4, 0.45, "sine"); break;
    }
  },
};
