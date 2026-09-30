import { useRef, useEffect, useState, useMemo } from "react";
import gsap from "gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import TreeSVG from "../svg/TreeSVG";

/* ── Timing constants (edit hold time here) ── */
export const TREE_HOLD_SECONDS = 4.0;
const TREE_GROWTH_SECONDS = 8.0;
const FADE_TO_BLACK_SECONDS = 0.4;

/**
 * Scene 2 — Magic Tree (12.4 s total)
 *
 * Timing:
 *   - Growth: 8.0 s (tree-grow.mp4 duration / SVG growth)
 *   - Hold:   4.0 s (TREE_HOLD_SECONDS)
 *   - Fade:   0.4 s (12.0 s - 12.4 s to pure black)
 *   - Total:  12.4 s -> onComplete fires Scene 3
 *
 * Visuals:
 *   - Plum background (#2B0A1A) with soft glowing ground and drifting stars.
 *   - Main visual: /assets/videos/tree-grow.mp4 (mix-blend-mode: screen, transparent black).
 *     Holds the last frame after ending. Starts immediately with Scene 2.
 *   - Overlay: /assets/videos/petals-loop.mp4 (mix-blend-mode: screen, 60% opacity).
 *     If FPS drops under 40 for 2 s, petals video is removed and canvas petals are used instead.
 *   - Fallback: if tree-grow.mp4 fails or prefers-reduced-motion is on, TreeSVG is displayed.
 */
