import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const SPORTS = ["Basketball", "Soccer", "Football", "Tennis", "Running", "Cycling", "Gym/Fitness", "Yoga", "Swimming", "Boxing", "Other"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];

export default function CreateChallengeDialog({ user, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "",
    duration_days: 30,
    goal_description: "",
    difficulty: "intermediate",
    start_date: new Date().toISOString().split("T")[0],
    image_url: "",
    is_premium: false,
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.duration_days) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + formData.duration_days);

      const status = new Date() >= startDate ? "active" : "upcoming";

      await base44.entities.Challenge.create({
        ...formData,
        creator_email: user.email,
        creator_name: user.full_name,
        creator_avatar: user.avatar_url,
        end_date: endDate.toISOString().split("T")[0],
        status,
        participants_count: 0,
      });

      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenge created!");
      onClose();
    } catch (error) {
      toast.error("Failed to create challenge");
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-cyan-400/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">Create New Challenge</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Challenge Title*</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="30-Day Push-up Challenge"
              className="bg-slate-800 border-cyan-400/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description*</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the challenge, rules, and what participants will achieve..."
              className="bg-slate-800 border-cyan-400/20 text-white resize-none"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Sport</Label>
              <Select value={formData.sport} onValueChange={v => setFormData({ ...formData, sport: v })}>
                <SelectTrigger className="bg-slate-800 border-cyan-400/20 text-white">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={v => setFormData({ ...formData, difficulty: v })}>
                <SelectTrigger className="bg-slate-800 border-cyan-400/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Duration (days)*</Label>
              <Input
                type="number"
                value={formData.duration_days}
                onChange={e => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-cyan-400/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Start Date*</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-slate-800 border-cyan-400/20 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Goal Description</Label>
            <Textarea
              value={formData.goal_description}
              onChange={e => setFormData({ ...formData, goal_description: e.target.value })}
              placeholder="What should participants aim to achieve? (e.g., 100 push-ups per day)"
              className="bg-slate-800 border-cyan-400/20 text-white resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Challenge Image</Label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-cyan-400/30 rounded-xl hover:border-cyan-400/50 cursor-pointer transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-slate-300">Upload Image</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {formData.image_url && (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-cyan-400/30">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-cyan-400/20">
            <div>
              <Label className="text-slate-300">Premium Only</Label>
              <p className="text-xs text-slate-500">Restrict to premium subscribers</p>
            </div>
            <Switch
              checked={formData.is_premium}
              onCheckedChange={v => setFormData({ ...formData, is_premium: v })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Challenge"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}