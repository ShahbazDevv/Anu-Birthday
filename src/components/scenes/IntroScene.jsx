import { useRef, useEffect } from "react";
import gsap from "gsap";
import { copy } from "../../content/copy";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Scene 0 — Intro / Age Reveal (~8 s)
 *
 * Timeline (full motion):
 *   0.0-0.6   pure black
 *   0.6-1.4   AGE_FROM fades in
 *   1.4-2.0   hold
 *   2.0-2.8   last digit slot-scrolls to AGE_TO
 *   2.8-3.3   tiny glow pulse
 *   3.3-4.7   zoom scale 1→40
 *   4.7-4.9   pink-white flash
 *   4.9       hard cut to deep plum
 *   4.9-6.2   two text lines fade + rise (0.5 s stagger)
 *   7.4-8.0   text fades out → onComplete
 *
 * Reduced motion: show AGE_TO with a simple fade, then text, then exit.
 */
export default function IntroScene({ onComplete }) {
  /* ── refs ── */
  const containerRef = useRef(null);
  const numberRef = useRef(null);
  const slotRef = useRef(null);
  const glowRef = useRef(null);
  const flashRef = useRef(null);
  const textBlockRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const prefersReduced = useReducedMotion();

  /* Stable callback ref so the timeline never captures a stale closure */
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  /* ── derived values ── */
  const { from, to } = copy.age;
  const fromStr = String(from);
  const toStr = String(to);
  const firstDigit = fromStr[0];
  const oldLastDigit = fromStr[fromStr.length - 1];
  const newLastDigit = toStr[toStr.length - 1];

  /* ── master effect — builds and plays the scene timeline ── */
  useEffect(() => {
    const done = () => onCompleteRef.current?.();

    const ctx = gsap.context(() => {
      /* ─────────────────────────────────
       *  REDUCED-MOTION PATH (~5.6 s)
       * ───────────────────────────────── */
      if (prefersReduced) {
        const tl = gsap.timeline({ onComplete: done });

        /* Show final age directly */
        gsap.set(slotRef.current, {
          y: () => -slotRef.current.children[0].offsetHeight,
        });

        /* 0.6 s — "24" fades in */
        tl.fromTo(
          numberRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1 },
          0.6,
        );

        /* 2.5 s — number fades out */
        tl.to(numberRef.current, { opacity: 0, duration: 0.5 }, 2.5);

        /* 3.0 s — switch to plum, show text */
        tl.set(containerRef.current, { backgroundColor: "#2B0A1A" }, 3.0);
        tl.set(numberRef.current, { display: "none" }, 3.0);
        tl.set(textBlockRef.current, { display: "flex" }, 3.0);
        tl.fromTo(
          [line1Ref.current, line2Ref.current],
          { opacity: 0 },
          { opacity: 1, duration: 1 },
          3.0,
        );

        /* 5.0 s — text fades out */
        tl.to(textBlockRef.current, { opacity: 0, duration: 0.6 }, 5.0);

        return; // done with reduced-motion branch
      }

      /* ─────────────────────────────────
       *  FULL-MOTION PATH (~8.0 s)
       * ───────────────────────────────── */
      const tl = gsap.timeline({ onComplete: done });

      /* 0.6–1.4 s  Number "23" fades in */
      tl.fromTo(
        numberRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" },
        0.6,
      );

      /* 2.0–2.8 s  Slot-machine scroll on last digit */
      tl.to(
        slotRef.current,
        {
          y: () => -slotRef.current.children[0].offsetHeight,
          duration: 0.8,
          ease: "power3.inOut",
        },
        2.0,
      );

      /* 2.8 s  Hide old digit — prevents sub-pixel leak at 40× zoom */
      tl.set(slotRef.current.children[0], { autoAlpha: 0 }, 2.8);

      /* 2.8–3.3 s  Tiny glow pulse behind number */
      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 0.5,
          scale: 1.15,
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        },
        2.8,
      );

      /* 3.3–4.7 s  Zoom 1 → 40 */
      tl.to(
        numberRef.current,
        { scale: 40, duration: 1.4, ease: "power4.in" },
        3.3,
      );

      /* 4.7–4.9 s  Pink-white flash */
      tl.fromTo(
        flashRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.in" },
        4.7,
      );

      /* 4.9 s  Hard cut → deep plum */
      tl.set(containerRef.current, { backgroundColor: "#2B0A1A" }, 4.9);
      tl.set(numberRef.current, { display: "none" }, 4.9);
      tl.set(flashRef.current, { opacity: 0 }, 4.9);
      tl.set(textBlockRef.current, { display: "flex" }, 4.9);

      /* 4.9–5.7 s  Line 1 fades + rises */
      tl.fromTo(
        line1Ref.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        4.9,
      );

      /* 5.4–6.2 s  Line 2 fades + rises (0.5 s stagger) */
      tl.fromTo(
        line2Ref.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        5.4,
      );

      /* 7.4–8.0 s  Text fades out → onComplete fires */
      tl.to(
        textBlockRef.current,
        { opacity: 0, duration: 0.6, ease: "power2.in" },
        7.4,
      );
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  /* ── render ── */
  return (
    <div ref={containerRef} className="absolute inset-0 bg-black overflow-hidden">
      {/* ── Number display ── */}
      <div
        ref={numberRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      >
        {/* Glow circle (animated via opacity + scale) */}
        <div
          ref={glowRef}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "clamp(10rem, 40vw, 22rem)",
            height: "clamp(10rem, 40vw, 22rem)",
            opacity: 0,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
          }}
        />

        {/* Digit pair */}
        <div
          className="relative flex font-playfair text-white leading-none select-none"
          style={{
            fontWeight: 900,
            fontSize: "clamp(7rem, 22vw, 15rem)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {/* First digit — static */}
          <span>{firstDigit}</span>

          {/* Last digit — slot machine */}
          <div className="overflow-hidden" style={{ height: "1em" }}>
            <div ref={slotRef} className="flex flex-col">
              <span
                className="block"
                style={{ height: "1em", lineHeight: "1" }}
              >
                {oldLastDigit}
              </span>
              <span
                className="block"
                style={{ height: "1em", lineHeight: "1" }}
              >
                {newLastDigit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pink-white flash overlay ── */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background:
            "radial-gradient(circle, rgba(255,228,236,0.95) 0%, rgba(255,255,255,1) 100%)",
        }}
      />

      {/* ── Text lines (shown after zoom) ── */}
      <div
        ref={textBlockRef}
        className="absolute inset-0 hidden flex-col items-center justify-center px-6 text-center"
      >
        <h1
          ref={line1Ref}
          className="font-playfair font-[800] text-blush"
          style={{ fontSize: "clamp(1.35rem, 4.5vw, 2.5rem)", opacity: 0 }}
        >
          {copy.intro.line1}
        </h1>
        <p
          ref={line2Ref}
          className="mt-3 font-inter text-white/60"
          style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.2rem)", opacity: 0 }}
        >
          {copy.intro.line2}
        </p>
      </div>
    </div>
  );
}
