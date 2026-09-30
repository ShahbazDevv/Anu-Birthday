import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { letterText } from "../../content/letter";
import { copy } from "../../content/copy";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import Heart from "../svg/Heart";

/**
 * Scene 5 — Envelope & Letter
 *
 * Sequence:
 *   - Closed envelope with a heart wax seal, gentle floating loop, label "Tap to open".
 *   - On tap:
 *       1. Seal cracks & fades out.
 *       2. Flap opens in 3D (0.9s, rotateX: 180deg).
 *       3. Letter slides up and scales to fill screen modal (1.0s).
 *       4. Small 20-particle heart burst emitted on shared canvas from the seal.
 *   - Letter modal:
 *       Parchment paper texture, Great Vibes cursive font, scrollable text, close button.
 *       Text sourced strictly from src/content/letter.js.
 *   - On close: letter slides down, envelope can be reopened.
 *   - Reduced motion: simple fades, no 3D rotation, float, or particles.
 */
export default function EnvelopeScene({ onComplete, particleRef }) {
  const containerRef = useRef(null);
  const envelopeWrapRef = useRef(null);
  const topFlapRef = useRef(null);
  const sealRef = useRef(null);
  const letterModalRef = useRef(null);
  const letterCardRef = useRef(null);
  const floatTweenRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const prefersReduced = useReducedMotion();

  /* ── Gentle Floating Loop (paused when opened) ── */
  useEffect(() => {
    if (prefersReduced || isOpen) return;

    floatTweenRef.current = gsap.to(envelopeWrapRef.current, {
      y: -12,
      rotation: 1.2,
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    return () => {
      floatTweenRef.current?.kill();
    };
  }, [prefersReduced, isOpen]);

  /* ── Open Envelope Sequence ── */
  const handleOpenEnvelope = useCallback(() => {
    if (isOpen || isOpening) return;
    setIsOpening(true);

    /* Pause float */
    floatTweenRef.current?.pause();

    /* 1. Emit 20 particles from seal on shared canvas */
    if (particleRef?.current && sealRef.current && !prefersReduced) {
      const rect = sealRef.current.getBoundingClientRect();
      particleRef.current.emit({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        count: 20,
        spread: 32,
        speed: 3.5,
        gravity: 0.1,
        types: ["heart", "dot"],
        colors: ["#FF2E7E", "#FF6FA5", "#FFE4EC", "#ffffff"],
        sizeRange: [4, 12],
        life: 2.2,
      });
    }

    /* Reduced motion path: quick fade-in of letter */
    if (prefersReduced) {
      setIsOpen(true);
      setIsOpening(false);
      gsap.fromTo(
        letterModalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(true);
        setIsOpening(false);
      },
    });

    /* 2. Seal cracks & disappears (0.25s) */
    tl.to(
      sealRef.current,
      {
        scale: 1.25,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      },
      0,
    );

    /* 3. Flap opens in 3D (0.9s, rotateX 0 → 180deg) */
    tl.to(
      topFlapRef.current,
      {
        rotateX: 180,
        duration: 0.9,
        ease: "power2.inOut",
      },
      0.1,
    );

    /* Switch flap z-index once it passes 90deg so it folds behind */
    tl.set(topFlapRef.current, { zIndex: 5 }, 0.55);

    /* 4. Letter modal fades in and scales up to fill view (1.0s) */
    tl.set(letterModalRef.current, { display: "flex", opacity: 0 }, 0.4);
    tl.fromTo(
      letterModalRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" },
      0.4,
    );

    tl.fromTo(
      letterCardRef.current,
      { y: 80, scale: 0.6, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 1.0,
        ease: "power3.out",
      },
      0.4,
    );
  }, [isOpen, isOpening, prefersReduced, particleRef]);

  /* ── Close Letter Modal ── */
  const handleClose = useCallback(() => {
    if (prefersReduced) {
      gsap.to(letterModalRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setIsOpen(false);
          setIsOpening(false);
        },
      });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(false);
        setIsOpening(false);
        /* Resume float */
        floatTweenRef.current?.restart();
      },
    });

    tl.to(letterCardRef.current, {
      y: 40,
      scale: 0.8,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
    });

    tl.to(
      letterModalRef.current,
      { opacity: 0, duration: 0.3, ease: "power2.in" },
      0.2,
    );

    /* Fold flap back down and restore seal */
    tl.set(topFlapRef.current, { zIndex: 25 }, 0.3);
    tl.to(
      topFlapRef.current,
      { rotateX: 0, duration: 0.6, ease: "power2.inOut" },
      0.3,
    );
    tl.to(sealRef.current, { scale: 1, opacity: 1, duration: 0.3 }, 0.7);
  }, [prefersReduced]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-deep-plum overflow-hidden flex flex-col items-center justify-center p-4 safe-area select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, #380E21 0%, #2B0A1A 60%, #17040E 100%)",
      }}
    >
      {/* ── Soft Romantic Ambient Glow ── */}
      <div
        className="absolute w-[80vw] max-w-lg h-[400px] rounded-full bg-rose/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Interactive Closed Envelope ── */}
      <div
        ref={envelopeWrapRef}
        onClick={handleOpenEnvelope}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpenEnvelope();
        }}
        className="relative z-10 flex flex-col items-center cursor-pointer group focus:outline-none"
        aria-label="Birthday letter envelope. Tap to open."
      >
        {/* Envelope 3D Container */}
        <div
          className="relative w-[300px] sm:w-[380px] h-[200px] sm:h-[240px] rounded-2xl shadow-2xl shadow-black/60 transition-transform duration-300 group-hover:scale-[1.02]"
          style={{ perspective: "1200px" }}
        >
          {/* 1. Envelope Back Interior */}
          <div className="absolute inset-0 bg-[#350D20] rounded-2xl border border-white/10 overflow-hidden">
            {/* Letter peek inside */}
            <div className="absolute top-3 left-6 right-6 h-28 bg-[#FFFDF8] rounded-t-lg shadow-sm border border-[#E8DCC8]/60 flex items-center justify-center">
              <span className="font-great-vibes text-deep-plum/30 text-lg">
                With Love...
              </span>
            </div>
          </div>

          {/* 2. Top Flap (3D Flip Open: rotateX 0 → 180deg) */}
          <div
            ref={topFlapRef}
            className="absolute top-0 left-0 right-0 h-[105px] sm:h-[125px] origin-top z-25"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(0deg)",
            }}
          >
            <svg
              viewBox="0 0 380 125"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
            >
              <path
                d="M0 0 L380 0 L190 125 Z"
                fill="#581A37"
                stroke="rgba(255, 228, 236, 0.25)"
                strokeWidth="1.5"
              />
              {/* Subtle inner decorative line */}
              <path
                d="M20 6 L360 6 L190 118 Z"
                stroke="rgba(255, 228, 236, 0.12)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* 3. Front Pocket (Sides & Bottom Flaps) */}
          <svg
            viewBox="0 0 380 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          >
            {/* Left fold */}
            <path
              d="M0 0 L190 120 L0 240 Z"
              fill="#421329"
              stroke="rgba(255, 228, 236, 0.1)"
              strokeWidth="1"
            />
            {/* Right fold */}
            <path
              d="M380 0 L190 120 L380 240 Z"
              fill="#421329"
              stroke="rgba(255, 228, 236, 0.1)"
              strokeWidth="1"
            />
            {/* Bottom pocket flap */}
            <path
              d="M0 240 L190 105 L380 240 Z"
              fill="#4D1730"
              stroke="rgba(255, 228, 236, 0.2)"
              strokeWidth="1.5"
            />
            {/* Soft decorative stitch line on bottom fold */}
            <path
              d="M15 232 L190 112 L365 232"
              stroke="rgba(255, 228, 236, 0.12)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </svg>

          {/* 4. Heart Wax Seal */}
          <div
            ref={sealRef}
            className="absolute left-1/2 top-[102px] sm:top-[122px] -translate-x-1/2 -translate-y-1/2 z-30
                       w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-rose via-hot-pink to-deep-red
                       shadow-xl shadow-hot-pink/40 border-2 border-white/40 flex items-center justify-center
                       group-hover:scale-110 transition-transform duration-200"
          >
            <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
          </div>
        </div>

        {/* ── "Tap to open" Label ── */}
        <p className="mt-8 font-inter text-blush/80 text-sm tracking-widest uppercase animate-pulse flex items-center gap-2">
          <span>{copy.envelope.label}</span>
          <span className="text-base">💌</span>
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       *  LETTER MODAL (Parchment Paper Texture, Great Vibes Font)
       * ───────────────────────────────────────────────────────────── */}
      <div
        ref={letterModalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Birthday Letter"
        style={{ display: isOpen ? "flex" : "none" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6"
      >
        <div
          ref={letterCardRef}
          className="relative w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl shadow-black/70 flex flex-col overflow-hidden border-2 border-[#EAE0D0]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, #FFFFFF 0%, #FFFDF9 60%, #F8EFE4 100%)",
          }}
        >
          {/* Top Paper Ornament Header */}
          <div className="relative pt-6 px-6 sm:px-10 flex items-center justify-between border-b border-[#E8DCC8]/60 pb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-hot-pink drop-shadow-sm" />
              <span className="font-playfair text-deep-plum text-xs tracking-widest uppercase font-semibold">
                Letter for You
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="px-4 py-1.5 rounded-full bg-deep-plum/10 hover:bg-deep-plum hover:text-white
                         text-deep-plum text-xs font-inter font-medium tracking-wider uppercase
                         transition-all cursor-pointer border border-deep-plum/20"
              aria-label="Close letter"
            >
              {copy.envelope.close}
            </button>
          </div>

          {/* Letter Body — Scrollable with Great Vibes font */}
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8 no-scrollbar">
            <div
              className="font-great-vibes text-[#2E0B1B] text-2xl sm:text-3xl md:text-4xl leading-relaxed whitespace-pre-line tracking-wide select-text"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              {letterText}
            </div>
          </div>

          {/* Bottom Paper Border Ornament */}
          <div className="py-3 px-6 sm:px-10 border-t border-[#E8DCC8]/60 flex items-center justify-center bg-[#FAF3EA]">
            <span className="text-deep-plum/40 text-xs font-playfair italic">
              Forever &amp; Always
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
