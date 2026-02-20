import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Film, X, Loader2, Image } from "lucide-react";
import { Link } from "react-router-dom";

const SPORTS = ["Basketball","Soccer","Football","Baseball","Tennis","Golf","Swimming","Boxing","MMA","Track","Volleyball","Hockey","Cycling","Yoga","CrossFit"];
const CATEGORIES = ["training","game","coaching","instruction","motivation","highlight","other"];

export default function CreateReel() {
  const navigate = useNavigate();
  const videoRef = useRef();
  const thumbRef = useRef();

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!videoFile) { setError("Please select a video."); return; }
    if (!content.trim()) { setError("Please add a caption."); return; }
    setUploading(true);
    setError("");

    const user = await base44.auth.me();

    // Upload video
    const { file_url: videoUrl } = await base44.integrations.Core.UploadFile({ file: videoFile });

    // Upload thumbnail if provided
    let thumbUrl = null;
    if (thumbnailFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
      thumbUrl = file_url;
    }

    await base44.entities.Post.create({
      author_email: user.email,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      content,
      media_urls: [videoUrl],
      media_type: "video",
      sport: sport || undefined,
      category: category || "other",
    });

    navigate(createPageUrl("Reels"));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Reels")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black text-slate-900">Create Reel</h1>
      </div>

      {/* Video Upload */}
      <div
        onClick={() => videoRef.current.click()}
        className="relative w-full aspect-[9/16] max-h-80 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all"
      >
        {videoPreview ? (
          <>
            <video src={videoPreview} className="absolute inset-0 w-full h-full object-cover rounded-2xl" controls />
            <button
              onClick={e => { e.stopPropagation(); setVideoFile(null); setVideoPreview(null); }}
              className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Film className="w-12 h-12" />
            <p className="font-semibold">Tap to upload video</p>
            <p className="text-sm">MP4, MOV, WebM</p>
          </div>
        )}
      </div>
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />

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
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <Image className="w-6 h-6 text-slate-400" />
          )}
        </div>
      </div>
      <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />

      {/* Caption */}
      <div className="space-y-2">
        <Label>Caption</Label>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's this reel about? 🔥"
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      {/* Sport */}
      <div className="space-y-2">
        <Label>Sport</Label>
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport..." /></SelectTrigger>
          <SelectContent>
            {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category..." /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-base shadow-xl"
      >
        {uploading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading...</> : <><Upload className="w-5 h-5 mr-2" /> Post Reel</>}
      </Button>
    </div>
  );
}