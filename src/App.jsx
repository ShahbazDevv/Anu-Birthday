import { useState, useCallback, useRef } from "react";
import AudioProvider from "./components/AudioProvider";
import StartGate from "./components/StartGate";
import MuteButton from "./components/MuteButton";
import SceneShell from "./components/SceneShell";
import ParticleCanvas from "./components/ParticleCanvas";
import IntroScene from "./components/scenes/IntroScene";
import ArrowHeartScene from "./components/scenes/ArrowHeartScene";
import TreeScene from "./components/scenes/TreeScene";
import BirthdayRevealScene from "./components/scenes/BirthdayRevealScene";
import GalleryScene from "./components/scenes/GalleryScene";
import EnvelopeScene from "./components/scenes/EnvelopeScene";
import { copy } from "./content/copy";

/**
 * Scene index:
 *   -1  = gate visible (initial)
 *    0  = Intro           (auto)
 *    1  = Arrow & Heart   (auto)
 *    2  = Magic Tree      (auto)
 *    3  = Birthday Reveal (auto, then holds)
 *    4  = Gallery          (user-paced)
 *    5  = Envelope/Letter  (user-paced)
 */
const SCENES = [
  IntroScene,           // 0
  ArrowHeartScene,      // 1
  TreeScene,            // 2
  BirthdayRevealScene,  // 3
  GalleryScene,         // 4
  EnvelopeScene,        // 5
];

export default function App() {
  const [gateOpen, setGateOpen] = useState(false);
  const [currentScene, setCurrentScene] = useState(-1);
  const [showContinue, setShowContinue] = useState(false);
  const particleRef = useRef(null);

  /* Gate tap completes → show Scene 0 */
  const handleGateComplete = useCallback(() => {
    setGateOpen(true);
    setCurrentScene(0);
  }, []);

  /* Each scene calls this when its timeline / interaction finishes */
  const handleSceneComplete = useCallback((sceneIndex) => {
    if (sceneIndex < 3) {
      /* Auto-advance through scenes 0 → 1 → 2 → 3 */
      setCurrentScene(sceneIndex + 1);
    } else if (sceneIndex === 3) {
      /* Scene 3 holds; show the Continue button */
      setShowContinue(true);
    } else if (sceneIndex === 4) {
      /* Gallery "Next" → Envelope */
      setCurrentScene(5);
    }
    /* Scene 5 is the last scene — no advance */
  }, []);

  /* Continue button (between Scene 3 and Scene 4) */
  const handleContinue = useCallback(() => {
    setShowContinue(false);
    setCurrentScene(4);
  }, []);

  const CurrentSceneComponent =
    currentScene >= 0 ? SCENES[currentScene] : null;

  return (
    <AudioProvider>
      <div className="relative w-screen min-h-[100dvh] overflow-hidden bg-deep-plum">
        {/* ── Active scene ── */}
        {CurrentSceneComponent && (
          <SceneShell key={currentScene}>
            <CurrentSceneComponent
              onComplete={() => handleSceneComplete(currentScene)}
              particleRef={particleRef}
            />
          </SceneShell>
        )}

        {/* ── Shared particle canvas (above scenes, below UI) ── */}
        <ParticleCanvas ref={particleRef} className="z-30" />

        {/* ── Continue button (after Scene 3) ── */}
        {showContinue && (
          <button
            onClick={handleContinue}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40
                       px-8 py-3 rounded-full
                       bg-white/10 backdrop-blur-md border border-white/20
                       text-white text-sm font-inter tracking-widest uppercase
                       hover:bg-white/20 transition-colors cursor-pointer
                       safe-area"
          >
            {copy.continueButton}
          </button>
        )}

        {/* ── Start gate (above everything) ── */}
        {!gateOpen && <StartGate onComplete={handleGateComplete} />}

        {/* ── Mute button (visible after gate) ── */}
        {gateOpen && <MuteButton />}
      </div>
    </AudioProvider>
  );
}
