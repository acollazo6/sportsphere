import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Dumbbell } from "lucide-react";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Golf", "Swimming", "Boxing", "MMA", "Track", "Volleyball", "Hockey", "Cycling", "Yoga", "CrossFit", "Other"];

export default function ProgramDialog({ open, onClose, onSave, user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [exercises, setExercises] = useState([]);

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: "10", rest_seconds: 60, notes: "" }]);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title || !sport || exercises.length === 0) return;

    onSave({
      creator_email: user.email,
      creator_name: user.full_name,
      title,
      description,
      sport,
      difficulty,
      duration_weeks: durationWeeks,
      exercises: exercises.filter(e => e.name),
      followers: [],
      is_public: true,
    });

    // Reset
    setTitle("");
    setDescription("");
    setSport("");
    setDifficulty("beginner");
    setDurationWeeks(4);
    setExercises([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-500" />
            Create Training Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Program Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 12-Week Basketball Strength Program" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What will this program help achieve?" className="rounded-xl resize-none" rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (weeks)</Label>
              <Input type="number" value={durationWeeks} onChange={e => setDurationWeeks(parseInt(e.target.value))} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Button size="sm" variant="outline" onClick={addExercise} className="h-7 gap-1 text-xs rounded-lg">
                <Plus className="w-3 h-3" /> Add Exercise
              </Button>
            </div>

            {exercises.map((ex, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex gap-2">
                  <Input value={ex.name} onChange={e => updateExercise(i, "name", e.target.value)} placeholder="Exercise name" className="flex-1 rounded-lg h-9 text-sm" />
                  <button onClick={() => removeExercise(i)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" value={ex.sets} onChange={e => updateExercise(i, "sets", parseInt(e.target.value))} placeholder="Sets" className="rounded-lg h-8 text-xs" />
                  <Input value={ex.reps} onChange={e => updateExercise(i, "reps", e.target.value)} placeholder="Reps" className="rounded-lg h-8 text-xs" />
                  <Input type="number" value={ex.rest_seconds} onChange={e => updateExercise(i, "rest_seconds", parseInt(e.target.value))} placeholder="Rest (s)" className="rounded-lg h-8 text-xs" />
                </div>
                <Input value={ex.notes} onChange={e => updateExercise(i, "notes", e.target.value)} placeholder="Notes (optional)" className="rounded-lg h-8 text-xs" />
              </div>
            ))}

            {exercises.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">No exercises added yet</p>
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={!title || !sport || exercises.filter(e => e.name).length === 0} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white">
            Create Program
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}