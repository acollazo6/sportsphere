import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Scissors, Sparkles, Share2, Twitter, Copy, Check,
  Zap, BookOpen, Heart, Info, Clock, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_CONFIG = {
  instagram_reels: { label: "Instagram Reels", color: "bg-pink-100 text-pink-700", icon: "📸" },
  tiktok: { label: "TikTok", color: "bg-slate-900 text-white", icon: "🎵" },
  twitter: { label: "Twitter / X", color: "bg-sky-100 text-sky-700", icon: "🐦" },
};

const ENERGY_CONFIG = {
  explosive: { label: "Explosive", color: "bg-red-100 text-red-700", icon: Zap },
  technical: { label: "Technical", color: "bg-blue-100 text-blue-700", icon: BookOpen },
  inspirational: { label: "Inspirational", color: "bg-purple-100 text-purple-700", icon: Heart },
  informative: { label: "Informative", color: "bg-green-100 text-green-700", icon: Info },
};

function ShareDialog({ clip, stream, open, onClose }) {
  const [copied, setCopied] = useState(null);

  const streamUrl = `${window.location.origin}/view-live?id=${stream?.id}`;
  const sport = stream?.sport ? `#${stream.sport.replace(/\s+/g, '')} ` : "";
  const hashtags = clip?.hashtags?.map(h => `#${h}`).join(" ") || "";
  const fullCaption = `${clip?.caption}\n\n${sport}${hashtags}\n\n🎬 Watch full stream: ${streamUrl}`;

  const shareOptions = [
    {
      key: "twitter",
      label: "Share on X / Twitter",
      icon: "🐦",
      color: "bg-sky-500 hover:bg-sky-600 text-white",
      action: () => {
        const text = encodeURIComponent(`${clip?.caption} ${sport}${hashtags}`);
        const url = encodeURIComponent(streamUrl);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
      }
    },
    {
      key: "instagram",
      label: "Copy for Instagram",
      icon: "📸",
      color: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white",
      action: () => copyText("instagram", fullCaption)
    },
    {
      key: "tiktok",
      label: "Copy for TikTok",
      icon: "🎵",
      color: "bg-slate-900 hover:bg-slate-800 text-white",
      action: () => copyText("tiktok", fullCaption)
    },
    {
      key: "copy",
      label: "Copy Link",
      icon: "🔗",
      color: "bg-gray-100 hover:bg-gray-200 text-gray-800",
      action: () => copyText("copy", streamUrl)
    },
  ];

  const copyText = async (key, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Highlight Clip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Clip info */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="font-bold text-sm text-slate-900">{clip?.title}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {clip?.start_time} – {clip?.end_time}
            </p>
          </div>

          {/* Caption preview */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Caption Preview</p>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
              {fullCaption}
            </div>
          </div>

          {/* Share buttons */}
          <div className="space-y-2">
            {shareOptions.map(opt => (
              <button
                key={opt.key}
                onClick={opt.action}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${opt.color}`}
              >
                <span className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  {opt.label}
                </span>
                {copied === opt.key ? (
                  <Check className="w-4 h-4" />
                ) : opt.key === "twitter" ? (
                  <ExternalLink className="w-4 h-4 opacity-70" />
                ) : (
                  <Copy className="w-4 h-4 opacity-70" />
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HighlightClipGenerator({ stream }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareClip, setShareClip] = useState(null);
  const [generated, setGenerated] = useState(false);

  const hasAiData = stream?.ai_summary || stream?.ai_tags?.length > 0;

  const generateClips = async () => {
    if (!stream) return;
    setLoading(true);

    // Parse highlights from the stream's ai analysis if stored, or pass summary
    const highlights = stream.ai_analysis?.key_moments || [];

    const res = await base44.functions.invoke("generateHighlightClips", {
      stream_id: stream.id,
      stream_title: stream.title,
      stream_sport: stream.sport,
      stream_description: stream.description,
      ai_summary: stream.ai_summary,
      highlights,
      duration_hint: stream.ended_at && stream.started_at
        ? Math.round((new Date(stream.ended_at) - new Date(stream.started_at)) / 60000)
        : 60,
    });

    setLoading(false);

    if (res.data?.clips?.length > 0) {
      setClips(res.data.clips);
      setGenerated(true);
      toast.success(`${res.data.clips.length} highlight clips generated!`);
    } else {
      toast.error("Could not generate clips. Try generating the AI summary first.");
    }
  };

  return (
    <Card className="p-4 bg-slate-900 border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">AI Highlight Clips</h3>
          {clips.length > 0 && (
            <Badge className="bg-blue-600 text-white text-xs">{clips.length}</Badge>
          )}
        </div>

        {!generated && (
          <Button
            size="sm"
            onClick={generateClips}
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Clips</>
            )}
          </Button>
        )}

        {generated && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setClips([]); setGenerated(false); generateClips(); }}
            disabled={loading}
            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Regenerate
          </Button>
        )}
      </div>

      {!hasAiData && !loading && clips.length === 0 && (
        <div className="text-center py-4 text-slate-400 text-sm">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Generate the AI Summary first, then come back to create shareable highlight clips.</p>
        </div>
      )}

      {hasAiData && !generated && !loading && (
        <div className="text-center py-4 text-slate-400 text-sm">
          <Scissors className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Click <span className="text-blue-400 font-semibold">Generate Clips</span> to auto-detect highlight moments and create shareable clips.</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm">Analyzing stream highlights...</p>
        </div>
      )}

      {clips.length > 0 && (
        <div className="space-y-3">
          {clips.map((clip, idx) => {
            const platform = PLATFORM_CONFIG[clip.best_platform] || PLATFORM_CONFIG.twitter;
            const energyCfg = ENERGY_CONFIG[clip.energy] || ENERGY_CONFIG.informative;
            const EnergyIcon = energyCfg.icon;

            return (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-2.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-snug">{clip.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {clip.start_time} – {clip.end_time}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShareClip(clip)}
                    className="flex-shrink-0 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2.5"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                </div>

                {/* Caption */}
                <p className="text-slate-300 text-xs leading-relaxed">{clip.caption}</p>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${platform.color}`}>
                    {platform.icon} {platform.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${energyCfg.color}`}>
                    <EnergyIcon className="w-2.5 h-2.5" />
                    {energyCfg.label}
                  </span>
                </div>

                {/* Hashtags */}
                {clip.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {clip.hashtags.map((tag, i) => (
                      <span key={i} className="text-[10px] text-blue-400 font-medium">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {shareClip && (
        <ShareDialog
          clip={shareClip}
          stream={stream}
          open={!!shareClip}
          onClose={() => setShareClip(null)}
        />
      )}
    </Card>
  );
}