import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Scissors, Image, Clock, Plus, Trash2, Play, Pause, Check,
  Loader2, X, Sliders, Type, AlignLeft, AlignCenter, AlignRight,
  Bold, Zap, Film, ChevronUp, ChevronDown, MoveVertical, Layers,
  Rewind, FastForward, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ─── helpers ─────────────────────────────────────────────────────────────────

function captureFrame(videoEl, time) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth || 320;
    canvas.height = videoEl.videoHeight || 240;
    videoEl.currentTime = time;
    const onSeeked = () => {
      videoEl.removeEventListener("seeked", onSeeked);
      canvas.getContext("2d").drawImage(videoEl, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    videoEl.addEventListener("seeked", onSeeked);
  });
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: "none",     label: "Original",  css: "",                                                          preview: "from-slate-600 to-slate-800" },
  { id: "vivid",    label: "Vivid",     css: "saturate(1.8) contrast(1.1)",                               preview: "from-red-500 to-orange-400" },
  { id: "cool",     label: "Cool",      css: "hue-rotate(20deg) saturate(1.3) brightness(1.05)",          preview: "from-blue-500 to-cyan-400" },
  { id: "warm",     label: "Warm",      css: "sepia(0.3) saturate(1.4) brightness(1.05)",                 preview: "from-amber-500 to-yellow-300" },
  { id: "bw",       label: "B&W",       css: "grayscale(1) contrast(1.1)",                                preview: "from-gray-600 to-gray-300" },
  { id: "fade",     label: "Fade",      css: "brightness(1.1) saturate(0.8) contrast(0.9)",               preview: "from-slate-400 to-slate-200" },
  { id: "dramatic", label: "Dramatic",  css: "contrast(1.4) brightness(0.9) saturate(1.2)",               preview: "from-purple-800 to-slate-900" },
  { id: "vintage",  label: "Vintage",   css: "sepia(0.5) contrast(0.9) brightness(1.1)",                  preview: "from-amber-800 to-yellow-600" },
  { id: "neon",     label: "Neon",      css: "saturate(2) contrast(1.3) hue-rotate(-10deg)",              preview: "from-pink-500 to-purple-500" },
  { id: "cold",     label: "Cold",      css: "hue-rotate(180deg) saturate(1.2) brightness(1.1)",          preview: "from-indigo-600 to-blue-300" },
  { id: "sunset",   label: "Sunset",    css: "sepia(0.4) saturate(1.6) hue-rotate(-20deg) brightness(1.1)", preview: "from-orange-600 to-pink-400" },
  { id: "deep",     label: "Deep",      css: "contrast(1.3) saturate(1.5) brightness(0.85)",              preview: "from-teal-700 to-emerald-400" },
];

const TRANSITIONS = [
  { id: "none",     label: "None",     icon: "—" },
  { id: "fade",     label: "Fade",     icon: "◐" },
  { id: "slide",    label: "Slide",    icon: "→" },
  { id: "zoom",     label: "Zoom",     icon: "⊕" },
  { id: "wipe",     label: "Wipe",     icon: "▷" },
  { id: "flash",    label: "Flash",    icon: "✦" },
];

const AI_SUGGESTIONS = {
  fast_paced: {
    transitions: ["zoom", "flash", "wipe"],
    effects: ["vivid", "neon"],
    speed: [1.5, 2],
    label: "🚀 Fast-Paced Energy"
  },
  slow_dramatic: {
    transitions: ["fade", "slide"],
    effects: ["dramatic", "cold"],
    speed: [0.75, 1],
    label: "🎬 Dramatic Mood"
  },
  uplifting: {
    transitions: ["fade", "zoom"],
    effects: ["vivid", "warm"],
    speed: [1, 1.25],
    label: "✨ Uplifting Vibes"
  },
  cinematic: {
    transitions: ["slide", "fade"],
    effects: ["cold", "dramatic"],
    speed: [0.5, 0.75],
    label: "🎥 Cinematic Feel"
  }
};

