import { useRef, useCallback } from "react";
import gsap from "gsap";

/**
 * Creates and owns the master GSAP timeline for Scenes 0-3.
 * The timeline starts paused; call play() after the start gate.
 *
 * Scenes add sub-timelines via:
 *   timeline.current.add(childTl, startPosition);
 *
 * @returns {{ timeline: React.MutableRefObject, play: Function, pause: Function, kill: Function }}
 */
export function useMasterTimeline() {
  const tl = useRef(null);

  /* Lazy-init so the same instance persists across renders */
  if (!tl.current) {
    tl.current = gsap.timeline({ paused: true });
  }

  const play = useCallback(() => tl.current?.play(), []);
  const pause = useCallback(() => tl.current?.pause(), []);
  const kill = useCallback(() => {
    tl.current?.kill();
    tl.current = null;
  }, []);

  return { timeline: tl, play, pause, kill };
}
