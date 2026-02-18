import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Shield, Users, Dumbbell, Heart, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const ROLES = [
  { value: "admin", label: "Team Admin / Coach", description: "Create and manage a team organization", icon: Shield, color: "border-red-300 bg-red-50 text-red-900" },
  { value: "coach", label: "Assistant Coach", description: "Coach athletes within an existing org", icon: Users, color: "border-purple-300 bg-purple-50 text-purple-900" },
  { value: "athlete", label: "Athlete", description: "Receive training plans and track progress", icon: Dumbbell, color: "border-blue-300 bg-blue-50 text-blue-900" },
  { value: "parent", label: "Parent / Guardian", description: "Monitor your athlete's progress", icon: Heart, color: "border-pink-300 bg-pink-50 text-pink-900" },
];

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Swimming", "Track & Field", "Volleyball", "Wrestling", "Gymnastics", "Hockey", "Other"];

export default function Onboarding() {
  const [step, setStep] = useState(1); // 1: role, 2: profile, 3: org
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", sport: "", position: "", phone: "" });
  const [org, setOrg] = useState({ name: "", sport: "", location: "", description: "" });
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setProfile(p => ({ ...p, full_name: u.full_name || "" }));
    }).catch(() => {});
  }, []);

  const handleFinish = async () => {
    setLoading(true);

    if (selectedRole === "admin") {
      // Create org + auto-join as admin
      const createdOrg = await base44.entities.Organization.create({
        name: org.name,
        sport: org.sport || profile.sport,
        location: org.location,
        description: org.description,
        owner_email: user.email,
        subscription_plan: "free",
        subscription_status: "trialing",
        max_athletes: 10,
      });
      await base44.entities.OrgMember.create({
        organization_id: createdOrg.id,
        user_email: user.email,
        user_name: profile.full_name || user.full_name,
        role: "admin",
        status: "active",
        sport: org.sport || profile.sport,
        phone: profile.phone,
      });
    } else {
      // For other roles: check if they have a pending invite, or just save profile
      const pendingInvites = await base44.entities.OrgInvite.filter({ invited_email: user.email, status: "pending" });
      if (pendingInvites[0]) {
        const invite = pendingInvites[0];
        // Accept invite: update member record
        const members = await base44.entities.OrgMember.filter({ organization_id: invite.organization_id, user_email: user.email });
        if (members[0]) {
          await base44.entities.OrgMember.update(members[0].id, {
            user_name: profile.full_name || user.full_name,
            status: "active",
            sport: profile.sport,
            position: profile.position,
            phone: profile.phone,
          });
        }
        await base44.entities.OrgInvite.update(invite.id, { status: "accepted" });
      }
    }

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">You're all set!</h2>
          <p className="text-gray-500">Welcome to SportHub Teams. Your profile is ready.</p>
          <Button
            onClick={() => window.location.href = createPageUrl("OrgDashboard")}
            className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl px-8 font-bold"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-red-900" : "bg-gray-200"}`} />
          ))}
        </div>

        {/* Step 1: Choose Role */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">What's your role?</h1>
              <p className="text-gray-500 text-sm mt-1">This helps us customize your experience</p>
            </div>
            <div className="space-y-3">
              {ROLES.map(r => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.value;
                return (
                  <Card
                    key={r.value}
                    onClick={() => setSelectedRole(r.value)}
                    className={`cursor-pointer border-2 transition-all ${isSelected ? r.color : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "" : "bg-gray-100"}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? "" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.description}</p>
                      </div>
                      {isSelected && <Check className="w-5 h-5 ml-auto text-green-600" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedRole}
              className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Profile Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Your profile</h1>
              <p className="text-gray-500 text-sm mt-1">Tell us a bit about yourself</p>
            </div>
            <div className="space-y-4 bg-white rounded-2xl p-5 shadow-md">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Full Name</Label>
                <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" className="rounded-xl" />
              </div>
              {selectedRole !== "parent" && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Primary Sport</Label>
                    <Select value={profile.sport} onValueChange={v => setProfile(p => ({ ...p, sport: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport" /></SelectTrigger>
                      <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Position / Specialty</Label>
                    <Input value={profile.position} onChange={e => setProfile(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Point Guard, Sprinter" className="rounded-xl" />
                  </div>
                </>
              )}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Phone (optional)</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" className="rounded-xl" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Org / Invite */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {selectedRole === "admin" ? "Create your organization" : "Join your team"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {selectedRole === "admin" ? "Set up your team or club" : "You'll be added when your coach invites you"}
              </p>
            </div>

            {selectedRole === "admin" ? (
              <div className="space-y-4 bg-white rounded-2xl p-5 shadow-md">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Organization Name *</Label>
                  <Input value={org.name} onChange={e => setOrg(o => ({ ...o, name: e.target.value }))} placeholder="e.g. Eagles Basketball Academy" className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Sport</Label>
                  <Select value={org.sport} onValueChange={v => setOrg(o => ({ ...o, sport: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport" /></SelectTrigger>
                    <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Location</Label>
                  <Input value={org.location} onChange={e => setOrg(o => ({ ...o, location: e.target.value }))} placeholder="City, State" className="rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                  <p className="font-semibold mb-1">How to join a team:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Ask your team admin/coach to invite your email: <strong>{user?.email}</strong></li>
                    <li>Your account will be linked to the team automatically</li>
                    <li>You can access your dashboard once invited</li>
                  </ol>
                </div>
                <p className="text-sm text-gray-500 text-center">Click finish to complete your profile setup</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl flex-1">Back</Button>
              <Button
                onClick={handleFinish}
                disabled={loading || (selectedRole === "admin" && !org.name)}
                className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Finish Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}