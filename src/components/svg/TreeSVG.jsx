import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const HEART_D =
  "M50 90C25 72 5 54 5 36 5 22 16 11 30 11c8 0 16 4 20 11 4-7 12-11 20-11 14 0 25 11 25 25 0 18-20 36-45 54Z";

/* 40 blossom positions, scales, and colors placed along branches */
const BLOSSOMS = [
  { x: 200, y: 65, size: 22, color: "#FF2E7E", delay: 0.1 },
  { x: 180, y: 78, size: 18, color: "#FFE4EC", delay: 0.25 },
  { x: 220, y: 75, size: 20, color: "#FF6FA5", delay: 0.2 },
  { x: 160, y: 92, size: 24, color: "#FF2E7E", delay: 0.4 },
  { x: 240, y: 88, size: 18, color: "#FF94BA", delay: 0.35 },
  { x: 140, y: 110, size: 20, color: "#FFE4EC", delay: 0.6 },
  { x: 260, y: 105, size: 22, color: "#FF6FA5", delay: 0.55 },
  { x: 120, y: 125, size: 18, color: "#FF2E7E", delay: 0.75 },
  { x: 280, y: 118, size: 20, color: "#FF94BA", delay: 0.7 },
  { x: 100, y: 138, size: 22, color: "#FFE4EC", delay: 0.95 },
  { x: 300, y: 130, size: 18, color: "#FF6FA5", delay: 0.9 },
  { x: 82, y: 152, size: 20, color: "#FF2E7E", delay: 1.15 },
  { x: 318, y: 145, size: 24, color: "#FF94BA", delay: 1.1 },
  { x: 68, y: 168, size: 18, color: "#FFE4EC", delay: 1.35 },
  { x: 332, y: 160, size: 20, color: "#FF6FA5", delay: 1.3 },
  { x: 92, y: 175, size: 22, color: "#FF2E7E", delay: 1.55 },
  { x: 308, y: 172, size: 18, color: "#FFE4EC", delay: 1.5 },
  { x: 112, y: 160, size: 20, color: "#FF94BA", delay: 1.75 },
  { x: 288, y: 158, size: 22, color: "#FF6FA5", delay: 1.7 },
  { x: 132, y: 142, size: 18, color: "#FF2E7E", delay: 1.95 },
  { x: 268, y: 138, size: 20, color: "#FFE4EC", delay: 1.9 },
  { x: 152, y: 122, size: 24, color: "#FF6FA5", delay: 2.15 },
  { x: 248, y: 120, size: 18, color: "#FF94BA", delay: 2.1 },
  { x: 172, y: 102, size: 20, color: "#FF2E7E", delay: 2.35 },
  { x: 228, y: 100, size: 22, color: "#FFE4EC", delay: 2.3 },
  { x: 192, y: 88, size: 18, color: "#FF6FA5", delay: 2.55 },
  { x: 208, y: 88, size: 20, color: "#FF2E7E", delay: 2.5 },
  { x: 168, y: 135, size: 22, color: "#FF94BA", delay: 2.75 },
  { x: 232, y: 132, size: 18, color: "#FFE4EC", delay: 2.7 },
  { x: 142, y: 88, size: 20, color: "#FF6FA5", delay: 2.95 },
  { x: 258, y: 82, size: 24, color: "#FF2E7E", delay: 2.9 },
  { x: 122, y: 102, size: 18, color: "#FFE4EC", delay: 3.15 },
  { x: 278, y: 98, size: 20, color: "#FF94BA", delay: 3.1 },
  { x: 102, y: 118, size: 22, color: "#FF6FA5", delay: 3.35 },
  { x: 298, y: 112, size: 18, color: "#FF2E7E", delay: 3.3 },
  { x: 182, y: 52, size: 20, color: "#FFE4EC", delay: 3.55 },
  { x: 218, y: 52, size: 18, color: "#FF94BA", delay: 3.5 },
  { x: 158, y: 68, size: 22, color: "#FF6FA5", delay: 3.75 },
  { x: 242, y: 65, size: 20, color: "#FF2E7E", delay: 3.7 },
  { x: 200, y: 110, size: 24, color: "#FFE4EC", delay: 3.9 },
];

/**
 * Reusable Tree SVG fallback:
 * - Animated stroked trunk and branches (stroke-dash animation, trunk first, branches 0.4s stagger).
 * - Exactly 40 pink heart blossoms popping from scale 0 with soft overshoot over ~5s.
 * - Single reusable SVG <symbol> for all heart blossoms.
 * - With prefersReduced, renders fully grown and static.
 */
