/**
 * Decorative Envelope SVG illustration and seal stamp.
 */
export default function EnvelopeSVG({ className = "", isOpen = false }) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="env-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A152D" />
          <stop offset="100%" stopColor="#320C1E" />
        </linearGradient>
        <linearGradient id="env-flap-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5E1C3A" />
          <stop offset="100%" stopColor="#441328" />
        </linearGradient>
        <filter id="env-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Main Base Card */}
      <rect
        x="10"
        y="10"
        width="300"
        height="180"
        rx="12"
        fill="url(#env-grad)"
        stroke="rgba(255, 228, 236, 0.2)"
        strokeWidth="1.5"
        filter="url(#env-shadow)"
      />

      {/* Side and Bottom Folds */}
      <path
        d="M10 190 L130 110 L10 20"
        fill="#3F1226"
        stroke="rgba(255, 228, 236, 0.1)"
        strokeWidth="1"
      />
      <path
        d="M310 190 L190 110 L310 20"
        fill="#3F1226"
        stroke="rgba(255, 228, 236, 0.1)"
        strokeWidth="1"
      />
      <path
        d="M10 190 L160 100 L310 190 Z"
        fill="url(#env-flap-grad)"
        stroke="rgba(255, 228, 236, 0.15)"
        strokeWidth="1.5"
      />

      {/* Decorative Gold/Blush Border Line */}
      <path
        d="M20 182 L160 98 L300 182"
        stroke="rgba(255, 228, 236, 0.12)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    </svg>
  );
}
