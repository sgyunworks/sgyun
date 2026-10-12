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
  // A decaying pitch oscillation follows the elastic recoil of a plucked steel wire.
  [1, 2.76, 5.1].forEach((partial, i) => {
    const oscillator = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    oscillator.type = 'sine';
    const pitch = new Float32Array(192);
    for (let n=0;n<pitch.length;n++) {
      const t=n/(pitch.length-1)*.85;
      pitch[n]=(185+strength*30+70*Math.min(strength,1.3)*Math.exp(-5*t)*Math.cos(30*t))*partial;
    }
    oscillator.frequency.setValueCurveAtTime(pitch, now, .85);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime((.035 / (i + 1)) * Math.min(1.3, strength), now + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .82 / (i + 1));
    oscillator.connect(gain).connect(ctx.destination); oscillator.start(now); oscillator.stop(now + .9);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}
export function readPortfolioSound() {
  try { return sessionStorage.getItem('portfolio-sound') !== 'off'; } catch { return true; }
}
export function savePortfolioSound(on: boolean) {
  try { sessionStorage.setItem('portfolio-sound', on ? 'on' : 'off'); } catch { /* preference remains in memory */ }
}
