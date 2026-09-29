import { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useAudio } from "./AudioProvider";
import Heart from "./svg/Heart";
import { copy } from "../content/copy";

/**
 * Start gate — full-screen dark overlay with a pulsing heart.
 * Tap starts audio and fades the gate out over 0.6 s.
 */
export default function StartGate({ onComplete }) {
  const gateRef = useRef(null);
  const { start } = useAudio();
  const [tapped, setTapped] = useState(false);

  const handleTap = useCallback(() => {
    if (tapped) return;
    setTapped(true);
    start();

    gsap.to(gateRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete,
    });
  }, [tapped, start, onComplete]);

  return (
    <div
      ref={gateRef}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleTap();
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center
                 bg-deep-plum cursor-pointer select-none"
    >
      <Heart className="w-20 h-20 text-hot-pink animate-pulse-heart drop-shadow-[0_0_24px_rgba(255,46,126,0.5)]" />

      <p className="mt-8 text-blush/80 text-lg tracking-widest uppercase font-inter">
        {copy.startGate}
      </p>
    </div>
  );
}
