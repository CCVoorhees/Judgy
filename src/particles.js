/**
 * Ambient floating shapes + confetti burst for success.
 */

const NEON = ['#c44dff', '#ff2d95', '#39ff14', '#00f0ff', '#ffea00', '#ff6b35'];

export function createAmbient(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let particles = [];
  let raf = 0;
  let running = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(n = 28) {
    particles = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.15 - Math.random() * 0.35,
      a: 0.15 + Math.random() * 0.35,
      color: NEON[Math.floor(Math.random() * NEON.length)],
      shape: Math.random() > 0.55 ? 'circle' : 'diamond',
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.02,
    }));
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.lineTo(p.r, 0);
        ctx.lineTo(0, p.r);
        ctx.lineTo(-p.r, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    resize();
    spawn();
    running = true;
    cancelAnimationFrame(raf);
    tick();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, w, h);
  }

  window.addEventListener('resize', () => {
    resize();
    if (particles.length === 0) spawn();
  });

  return { start, stop, resize };
}

export function createFX(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let bits = [];
  let raf = 0;
  let running = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst(cx = w / 2, cy = h * 0.42, count = 90) {
    resize();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 10;
      bits.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        g: 0.12 + Math.random() * 0.12,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        r: 2 + Math.random() * 5,
        color: NEON[Math.floor(Math.random() * NEON.length)],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.25,
        type: Math.random() > 0.4 ? 'rect' : 'circle',
      });
    }
    if (!running) {
      running = true;
      tick();
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    if (bits.length === 0) {
      running = false;
      return;
    }
    bits = bits.filter((p) => p.life > 0);
    for (const p of bits) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.99;
      p.life -= p.decay;
      p.rot += p.spin;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(tick);
  }

  function clear() {
    bits = [];
    running = false;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, w, h);
  }

  window.addEventListener('resize', resize);

  return { burst, clear, resize };
}
