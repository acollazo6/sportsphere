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
const SESSION_TYPES = ["coaching", "workshop", "qa", "training", "masterclass"];

export default function CreateSessionDialog({ user, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "",
    session_type: "coaching",
    scheduled_date: "",
    duration_minutes: 60,
    is_paid: false,
    price: 0,
    max_participants: null,
    image_url: "",
    meeting_link: "",
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
    if (!formData.title || !formData.scheduled_date) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.CoachingSession.create({
        ...formData,
        host_email: user.email,
        host_name: user.full_name,
        host_avatar: user.avatar_url,
        status: "scheduled",
        participants: [],
      });

      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
      toast.success("Session created!");
      onClose();
    } catch (error) {
      toast.error("Failed to create session");
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create Coaching Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Session Title*</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="1-on-1 Basketball Training Session"
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Description*</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what participants will learn and what to expect..."
              className="border-gray-300 resize-none"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Sport</Label>
              <Select value={formData.sport} onValueChange={v => setFormData({ ...formData, sport: v })}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Session Type</Label>
              <Select value={formData.session_type} onValueChange={v => setFormData({ ...formData, session_type: v })}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Date & Time*</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Duration (minutes)*</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Max Participants (optional)</Label>
            <Input
              type="number"
              value={formData.max_participants || ""}
              onChange={e => setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="Leave empty for unlimited"
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Meeting Link (Zoom, Google Meet, etc.)</Label>
            <Input
              value={formData.meeting_link}
              onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://zoom.us/j/..."
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Session Image</Label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-900 cursor-pointer transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-red-900" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-red-900" />
                    <span className="text-sm text-gray-600">Upload Image</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {formData.image_url && (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-300">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <Label className="text-gray-700">Paid Session</Label>
              <p className="text-xs text-gray-500">Charge participants for access</p>
            </div>
            <Switch
              checked={formData.is_paid}
              onCheckedChange={v => setFormData({ ...formData, is_paid: v })}
            />
          </div>

          {formData.is_paid && (
            <div className="space-y-2">
              <Label className="text-gray-700">Price (USD)*</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="border-gray-300"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}