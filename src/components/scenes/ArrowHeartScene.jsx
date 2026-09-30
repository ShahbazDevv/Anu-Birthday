import { useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { copy } from "../../content/copy";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import Heart from "../svg/Heart";
import Arrow from "../svg/Arrow";

/**
 * Scene 1 — Arrow & Heart (~5.6 s)
 *
 * Timeline (full motion):
 *   0.0        heart appears, starts pulsing
 *   0.3-1.0    heartOverlay text fades in
 *   1.0-1.8    heartOverlay text fades out (must be gone before arrow hits)
 *   0.8-2.2    arrow flies in from left on slight curve
 *   2.2        impact — 60 ms freeze, heart shake, white flash 30 %
 *   ~2.4       heart bursts into particles (60 mobile / 120 desktop)
 *   2.4-4.9    particles fade (light gravity, 2.5 s)
 *   4.8-5.6    scene fades out → onComplete
 *
 * Reduced motion: heart + text shown with fades, no arrow / particles.
 */
export default function ArrowHeartScene({ onComplete, particleRef }) {
  const containerRef = useRef(null);
  const heartWrapRef = useRef(null);
  const heartInnerRef = useRef(null);
  const arrowWrapRef = useRef(null);
  const textRef = useRef(null);
  const flashRef = useRef(null);
  const pulseRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 768,
    [],
  );

  useEffect(() => {
    const done = () => onCompleteRef.current?.();

    const ctx = gsap.context(() => {
      /* ─────────────────────────────────
       *  REDUCED-MOTION
       * ───────────────────────────────── */
      if (prefersReduced) {
        const tl = gsap.timeline({ onComplete: done });
        tl.fromTo(
          heartWrapRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          0,
        );
        tl.fromTo(
          textRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          0.3,
        );
        tl.to(textRef.current, { opacity: 0, duration: 0.5 }, 1.3);
        tl.set(textRef.current, { display: "none" }, 1.8);
        tl.to(heartWrapRef.current, { opacity: 0, duration: 0.6 }, 2.5);
        tl.to(containerRef.current, { opacity: 0, duration: 0.8 }, 3.2);
        return;
      }

      /* ─────────────────────────────────
       *  FULL-MOTION (~5.6 s)
       * ───────────────────────────────── */
      const tl = gsap.timeline({ onComplete: done });

      /* Heart appears */
      tl.set(heartWrapRef.current, { opacity: 1 }, 0);

      /* Start pulse (separate tween, killed on impact) */
      pulseRef.current = gsap.to(heartInnerRef.current, {
        scale: 1.06,
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut",
      });

      /* 0.3 s — heartOverlay text fades in */
      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        0.3,
      );

      /* 1.0 s — text fades out (fully gone by 1.8 s) */
      tl.to(
        textRef.current,
        { opacity: 0, duration: 0.8, ease: "power2.in" },
        1.0,
      );
      tl.set(textRef.current, { display: "none" }, 1.8);

      /* 0.8 s — arrow enters */
      tl.set(arrowWrapRef.current, { opacity: 1 }, 0.8);

      /* x: accelerating flight from left */
      tl.fromTo(
        arrowWrapRef.current,
        { x: -window.innerWidth * 0.75 },
        { x: 0, duration: 1.4, ease: "power3.in" },
        0.8,
      );

      /* y: slight upward curve (different ease → arc) */
      tl.fromTo(
        arrowWrapRef.current,
        { y: 25 },
        { y: 0, duration: 1.4, ease: "sine.out" },
        0.8,
      );

      /* ── 2.2 s — IMPACT ── */
      const hit = 2.2;

      /* hide arrow */
      tl.set(arrowWrapRef.current, { opacity: 0 }, hit);

      /* kill pulse, reset scale */
      tl.call(
        () => {
          pulseRef.current?.kill();
          pulseRef.current = null;
        },
        [],
        hit,
      );
      tl.set(heartInnerRef.current, { scale: 1 }, hit);

      /* 60 ms freeze (2.20 s - 2.26 s) */

      /* 2.26 s — heart shake */
      tl.to(
        heartInnerRef.current,
        {
          x: 5,
          duration: 0.03,
          yoyo: true,
          repeat: 5,
          ease: "power1.inOut",
        },
        hit + 0.06,
      );

      /* 2.26 s — white flash at 30 % */
      tl.fromTo(
        flashRef.current,
        { opacity: 0 },
        { opacity: 0.3, duration: 0.06, yoyo: true, repeat: 1 },
        hit + 0.06,
      );

      /* ── ~2.44 s — BURST ── */
      const burst = hit + 0.24;

      /* shrink + hide heart */
      tl.to(
        heartInnerRef.current,
        { scale: 0, opacity: 0, duration: 0.15, ease: "power2.in" },
        burst,
      );

      /* emit particles on the shared canvas */
      tl.call(
        () => {
          const el = heartWrapRef.current;
          if (!el || !particleRef?.current) return;
          const rect = el.getBoundingClientRect();
          particleRef.current.emit({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            count: isMobile ? 60 : 120,
            spread: 40,
            speed: 4.5,
            gravity: 0.12,
            types: ["heart", "dot"],
            colors: ["#FF6FA5", "#FF2E7E", "#FFE4EC", "#ffffff"],
            sizeRange: [4, 14],
            life: 2.5,
          });
        },
        [],
        burst,
      );

      /* 4.8 s — fade out the scene bg (particles live on shared canvas above) */
      tl.to(
        containerRef.current,
        { opacity: 0, duration: 0.8, ease: "power2.inOut" },
        4.8,
      );
    }, containerRef);

    return () => {
      pulseRef.current?.kill();
      ctx.revert();
    };
  }, [prefersReduced, isMobile, particleRef]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-deep-plum overflow-hidden"
    >
      {/* ── Heart overlay text ── */}
      <p
        ref={textRef}
        className="absolute left-1/2 -translate-x-1/2 font-inter text-blush/70 tracking-wide text-center"
        style={{
          opacity: 0,
          top: "36%",
          fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
        }}
      >
        {copy.heartOverlay}
      </p>

      {/* ── Heart ── */}
      <div
        ref={heartWrapRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0 }}
      >
        <div ref={heartInnerRef}>
          <Heart
            className="text-hot-pink"
            style={{
              width: "clamp(5rem, 18vw, 9rem)",
              height: "clamp(5rem, 18vw, 9rem)",
              filter: "drop-shadow(0 0 24px rgba(255,46,126,0.5))",
            }}
          />
        </div>
      </div>

      {/* ── Arrow (positioned so its tip lands at exact heart center at x:0, y:0) ── */}
      <div
        ref={arrowWrapRef}
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div style={{ transform: "translate(-98.75%, -50%)" }}>
          <Arrow
            className="text-rose"
            style={{
              width: "clamp(6rem, 20vw, 10rem)",
              filter: "drop-shadow(0 0 12px rgba(255,111,165,0.4))",
            }}
          />
        </div>
      </div>

      {/* ── White flash overlay ── */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
