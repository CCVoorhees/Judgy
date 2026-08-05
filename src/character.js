/**
 * Judgy character — expressive SVG gremlin with emotional states.
 */

const STATES = {
  judgy: {
    body: '#b84dff',
    belly: '#d4a0ff',
    eyeScale: 1,
    browL: 'M28 36 Q36 32 44 38',
    browR: 'M56 38 Q64 32 72 36',
    mouth: 'M42 62 Q50 58 58 62',
    armL: { x1: 22, y1: 70, x2: 10, y2: 78, x3: 14, y3: 88 },
    armR: { x1: 78, y1: 70, x2: 90, y2: 78, x3: 86, y3: 88 },
    pose: 'arms-crossed',
  },
  watching: {
    body: '#a33dff',
    belly: '#c990ff',
    eyeScale: 1.12,
    browL: 'M28 34 Q36 30 44 36',
    browR: 'M56 36 Q64 30 72 34',
    mouth: 'M44 64 Q50 66 56 64',
    armL: { x1: 24, y1: 72, x2: 8, y2: 62, x3: 6, y3: 52 },
    armR: { x1: 76, y1: 72, x2: 92, y2: 62, x3: 94, y3: 52 },
    pose: 'lean',
  },
  encouraging: {
    body: '#c44dff',
    belly: '#e0b0ff',
    eyeScale: 1.05,
    browL: 'M28 38 Q36 34 44 38',
    browR: 'M56 38 Q64 34 72 38',
    mouth: 'M40 62 Q50 70 60 62',
    armL: { x1: 24, y1: 72, x2: 12, y2: 80, x3: 8, y3: 92 },
    armR: { x1: 76, y1: 72, x2: 88, y2: 80, x3: 92, y3: 92 },
    pose: 'nod',
  },
  disappointed: {
    body: '#8a3ad4',
    belly: '#b888e8',
    eyeScale: 0.92,
    browL: 'M28 40 Q36 44 44 40',
    browR: 'M56 40 Q64 44 72 40',
    mouth: 'M42 66 Q50 60 58 66',
    armL: { x1: 24, y1: 74, x2: 14, y2: 90, x3: 18, y3: 96 },
    armR: { x1: 76, y1: 74, x2: 86, y2: 90, x3: 82, y3: 96 },
    pose: 'sigh',
  },
  celebrating: {
    body: '#ff2d95',
    belly: '#ff9ed0',
    eyeScale: 1.2,
    browL: 'M28 32 Q36 28 44 34',
    browR: 'M56 34 Q64 28 72 32',
    mouth: 'M38 60 Q50 76 62 60',
    armL: { x1: 26, y1: 58, x2: 14, y2: 28, x3: 10, y3: 18 },
    armR: { x1: 74, y1: 58, x2: 86, y2: 28, x3: 90, y3: 18 },
    pose: 'celebrate',
  },
};

function armPath(a) {
  return `M${a.x1} ${a.y1} Q${a.x2} ${a.y2} ${a.x3} ${a.y3}`;
}

