import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function PostChallengeUpdateDialog({ challenge, user, participation, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState("");
  const [dayNumber, setDayNumber] = useState(participation?.days_completed + 1 || 1);
  const [mediaUrls, setMediaUrls] = useState([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaUrls([...mediaUrls, file_url]);
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const removeMedia = (url) => {
    setMediaUrls(mediaUrls.filter(u => u !== url));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write an update");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.ChallengeUpdate.create({
        challenge_id: challenge.id,
        user_email: user.email,
        user_name: user.full_name,
        user_avatar: user.avatar_url,
        content,
        media_urls: mediaUrls,
        day_number: dayNumber,
        likes: [],
      });

      // Update participation progress
      if (participation) {
        const newDaysCompleted = Math.max(participation.days_completed, dayNumber);
        const progressPercentage = Math.round((newDaysCompleted / challenge.duration_days) * 100);
        
        await base44.entities.ChallengeParticipant.update(participation.id, {
          days_completed: newDaysCompleted,
          progress_percentage: progressPercentage,
          status: progressPercentage >= 100 ? "completed" : "active",
          completed_date: progressPercentage >= 100 ? new Date().toISOString() : null,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["challenge-updates"] });
      queryClient.invalidateQueries({ queryKey: ["challenge-participants"] });
      toast.success("Update posted!");
      onClose();
    } catch (error) {
      toast.error("Failed to post update");
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border-cyan-400/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cyan-400">Post Progress Update</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Day Number</Label>
            <Input
              type="number"
              value={dayNumber}
              onChange={e => setDayNumber(parseInt(e.target.value) || 1)}
              min={1}
              max={challenge.duration_days}
              className="bg-slate-800 border-cyan-400/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Share Your Progress*</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="How did today's workout go? Share your achievements, challenges, and feelings..."
              className="bg-slate-800 border-cyan-400/20 text-white resize-none"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Add Photos/Videos</Label>
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-cyan-400/30 rounded-xl hover:border-cyan-400/50 cursor-pointer transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-slate-300">Upload Media</span>
                </>
              )}
              <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
            </label>
            
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-cyan-400/30">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeMedia(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}