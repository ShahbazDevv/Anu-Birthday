import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Full-screen wrapper for every scene.
 * Fades in on mount (or instant with reduced-motion).
 * Sets will-change during the scene and cleans it on unmount.
 */
export default function SceneShell({ children, className = "" }) {
  const shellRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    if (prefersReduced) {
      gsap.set(el, { opacity: 1 });
    } else {
      gsap.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    }

    return () => {
      el.style.willChange = "auto";
    };
  }, [prefersReduced]);

  return (
    <div
      ref={shellRef}
      className={`fixed inset-0 w-screen h-[100dvh] overflow-hidden ${className}`}
      style={{ opacity: 0, willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}
