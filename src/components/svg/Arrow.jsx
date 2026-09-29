/**
 * Arrow SVG with a built-in fading gradient trail.
 * Points right. Colour inherits from parent via currentColor.
 */
export default function Arrow({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 160 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="arrow-trail-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="80%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Fading trail */}
      <line
        x1="0" y1="12" x2="105" y2="12"
        stroke="url(#arrow-trail-grad)" strokeWidth="2" strokeLinecap="round"
      />
      {/* Shaft */}
      <line
        x1="100" y1="12" x2="138" y2="12"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Head */}
      <path
        d="M132 4 L158 12 L132 20"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}