export default function TreeScene({ onComplete, particleRef }) {
  const containerRef = useRef(null);
  const treeVideoRef = useRef(null);
  const petalsVideoRef = useRef(null);
  const blackOverlayRef = useRef(null);
  const groundGlowRef = useRef(null);
  const starsWrapRef = useRef(null);

  const [videoFailed, setVideoFailed] = useState(false);
  const [usePetalsVideo, setUsePetalsVideo] = useState(true);
  const [treeLoaded, setTreeLoaded] = useState(false);

  const prefersReduced = useReducedMotion();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  /* 20 drifting stars generated once */
  const stars = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: (i * 17 + 7) % 96 + 2,
        y: (i * 23 + 11) % 65 + 5,
        size: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5,
        opacity: 0.25 + ((i * 13) % 45) / 100,
        dur: 2.5 + (i % 4) * 0.8,
      })),
    [],
  );

  /* ── Video Autoplay & Error Handling ── */
  useEffect(() => {
    if (prefersReduced) return;

    if (treeVideoRef.current && !videoFailed) {
      const v = treeVideoRef.current;
      v.muted = true;
      v.playsInline = true;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          /* Fallback gracefully without console error */
          setVideoFailed(true);
        });
      }
    }

    if (petalsVideoRef.current && usePetalsVideo) {
      const pv = petalsVideoRef.current;
      pv.muted = true;
      pv.playsInline = true;
      const playPromise = pv.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setUsePetalsVideo(false);
        });
      }
    }
  }, [prefersReduced, videoFailed, usePetalsVideo]);

  /* ── FPS Monitor: drop video petals if under 40fps for 2s ── */
  useEffect(() => {
    if (prefersReduced || !usePetalsVideo) return;

    let rafId;
    let lastTime = performance.now();
    let lowFpsStart = null;
    let petalInterval = null;

    const emitCanvasPetals = () => {
      if (particleRef?.current) {
        particleRef.current.emit({
          x: Math.random() * window.innerWidth,
          y: -10,
          count: 2,
          spread: window.innerWidth * 0.7,
          speed: 1.5,
          gravity: 0.04,
          types: ["heart", "dot"],
          colors: ["#FFE4EC", "#FF6FA5", "#FF94BA"],
          sizeRange: [3, 8],
          life: 4.5,
          initAlpha: 0.75,
        });
      }
    };

    const checkFps = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (dt > 0) {
        const fps = 1 / dt;
        if (fps < 40) {
          if (!lowFpsStart) lowFpsStart = now;
          else if (now - lowFpsStart > 2000) {
            setUsePetalsVideo(false);
            if (!petalInterval) {
              petalInterval = setInterval(emitCanvasPetals, 350);
            }
            return;
          }
        } else {
          lowFpsStart = null;
        }
      }
      rafId = requestAnimationFrame(checkFps);
    };

    rafId = requestAnimationFrame(checkFps);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (petalInterval) clearInterval(petalInterval);
    };
  }, [prefersReduced, usePetalsVideo, particleRef]);

  /* ── Master Scene 2 Timeline (12.4 s total) ── */
  useEffect(() => {
    const done = () => onCompleteRef.current?.();

    const ctx = gsap.context(() => {
      /* Reduced motion path: show static tree, gentle ground glow, exit to black after hold */
      if (prefersReduced) {
        const tl = gsap.timeline({ onComplete: done });
        tl.fromTo(
          groundGlowRef.current,
          { opacity: 0 },
          { opacity: 0.7, duration: 1.2, ease: "power2.out" },
          0,
        );
        tl.fromTo(
          blackOverlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: FADE_TO_BLACK_SECONDS, ease: "power2.in" },
          TREE_HOLD_SECONDS + 2.0,
        );
        return;
      }

      /* Full motion timeline: growth (8.0s) + hold (4.0s) + fade (0.4s) = 12.4s total */
      const tl = gsap.timeline({ onComplete: done });

      /* Ground glow fades in */
      tl.fromTo(
        groundGlowRef.current,
        { opacity: 0 },
        { opacity: 0.85, duration: 2.0, ease: "power2.out" },
        0.2,
      );

      /* Drifting stars subtle pulse */
      if (starsWrapRef.current) {
        tl.fromTo(
          starsWrapRef.current,
          { opacity: 0 },
          { opacity: 0.7, duration: 2.5, ease: "power2.out" },
          0.4,
        );
      }

      /* Fade to pure black for 0.4 s after tree growth + hold, then advance to Scene 3 */
      const fadeStartTime = TREE_GROWTH_SECONDS + TREE_HOLD_SECONDS; // 8.0 + 4.0 = 12.0s
      tl.fromTo(
        blackOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: FADE_TO_BLACK_SECONDS, ease: "power2.in" },
        fadeStartTime,
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [prefersReduced]);

  const showFallback = prefersReduced || videoFailed;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-deep-plum overflow-hidden flex items-center justify-center select-none"
    >
      {/* ── Drifting Stars ── */}
      <div
        ref={starsWrapRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0 }}
      >
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animation: `pulse ${s.dur}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Glowing Ground Atmosphere ── */}
      <div
        ref={groundGlowRef}
        className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none flex justify-center items-end"
        style={{ opacity: 0 }}
      >
        <div
          className="w-[85vw] max-w-2xl h-28 rounded-full bg-gradient-to-t from-rose/30 via-hot-pink/15 to-transparent blur-3xl"
        />
      </div>

      {/* ── Main Tree Visual ── */}
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <TreeSVG className="max-w-[480px] w-full" />
        </div>
      ) : (
        <video
          ref={treeVideoRef}
          src="/assets/videos/tree-grow.mp4"
          muted
          playsInline
          loop={false}
          onLoadedData={() => setTreeLoaded(true)}
          onError={() => setVideoFailed(true)}
          onEnded={() => {
            if (treeVideoRef.current) {
              treeVideoRef.current.pause();
            }
          }}
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 90% at 50% 50%, black 55%, transparent 95%)",
            maskImage:
              "radial-gradient(ellipse 85% 90% at 50% 50%, black 55%, transparent 95%)",
          }}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen transition-opacity duration-700 ${
            treeLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* ── Petals Loop Video Overlay ── */}
      {!prefersReduced && usePetalsVideo && (
        <video
          ref={petalsVideoRef}
          src="/assets/videos/petals-loop.mp4"
          muted
          playsInline
          loop
          onError={() => setUsePetalsVideo(false)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen opacity-60 z-20"
        />
      )}

      {/* ── Black Overlay (0.4 s cut to Scene 3) ── */}
      <div
        ref={blackOverlayRef}
        className="absolute inset-0 bg-black pointer-events-none z-30"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
