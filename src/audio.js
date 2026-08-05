/**
 * Lightweight Web Audio stingers — no external files.
 */

let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, t0, dur, type = 'sine', gain = 0.08) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function playTap() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    tone(520, t, 0.08, 'triangle', 0.05);
    tone(780, t + 0.04, 0.1, 'sine', 0.04);
  } catch {
    /* ignore */
  }
}

export function playProgressTick() {
  try {
    const c = getCtx();
    tone(660 + Math.random() * 80, c.currentTime, 0.05, 'sine', 0.03);
  } catch {
    /* ignore */
  }
}

export function playReset() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    tone(280, t, 0.12, 'sawtooth', 0.03);
    tone(180, t + 0.06, 0.15, 'triangle', 0.025);
  } catch {
    /* ignore */
  }
}

export function playVictory() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    // Ascending sparkly fanfare
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => {
      tone(n, t + i * 0.07, 0.22, 'triangle', 0.07);
      tone(n * 2, t + i * 0.07 + 0.03, 0.15, 'sine', 0.03);
    });
    // Low boom
    tone(90, t, 0.35, 'sine', 0.08);
  } catch {
    /* ignore */
  }
}

export function haptic(pattern = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
