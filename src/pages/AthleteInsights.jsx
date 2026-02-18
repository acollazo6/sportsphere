import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Loader2, RefreshCw, User, Calendar, Dumbbell, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export default function AthleteInsights() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedAthleteEmail, setSelectedAthleteEmail] = useState(null);
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [genRec, setGenRec] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setOrgId(orgs[0].id); setRole("admin"); return; }
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      if (memberships[0]) {
        setOrgId(memberships[0].organization_id);
        setRole(memberships[0].role);
        if (memberships[0].role === "athlete") setSelectedAthleteEmail(u.email);
      }
    }).catch(() => {});
  }, []);

  const { data: athletes } = useQuery({
    queryKey: ["org-athletes-insights", orgId],
    queryFn: async () => {
      const members = await base44.entities.OrgMember.filter({ organization_id: orgId });
      return members.filter(m => m.role === "athlete");
    },
    enabled: !!orgId && (role === "admin" || role === "coach"),
  });

  const { data: athleteData } = useQuery({
    queryKey: ["athlete-full-data", selectedAthleteEmail, orgId],
    queryFn: async () => {
      const [plans, sessions, videos, progress] = await Promise.all([
        base44.entities.TrainingPlan.filter({ organization_id: orgId, athlete_email: selectedAthleteEmail }),
        base44.entities.TrainingSession.filter({ organization_id: orgId }),
        base44.entities.AthleteVideo.filter({ organization_id: orgId, athlete_email: selectedAthleteEmail }),
        base44.entities.AthleteProgress.filter({ organization_id: orgId, athlete_email: selectedAthleteEmail }),
      ]);
      const athleteSessions = sessions.filter(s => s.attendees?.includes(selectedAthleteEmail));
      return { plans, sessions: athleteSessions, videos, progress };
    },
    enabled: !!orgId && !!selectedAthleteEmail,
  });

  const { data: memberProfile } = useQuery({
    queryKey: ["athlete-member-profile", selectedAthleteEmail, orgId],
    queryFn: async () => {
      const members = await base44.entities.OrgMember.filter({ organization_id: orgId, user_email: selectedAthleteEmail });
      return members[0] || null;
    },
    enabled: !!orgId && !!selectedAthleteEmail,
  });

  const generateSummary = async () => {
    if (!athleteData || !selectedAthleteEmail) return;
    setGenerating(true);
    const activePlan = athleteData.plans.find(p => p.status === "active");
    const reviewedVideos = athleteData.videos.filter(v => v.coach_reviewed);
    const recentMetrics = athleteData.progress.slice(-10);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports analytics AI. Generate a concise performance summary for this athlete.

Athlete: ${memberProfile?.user_name || selectedAthleteEmail}
Sport: ${memberProfile?.sport || "Not specified"}
Position: ${memberProfile?.position || "Not specified"}

Training Plan: ${activePlan ? `"${activePlan.title}" (${activePlan.status}) - Goal: ${activePlan.goal || "None set"}` : "No active plan"}
Sessions Attended: ${athleteData.sessions.filter(s => s.status === "completed").length} completed out of ${athleteData.sessions.length} scheduled
Videos Uploaded: ${athleteData.videos.length} total, ${reviewedVideos.length} reviewed by coach
Coach Ratings: ${reviewedVideos.map(v => v.coach_rating).filter(Boolean).join(", ") || "None yet"}
Coach Feedback summaries: ${reviewedVideos.map(v => v.coach_feedback).filter(Boolean).slice(0, 3).join(" | ") || "None yet"}
Recent Metrics: ${recentMetrics.map(m => `${m.metric_type}: ${m.metric_value}${m.metric_unit || ""}`).join(", ") || "No metrics logged"}

Write a 3-4 sentence performance summary covering:
1. Overall progress and engagement
2. Strengths observed
3. Key areas to focus on
Keep it encouraging, specific, and actionable. Address the athlete directly.`,
    });
    setSummary(result);
    setGenerating(false);
  };

  const generateRecommendation = async () => {
    if (!athleteData || !selectedAthleteEmail) return;
    setGenRec(true);
    const activePlan = athleteData.plans.find(p => p.status === "active");
    const lastSession = athleteData.sessions.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert sports coach AI. Provide personalized next-week training recommendations.

Athlete: ${memberProfile?.user_name || selectedAthleteEmail}
Sport: ${memberProfile?.sport || "General fitness"}
Position: ${memberProfile?.position || "Not specified"}
Current Goal: ${activePlan?.goal || "General improvement"}
Last Session Type: ${lastSession?.session_type || "Unknown"}
Sessions this month: ${athleteData.sessions.filter(s => new Date(s.scheduled_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
Coach feedback themes: ${athleteData.videos.filter(v => v.coach_feedback).map(v => v.coach_feedback).slice(0, 2).join(" | ") || "None"}

Provide 3-5 specific training recommendations for next week. Format as a numbered list with:
- Exercise name
- Sets/reps or duration
- Why it helps this athlete specifically
Keep it practical and sport-specific.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exercise: { type: "string" },
                prescription: { type: "string" },
                rationale: { type: "string" },
              }
            }
          },
          weekly_focus: { type: "string" },
          rest_advice: { type: "string" },
        }
      }
    });
    setRecommendation(result);
    setGenRec(false);
  };

  const isCoachOrAdmin = role === "admin" || role === "coach";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">AI Athlete Insights</h1>
          <p className="text-gray-500 text-sm">GPT-powered performance summaries & recommendations</p>
        </div>
      </div>

      {/* Athlete selector for coaches/admins */}
      {isCoachOrAdmin && athletes && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Select Athlete</label>
            <Select value={selectedAthleteEmail || ""} onValueChange={v => { setSelectedAthleteEmail(v); setSummary(null); setRecommendation(null); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Choose an athlete..." />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(a => (
                  <SelectItem key={a.user_email} value={a.user_email}>
                    {a.user_name || a.user_email} {a.sport ? `• ${a.sport}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedAthleteEmail && athleteData && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Training Plans", value: athleteData.plans.length, icon: Dumbbell, color: "text-blue-600 bg-blue-50" },
              { label: "Sessions", value: athleteData.sessions.length, icon: Calendar, color: "text-purple-600 bg-purple-50" },
              { label: "Videos", value: athleteData.videos.length, icon: Video, color: "text-orange-600 bg-orange-50" },
              { label: "Reviewed", value: athleteData.videos.filter(v => v.coach_reviewed).length, icon: TrendingUp, color: "text-green-600 bg-green-50" },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-black text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Performance Summary */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" /> Performance Summary
                </CardTitle>
                <Button
                  size="sm"
                  onClick={generateSummary}
                  disabled={generating}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl gap-1.5 text-xs"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {generating ? "Generating..." : summary ? "Regenerate" : "Generate Summary"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                  {summary}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">
                  Click "Generate Summary" to get an AI-powered performance overview
                </p>
              )}
            </CardContent>
          </Card>

          {/* Training Recommendations */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Next Week's Recommendations
                </CardTitle>
                <Button
                  size="sm"
                  onClick={generateRecommendation}
                  disabled={genRec}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl gap-1.5 text-xs"
                >
                  {genRec ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {genRec ? "Generating..." : recommendation ? "Regenerate" : "Generate Plan"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendation ? (
                <div className="space-y-4">
                  {recommendation.weekly_focus && (
                    <div className="bg-indigo-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-indigo-700 mb-0.5">Weekly Focus</p>
                      <p className="text-sm text-indigo-900">{recommendation.weekly_focus}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {recommendation.recommendations?.map((rec, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{rec.exercise}</p>
                          <p className="text-xs text-indigo-600 font-semibold">{rec.prescription}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{rec.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {recommendation.rest_advice && (
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-green-700 mb-0.5">Recovery</p>
                      <p className="text-sm text-green-900">{recommendation.rest_advice}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 italic">AI-generated suggestions — review with your coach before implementing.</p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">
                  Click "Generate Plan" to get personalized training recommendations
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedAthleteEmail && (
        <div className="text-center py-20 text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Select an athlete to view AI insights</p>
        </div>
      )}
    </div>
  );
}