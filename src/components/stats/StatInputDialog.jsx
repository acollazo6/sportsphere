import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, TrendingUp } from "lucide-react";

const SPORT_METRICS = {
  Basketball: [
    { name: "Points", unit: "pts" },
    { name: "Rebounds", unit: "reb" },
    { name: "Assists", unit: "ast" },
    { name: "Steals", unit: "stl" },
    { name: "Blocks", unit: "blk" },
    { name: "Field Goal %", unit: "%" },
    { name: "3-Point %", unit: "%" },
  ],
  Soccer: [
    { name: "Goals", unit: "goals" },
    { name: "Assists", unit: "ast" },
    { name: "Shots on Target", unit: "shots" },
    { name: "Passes Completed", unit: "passes" },
    { name: "Distance Covered", unit: "km" },
  ],
  Track: [
    { name: "Distance", unit: "m" },
    { name: "Time", unit: "sec" },
    { name: "Pace", unit: "min/km" },
    { name: "Heart Rate Avg", unit: "bpm" },
  ],
  Swimming: [
    { name: "Distance", unit: "m" },
    { name: "Time", unit: "sec" },
    { name: "Stroke Rate", unit: "spm" },
    { name: "Laps", unit: "laps" },
  ],
  Boxing: [
    { name: "Punches Thrown", unit: "punches" },
    { name: "Punches Landed", unit: "punches" },
    { name: "Rounds", unit: "rounds" },
    { name: "Accuracy", unit: "%" },
  ],
  Tennis: [
    { name: "Aces", unit: "aces" },
    { name: "Winners", unit: "winners" },
    { name: "Unforced Errors", unit: "errors" },
    { name: "First Serve %", unit: "%" },
  ],
  Golf: [
    { name: "Score", unit: "strokes" },
    { name: "Fairways Hit", unit: "fairways" },
    { name: "Greens in Regulation", unit: "greens" },
    { name: "Putts", unit: "putts" },
  ],
};

export default function StatInputDialog({ open, onClose, sportProfile, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState("training");
  const [metrics, setMetrics] = useState([]);
  const [notes, setNotes] = useState("");

  const availableMetrics = SPORT_METRICS[sportProfile?.sport] || [];

  const addMetric = () => {
    setMetrics([...metrics, { name: "", value: "", unit: "" }]);
  };

  const updateMetric = (index, field, value) => {
    const updated = [...metrics];
    updated[index][field] = value;
    
    // Auto-fill unit when selecting a predefined metric
    if (field === "name") {
      const predefined = availableMetrics.find(m => m.name === value);
      if (predefined) {
        updated[index].unit = predefined.unit;
      }
    }
    
    setMetrics(updated);
  };

  const removeMetric = (index) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validMetrics = metrics.filter(m => m.name && m.value);
    if (validMetrics.length === 0) return;

    onSave({
      date,
      session_type: sessionType,
      metrics: validMetrics.map(m => ({
        name: m.name,
        value: parseFloat(m.value),
        unit: m.unit,
      })),
      notes,
    });

    // Reset form
    setDate(new Date().toISOString().split("T")[0]);
    setSessionType("training");
    setMetrics([]);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Log Stats - {sportProfile?.sport}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-500">Performance Metrics</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addMetric}
                className="h-7 gap-1 text-xs rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Metric
              </Button>
            </div>

            {metrics.map((metric, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <Select
                    value={metric.name}
                    onValueChange={v => updateMetric(index, "name", v)}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMetrics.map(m => (
                        <SelectItem key={m.name} value={m.name} className="text-xs">
                          {m.name} ({m.unit})
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={metric.value}
                  onChange={e => updateMetric(index, "value", e.target.value)}
                  placeholder="Value"
                  className="w-24 rounded-xl h-9 text-xs"
                />
                <Input
                  value={metric.unit}
                  onChange={e => updateMetric(index, "unit", e.target.value)}
                  placeholder="Unit"
                  className="w-20 rounded-xl h-9 text-xs"
                />
                <button
                  onClick={() => removeMetric(index)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}

            {metrics.length === 0 && (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">No metrics added yet</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it feel? Any observations..."
              className="rounded-xl resize-none text-xs"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={metrics.filter(m => m.name && m.value).length === 0}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white"
          >
            Save Stats
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}