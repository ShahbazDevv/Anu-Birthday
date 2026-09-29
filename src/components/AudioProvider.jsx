import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import gsap from "gsap";

/* ── Easy-to-change volume constant ── */
const TARGET_VOLUME = 0.3;
const FADE_IN_SECONDS = 3;

const AudioCtx = createContext(null);

/** @returns {{ start: Function, toggleMute: Function, isMuted: boolean }} */
export function useAudio() {
  return useContext(AudioCtx);
}

export default function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const startedRef = useRef(false);

  const [isMuted, setIsMuted] = useState(
    () => sessionStorage.getItem("muted") === "true",
  );

  /* ── Start playback (call once, from the gate tap) ── */
  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || startedRef.current) return;
    startedRef.current = true;

    audio.volume = 0;
    audio.muted = isMuted;
    audio.play().catch(() => {});

    if (!isMuted) {
      gsap.to(audio, {
        volume: TARGET_VOLUME,
        duration: FADE_IN_SECONDS,
        ease: "power2.out",
      });
    }
  }, [isMuted]);

  /* ── Toggle mute ── */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sessionStorage.setItem("muted", String(next));
      const audio = audioRef.current;
      if (audio) {
        audio.muted = next;
        /* When un-muting, if volume was 0 fade it in */
        if (!next && audio.volume === 0) {
          gsap.to(audio, {
            volume: TARGET_VOLUME,
            duration: FADE_IN_SECONDS,
            ease: "power2.out",
          });
        }
      }
      return next;
    });
  }, []);

  /* ── Pause on tab hide, resume on tab show ── */
  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current;
      if (!audio || !startedRef.current) return;

      if (document.hidden) {
        wasPlayingRef.current = !audio.paused;
        audio.pause();
      } else if (wasPlayingRef.current) {
        audio.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <AudioCtx.Provider value={{ start, toggleMute, isMuted }}>
      {/* Single shared <audio> element — never visible */}
      <audio ref={audioRef} src="/assets/audio/song.mp3" loop preload="auto" />
      {children}
    </AudioCtx.Provider>
  );
}
