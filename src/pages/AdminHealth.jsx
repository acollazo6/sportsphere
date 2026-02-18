import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Activity, Users, Video, Dumbbell, Calendar, MessageCircle, TrendingUp, AlertCircle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AdminHealth() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [org, setOrg] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setOrg(orgs[0]); setOrgId(orgs[0].id); }
    }).catch(() => {});
  }, []);

  const { data: members } = useQuery({
    queryKey: ["health-members", orgId],
    queryFn: () => base44.entities.OrgMember.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: plans } = useQuery({
    queryKey: ["health-plans", orgId],
    queryFn: () => base44.entities.TrainingPlan.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: sessions } = useQuery({
    queryKey: ["health-sessions", orgId],
    queryFn: () => base44.entities.TrainingSession.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: videos } = useQuery({
    queryKey: ["health-videos", orgId],
    queryFn: () => base44.entities.AthleteVideo.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: messages } = useQuery({
    queryKey: ["health-messages", orgId],
    queryFn: () => base44.entities.OrgMessage.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  if (!user || !org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Admin access required. Only org owners can view this page.</p>
        <Link to={createPageUrl("OrgDashboard")} className="text-red-900 text-sm font-bold mt-2 inline-block hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const athletes = members?.filter(m => m.role === "athlete") || [];
  const coaches = members?.filter(m => m.role === "coach") || [];
  const activePlans = plans?.filter(p => p.status === "active") || [];
  const completedPlans = plans?.filter(p => p.status === "completed") || [];
  const pendingVideos = videos?.filter(v => !v.coach_reviewed) || [];
  const reviewedVideos = videos?.filter(v => v.coach_reviewed) || [];
  const upcomingSessions = sessions?.filter(s => new Date(s.scheduled_date) >= new Date() && s.status === "scheduled") || [];
  const completedSessions = sessions?.filter(s => s.status === "completed") || [];

  const planCompletionRate = plans?.length ? Math.round((completedPlans.length / plans.length) * 100) : 0;
  const videoReviewRate = videos?.length ? Math.round((reviewedVideos.length / videos.length) * 100) : 0;
  const memberUtilization = org.max_athletes ? Math.round((athletes.length / org.max_athletes) * 100) : 0;

  const statCards = [
    { label: "Total Members", value: members?.length || 0, sub: `${athletes.length} athletes · ${coaches.length} coaches`, icon: Users, color: "from-blue-500 to-blue-600", link: "OrgRoster" },
    { label: "Active Plans", value: activePlans.length, sub: `${completedPlans.length} completed`, icon: Dumbbell, color: "from-green-500 to-emerald-600", link: "TrainingPlans" },
    { label: "Sessions", value: upcomingSessions.length, sub: `${completedSessions.length} completed`, icon: Calendar, color: "from-purple-500 to-purple-600", link: "OrgSessions" },
    { label: "Pending Videos", value: pendingVideos.length, sub: `${reviewedVideos.length} reviewed`, icon: Video, color: "from-orange-500 to-red-500", link: "VideoReview" },
  ];

  const healthChecks = [
    { label: "Athletes have active training plans", ok: athletes.length > 0 && activePlans.length > 0, warn: activePlans.length === 0 && athletes.length > 0 },
    { label: "No pending video reviews older than 7 days", ok: pendingVideos.filter(v => new Date() - new Date(v.created_date) > 7 * 86400000).length === 0, warn: pendingVideos.some(v => new Date() - new Date(v.created_date) > 7 * 86400000) },
    { label: "Upcoming sessions scheduled", ok: upcomingSessions.length > 0, warn: upcomingSessions.length === 0 },
    { label: "Team communication active", ok: (messages?.length || 0) > 0, warn: (messages?.length || 0) === 0 },
    { label: "Org plan capacity within limits", ok: memberUtilization < 90, warn: memberUtilization >= 90 },
  ];

  // Athletes without a plan
  const athleteEmailsWithPlans = new Set(activePlans.map(p => p.athlete_email));
  const athletesWithoutPlan = athletes.filter(a => !athleteEmailsWithPlans.has(a.user_email));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Activity className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl font-black">{org.name} — Health Dashboard</h1>
        </div>
        <p className="text-gray-400 text-sm">Admin overview · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={createPageUrl(s.link)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{s.value}</div>
                  <div className="text-xs font-bold text-gray-700 mt-0.5">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Health Checks */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Health Checks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-3">
                {check.ok
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <AlertCircle className={`w-4 h-4 shrink-0 ${check.warn ? "text-amber-500" : "text-red-400"}`} />
                }
                <span className={`text-sm ${check.ok ? "text-gray-700" : "text-gray-500"}`}>{check.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Utilization */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Plan Completion Rate</span>
                <span>{planCompletionRate}%</span>
              </div>
              <Progress value={planCompletionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Video Review Rate</span>
                <span>{videoReviewRate}%</span>
              </div>
              <Progress value={videoReviewRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Athlete Capacity ({athletes.length}/{org.max_athletes})</span>
                <span>{memberUtilization}%</span>
              </div>
              <Progress value={memberUtilization} className={`h-2 ${memberUtilization >= 90 ? "[&>div]:bg-red-500" : ""}`} />
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                <span>Messages This Month</span>
                <span>{messages?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{(messages?.length || 0) > 20 ? "Active team communication 🔥" : "Encourage more team chat"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Athletes Without Plans */}
        {athletesWithoutPlan.length > 0 && (
          <Card className="border-0 shadow-md border-l-4 border-l-amber-400">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Athletes Without Active Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {athletesWithoutPlan.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{a.user_name || a.user_email}</p>
                    <p className="text-xs text-gray-500">{a.sport || "No sport set"}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0">No Plan</Badge>
                </div>
              ))}
              <Link to={createPageUrl("TrainingPlans")}>
                <div className="flex items-center gap-2 text-sm font-bold text-red-900 hover:underline mt-2 cursor-pointer">
                  Create plans for them <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Sessions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" /> Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingSessions.length === 0
              ? <p className="text-sm text-gray-400 py-4 text-center">No upcoming sessions scheduled</p>
              : upcomingSessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500">{new Date(s.scheduled_date).toLocaleDateString()} · {s.session_type}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">{s.attendees?.length || 0} invited</Badge>
                </div>
              ))
            }
            <Link to={createPageUrl("OrgSessions")}>
              <div className="flex items-center gap-2 text-sm font-bold text-red-900 hover:underline mt-2 cursor-pointer">
                Manage sessions <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}