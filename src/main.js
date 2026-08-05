/**
 * Judgy — main app loop
 * States: locked → challenge → success
 */

import './style.css';
import {
  buildCharacterSVG,
  setCharacterState,
  pickLine,
} from './character.js';
import {
  initPose,
  detectArmsUp,
  startCamera,
  stopCamera,
} from './pose.js';
import { createAmbient, createFX } from './particles.js';
import {
  playTap,
  playProgressTick,
  playReset,
  playVictory,
  haptic,
} from './audio.js';

// ── Hold duration for full unlock (ms) ──
const HOLD_MS = 2800;
const RING_C = 2 * Math.PI * 52; // ~326.7

// ── DOM ──
const app = document.getElementById('app');
const characterEl = document.getElementById('character');
const characterWrap = document.getElementById('character-wrap');
const speechEl = document.getElementById('speech');
const speechText = document.getElementById('speech-text');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const eyebrowEl = document.getElementById('eyebrow');
const statusPill = document.getElementById('status-pill');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const ctaBtn = document.getElementById('cta-btn');
const ctaLabel = document.getElementById('cta-label');
const doneBtn = document.getElementById('done-btn');
const finePrint = document.getElementById('fine-print');
const cameraLayer = document.getElementById('camera-layer');
const video = document.getElementById('camera');
const challengeHud = document.getElementById('challenge-hud');
const ringFill = document.getElementById('ring-fill');
const meterPct = document.getElementById('meter-pct');
const meterLabel = document.getElementById('meter-label');
const liveFeedback = document.getElementById('live-feedback');
const successBurst = document.getElementById('success-burst');
const toast = document.getElementById('toast');
const ambientCanvas = document.getElementById('ambient-canvas');
const fxCanvas = document.getElementById('fx-canvas');

// ── FX ──
const ambient = createAmbient(ambientCanvas);
const fx = createFX(fxCanvas);
ambient.start();

// Ring circumference CSS
document.documentElement.style.setProperty('--ring', String(RING_C));
ringFill.style.strokeDasharray = String(RING_C);
ringFill.style.strokeDashoffset = String(RING_C);

// Character mount
characterEl.innerHTML = buildCharacterSVG();
setCharacterState(characterEl, 'judgy');

// ── App state ──
let mode = 'locked'; // locked | challenge | success
let holdAccum = 0;
let lastTs = 0;
let rafId = 0;
let wasArmsUp = false;
let lastSpeechAt = 0;
let lastCharState = 'judgy';
let lastTickAt = 0;
let sassLevel = 0;
let poseModelReady = false;
let cameraReady = false;

// Preload pose model in background
initPose()
  .then(() => {
    poseModelReady = true;
  })
  .catch((err) => {
    console.warn('Pose model load failed', err);
  });

// ── Speech / character helpers ──
function say(text, force = false) {
  const now = performance.now();
  if (!force && now - lastSpeechAt < 900) return;
  lastSpeechAt = now;

  speechEl.dataset.visible = 'false';
  setTimeout(() => {
    speechText.textContent = text;
    speechEl.dataset.visible = 'true';
    popCharacter();
  }, 120);
}

function popCharacter() {
  characterWrap.classList.remove('pop');
  // reflow
  void characterWrap.offsetWidth;
  characterWrap.classList.add('pop');
}

function setMood(state, lineKey) {
  if (state !== lastCharState) {
    setCharacterState(characterEl, state);
    lastCharState = state;
    popCharacter();
  }
  if (lineKey) say(pickLine(lineKey));
}

function showToast(msg, ms = 2800) {
  toast.hidden = false;
  toast.textContent = msg;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.hidden = true;
    }, 300);
  }, ms);
}

function setProgress(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  ringFill.style.strokeDashoffset = String(RING_C * (1 - r));
  meterPct.textContent = `${Math.round(r * 100)}%`;
  if (r >= 1) meterLabel.textContent = 'done';
  else if (r > 0.6) meterLabel.textContent = 'almost';
  else if (r > 0) meterLabel.textContent = 'hold it';
  else meterLabel.textContent = 'raise up';
}

