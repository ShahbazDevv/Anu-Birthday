import { useRef, useEffect } from "react";
import gsap from "gsap";
import { copy } from "../../content/copy";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Scene 3 — Red Reveal (the peak of the site)
 *
 * Sequence:
 *   - Full screen deep red (#8B0000) with a darker radial vignette at edges.
 *   - 0.0s - 0.5s: black hold.
 *   - 0.5s: "HAPPY BIRTHDAY" letter by letter (scale 1.6→1, blur 12px→0, fade in, 0.04s stagger).
 *   - ~1.3s: "TO MY BEAUTIFUL" fades in and rises 20px over 0.8s.
 *   - ~1.6s: 36 soft white/pink dots rise slowly at low opacity on shared canvas.
 *   - ~2.1s: "PRINCESS" scales 0.6→1 while letter spacing tightens, 1.4s, expo.out.
 *   - ~3.6s: Slow camera push (whole block scales 1→1.04 over ~5s).
 *   - ~8.8s: onComplete fires → Continue button appears, scene holds.
 *
 * Reduced motion: 0.5s black hold, single fade-in for all text, no blur/scale/particles.
 */
export default function BirthdayRevealScene({ onComplete, particleRef }) {
  const containerRef = useRef(null);
  const blackCoverRef = useRef(null);
  const textContainerRef = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const lettersRef = useRef([]);
  const prefersReduced = useReducedMotion();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  lettersRef.current = [];
  const addToLetters = (el) => {
    if (el && !lettersRef.current.includes(el)) lettersRef.current.push(el);
  };

  useEffect(() => {
    const done = () => onCompleteRef.current?.();

    const ctx = gsap.context(() => {
      /* ─────────────────────────────────
       *  REDUCED-MOTION PATH (~5.0 s)
       * ───────────────────────────────── */
      if (prefersReduced) {
        const tl = gsap.timeline({ onComplete: done });

        /* 0.5s black hold, then fade out black cover */
        tl.to(
          blackCoverRef.current,
          { opacity: 0, duration: 0.8, ease: "power2.out" },
          0.5,
        );

        /* Single smooth fade-in for entire text block */
        tl.fromTo(
          textContainerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: "power2.out" },
          0.5,
        );

        /* Make individual elements visible */
        lettersRef.current.forEach((l) => gsap.set(l, { opacity: 1 }));
        if (line2Ref.current) gsap.set(line2Ref.current, { opacity: 1 });
        if (line3Ref.current) gsap.set(line3Ref.current, { opacity: 1 });

        /* Holds until 5s, then done() triggers Continue button */
        tl.set({}, {}, 5.0);
        return;
      }

      /* ─────────────────────────────────
       *  FULL-MOTION PATH (~8.8 s)
       * ───────────────────────────────── */
      const tl = gsap.timeline({ onComplete: done });

      /* 0.0s - 0.5s: Black hold. At 0.5s, fade out black cover into red vignette */
      tl.to(
        blackCoverRef.current,
        { opacity: 0, duration: 0.6, ease: "power2.out" },
        0.5,
      );

      /* Line 1: "HAPPY BIRTHDAY" letter by letter (scale 1.6→1, blur 12px→0, fade, 0.04s stagger) */
      lettersRef.current.forEach((letter, i) => {
        tl.fromTo(
          letter,
          {
            scale: 1.6,
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.6,
            ease: "power2.out",
          },
          0.5 + i * 0.04,
        );
      });

      /* Line 2: "TO MY BEAUTIFUL" fades in and rises 20px over 0.8s */
      tl.fromTo(
        line2Ref.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        1.3,
      );

      /* 30-40 soft white/pink dots rise slowly at low opacity on shared canvas */
      tl.call(
        () => {
          if (!particleRef?.current) return;
          particleRef.current.emit({
            x: window.innerWidth * 0.5,
            y: window.innerHeight * 0.85,
            count: 36,
            spread: window.innerWidth * 0.9,
            speed: 1.1,
            gravity: -0.025,
            types: ["dot"],
            colors: ["#ffffff", "#FFE4EC", "#FF6FA5"],
            sizeRange: [2.5, 6],
            life: 6.5,
            initAlpha: 0.45,
          });
        },
        [],
        1.6,
      );

      /* Line 3: "PRINCESS" scales 0.6 to 1 while letter spacing tightens, 1.4s, expo.out */
      tl.fromTo(
        line3Ref.current,
        {
          scale: 0.6,
          opacity: 0,
          letterSpacing: "0.45em",
        },
        {
          scale: 1,
          opacity: 1,
          letterSpacing: "0.22em",
          duration: 1.4,
          ease: "expo.out",
        },
        2.1,
      );

      /* Slow camera push: whole text block scales 1 to 1.04 */
      tl.to(
        textContainerRef.current,
        {
          scale: 1.04,
          duration: 5.2,
          ease: "power1.out",
        },
        3.6,
      );

      /* At 8.8s: hold state reached, timeline finishes, onComplete fires → Continue button appears */
      tl.set({}, {}, 8.8);
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReduced, particleRef]);

  const line1Chars = copy.reveal.line1.split("");

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden flex items-center justify-center select-none"
      style={{
        backgroundColor: "#8B0000",
        background:
          "radial-gradient(circle at 50% 50%, #9E0A1E 0%, #8B0000 45%, #4A0000 80%, #200000 100%)",
      }}
    >
      {/* ── Outer vignette overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.65) 100%)",
        }}
      />

      {/* ── Main Text Container ── */}
      <div
        ref={textContainerRef}
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 safe-area will-change-transform max-w-[94vw]"
      >
        {/* Line 1: "HAPPY BIRTHDAY" */}
        <h2
          className="font-playfair font-black text-white uppercase tracking-wider flex flex-wrap justify-center"
          style={{
            fontSize: "clamp(1.5rem, 5.6vw, 3.8rem)",
            lineHeight: 1.15,
            filter: "drop-shadow(0 0 16px rgba(255, 220, 200, 0.45))",
          }}
        >
          {line1Chars.map((char, i) => (
            <span
              key={i}
              ref={addToLetters}
              className="inline-block will-change-[transform,opacity,filter]"
              style={{ opacity: 0 }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h2>

        {/* Line 2: "TO MY BEAUTIFUL" */}
        <p
          ref={line2Ref}
          className="font-playfair font-bold text-white/90 uppercase tracking-widest mt-3 sm:mt-5"
          style={{
            fontSize: "clamp(0.95rem, 3.5vw, 2.2rem)",
            lineHeight: 1.2,
            opacity: 0,
            filter: "drop-shadow(0 0 12px rgba(255, 220, 200, 0.35))",
          }}
        >
          {copy.reveal.line2}
        </p>

        {/* Line 3: "PRINCESS" */}
        <h1
          ref={line3Ref}
          className="font-playfair font-black text-white uppercase mt-4 sm:mt-7"
          style={{
            fontSize: "clamp(2.4rem, 10.5vw, 6.2rem)",
            lineHeight: 1.05,
            opacity: 0,
            filter: "drop-shadow(0 0 26px rgba(255, 220, 200, 0.6))",
          }}
        >
          {copy.reveal.line3}
        </h1>
      </div>

      {/* ── Black Cover (0.5s initial hold) ── */}
      <div
        ref={blackCoverRef}
        className="absolute inset-0 bg-black pointer-events-none z-20"
        style={{ opacity: 1 }}
      />
    </div>
  );
}
