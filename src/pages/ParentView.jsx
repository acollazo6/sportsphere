import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Video, Calendar, Dumbbell, Loader2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ParentView() {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      setMembership(memberships[0] || null);
    }).catch(() => {});
  }, []);

  const athleteEmails = membership?.athlete_emails || [];
  const orgId = membership?.organization_id;

  const { data: athleteProfiles } = useQuery({
    queryKey: ["athlete-profiles", athleteEmails.join(",")],
    queryFn: async () => {
      const all = await base44.entities.OrgMember.filter({ organization_id: orgId });
      return all.filter(m => athleteEmails.includes(m.user_email));
    },
    enabled: !!orgId && athleteEmails.length > 0,
  });

  const { data: videos } = useQuery({
    queryKey: ["athlete-videos-parent", athleteEmails.join(","), orgId],
    queryFn: async () => {
      const all = await base44.entities.AthleteVideo.filter({ organization_id: orgId });
      return all.filter(v => athleteEmails.includes(v.athlete_email));
    },
    enabled: !!orgId && athleteEmails.length > 0,
  });

  const { data: plans } = useQuery({
    queryKey: ["athlete-plans-parent", athleteEmails.join(","), orgId],
    queryFn: async () => {
      const all = await base44.entities.TrainingPlan.filter({ organization_id: orgId });
      return all.filter(p => athleteEmails.includes(p.athlete_email));
    },
    enabled: !!orgId && athleteEmails.length > 0,
  });

  const { data: sessions } = useQuery({
    queryKey: ["athlete-sessions-parent", orgId],
    queryFn: async () => {
      const all = await base44.entities.TrainingSession.filter({ organization_id: orgId });
      return all.filter(s => new Date(s.scheduled_date) >= new Date());
    },
    enabled: !!orgId,
  });

  if (!user) return null;

  if (!membership || membership.role !== "parent") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-gray-400">
        <p className="text-lg font-semibold">This view is only for parents.</p>
      </div>
    );
  }

  if (athleteEmails.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-gray-400">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">No athlete linked to your account yet</p>
        <p className="text-sm mt-1">Ask your coach/admin to link your child's account</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-red-900" /> My Child's Progress
      </h1>

      {/* Athlete cards */}
      {athleteProfiles?.map(athlete => (
        <Card key={athlete.id} className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-5 flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={athlete.avatar_url} />
              <AvatarFallback className="bg-blue-200 text-blue-700 font-black text-lg">
                {athlete.user_name?.[0] || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-black text-gray-900">{athlete.user_name || athlete.user_email}</h2>
              <p className="text-sm text-gray-500">{athlete.sport} • {athlete.position || "Athlete"}</p>
              <Badge className="mt-1 bg-blue-100 text-blue-700 border-0 text-xs">{athlete.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Training plan summary */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2"><Dumbbell className="w-4 h-4 text-red-900" /> Training Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!plans?.length && <p className="text-sm text-gray-400">No plans assigned yet</p>}
            {plans?.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-900">{p.title}</p>
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">{p.status}</Badge>
                </div>
                {p.goal && <p className="text-xs text-gray-500 mt-1">🎯 {p.goal}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming sessions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-red-900" /> Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!sessions?.length && <p className="text-sm text-gray-400">No upcoming sessions</p>}
            {sessions?.slice(0, 4).map(s => (
              <div key={s.id} className="p-3 rounded-xl bg-gray-50">
                <p className="font-semibold text-sm text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(s.scheduled_date).toLocaleDateString()} • {s.duration_minutes}min</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reviewed videos */}
      {videos?.filter(v => v.coach_reviewed).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2"><Video className="w-4 h-4 text-red-900" /> Coach Feedback on Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {videos.filter(v => v.coach_reviewed).map(v => (
              <div key={v.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-900">{v.title}</p>
                  {v.coach_rating > 0 && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= v.coach_rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />)}
                    </div>
                  )}
                </div>
                {v.coach_feedback && <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{v.coach_feedback}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}