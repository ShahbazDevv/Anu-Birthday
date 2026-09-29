import { copy } from "../../content/copy";

/** Phase 1 stub — will be fully implemented in Phase 6. */
export default function GalleryScene({ onComplete }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <span className="text-blush/40 text-sm font-inter tracking-widest uppercase">
        Scene 4 · Gallery
      </span>
      <button
        onClick={onComplete}
        className="px-6 py-3 rounded-full bg-hot-pink text-white text-sm
                   font-inter tracking-wide hover:bg-rose transition-colors cursor-pointer"
      >
        {copy.gallery.next}
      </button>
    </div>
  );
}
