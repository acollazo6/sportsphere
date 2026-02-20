import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Music, Scissors, Zap, ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";

const TRENDING_AUDIO = [
  { title: "Epic Sports Anthem", genre: "Cinematic", bpm: 128, mood: "Hype", emoji: "🎵" },
  { title: "Training Montage Beat", genre: "Hip-Hop", bpm: 100, mood: "Motivational", emoji: "🔥" },
  { title: "Victory Lap", genre: "Electronic", bpm: 140, mood: "Triumphant", emoji: "🏆" },
  { title: "Raw Hustle", genre: "Trap", bpm: 85, mood: "Intense", emoji: "💪" },
  { title: "Champion Mindset", genre: "Orchestral", bpm: 110, mood: "Inspiring", emoji: "⭐" },
  { title: "Game Day Vibes", genre: "Pop", bpm: 120, mood: "Energetic", emoji: "🎯" },
];

export default function AIReelAssistant({ sport, category, videoFile, caption, onApplySuggestion }) {
  const [open, setOpen] = useState(false);
  const [loadingHighlight, setLoadingHighlight] = useState(false);
  const [loadingEditing, setLoadingEditing] = useState(false);
  const [highlightSuggestion, setHighlightSuggestion] = useState(null);
  const [editingSuggestions, setEditingSuggestions] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const trendingAudio = React.useMemo(() => {
    // Filter/sort audio based on sport/category context
    if (!sport && !category) return TRENDING_AUDIO;
    const hypeCategories = ["game", "highlight", "motivation"];
    const calmCategories = ["coaching", "instruction", "training"];
    if (hypeCategories.includes(category)) {
      return [...TRENDING_AUDIO].sort((a, b) => b.bpm - a.bpm);
    }
    if (calmCategories.includes(category)) {
      return [...TRENDING_AUDIO].sort((a, b) => a.bpm - b.bpm);
    }
    return TRENDING_AUDIO;
  }, [sport, category]);

  const generateHighlightSuggestion = async () => {
    setLoadingHighlight(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert sports video editor. A user has uploaded a video reel for the sport "${sport || "general sports"}" in the category "${category || "general"}". Their caption is: "${caption || "no caption"}".

Generate specific highlight reel suggestions including:
1. Which moments to keep (e.g., "Keep the first 3 seconds for the intro hook")
2. Which parts to trim for maximum impact
3. How to structure the highlight for best engagement

Return a JSON with these fields:
- hook: string (first 1-2 seconds suggestion for grabbing attention)
- keep_moments: array of strings (key moments to preserve)
- trim_suggestions: array of strings (what to cut)
- optimal_length: string (recommended duration)
- caption_suggestion: string (improved caption suggestion)`,
      response_json_schema: {
        type: "object",
        properties: {
          hook: { type: "string" },
          keep_moments: { type: "array", items: { type: "string" } },
          trim_suggestions: { type: "array", items: { type: "string" } },
          optimal_length: { type: "string" },
          caption_suggestion: { type: "string" }
        }
      }
    });
    setHighlightSuggestion(result);
    setLoadingHighlight(false);
  };

  const generateEditingSuggestions = async () => {
    setLoadingEditing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional sports video editor. Generate specific editing suggestions for a "${sport || "sports"}" reel in the "${category || "general"}" category.

Return JSON with:
- transitions: array of objects with {type: string, when: string, effect: string}
- speed_adjustments: array of objects with {moment: string, speed: string, reason: string}
- color_grade: string (suggested color grading style)
- text_overlays: array of strings (suggested text/caption moments)
- overall_tip: string`,
      response_json_schema: {
        type: "object",
        properties: {
          transitions: { type: "array", items: { type: "object" } },
          speed_adjustments: { type: "array", items: { type: "object" } },
          color_grade: { type: "string" },
          text_overlays: { type: "array", items: { type: "string" } },
          overall_tip: { type: "string" }
        }
      }
    });
    setEditingSuggestions(result);
    setLoadingEditing(false);
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-900">AI Reel Assistant</span>
          <Badge className="bg-blue-600 text-white text-xs">New</Badge>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-blue-200">

          {/* 1. Highlight Reel Generator */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-800">Auto Highlight Suggestions</h3>
            </div>
            <p className="text-xs text-slate-500">AI analyzes your sport & category to suggest the best moments to keep.</p>
            <Button
              onClick={generateHighlightSuggestion}
              disabled={loadingHighlight}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2"
            >
              {loadingHighlight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loadingHighlight ? "Analyzing..." : "Generate Highlight Plan"}
            </Button>
            {highlightSuggestion && (
              <div className="space-y-2 bg-white rounded-xl p-3 border border-indigo-100">
                <div>
                  <p className="text-xs font-bold text-indigo-700 mb-1">🎣 Hook (first seconds)</p>
                  <p className="text-xs text-slate-700">{highlightSuggestion.hook}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-700 mb-1">✅ Keep These Moments</p>
                  <ul className="space-y-1">
                    {highlightSuggestion.keep_moments?.map((m, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-1.5"><Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-700 mb-1">✂️ Trim These</p>
                  <ul className="space-y-1">
                    {highlightSuggestion.trim_suggestions?.map((m, i) => (
                      <li key={i} className="text-xs text-slate-500 pl-1">• {m}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">⏱ {highlightSuggestion.optimal_length}</Badge>
                  {highlightSuggestion.caption_suggestion && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 rounded-lg border-indigo-300 text-indigo-700"
                      onClick={() => onApplySuggestion?.("caption", highlightSuggestion.caption_suggestion)}
                    >
                      Use Suggested Caption
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Trending Audio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-pink-600" />
              <h3 className="font-bold text-sm text-slate-800">Trending Audio Picks</h3>
              {sport && <Badge variant="outline" className="text-xs text-pink-600 border-pink-300">For {sport}</Badge>}
            </div>
            <div className="space-y-2">
              {trendingAudio.map((track, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAudio(selectedAudio?.title === track.title ? null : track)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
                    selectedAudio?.title === track.title
                      ? "bg-pink-50 border-pink-400 shadow-sm"
                      : "bg-white border-slate-200 hover:border-pink-300"
                  }`}
                >
                  <span className="text-lg">{track.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{track.title}</p>
                    <p className="text-xs text-slate-400">{track.genre} • {track.bpm} BPM • {track.mood}</p>
                  </div>
                  {selectedAudio?.title === track.title && (
                    <Check className="w-4 h-4 text-pink-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {selectedAudio && (
              <p className="text-xs text-pink-600 font-medium">🎵 "{selectedAudio.title}" noted — add this track in your video editor before uploading!</p>
            )}
          </div>

          {/* 3. AI Editing Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800">AI Editing Suggestions</h3>
            </div>
            <p className="text-xs text-slate-500">Get transition styles, speed ramps, and color grading tips for your sport.</p>
            <Button
              onClick={generateEditingSuggestions}
              disabled={loadingEditing}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2"
            >
              {loadingEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {loadingEditing ? "Generating..." : "Get Editing Tips"}
            </Button>
            {editingSuggestions && (
              <div className="space-y-3 bg-white rounded-xl p-3 border border-amber-100">
                {editingSuggestions.transitions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-amber-700 mb-1.5">🎬 Transitions</p>
                    {editingSuggestions.transitions.slice(0, 3).map((t, i) => (
                      <div key={i} className="text-xs text-slate-600 mb-1">
                        <span className="font-semibold">{t.type}:</span> {t.when} — {t.effect}
                      </div>
                    ))}
                  </div>
                )}
                {editingSuggestions.speed_adjustments?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-blue-700 mb-1.5">⚡ Speed Adjustments</p>
                    {editingSuggestions.speed_adjustments.slice(0, 3).map((s, i) => (
                      <div key={i} className="text-xs text-slate-600 mb-1">
                        <span className="font-semibold">{s.moment}:</span> {s.speed} — {s.reason}
                      </div>
                    ))}
                  </div>
                )}
                {editingSuggestions.color_grade && (
                  <div>
                    <p className="text-xs font-bold text-purple-700 mb-1">🎨 Color Grade</p>
                    <p className="text-xs text-slate-600">{editingSuggestions.color_grade}</p>
                  </div>
                )}
                {editingSuggestions.overall_tip && (
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs font-bold text-amber-800">💡 Pro Tip</p>
                    <p className="text-xs text-amber-700 mt-0.5">{editingSuggestions.overall_tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}