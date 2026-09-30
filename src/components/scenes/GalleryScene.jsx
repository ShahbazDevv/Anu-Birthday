import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import gsap from "gsap";
import { galleryItems } from "../../content/gallery";
import { copy } from "../../content/copy";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/* Subtle rotation values within ±3 degrees */
const ROTATIONS = [-2.2, 1.8, -1.4, 2.5, -1.9, 2.2, -2.4, 1.6, -1.8, 2.1];

/**
 * Scene 4 — Gallery
 *
 * Requirements:
 *   - Blush background (#FFE4EC).
 *   - Mobile: swipe carousel with snap, one large photo at a time, dot indicator.
 *   - Desktop: staggered grid with click-to-open lightbox.
 *   - Cards: white border, soft shadow, rotation within ±3 degrees.
 *   - Entrance: rise and fade, 0.12s stagger.
 *   - Lazy-load all photos except the first two.
 *   - Skip any photo that fails to load silently.
 *   - "Next" button leads to Scene 5.
 */
export default function GalleryScene({ onComplete }) {
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const desktopGridRef = useRef(null);
  const cardsRef = useRef([]);
  const prefersReduced = useReducedMotion();

  const [failedIndices, setFailedIndices] = useState(() => new Set());
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  cardsRef.current = [];
  const addToCards = (el) => {
    if (el && !cardsRef.current.includes(el)) cardsRef.current.push(el);
  };

  /* Filter out photos that failed to load */
  const validItems = useMemo(
    () =>
      galleryItems
        .map((item, originalIndex) => ({ ...item, originalIndex }))
        .filter((_, idx) => !failedIndices.has(idx)),
    [failedIndices],
  );

  const handleImageError = useCallback((index) => {
    setFailedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  /* ── Entrance Animation ── */
  useEffect(() => {
    if (cardsRef.current.length === 0) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(cardsRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReduced, validItems.length]);

  /* ── Mobile Carousel Scroll Listener for Dot Indicator ── */
  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const itemWidth = el.offsetWidth;
    if (itemWidth > 0) {
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveMobileIndex(Math.max(0, Math.min(newIndex, validItems.length - 1)));
    }
  }, [validItems.length]);

  const scrollToSlide = useCallback((index) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * el.offsetWidth,
      behavior: "smooth",
    });
    setActiveMobileIndex(index);
  }, []);

  /* ── Lightbox Navigation & Keyboard Controls ── */
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevLightbox = useCallback(() => {
    setLightboxIndex((curr) =>
      curr === null ? null : curr > 0 ? curr - 1 : validItems.length - 1,
    );
  }, [validItems.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((curr) =>
      curr === null ? null : curr < validItems.length - 1 ? curr + 1 : 0,
    );
  }, [validItems.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox, prevLightbox, nextLightbox]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-blush overflow-y-auto overflow-x-hidden safe-area"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #FFF5F8 0%, #FFE4EC 100%)",
      }}
    >
      {/* ── Fixed "Next" Button leading to Scene 5 ── */}
      <button
        onClick={onComplete}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40
                   px-6 py-3 rounded-full bg-deep-plum text-white text-xs md:text-sm
                   font-inter font-semibold tracking-widest uppercase shadow-xl shadow-deep-plum/25
                   hover:bg-hot-pink hover:scale-105 active:scale-95 transition-all cursor-pointer
                   flex items-center gap-2 safe-area border border-white/20"
        aria-label="Next scene"
      >
        <span>{copy.gallery.next}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ── Header Title (Subtle & Elegant) ── */}
      <div className="pt-8 pb-4 text-center px-4">
        <h3 className="font-playfair text-deep-plum text-xl md:text-2xl font-bold tracking-wide">
          {copy.gallery.title}
        </h3>
        <p className="font-inter text-deep-plum/60 text-xs md:text-sm mt-1">
          {copy.gallery.subtitle}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       *  MOBILE VIEW (< 768px): Swipe carousel with snap & dot indicator
       * ───────────────────────────────────────────────────────────── */}
      <div className="block md:hidden w-full pb-20">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar py-6"
        >
          {validItems.map((item, idx) => {
            const rot = prefersReduced ? 0 : ROTATIONS[idx % ROTATIONS.length];
            const hasCaption = Boolean(item.caption && item.caption.trim());

            return (
              <div
                key={item.originalIndex}
                className="w-full flex-shrink-0 snap-center flex justify-center items-center px-6"
              >
                <div
                  ref={addToCards}
                  className={`bg-white p-3.5 ${
                    hasCaption ? "pb-5" : "pb-3.5"
                  } rounded-2xl shadow-xl shadow-rose/15 border-4 border-white w-full max-w-[320px] transition-transform`}
                  style={{
                    transform: `rotate(${rot}deg)`,
                  }}
                >
                  <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-rose/10">
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading={idx < 2 ? "eager" : "lazy"}
                      onError={() => handleImageError(idx)}
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                  {hasCaption && (
                    <div className="mt-3 text-center px-1">
                      <p className="font-playfair text-deep-plum/75 text-xs italic tracking-wider line-clamp-2 break-words leading-relaxed">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Dot Indicator ── */}
        <div className="flex justify-center items-center gap-1.5 mt-2">
          {validItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeMobileIndex === idx
                  ? "w-6 bg-hot-pink"
                  : "w-2 bg-deep-plum/20 hover:bg-deep-plum/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       *  DESKTOP VIEW (>= 768px): Staggered grid with click-to-open lightbox
       * ───────────────────────────────────────────────────────────── */}
      <div
        ref={desktopGridRef}
        className="hidden md:block max-w-7xl mx-auto px-8 pt-4 pb-28"
      >
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
          {validItems.map((item, idx) => {
            const rot = prefersReduced ? 0 : ROTATIONS[idx % ROTATIONS.length];
            const hasCaption = Boolean(item.caption && item.caption.trim());
            /* Artistic staggered vertical offset */
            const staggerOffset = idx % 2 === 1 ? "md:translate-y-4" : "";

            return (
              <div
                key={item.originalIndex}
                ref={addToCards}
                onClick={() => setLightboxIndex(idx)}
                style={{
                  transform: prefersReduced ? "none" : `rotate(${rot}deg)`,
                }}
                className={`bg-white p-3.5 ${
                  hasCaption ? "pb-5" : "pb-3.5"
                } rounded-2xl shadow-xl shadow-rose/15 border-4 border-white
                           cursor-pointer hover:rotate-0 hover:scale-105 hover:shadow-2xl hover:z-20
                           transition-all duration-300 ease-out select-none ${staggerOffset}`}
              >
                <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-rose/10">
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading={idx < 2 ? "eager" : "lazy"}
                    onError={() => handleImageError(idx)}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>
                {hasCaption && (
                  <div className="mt-3 text-center px-1">
                    <p className="font-playfair text-deep-plum/75 text-xs italic tracking-wider line-clamp-2 break-words leading-relaxed">
                      {item.caption}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       *  DESKTOP LIGHTBOX MODAL
       * ───────────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && validItems[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close Button (placed top-4 right-20 to avoid colliding with top-4 right-4 mute button) */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-20 z-50 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer border border-white/20"
            aria-label="Close lightbox"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevLightbox();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer border border-white/15"
            aria-label="Previous photo"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextLightbox();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer border border-white/15"
            aria-label="Next photo"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Enlarged Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white p-4 pb-6 rounded-2xl shadow-2xl border-4 border-white max-w-xl max-h-[85vh] flex flex-col items-center"
          >
            {/* Direct Close Button on Card Corner */}
            <button
              onClick={closeLightbox}
              className="absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full bg-deep-plum text-white shadow-xl flex items-center justify-center hover:bg-hot-pink transition-colors cursor-pointer border-2 border-white z-50"
              aria-label="Close photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={validItems[lightboxIndex].src}
                alt={validItems[lightboxIndex].alt}
                className="max-h-[66vh] w-auto object-contain rounded-xl select-none"
              />
            </div>
            {validItems[lightboxIndex].caption && validItems[lightboxIndex].caption.trim() && (
              <p className="mt-3.5 font-playfair text-deep-plum text-sm md:text-base italic font-semibold text-center px-4 max-w-md line-clamp-2 break-words">
                {validItems[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
