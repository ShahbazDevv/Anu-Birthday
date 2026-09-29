import { useEffect } from "react";

/** Phase 1 stub — will be fully implemented in Phase 4. */
export default function TreeScene({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-blush/40 text-sm font-inter tracking-widest uppercase">
        Scene 2 · Magic Tree
      </span>
    </div>
  );
}