// ── Mode transitions ──
function enterLocked() {
  mode = 'locked';
  app.className = '';
  app.classList.add('mode-locked');
  holdAccum = 0;
  sassLevel = 0;
  wasArmsUp = false;
  setProgress(0);

  challengeHud.hidden = true;
  successBurst.hidden = true;
  cameraLayer.classList.remove('active');

  statusPill.classList.remove('unlocked');
  statusIcon.textContent = '🔒';
  statusText.textContent = 'Locked';

  eyebrowEl.textContent = 'Vibe check required';
  titleEl.textContent = 'Locked';
  subtitleEl.textContent = "This little gremlin won't let you through";
  subtitleEl.hidden = false;

  ctaBtn.hidden = false;
  ctaBtn.disabled = false;
  ctaBtn.className = 'cta cta-primary';
  ctaLabel.textContent = "I'm ready";
  doneBtn.hidden = true;
  finePrint.textContent = 'Camera stays on-device. No uploads. No judgment… wait.';

  setMood('judgy', 'judgy');
  cancelAnimationFrame(rafId);
}

async function enterChallenge() {
  mode = 'challenge';
  app.className = '';
  app.classList.add('mode-challenge');
  holdAccum = 0;
  lastTs = 0;
  wasArmsUp = false;
  sassLevel = 0;
  setProgress(0);

  successBurst.hidden = true;
  challengeHud.hidden = false;

  statusPill.classList.remove('unlocked');
  statusIcon.textContent = '👀';
  statusText.textContent = 'Watching';

  eyebrowEl.textContent = 'Pass the vibe check';
  titleEl.textContent = 'Arms up';
  subtitleEl.hidden = true;

  ctaBtn.hidden = true;
  doneBtn.hidden = true;
  finePrint.textContent =
    'Hold the phone at arm’s length — keep head, torso & both arms in the frame';

  liveFeedback.textContent = 'Looking for you…';
  setMood('watching', 'ready');

  // Camera + model
  ctaBtn.classList.add('loading');
  try {
    if (!cameraReady) {
      await startCamera(video);
      cameraReady = true;
    }
    cameraLayer.classList.add('active');

    if (!poseModelReady) {
      liveFeedback.textContent = 'Loading brain…';
      await initPose();
      poseModelReady = true;
    }

    liveFeedback.textContent = 'Show me those arms 🙌';
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    showToast('Camera permission needed to vibe-check. Enable it & try again.');
    enterLocked();
    ctaLabel.textContent = 'Try camera again';
  } finally {
    ctaBtn.classList.remove('loading');
  }
}

function enterSuccess() {
  mode = 'success';
  app.className = '';
  app.classList.add('mode-success', 'flash');
  setTimeout(() => app.classList.remove('flash'), 600);

  challengeHud.hidden = true;
  successBurst.hidden = false;

  statusPill.classList.add('unlocked');
  statusIcon.textContent = '✨';
  statusText.textContent = 'Unlocked';

  eyebrowEl.textContent = 'Vibe accepted';
  titleEl.textContent = "You're free";
  subtitleEl.hidden = true;

  setMood('celebrating', 'celebrating');
  say(pickLine('celebrating'), true);

  // Payoff
  playVictory();
  haptic([20, 40, 20, 40, 60]);
  const rect = characterWrap.getBoundingClientRect();
  const appRect = app.getBoundingClientRect();
  fx.burst(
    rect.left + rect.width / 2 - appRect.left,
    rect.top + rect.height / 2 - appRect.top,
    110
  );
  // Second burst
  setTimeout(() => {
    fx.burst(appRect.width / 2, appRect.height * 0.35, 60);
  }, 280);

  ctaBtn.hidden = false;
  ctaBtn.disabled = false;
  ctaBtn.className = 'cta cta-success';
  ctaLabel.textContent = 'Film another take';
  doneBtn.hidden = false;
  finePrint.textContent = 'Pro tip: Film your reaction';

  cancelAnimationFrame(rafId);
}

