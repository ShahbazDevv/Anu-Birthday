import { useAudio } from "./AudioProvider";

/**
 * Fixed mute / un-mute button — top-right corner.
 * 44 px minimum touch target, aria-labelled, session-aware.
 */
export default function MuteButton() {
  const { toggleMute, isMuted } = useAudio();

  return (
    <button
      onClick={toggleMute}
      aria-label={isMuted ? "Unmute music" : "Mute music"}
      className="fixed top-4 right-4 z-[100] flex items-center justify-center
                 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm
                 text-white/80 hover:text-white transition-colors
                 safe-area cursor-pointer"
    >
      {isMuted ? (
        /* Speaker off icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Speaker on icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
