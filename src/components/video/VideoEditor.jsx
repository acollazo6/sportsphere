import React, { useState, useRef, useEffect } from "react";
import { Scissors, Image, Clock, Plus, Trash2, Play, Pause, Check, Loader2, X, Sliders, Type, AlignLeft, AlignCenter, AlignRight, Bold } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Capture a frame from a video element as a data URL
function captureFrame(videoEl, time) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    videoEl.currentTime = time;
    const onSeeked = () => {
      videoEl.removeEventListener("seeked", onSeeked);
      canvas.getContext("2d").drawImage(videoEl, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    videoEl.addEventListener("seeked", onSeeked);
  });
}

// Convert dataURL to File
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const FILTERS = [
  { id: "none",        label: "Original",   css: "" },
  { id: "vivid",       label: "Vivid",      css: "saturate(1.8) contrast(1.1)" },
  { id: "cool",        label: "Cool",       css: "hue-rotate(20deg) saturate(1.3) brightness(1.05)" },
  { id: "warm",        label: "Warm",       css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { id: "bw",          label: "B&W",        css: "grayscale(1) contrast(1.1)" },
  { id: "fade",        label: "Fade",       css: "brightness(1.1) saturate(0.8) contrast(0.9)" },
  { id: "dramatic",    label: "Dramatic",   css: "contrast(1.4) brightness(0.9) saturate(1.2)" },
  { id: "vintage",     label: "Vintage",    css: "sepia(0.5) contrast(0.9) brightness(1.1)" },
];

export default function VideoEditor({ videoFile, videoUrl, onThumbnailReady, onTrimReady, onChaptersChange, onFiltersChange, onTextOverlaysChange, onClose }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimRange, setTrimRange] = useState([0, 100]);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState(null);
  const [generatingThumbs, setGeneratingThumbs] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [newChapterLabel, setNewChapterLabel] = useState("");

  // Filters
  const [activeFilter, setActiveFilter] = useState("none");

  // Text overlays
  const [textOverlays, setTextOverlays] = useState([]);
  const [newText, setNewText] = useState("");
  const [newTextColor, setNewTextColor] = useState("#ffffff");
  const [newTextSize, setNewTextSize] = useState("lg");
  const [newTextAlign, setNewTextAlign] = useState("center");
  const [newTextBold, setNewTextBold] = useState(false);

  const src = videoUrl || (videoFile ? URL.createObjectURL(videoFile) : null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      setDuration(v.duration);
      setTrimRange([0, v.duration]);
    };
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    return () => { v.removeEventListener("loadedmetadata", onLoaded); v.removeEventListener("timeupdate", onTime); };
  }, [src]);

  // Playback clamped to trim window
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playing) return;
    if (currentTime >= trimRange[1]) {
      v.pause();
      v.currentTime = trimRange[0];
      setPlaying(false);
    }
  }, [currentTime, trimRange, playing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else {
      if (v.currentTime < trimRange[0] || v.currentTime >= trimRange[1]) v.currentTime = trimRange[0];
      v.play(); setPlaying(true);
    }
  };

  const handleTrimChange = (vals) => {
    setTrimRange(vals);
    if (videoRef.current) videoRef.current.currentTime = vals[0];
    onTrimReady?.({ startTime: vals[0], endTime: vals[1] });
  };

  const generateThumbnails = async () => {
    const v = videoRef.current;
    if (!v || !duration) return;
    setGeneratingThumbs(true);
    v.pause(); setPlaying(false);
    const count = 6;
    const frames = [];
    for (let i = 0; i < count; i++) {
      const t = (duration / (count + 1)) * (i + 1);
      const dataUrl = await captureFrame(v, t);
      frames.push({ dataUrl, time: t });
    }
    setThumbnails(frames);
    setGeneratingThumbs(false);
  };

  const selectThumbnail = (thumb) => {
    setSelectedThumb(thumb.dataUrl);
    const file = dataURLtoFile(thumb.dataUrl, "thumbnail.jpg");
    onThumbnailReady?.(file, thumb.dataUrl);
  };

  const captureCurrentFrame = async () => {
    const v = videoRef.current;
    if (!v) return;
    const dataUrl = await captureFrame(v, v.currentTime);
    const file = dataURLtoFile(dataUrl, "thumbnail.jpg");
    setSelectedThumb(dataUrl);
    onThumbnailReady?.(file, dataUrl);
  };

  const addChapter = () => {
    if (!newChapterLabel.trim()) return;
    const newChapter = { time: Math.floor(currentTime), label: newChapterLabel.trim() };
    const updated = [...chapters, newChapter].sort((a, b) => a.time - b.time);
    setChapters(updated);
    onChaptersChange?.(updated);
    setNewChapterLabel("");
  };

  const removeChapter = (i) => {
    const updated = chapters.filter((_, idx) => idx !== i);
    setChapters(updated);
    onChaptersChange?.(updated);
  };

  const seekTo = (t) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    onFiltersChange?.(filterId);
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    const overlay = {
      id: Date.now(),
      text: newText.trim(),
      color: newTextColor,
      size: newTextSize,
      align: newTextAlign,
      bold: newTextBold,
    };
    const updated = [...textOverlays, overlay];
    setTextOverlays(updated);
    onTextOverlaysChange?.(updated);
    setNewText("");
  };

  const removeTextOverlay = (id) => {
    const updated = textOverlays.filter(o => o.id !== id);
    setTextOverlays(updated);
    onTextOverlaysChange?.(updated);
  };

  const currentFilter = FILTERS.find(f => f.id === activeFilter) || FILTERS[0];

  if (!src) return null;

  const trimStartPct = duration ? (trimRange[0] / duration) * 100 : 0;
  const trimEndPct = duration ? (trimRange[1] / duration) * 100 : 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="font-bold text-slate-800 text-sm">Video Editor</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Video preview */}
      <div className="bg-black relative overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          className="w-full max-h-56 mx-auto block"
          style={{ filter: currentFilter.css || "none" }}
          onEnded={() => setPlaying(false)}
        />
        {/* Text overlays preview */}
        {textOverlays.map(o => (
          <div
            key={o.id}
            className={`absolute inset-x-0 bottom-10 flex ${o.align === "left" ? "justify-start px-4" : o.align === "right" ? "justify-end px-4" : "justify-center"}`}
          >
            <span
              style={{ color: o.color }}
              className={`drop-shadow-lg px-2 py-0.5 rounded text-${o.size} ${o.bold ? "font-black" : "font-semibold"} bg-black/30 backdrop-blur-sm`}
            >
              {o.text}
            </span>
          </div>
        ))}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </div>
        </button>
        <div className="absolute bottom-2 right-3 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        {currentFilter.id !== "none" && (
          <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">{currentFilter.label}</div>
        )}
      </div>

      {/* Scrubber */}
      {duration > 0 && (
        <div className="px-4 py-2">
          <div className="relative h-2 bg-slate-200 rounded-full cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTo(pct * duration);
            }}>
            {/* Trim window highlight */}
            <div className="absolute top-0 h-full bg-orange-400/40 rounded-full"
              style={{ left: `${trimStartPct}%`, width: `${trimEndPct - trimStartPct}%` }} />
            {/* Playhead */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full shadow"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: "translate(-50%,-50%)" }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="trim" className="px-4 pb-4">
        <TabsList className="w-full bg-slate-100 rounded-xl mb-4 mt-2 h-9">
          <TabsTrigger value="trim" className="flex-1 text-xs rounded-lg gap-1.5">
            <Scissors className="w-3.5 h-3.5" />Trim
          </TabsTrigger>
          <TabsTrigger value="thumbnail" className="flex-1 text-xs rounded-lg gap-1.5">
            <Image className="w-3.5 h-3.5" />Thumbnail
          </TabsTrigger>
          <TabsTrigger value="chapters" className="flex-1 text-xs rounded-lg gap-1.5">
            <Clock className="w-3.5 h-3.5" />Chapters
          </TabsTrigger>
        </TabsList>

        {/* TRIM */}
        <TabsContent value="trim" className="space-y-3 mt-0">
          {duration > 0 ? (
            <>
              <p className="text-xs text-slate-500">Drag handles to set start and end of clip.</p>
              <Slider
                min={0}
                max={duration}
                step={0.1}
                value={trimRange}
                onValueChange={handleTrimChange}
                className="my-3"
              />
              <div className="flex justify-between text-xs font-mono text-slate-600 bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="text-slate-400 mb-0.5">Start</p>
                  <p className="font-bold text-orange-600">{formatTime(trimRange[0])}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 mb-0.5">Duration</p>
                  <p className="font-bold">{formatTime(trimRange[1] - trimRange[0])}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 mb-0.5">End</p>
                  <p className="font-bold text-orange-600">{formatTime(trimRange[1])}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">Trim info is saved with your post. Actual video trimming applies on upload.</p>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Loading video…</p>
          )}
        </TabsContent>

        {/* THUMBNAIL */}
        <TabsContent value="thumbnail" className="space-y-3 mt-0">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={captureCurrentFrame} className="rounded-xl text-xs flex-1 gap-1.5">
              <Image className="w-3.5 h-3.5" /> Use Current Frame
            </Button>
            <Button size="sm" variant="outline" onClick={generateThumbnails} disabled={generatingThumbs} className="rounded-xl text-xs flex-1 gap-1.5">
              {generatingThumbs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Play className="w-3.5 h-3.5" />Auto-Generate</>}
            </Button>
          </div>

          {selectedThumb && (
            <div className="relative rounded-xl overflow-hidden border-2 border-orange-400">
              <img src={selectedThumb} alt="Selected thumbnail" className="w-full h-28 object-cover" />
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />Selected
              </div>
            </div>
          )}

          {thumbnails.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {thumbnails.map((t, i) => (
                <button key={i} onClick={() => selectThumbnail(t)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${selectedThumb === t.dataUrl ? "border-orange-500 scale-95" : "border-transparent hover:border-slate-300"}`}>
                  <img src={t.dataUrl} alt="" className="w-full aspect-video object-cover" />
                  <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1 rounded">{formatTime(t.time)}</span>
                </button>
              ))}
            </div>
          )}

          {thumbnails.length === 0 && !selectedThumb && (
            <p className="text-xs text-slate-400 text-center py-3">Click "Auto-Generate" to preview frames, or use current frame.</p>
          )}
        </TabsContent>

        {/* CHAPTERS */}
        <TabsContent value="chapters" className="space-y-3 mt-0">
          <p className="text-xs text-slate-500">Add chapter markers at the current playback time.</p>
          <div className="flex gap-2">
            <Input
              value={newChapterLabel}
              onChange={e => setNewChapterLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addChapter()}
              placeholder={`Label for ${formatTime(currentTime)}`}
              className="rounded-xl text-sm h-9 flex-1"
            />
            <Button size="sm" onClick={addChapter} disabled={!newChapterLabel.trim()} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-1 px-3">
              <Plus className="w-3.5 h-3.5" />Add
            </Button>
          </div>

          {chapters.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 group">
                  <button onClick={() => seekTo(ch.time)} className="font-mono text-xs text-orange-600 font-bold hover:underline w-10 shrink-0">
                    {formatTime(ch.time)}
                  </button>
                  <p className="text-sm text-slate-700 flex-1 truncate">{ch.label}</p>
                  <button onClick={() => removeChapter(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No chapters yet. Scrub to a moment and add a label.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}