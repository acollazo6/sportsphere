import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Swimming", "Track & Field", "Volleyball", "Wrestling", "Gymnastics", "Hockey", "Other"];

export default function OrgSetupDialog({ user, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", sport: "", location: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return;
    setLoading(true);
    const org = await base44.entities.Organization.create({
      ...form,
      owner_email: user.email,
      subscription_plan: "free",
      subscription_status: "trialing",
      max_athletes: 10,
    });
    // Auto-add creator as admin member
    await base44.entities.OrgMember.create({
      organization_id: org.id,
      user_email: user.email,
      user_name: user.full_name,
      role: "admin",
      status: "active",
      sport: form.sport,
    });
    setLoading(false);
    onCreated();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Create Your Organization</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Organization Name *</Label>
            <Input
              placeholder="e.g. Eagles Basketball Academy"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Primary Sport</Label>
            <Select value={form.sport} onValueChange={v => setForm(f => ({ ...f, sport: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport" /></SelectTrigger>
              <SelectContent>
                {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Location</Label>
            <Input
              placeholder="City, State"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Description</Label>
            <Textarea
              placeholder="Short description of your org..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="rounded-xl"
              rows={3}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={loading || !form.name}
            className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold py-3"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Organization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}