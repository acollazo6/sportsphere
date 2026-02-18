import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Mail, Search, Shield, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ROLE_COLORS = { admin: "bg-red-100 text-red-700", coach: "bg-purple-100 text-purple-700", athlete: "bg-blue-100 text-blue-700", parent: "bg-pink-100 text-pink-700" };

export default function OrgRoster() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "athlete" });
  const [inviting, setInviting] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setOrgId(orgs[0].id); return; }
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      if (memberships[0]) setOrgId(memberships[0].organization_id);
    }).catch(() => {});
  }, []);

  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => base44.entities.OrgMember.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const filtered = members?.filter(m => {
    const matchesSearch = !search || m.user_name?.toLowerCase().includes(search.toLowerCase()) || m.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInvite = async () => {
    if (!invite.email || !orgId) return;
    setInviting(true);
    await base44.entities.OrgInvite.create({
      organization_id: orgId,
      invited_email: invite.email,
      role: invite.role,
      invited_by_email: user.email,
      status: "pending",
      token: Math.random().toString(36).substring(2, 18),
    });
    // Also create a pending member record
    await base44.entities.OrgMember.create({
      organization_id: orgId,
      user_email: invite.email,
      role: invite.role,
      status: "invited",
    });
    qc.invalidateQueries(["org-members", orgId]);
    setInviting(false);
    setShowInvite(false);
    setInvite({ email: "", role: "athlete" });
  };

  const handleRemove = async (memberId) => {
    await base44.entities.OrgMember.delete(memberId);
    qc.invalidateQueries(["org-members", orgId]);
  };

  const groups = ["athlete", "coach", "parent", "admin"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Users className="w-6 h-6 text-red-900" /> Roster</h1>
          <p className="text-gray-500 text-sm mt-0.5">{members?.length || 0} members</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl gap-2 font-bold">
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="athlete">Athletes</SelectItem>
            <SelectItem value="coach">Coaches</SelectItem>
            <SelectItem value="parent">Parents</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : (
        <div className="space-y-6">
          {groups.map(role => {
            const group = filtered?.filter(m => m.role === role);
            if (!group?.length) return null;
            return (
              <Card key={role} className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">{role}s ({group.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {group.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={m.avatar_url} />
                        <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-sm">
                          {m.user_name?.[0] || m.user_email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{m.user_name || m.user_email}</p>
                        <p className="text-xs text-gray-500 truncate">{m.user_email}</p>
                      </div>
                      <Badge className={`${ROLE_COLORS[m.role]} border-0 text-xs`}>{m.role}</Badge>
                      {m.status === "invited" && <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Invited</Badge>}
                      <button onClick={() => handleRemove(m.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {filtered?.length === 0 && <div className="text-center py-16 text-gray-400">No members found</div>}
        </div>
      )}

      {/* Invite Dialog */}
      {showInvite && (
        <Dialog open onOpenChange={() => setShowInvite(false)}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black">Invite Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Email Address</Label>
                <Input placeholder="athlete@email.com" value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Role</Label>
                <Select value={invite.role} onValueChange={v => setInvite(i => ({ ...i, role: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={inviting || !invite.email} className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}