export default function TreeSVG({ className = "" }) {
  const svgRef = useRef(null);
  const trunkRef = useRef(null);
  const branchesRef = useRef([]);
  const blossomsRef = useRef([]);
  const prefersReduced = useReducedMotion();

  branchesRef.current = [];
  blossomsRef.current = [];

  const addToBranches = (el) => {
    if (el && !branchesRef.current.includes(el)) branchesRef.current.push(el);
  };

  const addToBlossoms = (el) => {
    if (el && !blossomsRef.current.includes(el)) blossomsRef.current.push(el);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        /* Render fully grown immediately */
        if (trunkRef.current) {
          gsap.set(trunkRef.current, { strokeDashoffset: 0 });
        }
        branchesRef.current.forEach((b) => {
          gsap.set(b, { strokeDashoffset: 0 });
        });
        blossomsRef.current.forEach((blossom) => {
          gsap.set(blossom, { scale: 1, opacity: 1, transformOrigin: "center center" });
        });
        return;
      }

      const tl = gsap.timeline();

      /* Setup stroke-dash on trunk */
      if (trunkRef.current) {
        const len = trunkRef.current.getTotalLength?.() || 260;
        gsap.set(trunkRef.current, {
          strokeDasharray: len,
          strokeDashoffset: len,
        });
        tl.to(trunkRef.current, {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: "power2.out",
        }, 0);
      }

      /* Branches stroke-dash with 0.4s stagger */
      branchesRef.current.forEach((branch, idx) => {
        const len = branch.getTotalLength?.() || 200;
        gsap.set(branch, {
          strokeDasharray: len,
          strokeDashoffset: len,
        });
        tl.to(
          branch,
          {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: "power2.out",
          },
          0.8 + idx * 0.15,
        );
      });

      /* 40 blossoms popping from scale 0 with soft overshoot over ~5s */
      blossomsRef.current.forEach((blossom, idx) => {
        gsap.set(blossom, {
          scale: 0,
          opacity: 0,
          transformOrigin: "center center",
        });

        const popTime = 2.0 + (BLOSSOMS[idx]?.delay || (idx * 0.08));

        tl.to(
          blossom,
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "back.out(2)",
          },
          popTime,
        );

        /* Soft gentle sway after popping */
        tl.to(
          blossom,
          {
            rotation: (idx % 2 === 0 ? 5 : -5),
            duration: 2.5 + (idx % 3) * 0.4,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            transformOrigin: "center center",
          },
          popTime + 0.8,
        );
      });
    }, svgRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 420"
      className={`w-full h-full max-h-[85vh] object-contain drop-shadow-[0_0_25px_rgba(255,111,165,0.3)] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Magic blooming heart tree"
    >
      <defs>
        {/* Single reusable heart symbol */}
        <symbol id="tree-heart-symbol" viewBox="0 0 100 100">
          <path d={HEART_D} fill="currentColor" />
        </symbol>

        {/* Tree gradient */}
        <linearGradient id="tree-trunk-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8B3A62" />
          <stop offset="100%" stopColor="#FF6FA5" />
        </linearGradient>
      </defs>

      {/* ── Trunk ── */}
      <path
        ref={trunkRef}
        d="M 200 410 C 200 340, 195 280, 200 220"
        stroke="url(#tree-trunk-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Branches ── */}
      <g stroke="url(#tree-trunk-grad)" fill="none" strokeLinecap="round">
        <path
          ref={addToBranches}
          d="M 200 240 C 180 200, 140 170, 100 160"
          strokeWidth="6"
        />
        <path
          ref={addToBranches}
          d="M 140 180 C 120 150, 90 130, 70 120"
          strokeWidth="4.5"
        />
        <path
          ref={addToBranches}
          d="M 160 195 C 150 150, 130 110, 110 90"
          strokeWidth="3.5"
        />
        <path
          ref={addToBranches}
          d="M 200 220 C 190 170, 175 130, 160 80"
          strokeWidth="5"
        />
        <path
          ref={addToBranches}
          d="M 200 220 C 200 160, 200 120, 200 70"
          strokeWidth="5.5"
        />
        <path
          ref={addToBranches}
          d="M 200 220 C 210 170, 225 130, 240 80"
          strokeWidth="5"
        />
        <path
          ref={addToBranches}
          d="M 200 235 C 220 195, 260 165, 300 155"
          strokeWidth="6"
        />
        <path
          ref={addToBranches}
          d="M 260 175 C 280 145, 310 125, 330 115"
          strokeWidth="4.5"
        />
        <path
          ref={addToBranches}
          d="M 240 190 C 250 145, 270 105, 290 85"
          strokeWidth="3.5"
        />
      </g>

      {/* ── 40 Heart Blossoms (reusing single symbol) ── */}
      <g>
        {BLOSSOMS.map((b, i) => (
          <g
            key={i}
            ref={addToBlossoms}
            transform={`translate(${b.x}, ${b.y})`}
            style={{ color: b.color }}
          >
            <use
              href="#tree-heart-symbol"
              x={-b.size / 2}
              y={-b.size / 2}
              width={b.size}
              height={b.size}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
