import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Dumbbell, Calendar, Target, User, Sparkles, CheckCircle, ChevronDown, ChevronUp, Loader2, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS = { draft: "bg-gray-100 text-gray-600", active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", paused: "bg-yellow-100 text-yellow-700" };

export default function TrainingPlanDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(0);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setRole("admin"); return; }
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      if (memberships[0]) setRole(memberships[0].role);
    }).catch(() => {});
  }, []);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["training-plan", planId],
    queryFn: () => base44.entities.TrainingPlan.filter({ id: planId }).then(r => r[0]),
    enabled: !!planId,
    onSuccess: (data) => { if (data) setNotes(data.notes || ""); },
  });

  const saveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.TrainingPlan.update(planId, { notes });
    qc.invalidateQueries(["training-plan", planId]);
    setSavingNotes(false);
    setEditingNotes(false);
  };

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    await base44.entities.TrainingPlan.update(planId, { status });
    qc.invalidateQueries(["training-plan", planId]);
    qc.invalidateQueries(["training-plans"]);
    setUpdatingStatus(false);
  };

  if (isLoading) return (
    <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
  );

  if (!plan) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
      <p>Plan not found.</p>
      <Link to={createPageUrl("TrainingPlans")}><Button className="mt-4">Back to Plans</Button></Link>
    </div>
  );

  const isCoachOrAdmin = role === "admin" || role === "coach";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("TrainingPlans")}>
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-gray-900 truncate">{plan.title}</h1>
            <Badge className={`${STATUS_COLORS[plan.status]} border-0 text-xs`}>{plan.status}</Badge>
            {plan.ai_generated && <Badge className="bg-purple-100 text-purple-700 border-0 text-xs"><Sparkles className="w-3 h-3 mr-1" />AI</Badge>}
          </div>
        </div>
        {isCoachOrAdmin && (
          <Select value={plan.status} onValueChange={updateStatus} disabled={updatingStatus}>
            <SelectTrigger className="w-36 rounded-xl text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Plan details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Athlete:</span>
              <span className="font-semibold text-gray-900">{plan.athlete_name || plan.athlete_email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Coach:</span>
              <span className="font-semibold text-gray-900">{plan.coach_name || plan.coach_email}</span>
            </div>
            {plan.sport && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🏅</span>
                <span className="font-semibold text-gray-900">{plan.sport}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            {plan.goal && (
              <div className="flex items-start gap-2 text-sm">
                <Target className="w-4 h-4 text-red-900 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Goal</p>
                  <p className="font-semibold text-gray-900">{plan.goal}</p>
                </div>
              </div>
            )}
            {plan.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Period:</span>
                <span className="font-semibold text-gray-900">{plan.start_date} → {plan.end_date || "Ongoing"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {plan.description && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">{plan.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Weekly breakdown */}
      {plan.weeks?.length > 0 ? (
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-3">Weekly Breakdown ({plan.weeks.length} weeks)</h2>
          <div className="space-y-3">
            {plan.weeks.map((week, wi) => (
              <Card key={wi} className="border-0 shadow-md overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedWeek(expandedWeek === wi ? -1 : wi)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-900 text-white flex items-center justify-center text-sm font-black">
                      {week.week_number}
                    </div>
                    <span className="font-bold text-gray-900">Week {week.week_number}</span>
                    <span className="text-xs text-gray-500">{week.days?.length || 0} days</span>
                  </div>
                  {expandedWeek === wi ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedWeek === wi && (
                  <div className="border-t border-gray-100">
                    {week.days?.map((day, di) => (
                      <div key={di} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                        <p className="font-bold text-gray-700 text-sm mb-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">{di + 1}</span>
                          {day.day}
                        </p>
                        {day.exercises?.length > 0 ? (
                          <div className="space-y-2 ml-7">
                            {day.exercises.map((ex, ei) => (
                              <div key={ei} className="flex items-start gap-2 text-sm bg-gray-50 rounded-lg p-2">
                                <Dumbbell className="w-3.5 h-3.5 text-red-900 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold text-gray-800">{ex.name}</span>
                                  <span className="text-gray-500 ml-2 text-xs">
                                    {ex.sets && `${ex.sets} sets`}{ex.reps && ` × ${ex.reps}`}{ex.duration && ` • ${ex.duration}`}
                                  </span>
                                  {ex.notes && <p className="text-xs text-gray-400 mt-0.5">{ex.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic ml-7">{day.notes || "Rest day"}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No weekly breakdown yet</p>
        </div>
      )}

      {/* Coach notes */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-700">Coach Notes</CardTitle>
            {isCoachOrAdmin && !editingNotes && (
              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(true)} className="rounded-xl gap-1.5 text-xs">
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl" rows={4} placeholder="Add notes for the athlete..." />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="bg-red-900 text-white rounded-xl gap-1.5 text-xs">
                  {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)} className="rounded-xl text-xs">Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{plan.notes || <span className="text-gray-400 italic">No notes yet</span>}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}