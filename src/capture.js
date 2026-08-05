/**
 * Capture a shareable success still from the live camera frame.
 * Draws a mirrored selfie + neon caption for TikTok-style vibes.
 */

const CAPTION = 'Passed the Judgy vibe check';
const FILENAME = 'judgy-vibe-check.jpg';

/**
 * @param {HTMLVideoElement} video
 * @returns {{ canvas: HTMLCanvasElement, dataUrl: string, blobPromise: Promise<Blob|null> } | null}
 */
export function captureSuccessStill(video) {
  if (!video || video.readyState < 2) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  // Cap output for share size / memory on mobile
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Mirror like the on-screen selfie preview
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();

  // Soft vignette
  const vig = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    h * 0.15,
    w * 0.5,
    h * 0.5,
    h * 0.72
  );
  vig.addColorStop(0, 'rgba(10,6,20,0)');
  vig.addColorStop(1, 'rgba(10,6,20,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Bottom caption bar
  const barH = Math.max(48, Math.round(h * 0.14));
  const grad = ctx.createLinearGradient(0, h - barH * 1.4, 0, h);
  grad.addColorStop(0, 'rgba(10,6,20,0)');
  grad.addColorStop(0.35, 'rgba(10,6,20,0.55)');
  grad.addColorStop(1, 'rgba(10,6,20,0.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - barH * 1.4, w, barH * 1.4);

  // Neon accent line
  ctx.fillStyle = '#ff2d95';
  ctx.shadowColor = 'rgba(255,45,149,0.8)';
  ctx.shadowBlur = 12;
  ctx.fillRect(0, h - barH * 1.4, w, 3);
  ctx.shadowBlur = 0;

  // Caption text
  const fontSize = Math.max(18, Math.round(w * 0.045));
  ctx.font = `800 ${fontSize}px Outfit, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(196,77,255,0.65)';
  ctx.shadowBlur = 10;
  ctx.fillText(CAPTION, w / 2, h - barH * 0.55);

  // Small brand tag
  ctx.shadowBlur = 0;
  ctx.font = `700 ${Math.max(11, Math.round(fontSize * 0.55))}px Outfit, system-ui, sans-serif`;
  ctx.fillStyle = '#39ff14';
  ctx.fillText('JUDGY', w / 2, h - barH * 0.22);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blobPromise = new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
  });

  return { canvas, dataUrl, blobPromise };
}

/**
 * Share via Web Share API (files when supported). Falls back to download.
 * @param {Blob} blob
 * @param {{ title?: string, text?: string }} meta
 */
export async function shareStill(blob, meta = {}) {
  const file = new File([blob], FILENAME, { type: blob.type || 'image/jpeg' });
  const payload = {
    title: meta.title || 'Judgy',
    text: meta.text || 'I passed the Judgy vibe check 🙌',
    files: [file],
  };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share(payload);
    return 'shared';
  }

  if (navigator.share) {
    // Some browsers share text/url only
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
      });
      // Still offer the file via download after text share on limited APIs
      downloadStill(blob);
      return 'shared-text';
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      downloadStill(blob);
      return 'downloaded';
    }
  }

  downloadStill(blob);
  return 'downloaded';
}

/** Trigger a file download of the still. */
export function downloadStill(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export { CAPTION, FILENAME };
