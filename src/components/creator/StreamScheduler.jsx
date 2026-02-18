import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Plus, Bell, Users, Trash2, Radio, Crown, Loader2 } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Track & Field", "Swimming", "Cycling", "CrossFit", "Weightlifting", "Martial Arts", "Other"];

export default function StreamScheduler({ user }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", sport: "", scheduled_at: "", duration_minutes: 60, is_premium: false, price: 0
  });

  const { data: scheduled = [], isLoading } = useQuery({
    queryKey: ["scheduled-streams", user?.email],
    queryFn: () => base44.entities.ScheduledStream.filter({ host_email: user.email }, "scheduled_at"),
    enabled: !!user,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers-for-notify", user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user.email, status: "accepted" }),
    enabled: !!user,
  });

  const save = async () => {
    if (!form.title || !form.scheduled_at) return toast.error("Title and date are required");
    setSaving(true);
    await base44.entities.ScheduledStream.create({
      ...form,
      host_email: user.email,
      host_name: user.full_name,
      host_avatar: user.avatar_url,
      price: parseFloat(form.price) || 0,
      rsvp_emails: [],
      status: "upcoming",
    });
    qc.invalidateQueries({ queryKey: ["scheduled-streams"] });
    setShowForm(false);
    setForm({ title: "", description: "", sport: "", scheduled_at: "", duration_minutes: 60, is_premium: false, price: 0 });
    toast.success("Stream scheduled!");
    setSaving(false);
  };

  const notifyFollowers = async (stream) => {
    if (!followers.length) return toast.info("You have no followers yet");
    setNotifying(stream.id);
    // Send notification to each follower
    const notifications = followers.map(f => ({
      recipient_email: f.follower_email,
      type: "stream_scheduled",
      title: `${user.full_name} scheduled a live stream`,
      message: `"${stream.title}" - ${moment(stream.scheduled_at).format("MMM D [at] h:mm A")}`,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_avatar: user.avatar_url,
      is_read: false,
    }));
    await base44.entities.Notification.bulkCreate(notifications);
    await base44.entities.ScheduledStream.update(stream.id, { notified_followers: true });
    qc.invalidateQueries({ queryKey: ["scheduled-streams"] });
    toast.success(`Notified ${followers.length} followers!`);
    setNotifying(null);
  };

  const cancel = async (id) => {
    await base44.entities.ScheduledStream.update(id, { status: "cancelled" });
    qc.invalidateQueries({ queryKey: ["scheduled-streams"] });
    toast.success("Stream cancelled");
  };

  const upcoming = scheduled.filter(s => s.status === "upcoming" && new Date(s.scheduled_at) > new Date());
  const past = scheduled.filter(s => s.status !== "upcoming" || new Date(s.scheduled_at) <= new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Stream Scheduler</h3>
          <p className="text-sm text-gray-500">Plan your streams and notify followers in advance</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-red-900 hover:bg-red-800 gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> Schedule Stream
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No upcoming streams scheduled</p>
          <p className="text-gray-400 text-sm mt-1">Schedule a stream and notify your {followers.length} followers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:border-red-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 text-sm">{s.title}</p>
                  {s.is_premium && <Badge className="bg-amber-100 text-amber-700 text-[10px]"><Crown className="w-2.5 h-2.5 mr-1" />Premium</Badge>}
                  {s.sport && <Badge variant="secondary" className="text-[10px]">{s.sport}</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{moment(s.scheduled_at).format("MMM D, YYYY")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(s.scheduled_at).format("h:mm A")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes}min</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.rsvp_emails?.length || 0} RSVPs</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!s.notified_followers ? (
                  <Button
                    onClick={() => notifyFollowers(s)}
                    disabled={notifying === s.id}
                    size="sm"
                    className="bg-red-900 hover:bg-red-800 rounded-xl gap-1.5 text-xs font-bold"
                  >
                    {notifying === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                    Notify Followers
                  </Button>
                ) : (
                  <Badge className="bg-green-100 text-green-700 gap-1 text-[10px]">
                    <Bell className="w-2.5 h-2.5" /> Followers Notified
                  </Badge>
                )}
                <Button onClick={() => cancel(s.id)} variant="ghost" size="sm" className="text-gray-400 hover:text-red-600 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-500 font-semibold py-2 select-none">
            Past Scheduled ({past.length})
          </summary>
          <div className="space-y-2 mt-2">
            {past.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                <span>{moment(s.scheduled_at).format("MMM D")}</span>
                <Badge className={s.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"} >{s.status}</Badge>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Schedule a Stream</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning Basketball Practice" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will you cover?" className="rounded-xl resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} min="15" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={form.sport} onValueChange={v => setForm({ ...form, sport: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <Label className="text-sm font-semibold text-amber-900">Premium / Subscribers Only</Label>
              </div>
              <Switch checked={form.is_premium} onCheckedChange={v => setForm({ ...form, is_premium: v })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} disabled={saving} className="flex-1 bg-red-900 hover:bg-red-800 rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4 mr-1.5" />}
                Schedule Stream
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}