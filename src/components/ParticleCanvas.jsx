import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

/* ── Shared heart Path2D (reused for every heart particle) ── */
const HEART_PATH = new Path2D(
  "M50 90C25 72 5 54 5 36 5 22 16 11 30 11c8 0 16 4 20 11 4-7 12-11 20-11 14 0 25 11 25 25 0 18-20 36-45 54Z",
);

/**
 * Shared particle canvas.
 *
 * Imperative API exposed via ref:
 *   emit(config)  — spawn particles
 *   clear()       — remove all particles
 *   stop()        — stop the draw loop and clear
 *
 * One rAF loop that automatically stops when no particles remain.
 * FPS is monitored; if it stays under 40 for 2 s the particle cap is halved.
 */
const ParticleCanvas = forwardRef(function ParticleCanvas(
  { className = "" },
  ref,
) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const lastTimeRef = useRef(0);
  const fpsSamplesRef = useRef([]);
  const maxParticlesRef = useRef(
    typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 120,
  );

  const dprRef = useRef(1);

  /* ── drawing helpers ── */
  const drawHeart = useCallback((ctx, x, y, size, color, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const s = size / 100; // path is in a 100×100 box
    ctx.translate(x - size / 2, y - size / 2);
    ctx.scale(s, s);
    ctx.fill(HEART_PATH);
    ctx.restore();
  }, []);

  const drawDot = useCallback((ctx, x, y, size, color, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  /* ── tick ── */
  const tick = useCallback(
    (timestamp) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      /* delta time (capped to avoid huge jumps after tab-switch) */
      const dt = lastTimeRef.current
        ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
        : 1 / 60;
      lastTimeRef.current = timestamp;

      /* ── fps monitoring ── */
      if (dt > 0) {
        const fps = 1 / dt;
        fpsSamplesRef.current.push({ t: timestamp, fps });
        const cutoff = timestamp - 2000;
        fpsSamplesRef.current = fpsSamplesRef.current.filter(
          (s) => s.t > cutoff,
        );
        if (fpsSamplesRef.current.length > 30) {
          const avg =
            fpsSamplesRef.current.reduce((sum, s) => sum + s.fps, 0) /
            fpsSamplesRef.current.length;
          if (avg < 40) {
            maxParticlesRef.current = Math.max(
              15,
              Math.floor(maxParticlesRef.current / 2),
            );
            fpsSamplesRef.current = [];
            /* cull excess */
            const excess =
              particlesRef.current.length - maxParticlesRef.current;
            if (excess > 0) particlesRef.current.splice(0, excess);
          }
        }
      }

      /* ── update & draw ── */
      const dpr = dprRef.current;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const parts = particlesRef.current;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.vy += p.gravity * dt * 60;
        p.life -= dt;
        p.alpha = Math.max(0, (p.life / p.totalLife) * p.initAlpha);

        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }

        if (p.type === "heart") {
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha);
        } else {
          drawDot(ctx, p.x, p.y, p.size, p.color, p.alpha);
        }
      }

      ctx.restore();

      if (parts.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
      }
    },
    [drawHeart, drawDot],
  );

  /* ── public helpers ── */
  const startLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const emit = useCallback(
    (config) => {
      const {
        x,
        y,
        count,
        spread = 20,
        speed = 3,
        gravity = 0.12,
        types = ["heart", "dot"],
        colors = ["#FF6FA5", "#FF2E7E", "#FFE4EC", "#ffffff"],
        sizeRange = [4, 12],
        life = 2.5,
        initAlpha = 1,
      } = config;

      const max = maxParticlesRef.current;
      const room = Math.max(0, max - particlesRef.current.length);
      const n = Math.min(count, room);

      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = speed * (0.4 + Math.random() * 0.6);
        const type = types[Math.floor(Math.random() * types.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size =
          sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
        const totalLife = life * (0.5 + Math.random() * 0.5);

        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * spread,
          y: y + (Math.random() - 0.5) * spread,
          vx: Math.cos(angle) * vel,
          vy: Math.sin(angle) * vel - speed * 0.3,
          gravity,
          size,
          alpha: initAlpha,
          initAlpha,
          type,
          color,
          life: totalLife,
          totalLife,
        });
      }

      startLoop();
    },
    [startLoop],
  );

  const clear = useCallback(() => {
    particlesRef.current = [];
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    runningRef.current = false;
    clear();
  }, [clear]);

  useImperativeHandle(ref, () => ({ emit, clear, stop }), [emit, clear, stop]);

  /* ── resize ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      maxParticlesRef.current = window.innerWidth < 768 ? 60 : 120;
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      stop();
    };
  }, [stop]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
});

export default ParticleCanvas;
