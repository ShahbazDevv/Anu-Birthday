import { useRef, useEffect } from "react";
import gsap from "gsap";

/**
 * Creates a GSAP context scoped to the given ref.
 * All animations added via ctx.current.add(() => { ... }) are
 * automatically reverted (killed + DOM restored) on unmount.
 *
 * @param {React.RefObject} scope - ref to the container DOM node
 * @returns {React.MutableRefObject<gsap.Context>}
 */
export function useGsapContext(scope) {
  const ctx = useRef(null);

  useEffect(() => {
    ctx.current = gsap.context(() => {}, scope?.current);
    return () => ctx.current?.revert();
  }, [scope]);

  return ctx;
}
