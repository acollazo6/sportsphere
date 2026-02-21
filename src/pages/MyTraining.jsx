import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Calendar, CheckCircle, Target, Loader2, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SocialShareDialog from "../components/sharing/SocialShareDialog";

export default function MyTraining() {
  const [user, setUser] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["my-training-plans", user?.email],
    queryFn: async () => {
      const memberships = await base44.entities.OrgMember.filter({ user_email: user.email });
      const orgId = memberships[0]?.organization_id;
      if (!orgId) return [];
      return base44.entities.TrainingPlan.filter({ athlete_email: user.email, organization_id: orgId });
    },
    enabled: !!user,
  });

  const { data: sessions } = useQuery({
    queryKey: ["my-sessions", user?.email],
    queryFn: async () => {
      const memberships = await base44.entities.OrgMember.filter({ user_email: user.email });
      const orgId = memberships[0]?.organization_id;
      if (!orgId) return [];
      const all = await base44.entities.TrainingSession.filter({ organization_id: orgId });
      return all.filter(s => s.attendees?.includes(user.email) && new Date(s.scheduled_date) >= new Date());
    },
    enabled: !!user,
  });

  const activePlan = plans?.find(p => p.status === "active") || plans?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Dumbbell className="w-6 h-6 text-red-900" /> My Training</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your personalized training plan from your coach</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : !activePlan ? (
        <div className="text-center py-20 text-gray-400">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No training plan assigned yet</p>
          <p className="text-sm mt-1">Your coach will create one for you soon</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Plan header */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-red-900 to-red-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <Badge className="bg-white/20 text-white mb-3">{activePlan.status?.toUpperCase()}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShareOpen(true)}
                  className="text-white/80 hover:text-white hover:bg-white/20 gap-1.5 -mt-1"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              <h2 className="text-xl font-black">{activePlan.title}</h2>
              {activePlan.goal && (
                <p className="flex items-center gap-2 mt-3 text-white/90 text-sm">
                  <Target className="w-4 h-4 shrink-0" /> {activePlan.goal}
                </p>
              )}
              <div className="flex gap-4 mt-4 text-white/80 text-sm">
                {activePlan.start_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{activePlan.start_date}</span>}
                {activePlan.coach_name && <span>Coach: {activePlan.coach_name}</span>}
                {activePlan.sport && <span>🏅 {activePlan.sport}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming sessions */}
          {sessions?.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-red-900" /> Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {sessions.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500">{new Date(s.scheduled_date).toLocaleString()} • {s.duration_minutes}min</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Weekly breakdown */}
          {activePlan.weeks?.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-3">Weekly Breakdown</h2>
              <div className="space-y-3">
                {activePlan.weeks.map((week, wi) => (
                  <Card key={wi} className="border-0 shadow-md">
                    <button
                      className="w-full p-4 flex items-center justify-between"
                      onClick={() => setExpandedWeek(expandedWeek === wi ? -1 : wi)}
                    >
                      <span className="font-bold text-gray-900">Week {week.week_number}</span>
                      {expandedWeek === wi ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedWeek === wi && week.days?.map((day, di) => (
                      <CardContent key={di} className="pt-0 px-4 pb-4">
                        <div className="border-t border-gray-100 pt-3 mt-1">
                          <p className="font-bold text-gray-700 text-sm mb-2">{day.day}</p>
                          {day.exercises?.length > 0 ? (
                            <div className="space-y-2">
                              {day.exercises.map((ex, ei) => (
                                <div key={ei} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-semibold text-gray-800">{ex.name}</span>
                                    <span className="text-gray-500 ml-2">
                                      {ex.sets && `${ex.sets} sets`}{ex.reps && ` × ${ex.reps}`}{ex.duration && ` • ${ex.duration}`}
                                    </span>
                                    {ex.notes && <p className="text-xs text-gray-400 mt-0.5">{ex.notes}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">{day.notes || "Rest day"}</p>
                          )}
                        </div>
                      </CardContent>
                    ))}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Notes from coach */}
          {activePlan.notes && (
            <Card className="border-0 shadow-md border-l-4 border-l-red-900">
              <CardContent className="p-4">
                <p className="text-sm font-bold text-gray-700 mb-1">Coach Notes</p>
                <p className="text-gray-600 text-sm">{activePlan.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}