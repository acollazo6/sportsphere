import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Scissors, Loader2, Play, Clock, Save, RotateCcw, Merge, Video,
  CheckCircle, GripVertical, ChevronUp, ChevronDown, Plus, Trash2, Type, Film
} from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

function secondsToTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Trim Editor ─────────────────────────────────────────────────────────────
function TrimEditor({ stream, onClose }) {
  const qc = useQueryClient();
  const [range, setRange] = useState([0, 100]);
  const [saving, setSaving] = useState(false);
  const duration = stream.duration_seconds || 3600;
  const startSec = Math.round((range[0] / 100) * duration);
  const endSec = Math.round((range[1] / 100) * duration);

  const save = async () => {
    setSaving(true);
    await base44.entities.LiveStream.update(stream.id, {
      trim_start_seconds: startSec,
      trim_end_seconds: endSec,
      trim_applied: true,
    });
    qc.invalidateQueries({ queryKey: ["past-streams-vod"] });
    toast.success("Trim saved! VOD updated.");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
        {stream.stream_url ? (
          <iframe src={stream.stream_url} className="w-full h-full" allowFullScreen />
        ) : (
          <div className="text-center text-slate-400">
            <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No video preview available</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5 text-red-700" />Trim Range</span>
          <span className="text-gray-500 text-xs">Total: {secondsToTime(duration)}</span>
        </div>
        <Slider value={range} onValueChange={setRange} min={0} max={100} step={0.5} className="w-full" />
        <div className="flex items-center justify-between text-sm">
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-gray-500">Start</span>
            <p className="font-bold text-gray-900">{secondsToTime(startSec)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Duration</p>
            <p className="font-bold text-red-800">{secondsToTime(endSec - startSec)}</p>
          </div>
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-right">
            <span className="text-xs text-gray-500">End</span>
            <p className="font-bold text-gray-900">{secondsToTime(endSec)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="flex-1 bg-red-900 hover:bg-red-800 rounded-xl font-bold gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Trim
        </Button>
        <Button onClick={() => setRange([0, 100])} variant="outline" className="rounded-xl gap-2">
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>
    </div>
  );
}

// ─── Merge Selector with ordering + transitions ───────────────────────────────
const TRANSITIONS = [
  { value: "none", label: "None (Hard Cut)" },
  { value: "fade", label: "Fade to Black" },
  { value: "crossfade", label: "Crossfade" },
  { value: "slide", label: "Slide" },
  { value: "wipe", label: "Wipe" },
];

function MergeSelector({ streams, onMerge }) {
  const [selected, setSelected] = useState([]); // ordered array of stream ids
  const [title, setTitle] = useState("");
  const [transition, setTransition] = useState("fade");
  const [merging, setMerging] = useState(false);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setSelected(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index) => {
    setSelected(prev => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const merge = async () => {
    if (selected.length < 2) return toast.error("Select at least 2 clips to merge");
    if (!title.trim()) return toast.error("Enter a title for the merged clip");
    setMerging(true);
    const clips = selected.map(id => streams.find(s => s.id === id)).filter(Boolean);
    await base44.entities.LiveStream.create({
      host_email: clips[0].host_email,
      host_name: clips[0].host_name,
      host_avatar: clips[0].host_avatar,
      title,
      description: `Merged from: ${clips.map(c => c.title).join(", ")}. Transition: ${transition}`,
      sport: clips[0].sport,
      status: "ended",
      merged_from_ids: selected,
      merge_transition: transition,
      started_at: clips[0].started_at,
      ended_at: clips[clips.length - 1].ended_at,
    });
    toast.success(`Merged clip "${title}" created!`);
    setMerging(false);
    setSelected([]);
    setTitle("");
    onMerge();
  };

  const streamMap = Object.fromEntries(streams.map(s => [s.id, s]));

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Select clips and arrange their order</p>

      {/* Available clips */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {streams.slice(0, 20).map(s => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selected.includes(s.id) ? "border-red-700 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected.includes(s.id) ? "border-red-700 bg-red-700" : "border-gray-300"}`}>
              {selected.includes(s.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
              <p className="text-xs text-gray-500">{moment(s.started_at).format("MMM D, YYYY")}</p>
            </div>
            {s.sport && <Badge variant="secondary" className="text-[10px]">{s.sport}</Badge>}
          </button>
        ))}
      </div>

      {/* Ordered clips */}
      {selected.length >= 1 && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" /> Clip Order
          </p>
          <div className="space-y-1.5">
            {selected.map((id, idx) => {
              const s = streamMap[id];
              if (!s) return null;
              return (
                <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <span className="text-xs font-black text-red-800 w-5 text-center">{idx + 1}</span>
                  <p className="flex-1 text-sm font-medium text-gray-800 truncate">{s.title}</p>
                  {idx < selected.length - 1 && (
                    <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">{TRANSITIONS.find(t => t.value === transition)?.label?.split(" ")[0]}</Badge>
                  )}
                  <div className="flex gap-0.5">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === selected.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transition picker */}
          <div>
            <Label className="text-xs font-bold text-gray-700 mb-1.5 block">Transition Between Clips</Label>
            <Select value={transition} onValueChange={setTransition}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected.length >= 2 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 block">Merged Clip Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Basketball Highlights Compilation" className="rounded-xl" />
              <Button onClick={merge} disabled={merging} className="w-full bg-red-900 hover:bg-red-800 rounded-xl font-bold gap-2">
                {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                Merge {selected.length} Clips
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Text Overlay / Annotations Editor ───────────────────────────────────────
const OVERLAY_POSITIONS = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

const OVERLAY_STYLES = [
  { value: "white", label: "White", bg: "bg-white", text: "text-black" },
  { value: "black", label: "Dark", bg: "bg-black", text: "text-white" },
  { value: "red", label: "Red", bg: "bg-red-700", text: "text-white" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-400", text: "text-black" },
];

function AnnotationsEditor({ stream, onClose }) {
  const qc = useQueryClient();
  const existingOverlays = stream.text_overlays || [];
  const [overlays, setOverlays] = useState(existingOverlays);
  const [saving, setSaving] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPosition, setNewPosition] = useState("bottom-center");
  const [newStyle, setNewStyle] = useState("white");
  const [newTimestamp, setNewTimestamp] = useState("0");

  const addOverlay = () => {
    if (!newText.trim()) return toast.error("Enter overlay text");
    setOverlays(prev => [...prev, {
      id: Date.now().toString(),
      text: newText.trim(),
      position: newPosition,
      style: newStyle,
      timestamp_seconds: parseInt(newTimestamp) || 0,
    }]);
    setNewText("");
    setNewTimestamp("0");
  };

  const removeOverlay = (id) => setOverlays(prev => prev.filter(o => o.id !== id));

  const save = async () => {
    setSaving(true);
    await base44.entities.LiveStream.update(stream.id, { text_overlays: overlays });
    qc.invalidateQueries({ queryKey: ["past-streams-vod"] });
    toast.success("Text overlays saved!");
    setSaving(false);
    onClose();
  };

  const styleObj = OVERLAY_STYLES.find(s => s.value === newStyle);

  return (
    <div className="space-y-5">
      {/* Preview area */}
      <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
        <div className="text-center text-slate-400">
          <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Overlay preview</p>
        </div>
        {/* Show overlays in preview */}
        {overlays.map(o => {
          const pos = {
            "top-left": "top-2 left-2",
            "top-center": "top-2 left-1/2 -translate-x-1/2",
            "top-right": "top-2 right-2",
            "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "bottom-left": "bottom-2 left-2",
            "bottom-center": "bottom-2 left-1/2 -translate-x-1/2",
            "bottom-right": "bottom-2 right-2",
          }[o.position] || "bottom-2 left-1/2 -translate-x-1/2";
          const st = OVERLAY_STYLES.find(s => s.value === o.style);
          return (
            <div key={o.id} className={`absolute ${pos} px-2 py-1 rounded text-xs font-bold ${st?.bg || "bg-white"} ${st?.text || "text-black"} opacity-90`}>
              {o.text}
              {o.timestamp_seconds > 0 && <span className="ml-1 opacity-60">@{secondsToTime(o.timestamp_seconds)}</span>}
            </div>
          );
        })}
      </div>

      {/* Add new overlay */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> Add Text Overlay
        </p>
        <Textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Enter overlay text (e.g. 'Incredible goal! 🔥')"
          className="rounded-xl resize-none text-sm"
          rows={2}
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px] font-bold text-gray-500 mb-1 block">Position</Label>
            <Select value={newPosition} onValueChange={setNewPosition}>
              <SelectTrigger className="rounded-lg text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OVERLAY_POSITIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-bold text-gray-500 mb-1 block">Style</Label>
            <Select value={newStyle} onValueChange={setNewStyle}>
              <SelectTrigger className="rounded-lg text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OVERLAY_STYLES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-bold text-gray-500 mb-1 block">At (seconds)</Label>
            <Input
              type="number"
              value={newTimestamp}
              onChange={e => setNewTimestamp(e.target.value)}
              className="rounded-lg text-xs h-8"
              min={0}
            />
          </div>
        </div>
        {newText && (
          <div className={`inline-flex px-2 py-1 rounded text-xs font-bold ${styleObj?.bg} ${styleObj?.text}`}>
            {newText}
          </div>
        )}
        <Button onClick={addOverlay} variant="outline" size="sm" className="w-full rounded-xl gap-2 font-bold">
          <Plus className="w-4 h-4" /> Add Overlay
        </Button>
      </div>

      {/* Existing overlays list */}
      {overlays.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Overlays ({overlays.length})</p>
          {overlays.map(o => {
            const st = OVERLAY_STYLES.find(s => s.value === o.style);
            return (
              <div key={o.id} className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl">
                <div className={`px-2 py-0.5 rounded text-xs font-bold ${st?.bg} ${st?.text} flex-shrink-0`}>
                  {o.text.length > 20 ? o.text.slice(0, 20) + "…" : o.text}
                </div>
                <span className="text-xs text-gray-400 flex-1">{OVERLAY_POSITIONS.find(p => p.value === o.position)?.label} · @{secondsToTime(o.timestamp_seconds)}</span>
                <button onClick={() => removeOverlay(o.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={save} disabled={saving} className="flex-1 bg-red-900 hover:bg-red-800 rounded-xl font-bold gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Overlays
        </Button>
        <Button onClick={onClose} variant="outline" className="rounded-xl">Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main VODEditor ────────────────────────────────────────────────────────────
export default function VODEditor({ user }) {
  const qc = useQueryClient();
  const [activeStream, setActiveStream] = useState(null);
  const [mode, setMode] = useState(null); // "trim" | "merge" | "annotate"

  const { data: pastStreams = [], isLoading } = useQuery({
    queryKey: ["past-streams-vod", user?.email],
    queryFn: () => base44.entities.LiveStream.filter({ host_email: user.email, status: "ended" }, "-ended_at", 30),
    enabled: !!user,
  });

  const closeAll = () => { setActiveStream(null); setMode(null); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-900 text-lg">VOD Editor</h3>
          <p className="text-sm text-gray-500">Trim, merge, and annotate your past streams</p>
        </div>
        <Button
          onClick={() => { setActiveStream(null); setMode("merge"); }}
          variant="outline"
          className="gap-2 rounded-xl border-gray-300 font-bold text-sm"
        >
          <Merge className="w-4 h-4" /> Merge Clips
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : pastStreams.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No past streams to edit</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {pastStreams.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 hover:border-red-200 transition-all">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{s.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                  <Clock className="w-3 h-3" />
                  <span>{moment(s.started_at).format("MMM D")}</span>
                  {s.trim_applied && <Badge className="bg-green-100 text-green-700 text-[10px] gap-1"><Scissors className="w-2.5 h-2.5" />Trimmed</Badge>}
                  {s.text_overlays?.length > 0 && <Badge className="bg-blue-100 text-blue-700 text-[10px] gap-1"><Type className="w-2.5 h-2.5" />{s.text_overlays.length} overlays</Badge>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  onClick={() => { setActiveStream(s); setMode("trim"); }}
                  size="sm"
                  variant="outline"
                  className="gap-1 rounded-xl text-xs font-bold px-2"
                  title="Trim"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={() => { setActiveStream(s); setMode("annotate"); }}
                  size="sm"
                  variant="outline"
                  className="gap-1 rounded-xl text-xs font-bold px-2"
                  title="Add Text Overlays"
                >
                  <Type className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trim Dialog */}
      <Dialog open={mode === "trim" && !!activeStream} onOpenChange={closeAll}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Scissors className="w-5 h-5 text-red-700" /> Trim: {activeStream?.title}
            </DialogTitle>
          </DialogHeader>
          {activeStream && <TrimEditor stream={activeStream} onClose={closeAll} />}
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mode === "merge"} onOpenChange={closeAll}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Merge className="w-5 h-5 text-red-700" /> Merge Clips
            </DialogTitle>
          </DialogHeader>
          <MergeSelector streams={pastStreams} onMerge={() => { closeAll(); qc.invalidateQueries({ queryKey: ["past-streams-vod"] }); }} />
        </DialogContent>
      </Dialog>

      {/* Annotations Dialog */}
      <Dialog open={mode === "annotate" && !!activeStream} onOpenChange={closeAll}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Type className="w-5 h-5 text-red-700" /> Text Overlays: {activeStream?.title}
            </DialogTitle>
          </DialogHeader>
          {activeStream && <AnnotationsEditor stream={activeStream} onClose={closeAll} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}