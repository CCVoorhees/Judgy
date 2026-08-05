# Judgy

A mobile-first web demo: a judgmental little gremlin locks the screen until you pass a camera vibe check — raise both arms and hold the victory pose.

Built for short-form video energy (TikTok / YouTube Shorts): neon, snappy, and shareable.

## Run

```bash
npm install
npm run dev
```

Open the local URL on your phone (same Wi‑Fi) or use Chrome DevTools device mode. **Camera requires HTTPS or localhost.**

```bash
npm run build   # production build → dist/
npm run preview # preview production build
```

## How it works

1. **Locked** — full-screen character refuses entry  
2. **Challenge** — front camera + on-device MediaPipe pose detection  
3. **Hold** — both arms straight up for ~2.8s fills the progress ring  
4. **Unlocked** — celebration, confetti, try-again for another take  

Pose detection runs entirely on-device via `@mediapipe/tasks-vision`. No video is uploaded.

## Stack

- Vite + vanilla JS  
- MediaPipe Pose Landmarker (lite)  
- Web Audio stingers + `navigator.vibrate` haptics  
- SVG character with emotional states  

## Notes

- Best on a real phone with good lighting  
- Allow camera permission when prompted  
- Desktop works with a webcam for testing  