export function buildCharacterSVG() {
  return `
  <svg class="judgy-svg" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#e8b8ff"/>
        <stop offset="55%" stop-color="#b84dff"/>
        <stop offset="100%" stop-color="#5a1a9a"/>
      </radialGradient>
      <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffe8ff"/>
        <stop offset="100%" stop-color="#d4a0ff"/>
      </radialGradient>
      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.6" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="eyeShine">
        <feGaussianBlur stdDeviation="0.4"/>
      </filter>
    </defs>

    <!-- Legs -->
    <g class="legs">
      <ellipse class="leg leg-l" cx="38" cy="98" rx="9" ry="7" fill="#6b28b0" stroke="#1a0a2e" stroke-width="2.5"/>
      <ellipse class="leg leg-r" cx="62" cy="98" rx="9" ry="7" fill="#6b28b0" stroke="#1a0a2e" stroke-width="2.5"/>
    </g>

    <!-- Arms (behind body for crossed feel via order swap in CSS/state) -->
    <g class="arms">
      <path class="arm arm-l" d="M24 70 Q10 78 14 88" fill="none" stroke="#9a3de0" stroke-width="8" stroke-linecap="round"/>
      <path class="arm arm-r" d="M76 70 Q90 78 86 88" fill="none" stroke="#9a3de0" stroke-width="8" stroke-linecap="round"/>
      <circle class="hand hand-l" cx="14" cy="88" r="6" fill="#c44dff" stroke="#1a0a2e" stroke-width="2"/>
      <circle class="hand hand-r" cx="86" cy="88" r="6" fill="#c44dff" stroke="#1a0a2e" stroke-width="2"/>
    </g>

    <!-- Body -->
    <g class="body-group" filter="url(#softGlow)">
      <ellipse class="body" cx="50" cy="62" rx="34" ry="32" fill="url(#bodyGrad)" stroke="#1a0a2e" stroke-width="3"/>
      <ellipse class="belly" cx="50" cy="70" rx="18" ry="14" fill="url(#bellyGrad)" opacity="0.9"/>
      <!-- Cheek freckles -->
      <circle cx="30" cy="58" r="1.4" fill="#ff6bcb" opacity="0.7"/>
      <circle cx="34" cy="61" r="1" fill="#ff6bcb" opacity="0.5"/>
      <circle cx="70" cy="58" r="1.4" fill="#ff6bcb" opacity="0.7"/>
      <circle cx="66" cy="61" r="1" fill="#ff6bcb" opacity="0.5"/>
    </g>

    <!-- Ears / horns -->
    <g class="ears">
      <path d="M22 42 Q14 22 28 34" fill="#b84dff" stroke="#1a0a2e" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M78 42 Q86 22 72 34" fill="#b84dff" stroke="#1a0a2e" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M24 38 Q18 28 26 34" fill="#ff2d95" opacity="0.55"/>
      <path d="M76 38 Q82 28 74 34" fill="#ff2d95" opacity="0.55"/>
    </g>

    <!-- Face -->
    <g class="face">
      <!-- Brows -->
      <path class="brow brow-l" d="M28 36 Q36 32 44 38" fill="none" stroke="#1a0a2e" stroke-width="3" stroke-linecap="round"/>
      <path class="brow brow-r" d="M56 38 Q64 32 72 36" fill="none" stroke="#1a0a2e" stroke-width="3" stroke-linecap="round"/>

      <!-- Eyes -->
      <g class="eye eye-l">
        <ellipse class="eye-white" cx="36" cy="48" rx="9" ry="10" fill="#fff" stroke="#1a0a2e" stroke-width="2.5"/>
        <circle class="pupil" cx="37" cy="50" r="4.5" fill="#1a0a2e"/>
        <circle class="shine" cx="39.5" cy="47" r="1.8" fill="#fff"/>
      </g>
      <g class="eye eye-r">
        <ellipse class="eye-white" cx="64" cy="48" rx="9" ry="10" fill="#fff" stroke="#1a0a2e" stroke-width="2.5"/>
        <circle class="pupil" cx="65" cy="50" r="4.5" fill="#1a0a2e"/>
        <circle class="shine" cx="67.5" cy="47" r="1.8" fill="#fff"/>
      </g>

      <!-- Mouth -->
      <path class="mouth" d="M42 62 Q50 58 58 62" fill="none" stroke="#1a0a2e" stroke-width="2.8" stroke-linecap="round"/>

      <!-- Smug cheek puff (optional accent) -->
      <ellipse class="cheek cheek-l" cx="26" cy="56" rx="4" ry="3" fill="#ff2d95" opacity="0.25"/>
      <ellipse class="cheek cheek-r" cx="74" cy="56" rx="4" ry="3" fill="#ff2d95" opacity="0.25"/>
    </g>

    <!-- Sparkle accents for celebrate (toggled via CSS) -->
    <g class="sparkles" opacity="0">
      <circle cx="12" cy="30" r="2" fill="#39ff14"/>
      <circle cx="88" cy="28" r="2.5" fill="#00f0ff"/>
      <circle cx="50" cy="12" r="2" fill="#ffea00"/>
      <circle cx="18" cy="55" r="1.5" fill="#ff2d95"/>
      <circle cx="82" cy="55" r="1.5" fill="#c44dff"/>
    </g>
  </svg>`;
}

export function setCharacterState(root, stateName) {
  const state = STATES[stateName] || STATES.judgy;
  root.dataset.state = stateName;

  const browL = root.querySelector('.brow-l');
  const browR = root.querySelector('.brow-r');
  const mouth = root.querySelector('.mouth');
  const armL = root.querySelector('.arm-l');
  const armR = root.querySelector('.arm-r');
  const handL = root.querySelector('.hand-l');
  const handR = root.querySelector('.hand-r');
  const body = root.querySelector('.body');
  const belly = root.querySelector('.belly');
  const eyes = root.querySelectorAll('.eye');
  const sparkles = root.querySelector('.sparkles');

  if (browL) browL.setAttribute('d', state.browL);
  if (browR) browR.setAttribute('d', state.browR);
  if (mouth) {
    mouth.setAttribute('d', state.mouth);
    // Open mouth fill for celebrate
    if (stateName === 'celebrating') {
      mouth.setAttribute('fill', '#1a0a2e');
    } else {
      mouth.setAttribute('fill', 'none');
    }
  }
  if (armL) armL.setAttribute('d', armPath(state.armL));
  if (armR) armR.setAttribute('d', armPath(state.armR));
  if (handL) {
    handL.setAttribute('cx', state.armL.x3);
    handL.setAttribute('cy', state.armL.y3);
  }
  if (handR) {
    handR.setAttribute('cx', state.armR.x3);
    handR.setAttribute('cy', state.armR.y3);
  }
  if (body) body.setAttribute('fill', state.body);
  if (belly) belly.setAttribute('fill', state.belly);

  eyes.forEach((eye) => {
    eye.style.transform = `scale(${state.eyeScale})`;
    eye.style.transformOrigin = eye.classList.contains('eye-l') ? '36px 48px' : '64px 48px';
  });

  if (sparkles) {
    sparkles.setAttribute('opacity', stateName === 'celebrating' ? '1' : '0');
  }
}

export const LINES = {
  judgy: ['Prove it.', "I'm waiting…", 'Vibe check time.', 'Make it count.'],
  watching: ['Hmm…', 'I see you.', "Don't fake it.", 'Eyes on you.'],
  encouraging: ['Okay… not terrible.', 'Keep going.', 'Almost.', "That's the energy."],
  disappointed: ["That's it? Do better.", 'Arms higher.', 'Come onnn.', 'I expected more.'],
  celebrating: ['FINE. You’re in.', 'YESSS let’s gooo', 'Okay okay I get it!', 'You earned it.'],
  ready: ["I'm ready when you are.", 'Show me the pose.', 'Two arms. Straight up.'],
  holding: ['Hold it…', 'Don’t drop it.', 'Stayyyy…', 'Almost there…'],
  reset: ['Dropped it. Rude.', 'Again.', 'Focus.', 'Reset. Do better.'],
};

export function pickLine(key) {
  const list = LINES[key] || LINES.judgy;
  return list[Math.floor(Math.random() * list.length)];
}
