import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

export default function CreateTrainingPlanDialog({ orgId, coachEmail, coachName, athletes, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", athlete_email: "", athlete_name: "", sport: "", goal: "", start_date: "", end_date: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAthleteSelect = (email) => {
    const athlete = athletes.find(a => a.user_email === email);
    setForm(f => ({ ...f, athlete_email: email, athlete_name: athlete?.user_name || email, sport: athlete?.sport || f.sport }));
  };

  const generateAIPlan = async () => {
    if (!form.athlete_email || !form.goal) return;
    setAiLoading(true);
    const athlete = athletes.find(a => a.user_email === form.athlete_email);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a detailed 4-week training plan for an athlete.

Athlete: ${form.athlete_name || form.athlete_email}
Sport: ${form.sport || athlete?.sport || "General"}
Position/Specialty: ${athlete?.position || "Not specified"}
Level: ${athlete?.level || "intermediate"}
Training Goal: ${form.goal}
Additional notes: ${form.description || "None"}

Generate a structured weekly training plan with specific exercises, sets, reps, and duration for each day. Include rest days. Be practical and sport-specific.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          weeks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week_number: { type: "number" },
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      exercises: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            sets: { type: "number" },
                            reps: { type: "string" },
                            duration: { type: "string" },
                            notes: { type: "string" }
                          }
                        }
                      },
                      notes: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    setForm(f => ({
      ...f,
      title: result.title || f.title,
      description: result.description || f.description,
      _weeks: result.weeks || [],
    }));
    setAiLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    await base44.entities.TrainingPlan.create({
      organization_id: orgId,
      coach_email: coachEmail,
      coach_name: coachName,
      athlete_email: form.athlete_email,
      athlete_name: form.athlete_name,
      title: form.title,
      description: form.description,
      sport: form.sport,
      goal: form.goal,
      start_date: form.start_date,
      end_date: form.end_date,
      status: "active",
      weeks: form._weeks || [],
      ai_generated: !!form._weeks?.length,
    });
    setLoading(false);
    onCreated();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Create Training Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Athlete *</Label>
            <Select value={form.athlete_email} onValueChange={handleAthleteSelect}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select athlete" /></SelectTrigger>
              <SelectContent>
                {athletes.map(a => <SelectItem key={a.user_email} value={a.user_email}>{a.user_name || a.user_email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Training Goal *</Label>
            <Textarea placeholder="e.g. Improve vertical jump and shooting accuracy for upcoming season..." value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} className="rounded-xl" rows={2} />
          </div>

          <Button
            onClick={generateAIPlan}
            disabled={aiLoading || !form.athlete_email || !form.goal}
            variant="outline"
            className="w-full rounded-xl border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold gap-2"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? "Generating AI Plan..." : "Generate Plan with AI"}
          </Button>

          {form._weeks?.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700">✅ AI generated a {form._weeks.length}-week plan</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Plan Title *</Label>
            <Input placeholder="e.g. Pre-Season Basketball Conditioning" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="rounded-xl" />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading || !form.title || !form.athlete_email} className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}