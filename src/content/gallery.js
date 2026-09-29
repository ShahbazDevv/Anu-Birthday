/**
 * Gallery photo list.
 * Each entry: { src, alt }
 * Photos that fail to load are silently skipped at render time.
 */
export const galleryItems = Array.from({ length: 10 }, (_, i) => ({
  src: `/assets/images/photo-${String(i + 1).padStart(2, "0")}.jpeg`,
  alt: `Photo ${i + 1}`,
}));
