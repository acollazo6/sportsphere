import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Loader2, MapPin, Video, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SESSION_TYPES = ["practice", "game", "strength", "recovery", "review", "meeting", "other"];
const STATUS_COLORS = { scheduled: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600" };

export default function OrgSessions() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [role, setRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", session_type: "practice", scheduled_date: "", duration_minutes: 60, location: "", is_virtual: false, meeting_link: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setOrgId(orgs[0].id); setRole("admin"); return; }
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      if (memberships[0]) { setOrgId(memberships[0].organization_id); setRole(memberships[0].role); }
    }).catch(() => {});
  }, []);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["org-sessions-all", orgId],
    queryFn: () => base44.entities.TrainingSession.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: athletes } = useQuery({
    queryKey: ["org-athletes", orgId],
    queryFn: async () => {
      const members = await base44.entities.OrgMember.filter({ organization_id: orgId });
      return members.filter(m => m.role === "athlete");
    },
    enabled: !!orgId,
  });

  const upcoming = sessions?.filter(s => new Date(s.scheduled_date) >= new Date()).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)) || [];
  const past = sessions?.filter(s => new Date(s.scheduled_date) < new Date()).sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)) || [];

  const createSession = async () => {
    if (!form.title || !form.scheduled_date) return;
    setSaving(true);
    await base44.entities.TrainingSession.create({
      organization_id: orgId,
      coach_email: user.email,
      coach_name: user.full_name,
      ...form,
      attendees: athletes?.map(a => a.user_email) || [],
    });
    qc.invalidateQueries(["org-sessions-all"]);
    qc.invalidateQueries(["org-sessions"]);
    setSaving(false);
    setShowCreate(false);
    setForm({ title: "", description: "", session_type: "practice", scheduled_date: "", duration_minutes: 60, location: "", is_virtual: false, meeting_link: "", notes: "" });
  };

  const markComplete = async (session) => {
    await base44.entities.TrainingSession.update(session.id, { status: "completed" });
    qc.invalidateQueries(["org-sessions-all"]);
  };

  const SessionCard = ({ session }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-gray-900">{session.title}</h3>
              <Badge className={`${STATUS_COLORS[session.status] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{session.session_type}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(session.scheduled_date).toLocaleString()} • {session.duration_minutes}min</span>
              {session.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>}
              {session.is_virtual && <span className="flex items-center gap-1"><Video className="w-3 h-3 text-blue-500" />Virtual</span>}
              {session.attendees?.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.attendees.length} athletes</span>}
            </div>
          </div>
          {(role === "admin" || role === "coach") && session.status === "scheduled" && (
            <Button size="sm" variant="outline" onClick={() => markComplete(session)} className="rounded-xl text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50">
              <CheckCircle className="w-3.5 h-3.5" />Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Calendar className="w-6 h-6 text-red-900" /> Sessions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{upcoming.length} upcoming</p>
        </div>
        {(role === "admin" || role === "coach") && (
          <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl gap-2 font-bold">
            <Plus className="w-4 h-4" /> Schedule Session
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-gray-300" /></div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">{upcoming.map(s => <SessionCard key={s.id} session={s} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Past ({past.length})</h2>
              <div className="space-y-3">{past.slice(0, 10).map(s => <SessionCard key={s.id} session={s} />)}</div>
            </div>
          )}
          {!sessions?.length && <div className="text-center py-16 text-gray-400">No sessions yet</div>}
        </div>
      )}

      {showCreate && (
        <Dialog open onOpenChange={() => setShowCreate(false)}>
          <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-black">Schedule Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Title *</Label>
                <Input placeholder="e.g. Monday Morning Practice" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Type</Label>
                  <Select value={form.session_type} onValueChange={v => setForm(f => ({ ...f, session_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Duration (min)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))} className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Date & Time *</Label>
                <Input type="datetime-local" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_virtual} onCheckedChange={v => setForm(f => ({ ...f, is_virtual: v }))} />
                <Label className="text-sm font-semibold">Virtual Session</Label>
              </div>
              {form.is_virtual
                ? <Input placeholder="Meeting link" value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} className="rounded-xl" />
                : <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="rounded-xl" />}
              <Textarea placeholder="Session notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-xl" rows={3} />
              <Button onClick={createSession} disabled={saving || !form.title || !form.scheduled_date} className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}