import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Heart, MessageCircle, UserPlus, AtSign, Trophy, Radio, DollarSign, Bell, Lightbulb, Smartphone, Mail } from "lucide-react";
import { toast } from "sonner";

const SETTINGS = [
  { group: "Social", items: [
    { key: "likes", label: "Likes on your posts", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { key: "comments", label: "Comments on your posts", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
    { key: "mentions", label: "Mentions (@you)", icon: AtSign, color: "text-orange-500", bg: "bg-orange-50" },
  ]},
  { group: "Followers", items: [
    { key: "follows", label: "New followers", icon: UserPlus, color: "text-green-500", bg: "bg-green-50" },
    { key: "follow_requests", label: "Follow requests", icon: UserPlus, color: "text-amber-500", bg: "bg-amber-50" },
  ]},
  { group: "Messages & Advice", items: [
    { key: "messages", label: "Direct messages", icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
    { key: "advice_requests", label: "Advice requests", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50" },
  ]},
  { group: "Streams & Events", items: [
    { key: "stream_reminders", label: "Stream reminders", icon: Radio, color: "text-red-600", bg: "bg-red-50" },
    { key: "challenge_updates", label: "Challenge updates", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  ]},
  { group: "Monetization", items: [
    { key: "tips", label: "Tips received", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { key: "subscriptions", label: "Subscription updates", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ]},
];

const DEFAULT_PREFS = SETTINGS.flatMap(g => g.items).reduce((acc, s) => ({
  ...acc,
  [`${s.key}_inapp`]: true,
  [`${s.key}_email`]: ["follows", "follow_requests", "messages", "mentions", "advice_requests", "tips", "subscriptions"].includes(s.key),
}), {});

export default function NotificationSettingsDialog({ user, onClose }) {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const { data: existingPrefs } = useQuery({
    queryKey: ["notification-preferences", user?.email],
    queryFn: async () => {
      const res = await base44.entities.NotificationPreferences.filter({ user_email: user.email });
      return res[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (existingPrefs) setPrefs({ ...DEFAULT_PREFS, ...existingPrefs });
  }, [existingPrefs]);

  const toggle = (key, channel) => {
    setPrefs(p => ({ ...p, [`${key}_${channel}`]: !p[`${key}_${channel}`] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { user_email: user.email, ...prefs };
    if (existingPrefs) {
      await base44.entities.NotificationPreferences.update(existingPrefs.id, data);
    } else {
      await base44.entities.NotificationPreferences.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    toast.success("Notification preferences saved!");
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-900" />
            Notification Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Column headers */}
          <div className="flex items-center justify-end gap-6 pr-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> In-App</span>
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
          </div>

          {SETTINGS.map(group => (
            <div key={group.group}>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{group.group}</p>
              <div className="space-y-1">
                {group.items.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <Switch
                          checked={!!prefs[`${s.key}_inapp`]}
                          onCheckedChange={() => toggle(s.key, "inapp")}
                        />
                        <Switch
                          checked={!!prefs[`${s.key}_email`]}
                          onCheckedChange={() => toggle(s.key, "email")}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              🔔 Real-time push banners appear for critical alerts (follows, messages, mentions, advice) regardless of email settings.
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-red-900 hover:bg-red-800 text-white">
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}