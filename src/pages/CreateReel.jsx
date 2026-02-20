import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Film, X, Loader2, Image, Plus, Layers, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AIReelAssistant from "../components/reels/AIReelAssistant";
import VideoEditor from "../components/video/VideoEditor";

const SPORTS = ["Basketball","Soccer","Football","Baseball","Tennis","Golf","Swimming","Boxing","MMA","Track","Volleyball","Hockey","Cycling","Yoga","CrossFit"];
const CATEGORIES = ["training","game","coaching","instruction","motivation","highlight","other"];

function generateId() { return Date.now() + Math.random().toString(36).slice(2); }

export default function CreateReel() {
  const navigate = useNavigate();
  const addClipRef = useRef();

  const [clips, setClips] = useState([]); // [{id, file, objectUrl, previewUrl, trimStart, trimEnd, speed, filter, textOverlays, transition}]
  const [activeClipIdx, setActiveClipIdx] = useState(0);
  const [showEditor, setShowEditor] = useState(false);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbRef = useRef();

  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [error, setError] = useState("");

  const handleAddClips = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newClips = files.map(file => ({
      id: generateId(),
      file,
      objectUrl: URL.createObjectURL(file),
      previewUrl: null,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      filter: "none",
      textOverlays: [],
      transition: "none",
    }));
    setClips(prev => {
      const updated = [...prev, ...newClips];
      // auto-open editor on first clip
      if (prev.length === 0) {
        setShowEditor(true);
        setActiveClipIdx(0);
      } else {
        setActiveClipIdx(updated.length - 1);
      }
      return updated;
    });
    e.target.value = "";
  };

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (clips.length === 0) { setError("Please add at least one video clip."); return; }
    if (!content.trim()) { setError("Please add a caption."); return; }
    setUploading(true);
    setError("");

    const user = await base44.auth.me();

    // Upload all clips
    const videoUrls = [];
    for (const clip of clips) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: clip.file });
      videoUrls.push(file_url);
    }

    // Upload thumbnail
    let thumbUrl = null;
    if (thumbnailFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
      thumbUrl = file_url;
    }

    // Collect editing metadata
    const editMetadata = clips.map(c => ({
      trimStart: c.trimStart,
      trimEnd: c.trimEnd,
      speed: c.speed,
      filter: c.filter,
      textOverlays: c.textOverlays,
      transition: c.transition,
    }));

    await base44.entities.Post.create({
      author_email: user.email,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      content,
      media_urls: videoUrls,
      media_type: "video",
      sport: sport || undefined,
      category: category || "other",
      ai_analysis: { edit_metadata: editMetadata, clip_count: clips.length },
      comments_disabled: commentsDisabled,
    });

    navigate(createPageUrl("Reels"));
  };

  const totalDuration = clips.reduce((s, c) => s + Math.max(0, (c.trimEnd || 0) - (c.trimStart || 0)), 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Reels")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black text-slate-900">Create Reel</h1>
        {clips.length > 0 && (
          <Badge className="bg-blue-600 text-white ml-auto">{clips.length} clip{clips.length > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {/* Clip upload zone */}
      {clips.length === 0 ? (
        <div
          onClick={() => addClipRef.current.click()}
          className="w-full aspect-[9/16] max-h-80 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer flex flex-col items-center justify-center gap-3 text-slate-400 transition-all"
        >
          <Film className="w-12 h-12" />
          <p className="font-semibold">Tap to upload video(s)</p>
          <p className="text-sm">MP4, MOV, WebM · Select multiple for multi-clip</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Clip grid */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {clips.map((clip, i) => (
              <div
                key={clip.id}
                onClick={() => { setActiveClipIdx(i); setShowEditor(true); }}
                className={`relative shrink-0 w-24 h-36 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group ${
                  activeClipIdx === i && showEditor ? "border-blue-500 scale-105 shadow-lg" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <video src={clip.objectUrl} className="w-full h-full object-cover" muted preload="metadata" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-1.5 left-1.5">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeClipIdx === i && showEditor ? "bg-blue-500 text-white" : "bg-black/60 text-white"}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="absolute bottom-1.5 inset-x-0 text-center text-white text-[10px] font-mono">
                  {clip.trimEnd > 0 ? `${(clip.trimEnd - clip.trimStart).toFixed(1)}s` : "..."}
                </div>
                {/* badges */}
                <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5">
                  {clip.filter && clip.filter !== "none" && (
                    <span className="text-[8px] bg-purple-500/80 text-white px-1 rounded-full font-bold">FX</span>
                  )}
                  {clip.speed && clip.speed !== 1 && (
                    <span className="text-[8px] bg-orange-500/80 text-white px-1 rounded-full font-bold">{clip.speed}×</span>
                  )}
                  {clip.textOverlays?.length > 0 && (
                    <span className="text-[8px] bg-blue-500/80 text-white px-1 rounded-full font-bold">T</span>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setClips(prev => prev.filter((_, idx) => idx !== i)); if (activeClipIdx >= clips.length - 1) setActiveClipIdx(Math.max(0, clips.length - 2)); }}
                  className="absolute bottom-5 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* Add more */}
            <div
              onClick={() => addClipRef.current.click()}
              className="shrink-0 w-24 h-36 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-400 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-medium">Add clip</span>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs text-slate-600 flex-1">
              {clips.length} clip{clips.length > 1 ? "s" : ""} · {totalDuration > 0 ? `~${totalDuration.toFixed(1)}s total` : "Edit clips for duration"}
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowEditor(s => !s)} className="rounded-xl text-xs h-7 gap-1">
              {showEditor ? <X className="w-3 h-3" /> : <Film className="w-3 h-3" />}
              {showEditor ? "Hide" : "Edit"} Tools
            </Button>
          </div>
        </div>
      )}

      <input ref={addClipRef} type="file" accept="video/*" multiple className="hidden" onChange={handleAddClips} />

      {/* Video Editor */}
      {showEditor && clips.length > 0 && (
        <VideoEditor
          clips={clips}
          onClipsChange={setClips}
          activeClipIdx={activeClipIdx}
          onActiveClipChange={setActiveClipIdx}
          onThumbnailReady={(file, preview) => { setThumbnailFile(file); setThumbnailPreview(preview); }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label>Thumbnail (optional)</Label>
        <div
          onClick={() => thumbRef.current.click()}
          className="relative w-32 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-center overflow-hidden"
        >
          {thumbnailPreview ? (
            <>
              <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover" />
              <button
                onClick={e => { e.stopPropagation(); setThumbnailFile(null); setThumbnailPreview(null); }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              ><X className="w-3 h-3" /></button>
            </>
          ) : (
            <Image className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label>Caption</Label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's this reel about? 🔥" className="rounded-xl resize-none" rows={3} />
      </div>

      {/* Sport & Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Sport</Label>
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport..." /></SelectTrigger>
            <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Category..." /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Reel Assistant */}
      <AIReelAssistant
        sport={sport}
        category={category}
        videoFile={clips[0]?.file}
        caption={content}
        onApplySuggestion={(type, value) => { if (type === "caption") setContent(value); }}
      />

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={uploading || clips.length === 0}
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-base shadow-xl"
      >
        {uploading
          ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading {clips.length} clip{clips.length > 1 ? "s" : ""}…</>
          : <><Upload className="w-5 h-5 mr-2" /> Post Reel{clips.length > 1 ? ` (${clips.length} clips)` : ""}</>
        }
      </Button>
    </div>
  );
}