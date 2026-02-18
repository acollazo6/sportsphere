import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Plus, Sparkles, Loader2, ChevronRight, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateTrainingPlanDialog from "@/components/org/CreateTrainingPlanDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_COLORS = { draft: "bg-gray-100 text-gray-600", active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", paused: "bg-yellow-100 text-yellow-700" };

export default function TrainingPlans() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [role, setRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
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

  const { data: plans, isLoading } = useQuery({
    queryKey: ["training-plans", orgId, user?.email, role],
    queryFn: async () => {
      if (role === "athlete") {
        return base44.entities.TrainingPlan.filter({ organization_id: orgId, athlete_email: user.email });
      }
      return base44.entities.TrainingPlan.filter({ organization_id: orgId });
    },
    enabled: !!orgId && !!role,
  });

  const { data: athletes } = useQuery({
    queryKey: ["org-athletes", orgId],
    queryFn: async () => {
      const members = await base44.entities.OrgMember.filter({ organization_id: orgId });
      return members.filter(m => m.role === "athlete");
    },
    enabled: !!orgId && (role === "admin" || role === "coach"),
  });

  const grouped = plans?.reduce((acc, plan) => {
    const key = plan.status || "draft";
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-red-900" /> Training Plans
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{plans?.length || 0} plans</p>
        </div>
        {(role === "admin" || role === "coach") && (
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl gap-2 font-bold">
              <Plus className="w-4 h-4" /> Create Plan
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : !plans?.length ? (
        <div className="text-center py-20 text-gray-400">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No training plans yet</p>
          {(role === "admin" || role === "coach") && <p className="text-sm mt-1">Create one to get started</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {["active", "draft", "paused", "completed"].map(status => {
            const group = grouped?.[status];
            if (!group?.length) return null;
            return (
              <div key={status}>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{status} ({group.length})</h2>
                <div className="space-y-3">
                  {group.map(plan => (
                    <Card key={plan.id} className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900">{plan.title}</h3>
                              <Badge className={`${STATUS_COLORS[plan.status]} border-0 text-xs`}>{plan.status}</Badge>
                              {plan.ai_generated && <Badge className="bg-purple-100 text-purple-700 border-0 text-xs"><Sparkles className="w-3 h-3 mr-1" />AI</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{plan.athlete_name || plan.athlete_email}</span>
                              {plan.sport && <span className="flex items-center gap-1">🏅 {plan.sport}</span>}
                              {plan.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.start_date} → {plan.end_date || "Ongoing"}</span>}
                            </div>
                            {plan.goal && <p className="text-sm text-gray-600 mt-2 line-clamp-1">🎯 {plan.goal}</p>}
                          </div>
                          <Link to={createPageUrl(`TrainingPlanDetail?id=${plan.id}`)}>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTrainingPlanDialog
          orgId={orgId}
          coachEmail={user?.email}
          coachName={user?.full_name}
          athletes={athletes || []}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); qc.invalidateQueries(["training-plans"]); }}
        />
      )}
    </div>
  );
}