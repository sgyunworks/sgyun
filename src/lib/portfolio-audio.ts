// One gesture-unlocked context survives the landing-to-Works client navigation.
let context: AudioContext | null = null;
export function portfolioAudio() {
  if (typeof window === 'undefined') return null;
  const Constructor = window.AudioContext ?? (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!Constructor) return null;
  if (!context || context.state === 'closed') context = new Constructor();
  if (context.state === 'suspended') void context.resume().catch(() => undefined);
  return context;
}
export function wireTone(strength = 1) {
  const ctx = portfolioAudio();
  if (!ctx || ctx.state !== 'running') return;
  // Inharmonic partials give a restrained steel-wire pluck, not a notification chime.
  [1, 2.71, 4.13].forEach((partial, i) => {
    const oscillator = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime((210 + strength * 34) * partial, now);
    oscillator.frequency.exponentialRampToValueAtTime(195 * partial, now + .55);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime((.035 / (i + 1)) * Math.min(1.3, strength), now + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .65 / (i + 1));
    oscillator.connect(gain).connect(ctx.destination); oscillator.start(now); oscillator.stop(now + .7);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}
export function readPortfolioSound() {
  try { return sessionStorage.getItem('portfolio-sound') !== 'off'; } catch { return true; }
}
export function savePortfolioSound(on: boolean) {
  try { sessionStorage.setItem('portfolio-sound', on ? 'on' : 'off'); } catch { /* preference remains in memory */ }
}
