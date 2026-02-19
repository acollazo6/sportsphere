import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export default function MediaViewer({ mediaUrls, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);

  const isVideo = (url) =>
    url && (url.includes(".mp4") || url.includes(".mov") || url.includes(".webm") || url.includes("video"));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex(i => Math.min(i + 1, mediaUrls.length - 1));
      if (e.key === "ArrowLeft") setIndex(i => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [mediaUrls.length, onClose]);

  const current = mediaUrls[index];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm shrink-0">
        <span className="text-white/60 text-sm font-medium">
          {mediaUrls.length > 1 ? `${index + 1} / ${mediaUrls.length}` : ""}
        </span>
        <div className="flex items-center gap-2">
          {!isVideo(current) && (
            <button
              onClick={() => setZoomed(z => !z)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-12">
        {/* Prev */}
        {index > 0 && (
          <button
            onClick={() => { setIndex(i => i - 1); setZoomed(false); }}
            className="absolute left-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {isVideo(current) ? (
          <video
            key={current}
            src={current}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-xl shadow-2xl"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          />
        ) : (
          <img
            key={current}
            src={current}
            alt=""
            className={`rounded-xl shadow-2xl transition-all duration-300 ${
              zoomed
                ? "max-w-none max-h-none cursor-zoom-out"
                : "max-h-full max-w-full object-contain cursor-zoom-in"
            }`}
            style={zoomed ? {} : { maxHeight: "calc(100vh - 120px)" }}
            onClick={() => setZoomed(z => !z)}
          />
        )}

        {/* Next */}
        {index < mediaUrls.length - 1 && (
          <button
            onClick={() => { setIndex(i => i + 1); setZoomed(false); }}
            className="absolute right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Thumbnails strip */}
      {mediaUrls.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-black/60 backdrop-blur-sm shrink-0 overflow-x-auto">
          {mediaUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); setZoomed(false); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                i === index ? "border-white scale-110" : "border-white/20 opacity-60 hover:opacity-100"
              }`}
            >
              {isVideo(url) ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/60 text-xs">▶</div>
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}