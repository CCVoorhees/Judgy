/**
 * On-device pose detection via MediaPipe Pose Landmarker.
 * Detects both-arms-up victory pose.
 */

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// MediaPipe Pose landmark indices
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;
const NOSE = 0;

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

let landmarker = null;
let lastVideoTime = -1;
let ready = false;

export async function initPose() {
  if (landmarker) return landmarker;

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = {
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };

  try {
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    });
  } catch {
    // Some mobile browsers reject GPU delegate — fall back to CPU
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
    });
  }
  ready = true;
  return landmarker;
}

export function isPoseReady() {
  return ready;
}

/**
 * Returns { armsUp: boolean, score: 0-1, visible: boolean, detail }
 * score is continuous quality of the pose (for soft feedback).
 */
export function detectArmsUp(video) {
  if (!landmarker || !video || video.readyState < 2) {
    return { armsUp: false, score: 0, visible: false, detail: 'no-video' };
  }

  const now = performance.now();
  // Avoid re-running on the exact same frame
  if (video.currentTime === lastVideoTime) {
    return detectArmsUp._last || { armsUp: false, score: 0, visible: false, detail: 'same-frame' };
  }
  lastVideoTime = video.currentTime;

  let result;
  try {
    result = landmarker.detectForVideo(video, now);
  } catch {
    return { armsUp: false, score: 0, visible: false, detail: 'detect-error' };
  }

  const pose = result.landmarks?.[0];
  if (!pose) {
    const out = { armsUp: false, score: 0, visible: false, detail: 'no-pose' };
    detectArmsUp._last = out;
    return out;
  }

  const ls = pose[L_SHOULDER];
  const rs = pose[R_SHOULDER];
  const le = pose[L_ELBOW];
  const re = pose[R_ELBOW];
  const lw = pose[L_WRIST];
  const rw = pose[R_WRIST];
  const nose = pose[NOSE];

  // Visibility / presence (MediaPipe uses visibility when available)
  const vis = (p) => (p.visibility ?? 1) > 0.4;
  const bodyVisible = vis(ls) && vis(rs) && vis(lw) && vis(rw);

  if (!bodyVisible) {
    const out = { armsUp: false, score: 0, visible: false, detail: 'partial' };
    detectArmsUp._last = out;
    return out;
  }

  // In image coords, y increases downward. Arms up = wrists above shoulders (and ideally near/above head).
  const shoulderY = (ls.y + rs.y) / 2;
  const headY = nose?.y ?? shoulderY - 0.15;

  // How far above shoulder each wrist is (positive = above)
  const leftLift = shoulderY - lw.y;
  const rightLift = shoulderY - rw.y;

  // Elbows should also be elevated (not hanging)
  const leftElbowLift = shoulderY - le.y;
  const rightElbowLift = shoulderY - re.y;

  // Wrists should be roughly lateral or outward, not crossed tightly in front
  // Prefer wrists above head-ish for "straight up"
  const leftAboveHead = headY - lw.y;
  const rightAboveHead = headY - rw.y;

  // Score components 0..1
  const liftScore = clamp01((Math.min(leftLift, rightLift) - 0.05) / 0.25);
  const elbowScore = clamp01((Math.min(leftElbowLift, rightElbowLift) + 0.05) / 0.2);
  const headScore = clamp01((Math.min(leftAboveHead, rightAboveHead) + 0.08) / 0.2);

  // Both sides reasonably symmetric
  const symmetry = 1 - clamp01(Math.abs(leftLift - rightLift) / 0.2);
  const score = clamp01(liftScore * 0.5 + elbowScore * 0.2 + headScore * 0.2 + symmetry * 0.1);

  // Hard threshold for "arms up" hold progress
  const armsUp =
    leftLift > 0.12 &&
    rightLift > 0.12 &&
    leftElbowLift > 0.02 &&
    rightElbowLift > 0.02 &&
    score >= 0.55;

  const out = {
    armsUp,
    score,
    visible: true,
    detail: armsUp ? 'arms-up' : score > 0.3 ? 'partial-up' : 'down',
    leftLift,
    rightLift,
  };
  detectArmsUp._last = out;
  return out;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Prefer a natural front-camera FOV for upper-body pose work.
 * Avoid tall 9:16 "selfie zoom" ideals — many phones digitally crop to fill
 * those, which makes the user look extreme close-up and arms go off-frame.
 * A moderate 4:3 / landscape ideal keeps head + torso + raised arms visible
 * at a normal arm’s-length hold.
 */
export async function startCamera(videoEl) {
  const attempts = [
    {
      audio: false,
      video: {
        facingMode: { ideal: 'user' },
        // Landscape-ish ideal → wider FOV; CSS frame is portrait-rounded
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        aspectRatio: { ideal: 4 / 3 },
        frameRate: { ideal: 30, max: 30 },
      },
    },
    {
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 960 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
    },
    {
      audio: false,
      video: { facingMode: 'user' },
    },
  ];

  let lastErr;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      // Hint the browser we want the full uncropped stream displayed
      videoEl.setAttribute('playsinline', '');
      videoEl.playsInline = true;
      await videoEl.play();
      return stream;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Camera unavailable');
}

export function stopCamera(videoEl) {
  const stream = videoEl?.srcObject;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  }
}
