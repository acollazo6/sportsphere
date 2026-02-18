import React, { useState, useRef } from "base44";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scissors, Loader2, Play, Clock, Save, RotateCcw, Merge, Video, CheckCircle } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

function secondsToTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TrimEditor({ stream, onClose }) {
  const qc = useQueryClient();
  const [range, setRange] = useState([0, 100]); // percentage of duration
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
    qc.invalidateQueries({ queryKey: ["past-streams"] });
    toast.success("Trim saved! VOD updated.");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Video preview placeholder */}
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

      {/* Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5 text-red-700" />Trim Range</span>
          <span className="text-gray-500 text-xs">Total: {secondsToTime(duration)}</span>
        </div>
        <Slider
          value={range}
          onValueChange={setRange}
          min={0}
          max={100}
          step={0.5}
          className="w-full"
        />
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

function MergeSelector({ streams, onMerge }) {
  const [selected, setSelected] = useState([]);
  const [title, setTitle] = useState("");
  const [merging, setMerging] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const merge = async () => {
    if (selected.length < 2) return toast.error("Select at least 2 clips to merge");
    if (!title.trim()) return toast.error("Enter a title for the merged clip");
    setMerging(true);
    const clips = streams.filter(s => selected.includes(s.id));
    // Create a new VOD entry representing merged clips
    await base44.entities.LiveStream.create({
      host_email: clips[0].host_email,
      host_name: clips[0].host_name,
      host_avatar: clips[0].host_avatar,
      title,
      description: `Merged from: ${clips.map(c => c.title).join(", ")}`,
      sport: clips[0].sport,
      status: "ended",
      merged_from_ids: selected,
      started_at: clips[0].started_at,
      ended_at: clips[clips.length - 1].ended_at,
    });
    toast.success(`Merged clip "${title}" created!`);
    setMerging(false);
    setSelected([]);
    setTitle("");
    onMerge();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select 2+ clips to merge into a single VOD</p>
      <div className="space-y-2 max-h-56 overflow-y-auto">
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
      {selected.length >= 2 && (
        <div className="space-y-2 border-t pt-3">
          <Label>Merged Clip Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Basketball Highlights Compilation" className="rounded-xl" />
          <Button onClick={merge} disabled={merging} className="w-full bg-red-900 hover:bg-red-800 rounded-xl font-bold gap-2">
            {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
            Merge {selected.length} Clips
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VODEditor({ user }) {
  const qc = useQueryClient();
  const [activeStream, setActiveStream] = useState(null);
  const [mode, setMode] = useState("trim"); // "trim" | "merge"

  const { data: pastStreams = [], isLoading } = useQuery({
    queryKey: ["past-streams-vod", user?.email],
    queryFn: () => base44.entities.LiveStream.filter({ host_email: user.email, status: "ended" }, "-ended_at", 30),
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-900 text-lg">VOD Editor</h3>
          <p className="text-sm text-gray-500">Trim and merge your past streams</p>
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
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{moment(s.started_at).format("MMM D")}</span>
                  {s.trim_applied && <Badge className="bg-green-100 text-green-700 text-[10px] gap-1"><Scissors className="w-2.5 h-2.5" />Trimmed</Badge>}
                </div>
              </div>
              <Button
                onClick={() => { setActiveStream(s); setMode("trim"); }}
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-xl text-xs font-bold flex-shrink-0"
              >
                <Scissors className="w-3.5 h-3.5" /> Trim
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Trim Dialog */}
      <Dialog open={!!activeStream && mode === "trim"} onOpenChange={() => setActiveStream(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Scissors className="w-5 h-5 text-red-700" /> Trim: {activeStream?.title}
            </DialogTitle>
          </DialogHeader>
          {activeStream && <TrimEditor stream={activeStream} onClose={() => setActiveStream(null)} />}
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mode === "merge" && !activeStream} onOpenChange={() => setMode("trim")}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Merge className="w-5 h-5 text-red-700" /> Merge Clips
            </DialogTitle>
          </DialogHeader>
          <MergeSelector streams={pastStreams} onMerge={() => { setMode("trim"); qc.invalidateQueries({ queryKey: ["past-streams-vod"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}