const SPEED_OPTIONS = [
  { label: "0.25×", value: 0.25 },
  { label: "0.5×",  value: 0.5  },
  { label: "0.75×", value: 0.75 },
  { label: "1×",    value: 1    },
  { label: "1.5×",  value: 1.5  },
  { label: "2×",    value: 2    },
  { label: "3×",    value: 3    },
];

// ─── ClipTimeline ─────────────────────────────────────────────────────────────

function ClipTimeline({ clips, activeClipIdx, onSelectClip, onRemoveClip, onReorderClip }) {
  if (clips.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1">
      {clips.map((clip, i) => (
        <div
          key={clip.id}
          onClick={() => onSelectClip(i)}
          className={`relative shrink-0 w-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
            activeClipIdx === i ? "border-blue-500 scale-105 shadow-lg" : "border-transparent hover:border-slate-300"
          }`}
        >
          <div className="aspect-video bg-slate-800 flex items-center justify-center">
            {clip.previewUrl ? (
              <img src={clip.previewUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Film className="w-5 h-5 text-slate-400" />
            )}
          </div>
          {/* Clip number badge */}
          <div className="absolute top-1 left-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeClipIdx === i ? "bg-blue-500 text-white" : "bg-black/60 text-white"}`}>
              {i + 1}
            </span>
          </div>
          {/* Duration */}
          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-mono">
            {fmt(clip.trimEnd - clip.trimStart)}
          </div>
          {/* Reorder & remove */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5">
            {i > 0 && (
              <button onClick={e => { e.stopPropagation(); onReorderClip(i, i - 1); }}
                className="bg-black/70 text-white rounded p-0.5">
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
            )}
            {i < clips.length - 1 && (
              <button onClick={e => { e.stopPropagation(); onReorderClip(i, i + 1); }}
                className="bg-black/70 text-white rounded p-0.5">
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onRemoveClip(i); }}
              className="bg-red-500/80 text-white rounded p-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
          {/* Transition badge */}
          {clip.transition && clip.transition !== "none" && i < clips.length - 1 && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-blue-500 text-white text-[9px] px-1 py-0.5 rounded-full shadow">
              {TRANSITIONS.find(t => t.id === clip.transition)?.icon}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main VideoEditor ─────────────────────────────────────────────────────────

export default function VideoEditor({
  videoFile,
  videoUrl,
  onThumbnailReady,
  onTrimReady,
  onEditsChange,
  onClose,
  // multi-clip
  clips: externalClips,
  onClipsChange,
  activeClipIdx: externalActiveIdx,
  onActiveClipChange,
}) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Single-clip state (fallback when not multi-clip mode)
  const [trimRange, setTrimRange] = useState([0, 0]);
  const [speed, setSpeed] = useState(1);
  const [activeFilter, setActiveFilter] = useState("none");
  const [textOverlays, setTextOverlays] = useState([]);
  const [transition, setTransition] = useState("none");

  // Text overlay builder
  const [newText, setNewText] = useState("");
  const [newTextColor, setNewTextColor] = useState("#ffffff");
  const [newTextSize, setNewTextSize] = useState("lg");
  const [newTextAlign, setNewTextAlign] = useState("center");
  const [newTextBold, setNewTextBold] = useState(false);
  const [newTextPosition, setNewTextPosition] = useState("bottom"); // top | center | bottom

  // Thumbnail
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState(null);
  const [generatingThumbs, setGeneratingThumbs] = useState(false);
  
  // AI Suggestions
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Multi-clip mode
  const multiClipMode = !!externalClips;
  const clips = externalClips || [];
  const activeIdx = externalActiveIdx ?? 0;
  const activeClip = clips[activeIdx];

  const src = videoUrl || (videoFile ? URL.createObjectURL(videoFile) : null);
  const activeSrc = multiClipMode && activeClip
    ? (activeClip.objectUrl || (activeClip.file ? URL.createObjectURL(activeClip.file) : null))
    : src;

  const currentFilter = FILTERS.find(f => f.id === (multiClipMode ? activeClip?.filter || "none" : activeFilter)) || FILTERS[0];

  // ── video events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      const dur = v.duration;
      setDuration(dur);
      if (!multiClipMode) {
        setTrimRange([0, dur]);
        onTrimReady?.({ startTime: 0, endTime: dur });
      }
    };
    const onTime = () => setCurrentTime(v.currentTime);
    const onEnded = () => setPlaying(false);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [activeSrc]);

  // Keep speed synced
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = multiClipMode ? (activeClip?.speed || 1) : speed;
  }, [speed, activeClip?.speed, activeSrc]);

  // Clamp playback to trim window
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playing) return;
    const end = multiClipMode ? (activeClip?.trimEnd || duration) : trimRange[1];
    if (currentTime >= end) {
      v.pause(); v.currentTime = multiClipMode ? (activeClip?.trimStart || 0) : trimRange[0];
      setPlaying(false);
    }
  }, [currentTime, trimRange, playing, activeClip, duration, multiClipMode]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else {
      const start = multiClipMode ? (activeClip?.trimStart || 0) : trimRange[0];
      const end = multiClipMode ? (activeClip?.trimEnd || duration) : trimRange[1];
      if (v.currentTime < start || v.currentTime >= end) v.currentTime = start;
      v.play(); setPlaying(true);
    }
  };

  const seekTo = (t) => { if (videoRef.current) videoRef.current.currentTime = t; };

  // ── helpers to update active clip ─────────────────────────────────────────
  const updateClip = useCallback((patch) => {
    if (!multiClipMode) return;
    const updated = clips.map((c, i) => i === activeIdx ? { ...c, ...patch } : c);
    onClipsChange?.(updated);
  }, [multiClipMode, clips, activeIdx, onClipsChange]);

  // ── trim ──────────────────────────────────────────────────────────────────
  const handleTrimChange = (vals) => {
    if (multiClipMode) {
      updateClip({ trimStart: vals[0], trimEnd: vals[1] });
    } else {
      setTrimRange(vals);
      seekTo(vals[0]);
      onTrimReady?.({ startTime: vals[0], endTime: vals[1] });
    }
  };

  const trimStart = multiClipMode ? (activeClip?.trimStart ?? 0) : trimRange[0];
  const trimEnd   = multiClipMode ? (activeClip?.trimEnd ?? duration) : trimRange[1];

  // ── speed ─────────────────────────────────────────────────────────────────
  const handleSpeedChange = (val) => {
    if (videoRef.current) videoRef.current.playbackRate = val;
    if (multiClipMode) updateClip({ speed: val });
    else {
      setSpeed(val);
      onEditsChange?.({ speed: val, filter: activeFilter, textOverlays, transition });
    }
  };

  // ── filters ───────────────────────────────────────────────────────────────
  const handleFilterChange = (filterId) => {
    if (multiClipMode) updateClip({ filter: filterId });
    else {
      setActiveFilter(filterId);
      onEditsChange?.({ speed, filter: filterId, textOverlays, transition });
    }
  };

  // ── transitions ───────────────────────────────────────────────────────────
  const handleTransitionChange = (val) => {
    if (multiClipMode) updateClip({ transition: val });
    else {
      setTransition(val);
      onEditsChange?.({ speed, filter: activeFilter, textOverlays, transition: val });
    }
  };

  // ── text overlays ─────────────────────────────────────────────────────────
  const addTextOverlay = () => {
    if (!newText.trim()) return;
    const overlay = { id: Date.now(), text: newText.trim(), color: newTextColor, size: newTextSize, align: newTextAlign, bold: newTextBold, position: newTextPosition };
    const current = multiClipMode ? (activeClip?.textOverlays || []) : textOverlays;
    const updated = [...current, overlay];
    if (multiClipMode) updateClip({ textOverlays: updated });
    else { setTextOverlays(updated); onEditsChange?.({ speed, filter: activeFilter, textOverlays: updated, transition }); }
    setNewText("");
  };

  const removeTextOverlay = (id) => {
    const current = multiClipMode ? (activeClip?.textOverlays || []) : textOverlays;
    const updated = current.filter(o => o.id !== id);
    if (multiClipMode) updateClip({ textOverlays: updated });
    else { setTextOverlays(updated); onEditsChange?.({ speed, filter: activeFilter, textOverlays: updated, transition }); }
  };

  const activeOverlays = multiClipMode ? (activeClip?.textOverlays || []) : textOverlays;
  const activeSpeed    = multiClipMode ? (activeClip?.speed || 1)   : speed;
  const activeTransition = multiClipMode ? (activeClip?.transition || "none") : transition;

  // ── thumbnail ─────────────────────────────────────────────────────────────
  const generateThumbnails = async () => {
    const v = videoRef.current;
    if (!v || !duration) return;
    setGeneratingThumbs(true);
    v.pause(); setPlaying(false);
    const frames = [];
    for (let i = 0; i < 6; i++) {
      const t = (duration / 7) * (i + 1);
      frames.push({ dataUrl: await captureFrame(v, t), time: t });
    }
    setThumbnails(frames);
    setGeneratingThumbs(false);
  };

  const selectThumbnail = (thumb) => {
    setSelectedThumb(thumb.dataUrl);
    onThumbnailReady?.(dataURLtoFile(thumb.dataUrl, "thumbnail.jpg"), thumb.dataUrl);
  };

  const captureCurrentFrame = async () => {
    const v = videoRef.current;
    if (!v) return;
    const dataUrl = await captureFrame(v, v.currentTime);
    setSelectedThumb(dataUrl);
    onThumbnailReady?.(dataURLtoFile(dataUrl, "thumbnail.jpg"), dataUrl);
  };

  const applySuggestions = (moodKey) => {
    const suggestion = AI_SUGGESTIONS[moodKey];
    if (!multiClipMode || !activeClip) return;
    
    const randomTransition = suggestion.transitions[Math.floor(Math.random() * suggestion.transitions.length)];
    const randomEffect = suggestion.effects[Math.floor(Math.random() * suggestion.effects.length)];
    const randomSpeed = suggestion.speed[Math.floor(Math.random() * suggestion.speed.length)];
    
    updateClip({
      transition: randomTransition,
      filter: randomEffect,
      speed: randomSpeed
    });
    
    setSelectedMood(moodKey);
    setTimeout(() => setShowAISuggestions(false), 500);
  };

  // ── layout helpers ────────────────────────────────────────────────────────
  const posClass = (pos) =>
    pos === "top" ? "items-start pt-10" : pos === "center" ? "items-center" : "items-end pb-10";

  if (!activeSrc) return null;

  const trimStartPct = duration ? (trimStart / duration) * 100 : 0;
  const trimEndPct   = duration ? (trimEnd   / duration) * 100 : 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-sm">Video Editor</h3>
          {multiClipMode && clips.length > 0 && (
            <Badge className="bg-blue-600 text-white text-xs px-2">{clips.length} clip{clips.length > 1 ? "s" : ""}</Badge>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        )}
      </div>

      {/* Multi-clip timeline */}
      {multiClipMode && clips.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
          <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Clips Timeline</p>
          <ClipTimeline
            clips={clips}
            activeClipIdx={activeIdx}
            onSelectClip={onActiveClipChange}
            onRemoveClip={(i) => {
              const updated = clips.filter((_, idx) => idx !== i);
              onClipsChange?.(updated);
              if (i <= activeIdx && activeIdx > 0) onActiveClipChange?.(activeIdx - 1);
            }}
            onReorderClip={(from, to) => {
              const updated = [...clips];
              const [moved] = updated.splice(from, 1);
              updated.splice(to, 0, moved);
              onClipsChange?.(updated);
              onActiveClipChange?.(to);
            }}
          />
          {multiClipMode && (
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Editing clip {activeIdx + 1} of {clips.length} · Total: {fmt(clips.reduce((s, c) => s + ((c.trimEnd || 0) - (c.trimStart || 0)), 0))}
            </p>
          )}
        </div>
      )}

      {/* Video preview */}
      <div className="bg-black relative" style={{ minHeight: 180 }}>
        <video
          ref={videoRef}
          src={activeSrc}
          className="w-full max-h-60 mx-auto block"
          style={{ filter: currentFilter.css || "none" }}
        />

        {/* Text overlays preview */}
        {activeOverlays.map(o => (
          <div key={o.id} className={`absolute inset-x-0 px-4 flex flex-col pointer-events-none ${posClass(o.position)} ${
            o.align === "left" ? "items-start" : o.align === "right" ? "items-end" : "items-center"
          }`} style={{ top: 0, bottom: 0 }}>
            <span style={{ color: o.color }}
              className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-3 py-1 rounded-lg text-${o.size} ${o.bold ? "font-black" : "font-semibold"} bg-black/25 backdrop-blur-sm`}>
              {o.text}
            </span>
          </div>
        ))}

        {/* Play/pause overlay */}
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center group">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </div>
        </button>

        {/* HUD */}
        <div className="absolute bottom-2 right-3 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-full font-mono">
          {fmt(currentTime)} / {fmt(duration)}
        </div>
        {currentFilter.id !== "none" && (
          <div className="absolute top-2 left-2 text-xs text-white bg-black/60 px-2 py-0.5 rounded-full">{currentFilter.label}</div>
        )}
        {activeSpeed !== 1 && (
          <div className={`absolute top-2 ${currentFilter.id !== "none" ? "left-20" : "left-2"} text-xs font-bold px-2 py-0.5 rounded-full ${activeSpeed < 1 ? "bg-blue-600 text-white" : "bg-orange-500 text-white"}`}>
            {activeSpeed}×
          </div>
        )}
      </div>

      {/* Scrubber */}
      {duration > 0 && (
        <div className="px-4 py-2 bg-black">
          <div className="relative h-2.5 bg-slate-700 rounded-full cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - rect.left) / rect.width) * duration);
            }}>
            {/* Trim highlight */}
            <div className="absolute top-0 h-full bg-blue-500/40 rounded-full"
              style={{ left: `${trimStartPct}%`, width: `${trimEndPct - trimStartPct}%` }} />
            {/* Playhead */}
            <div className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-blue-500"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: "translate(-50%,-50%)", cursor: "pointer" }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>{fmt(0)}</span><span>{fmt(duration)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="trim" className="px-3 pb-4">
        <TabsList className="w-full bg-slate-100 rounded-xl mb-3 mt-2 h-9 grid grid-cols-6">
          <TabsTrigger value="trim" className="text-[11px] rounded-lg gap-0.5 flex-col sm:flex-row">
            <Scissors className="w-3.5 h-3.5" /><span className="hidden sm:inline">Trim</span>
          </TabsTrigger>
          <TabsTrigger value="speed" className="text-[11px] rounded-lg gap-0.5">
            <Zap className="w-3.5 h-3.5" /><span className="hidden sm:inline">Speed</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="text-[11px] rounded-lg gap-0.5">
            <Sliders className="w-3.5 h-3.5" /><span className="hidden sm:inline">Filter</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="text-[11px] rounded-lg gap-0.5">
            <Type className="w-3.5 h-3.5" /><span className="hidden sm:inline">Text</span>
          </TabsTrigger>
          <TabsTrigger value="transition" className="text-[11px] rounded-lg gap-0.5">
            <Layers className="w-3.5 h-3.5" /><span className="hidden sm:inline">Trans.</span>
          </TabsTrigger>
          <TabsTrigger value="thumbnail" className="text-[11px] rounded-lg gap-0.5">
            <Image className="w-3.5 h-3.5" /><span className="hidden sm:inline">Thumb</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TRIM ─────────────────────────────────────────────────────────── */}
        <TabsContent value="trim" className="space-y-3 mt-0">
          {duration > 0 ? (
            <>
              <p className="text-xs text-slate-500">Drag both handles to trim your clip.</p>
              <Slider
                min={0} max={duration} step={0.1}
                value={[trimStart, trimEnd]}
                onValueChange={handleTrimChange}
                className="my-2"
              />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Start", val: trimStart, color: "text-blue-600" },
                  { label: "Duration", val: trimEnd - trimStart, color: "text-slate-700" },
                  { label: "End", val: trimEnd, color: "text-blue-600" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className={`font-black font-mono text-sm ${color}`}>{fmt(val)}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => seekTo(trimStart)} className="rounded-xl text-xs gap-1.5 flex-1">
                  <Rewind className="w-3.5 h-3.5" /> Go to Start
                </Button>
                <Button size="sm" variant="outline" onClick={() => seekTo(trimEnd - 0.1)} className="rounded-xl text-xs gap-1.5 flex-1">
                  <FastForward className="w-3.5 h-3.5" /> Go to End
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">Loading video metadata…</p>
          )}
        </TabsContent>

        {/* ── SPEED ────────────────────────────────────────────────────────── */}
        <TabsContent value="speed" className="space-y-3 mt-0">
          <p className="text-xs text-slate-500">Adjust playback speed for slow motion or fast forward.</p>
          <div className="grid grid-cols-4 gap-2">
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSpeedChange(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  activeSpeed === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {opt.label}
                {opt.value < 1 && <div className="text-[9px] text-slate-400 font-normal">Slow Mo</div>}
                {opt.value > 1 && <div className="text-[9px] text-slate-400 font-normal">Fast Fwd</div>}
              </button>
            ))}
          </div>
          <div className={`rounded-xl p-3 text-center text-sm font-semibold ${
            activeSpeed < 1 ? "bg-blue-50 text-blue-700 border border-blue-200" :
            activeSpeed > 1 ? "bg-orange-50 text-orange-700 border border-orange-200" :
            "bg-slate-50 text-slate-600 border border-slate-200"
          }`}>
            {activeSpeed < 1 ? `🐢 Slow Motion — ${activeSpeed}× speed` :
             activeSpeed > 1 ? `⚡ Fast Forward — ${activeSpeed}× speed` :
             "▶ Normal Speed"}
          </div>
        </TabsContent>

        {/* ── FILTERS ──────────────────────────────────────────────────────── */}
        <TabsContent value="filters" className="space-y-3 mt-0">
          <p className="text-xs text-slate-500">Apply a color filter to your clip.</p>
          <div className="grid grid-cols-4 gap-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  currentFilter.id === f.id ? "border-blue-500 scale-95 shadow-lg" : "border-transparent hover:border-slate-300"
                }`}
              >
                <div className={`w-full aspect-video bg-gradient-to-br ${f.preview}`}
                  style={{ filter: f.css || "none" }} />
                <div className={`absolute inset-x-0 bottom-0 py-1 text-[10px] font-bold text-center ${
                  currentFilter.id === f.id ? "bg-blue-500 text-white" : "bg-black/60 text-white"
                }`}>
                  {f.label}
                </div>
                {currentFilter.id === f.id && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-3 h-3 text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </TabsContent>

        {/* ── TEXT OVERLAYS ─────────────────────────────────────────────────── */}
        <TabsContent value="text" className="space-y-3 mt-0">
          <p className="text-xs text-slate-500">Add text overlays to your video.</p>
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTextOverlay()}
            placeholder="Your overlay text…"
            className="rounded-xl text-sm h-9"
          />
          <div className="grid grid-cols-3 gap-2">
            {/* Color */}
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Color</Label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={newTextColor} onChange={e => setNewTextColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
                <span className="text-[10px] text-slate-500 font-mono">{newTextColor}</span>
              </div>
            </div>
            {/* Size */}
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Size</Label>
              <Select value={newTextSize} onValueChange={setNewTextSize}>
                <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="2xl">X-Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Position */}
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Position</Label>
              <Select value={newTextPosition} onValueChange={setNewTextPosition}>
                <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-slate-400 uppercase">Align</Label>
            {[["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]].map(([val, Icon]) => (
              <button key={val} onClick={() => setNewTextAlign(val)}
                className={`p-1.5 rounded-lg transition-colors ${newTextAlign === val ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
            <button onClick={() => setNewTextBold(b => !b)}
              className={`p-1.5 rounded-lg transition-colors ml-1 ${newTextBold ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              <Bold className="w-3.5 h-3.5" />
            </button>
            <Button size="sm" onClick={addTextOverlay} disabled={!newText.trim()}
              className="ml-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1 px-3 text-xs h-8">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
          {activeOverlays.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {activeOverlays.map(o => (
                <div key={o.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 group border border-slate-100">
                  <span className="w-4 h-4 rounded-full shrink-0 border border-slate-200" style={{ background: o.color }} />
                  <p className="text-sm text-slate-700 flex-1 truncate" style={{ fontWeight: o.bold ? 700 : 400 }}>{o.text}</p>
                  <Badge variant="outline" className="text-[10px] capitalize px-1.5">{o.position || "bottom"}</Badge>
                  <button onClick={() => removeTextOverlay(o.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No overlays yet.</p>
          )}
        </TabsContent>

        {/* ── TRANSITIONS ───────────────────────────────────────────────────── */}
        <TabsContent value="transition" className="space-y-3 mt-0">
          <p className="text-xs text-slate-500">
            {multiClipMode ? "Choose the transition after this clip." : "Select a transition style for your reel."}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TRANSITIONS.map(t => (
              <button
                key={t.id}
                onClick={() => handleTransitionChange(t.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                  activeTransition === t.id
                    ? "border-blue-500 bg-blue-50 text-blue-700 scale-95 shadow-md"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
          {multiClipMode && activeIdx < clips.length - 1 && (
            <p className="text-xs text-center text-blue-600 bg-blue-50 rounded-xl py-2 border border-blue-200">
              This transition plays between clip {activeIdx + 1} and clip {activeIdx + 2}
            </p>
          )}
          {!multiClipMode && (
            <p className="text-xs text-slate-400 text-center">Transition info is stored with your reel metadata.</p>
          )}
        </TabsContent>

        {/* ── THUMBNAIL ─────────────────────────────────────────────────────── */}
        <TabsContent value="thumbnail" className="space-y-3 mt-0">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={captureCurrentFrame} className="rounded-xl text-xs flex-1 gap-1.5">
              <Image className="w-3.5 h-3.5" /> Use Current Frame
            </Button>
            <Button size="sm" variant="outline" onClick={generateThumbnails} disabled={generatingThumbs} className="rounded-xl text-xs flex-1 gap-1.5">
              {generatingThumbs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RefreshCw className="w-3.5 h-3.5" /> Auto-Generate</>}
            </Button>
          </div>
          {selectedThumb && (
            <div className="relative rounded-xl overflow-hidden border-2 border-blue-400">
              <img src={selectedThumb} alt="Thumbnail" className="w-full h-24 object-cover" />
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Selected
              </div>
            </div>
          )}
          {thumbnails.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {thumbnails.map((t, i) => (
                <button key={i} onClick={() => selectThumbnail(t)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${selectedThumb === t.dataUrl ? "border-blue-500 scale-95" : "border-transparent hover:border-slate-300"}`}>
                  <img src={t.dataUrl} alt="" className="w-full aspect-video object-cover" />
                  <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1 rounded">{fmt(t.time)}</span>
                </button>
              ))}
            </div>
          )}
          {thumbnails.length === 0 && !selectedThumb && (
            <p className="text-xs text-slate-400 text-center py-4">Click "Auto-Generate" to pick a frame, or use current frame.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}