// ── Detection loop ──
function loop(ts) {
  if (mode !== 'challenge') return;

  const dt = lastTs ? Math.min(64, ts - lastTs) : 16;
  lastTs = ts;

  const result = detectArmsUp(video);

  if (!result.visible) {
    liveFeedback.textContent =
      result.detail === 'no-pose'
        ? 'Step into frame — I need to see you'
        : 'Looking for you…';
    if (holdAccum > 0) {
      holdAccum = Math.max(0, holdAccum - dt * 1.8);
      setProgress(holdAccum / HOLD_MS);
    }
    if (lastCharState !== 'watching' && lastCharState !== 'disappointed') {
      setMood('watching');
    }
  } else if (result.armsUp) {
    if (!wasArmsUp) {
      wasArmsUp = true;
      say(pickLine('holding'), true);
      haptic(8);
    }
    holdAccum += dt;
    const ratio = holdAccum / HOLD_MS;
    setProgress(ratio);

    // Character mood by progress
    if (ratio > 0.55) {
      if (lastCharState !== 'encouraging') setMood('encouraging', 'encouraging');
      liveFeedback.textContent = 'YES keep holding 🔥';
    } else {
      if (lastCharState !== 'watching') setMood('watching');
      liveFeedback.textContent = 'Looking good — hold still';
    }

    // Soft progress ticks
    if (ts - lastTickAt > 280 && ratio < 1) {
      lastTickAt = ts;
      playProgressTick();
    }

    if (holdAccum >= HOLD_MS) {
      setProgress(1);
      enterSuccess();
      return;
    }
  } else {
    // Pose visible but arms not up
    if (wasArmsUp && holdAccum > 200) {
      // Dropped mid-hold
      sassLevel = Math.min(3, sassLevel + 1);
      playReset();
      haptic(25);
      say(pickLine('reset'), true);
      setMood('disappointed');
      liveFeedback.textContent =
        sassLevel >= 2 ? "Dropped it again?? I'm judging." : 'Arms dropped — meter reset';
    } else {
      liveFeedback.textContent =
        result.detail === 'partial-up'
          ? 'Higher! Both arms, straight up'
          : 'Raise BOTH arms above your head';
      if (lastCharState !== 'judgy' && lastCharState !== 'disappointed') {
        setMood('judgy');
      }
    }
    wasArmsUp = false;
    // Snap reset feels snappier for shorts content
    if (holdAccum > 0) {
      holdAccum = Math.max(0, holdAccum - dt * 3.5);
      if (holdAccum < 40) holdAccum = 0;
      setProgress(holdAccum / HOLD_MS);
    }
  }

  rafId = requestAnimationFrame(loop);
}

// ── CTA ──
ctaBtn.addEventListener('click', async () => {
  playTap();
  haptic(10);

  if (mode === 'locked') {
    ctaBtn.disabled = true;
    ctaBtn.classList.add('loading');
    ctaLabel.textContent = 'Opening camera…';
    await enterChallenge();
    ctaBtn.classList.remove('loading');
    if (mode === 'challenge') ctaBtn.disabled = false;
  } else if (mode === 'success') {
    // Soft reset — keep camera warm for quick re-takes
    fx.clear();
    holdAccum = 0;
    setProgress(0);
    setMood('judgy', 'judgy');
    enterChallenge();
  }
});

// Success secondary: exit cleanly back to locked
doneBtn.addEventListener('click', () => {
  playTap();
  haptic(8);
  fx.clear();
  stopCamera(video);
  cameraReady = false;
  enterLocked();
  say(pickLine('judgy'), true);
});

// Visibility: pause when backgrounded
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
  } else if (mode === 'challenge') {
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  }
});

// Boot
enterLocked();
say(pickLine('judgy'), true);

// Idle sass while locked
setInterval(() => {
  if (mode === 'locked' && document.visibilityState === 'visible') {
    say(pickLine('judgy'));
  }
}, 4200);

// Cleanup
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(rafId);
  stopCamera(video);
});
