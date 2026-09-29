import { useEffect } from "react";

/** Phase 1 stub — will be fully implemented in Phase 5. */
export default function BirthdayRevealScene({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-full bg-deep-red">
      <span className="text-white/40 text-sm font-inter tracking-widest uppercase">
        Scene 3 · Birthday Reveal
      </span>
    </div>
  );
}
