import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Crown, Edit2, Trash2, Users, DollarSign, Loader2, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#7f1d1d", "#1e3a5f", "#14532d", "#3b0764", "#7c2d12", "#1e293b"];
const EMOJIS = ["⭐", "🥇", "💎", "🔥", "👑", "🚀", "🏆", "🌟"];

function PlanForm({ plan, onSave, onClose }) {
  const [form, setForm] = useState(plan || {
    name: "", description: "", price_monthly: "", price_yearly: "",
    benefits: [""], is_active: true, color: "#7f1d1d", emoji: "⭐"
  });
  const [saving, setSaving] = useState(false);

  const addBenefit = () => setForm(f => ({ ...f, benefits: [...(f.benefits || []), ""] }));
  const setBenefit = (i, v) => setForm(f => ({ ...f, benefits: f.benefits.map((b, idx) => idx === i ? v : b) }));
  const removeBenefit = (i) => setForm(f => ({ ...f, benefits: f.benefits.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name || !form.price_monthly) return toast.error("Name and monthly price are required");
    setSaving(true);
    const data = { ...form, benefits: form.benefits.filter(b => b.trim()), price_monthly: parseFloat(form.price_monthly) || 0, price_yearly: parseFloat(form.price_yearly) || 0 };
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Plan Name *</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gold, Elite" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Emoji</Label>
          <div className="flex gap-1 flex-wrap">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                className={`w-8 h-8 rounded-lg text-base transition-all ${form.emoji === e ? "bg-red-100 ring-2 ring-red-700" : "bg-gray-100 hover:bg-gray-200"}`}>{e}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What do subscribers get?" rows={2} className="rounded-xl resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Monthly Price ($) *</Label>
          <Input type="number" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: e.target.value })} placeholder="9.99" min="0" step="0.01" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Yearly Price ($)</Label>
          <Input type="number" value={form.price_yearly} onChange={e => setForm({ ...form, price_yearly: e.target.value })} placeholder="99.00" min="0" step="0.01" className="rounded-xl" />
          <p className="text-[10px] text-gray-400">Leave 0 to disable yearly</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Benefits / Perks</Label>
        {(form.benefits || []).map((b, i) => (
          <div key={i} className="flex gap-2">
            <Input value={b} onChange={e => setBenefit(i, e.target.value)} placeholder={`Benefit ${i + 1}`} className="rounded-xl flex-1" />
            <Button onClick={() => removeBenefit(i)} variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></Button>
          </div>
        ))}
        <Button onClick={addBenefit} variant="outline" size="sm" className="gap-1.5 rounded-xl w-full border-dashed">
          <Plus className="w-3.5 h-3.5" /> Add Benefit
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Accent Color</Label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setForm({ ...form, color: c })}
              className={`w-7 h-7 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <Label className="font-semibold">Plan Active</Label>
        <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={save} disabled={saving} className="flex-1 bg-red-900 hover:bg-red-800 rounded-xl font-bold gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {plan ? "Update Plan" : "Create Plan"}
        </Button>
        <Button onClick={onClose} variant="outline" className="rounded-xl">Cancel</Button>
      </div>
    </div>
  );
}

export default function SubscriptionPlans({ user }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans", user?.email],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ creator_email: user.email }),
    enabled: !!user,
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["all-subscribers", user?.email],
    queryFn: () => base44.entities.CreatorSubscription.filter({ creator_email: user.email, status: "active" }),
    enabled: !!user,
  });

  const totalMRR = plans.reduce((sum, p) => {
    const count = subscribers.filter(s => s.tier === p.name.toLowerCase()).length;
    return sum + count * (p.price_monthly || 0);
  }, 0);

  const createPlan = async (data) => {
    if (editing) {
      await base44.entities.SubscriptionPlan.update(editing.id, data);
      toast.success("Plan updated!");
    } else {
      await base44.entities.SubscriptionPlan.create({ ...data, creator_email: user.email, subscriber_count: 0 });
      toast.success("Plan created!");
    }
    qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    setShowForm(false);
    setEditing(null);
  };

  const toggleActive = async (plan) => {
    await base44.entities.SubscriptionPlan.update(plan.id, { is_active: !plan.is_active });
    qc.invalidateQueries({ queryKey: ["subscription-plans"] });
  };

  const deletePlan = async (id) => {
    await base44.entities.SubscriptionPlan.delete(id);
    qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    toast.success("Plan deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Subscription Plans</h3>
          <p className="text-sm text-gray-500">MRR: <span className="font-bold text-green-700">${totalMRR.toFixed(2)}/mo</span> · {subscribers.length} active subscribers</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-red-900 hover:bg-red-800 gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Crown className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No subscription plans yet</p>
          <p className="text-gray-400 text-sm mt-1">Create plans to offer exclusive perks to your fans</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const subCount = subscribers.filter(s => s.tier === plan.name.toLowerCase()).length;
            return (
              <div key={plan.id} className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${plan.is_active ? "bg-white" : "bg-gray-50 opacity-60"}`} style={{ borderColor: plan.color + "33" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <div>
                      <p className="font-black text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.description?.slice(0, 40)}</p>
                    </div>
                  </div>
                  <Badge className={plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                    {plan.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: plan.color }}>${plan.price_monthly}</span>
                  <span className="text-sm text-gray-500">/mo</span>
                  {plan.price_yearly > 0 && (
                    <span className="text-xs text-gray-400 ml-2">${plan.price_yearly}/yr</span>
                  )}
                </div>

                {plan.benefits?.length > 0 && (
                  <ul className="space-y-1">
                    {plan.benefits.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: plan.color }} />
                        {b}
                      </li>
                    ))}
                    {plan.benefits.length > 3 && <li className="text-xs text-gray-400">+{plan.benefits.length - 3} more perks</li>}
                  </ul>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" /> {subCount} subscribers
                    <span className="mx-1">·</span>
                    <DollarSign className="w-3 h-3" /> ${(subCount * plan.price_monthly).toFixed(0)}/mo
                  </div>
                  <div className="flex items-center gap-1">
                    <Button onClick={() => { setEditing(plan); setShowForm(true); }} variant="ghost" size="icon" className="w-7 h-7 text-gray-400 hover:text-red-700">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button onClick={() => toggleActive(plan)} variant="ghost" size="icon" className="w-7 h-7 text-gray-400 hover:text-amber-600">
                      {plan.is_active ? <X className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </Button>
                    <Button onClick={() => deletePlan(plan.id)} variant="ghost" size="icon" className="w-7 h-7 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">{editing ? "Edit Plan" : "Create Subscription Plan"}</DialogTitle>
          </DialogHeader>
          <PlanForm plan={editing} onSave={createPlan} onClose={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}