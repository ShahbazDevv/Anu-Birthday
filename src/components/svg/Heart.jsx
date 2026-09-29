/**
 * Reusable heart SVG.
 * Accepts className and any standard SVG/HTML props.
 * Uses currentColor so the parent can set color via text-* utilities.
 */
export default function Heart({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M50 90C25 72 5 54 5 36 5 22 16 11 30 11c8 0 16 4 20 11 4-7 12-11 20-11 14 0 25 11 25 25 0 18-20 36-45 54Z"
        fill="currentColor"
      />
    </svg>
  );
}
