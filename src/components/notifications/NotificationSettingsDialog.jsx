import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, MessageCircle, UserPlus, AtSign, Trophy, Radio, DollarSign, Bell } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettingsDialog({ user, onClose }) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    likes_enabled: true,
    comments_enabled: true,
    mentions_enabled: true,
    follows_enabled: true,
    messages_enabled: true,
    challenge_updates_enabled: true,
    live_streams_enabled: true,
    subscriptions_enabled: true,
    tips_enabled: true,
  });

  const { data: existingPrefs } = useQuery({
    queryKey: ["notification-preferences", user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (existingPrefs) {
      setPreferences(existingPrefs);
    }
  }, [existingPrefs]);

  const handleSave = async () => {
    try {
      const data = {
        user_email: user.email,
        ...preferences,
      };

      if (existingPrefs) {
        await base44.entities.NotificationPreferences.update(existingPrefs.id, data);
      } else {
        await base44.entities.NotificationPreferences.create(data);
      }

      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences saved!");
      onClose();
    } catch (error) {
      toast.error("Failed to save preferences");
    }
  };

  const settings = [
    { key: "likes_enabled", label: "Likes on your posts", icon: Heart, color: "text-red-500" },
    { key: "comments_enabled", label: "Comments on your posts", icon: MessageCircle, color: "text-blue-500" },
    { key: "mentions_enabled", label: "When someone mentions you", icon: AtSign, color: "text-orange-500" },
    { key: "follows_enabled", label: "New followers", icon: UserPlus, color: "text-green-500" },
    { key: "messages_enabled", label: "Direct messages", icon: MessageCircle, color: "text-purple-500" },
    { key: "challenge_updates_enabled", label: "Challenge updates & invites", icon: Trophy, color: "text-amber-500" },
    { key: "live_streams_enabled", label: "Live stream notifications", icon: Radio, color: "text-red-500" },
    { key: "subscriptions_enabled", label: "Subscription updates", icon: DollarSign, color: "text-purple-500" },
    { key: "tips_enabled", label: "Tips received", icon: DollarSign, color: "text-green-500" },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto bg-slate-900 border-cyan-400/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-slate-400">
            Choose which notifications you want to receive. Changes are applied immediately.
          </p>

          <div className="space-y-3">
            {settings.map(setting => {
              const Icon = setting.icon;
              return (
                <div
                  key={setting.key}
                  className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-cyan-400/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${setting.color}`} />
                    </div>
                    <div>
                      <Label className="text-slate-200 font-semibold cursor-pointer">
                        {setting.label}
                      </Label>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[setting.key]}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, [setting.key]: checked })
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="bg-cyan-900/30 border border-cyan-400/30 rounded-xl p-4">
            <p className="text-sm text-cyan-300">
              💡 Tip: You can always change these settings later from your notification center.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}