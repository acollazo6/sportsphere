import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trophy, MapPin, Clock, Star, Trash2, Loader2, Camera, LogOut, Settings } from "lucide-react";
import PostCard from "../components/feed/PostCard";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Golf", "Swimming", "Boxing", "MMA", "Track", "Volleyball", "Hockey", "Cycling", "Yoga", "CrossFit", "Other"];
const ROLES = ["athlete", "coach", "trainer", "instructor", "fan"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional", "elite"];

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: sportProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["my-sport-profiles", user?.email],
    queryFn: () => base44.entities.SportProfile.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: myPosts } = useQuery({
    queryKey: ["my-posts", user?.email],
    queryFn: () => base44.entities.Post.filter({ author_email: user.email }, "-created_date", 20),
    enabled: !!user,
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    setUser(prev => ({ ...prev, avatar_url: file_url }));
    setAvatarUploading(false);
  };

  const openNewProfile = () => {
    setEditingProfile(null);
    setFormData({ sport: "", role: "athlete", level: "beginner", bio: "", team: "", location: "", years_experience: 0, achievements: [] });
    setShowProfileForm(true);
  };

  const openEditProfile = (profile) => {
    setEditingProfile(profile);
    setFormData({ ...profile });
    setShowProfileForm(true);
  };

  const saveSportProfile = async () => {
    setSaving(true);
    if (editingProfile) {
      await base44.entities.SportProfile.update(editingProfile.id, formData);
    } else {
      await base44.entities.SportProfile.create({
        ...formData,
        user_email: user.email,
        user_name: user.full_name,
        avatar_url: user.avatar_url,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["my-sport-profiles"] });
    setShowProfileForm(false);
    setSaving(false);
  };

  const deleteProfile = async (id) => {
    await base44.entities.SportProfile.delete(id);
    queryClient.invalidateQueries({ queryKey: ["my-sport-profiles"] });
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-white shadow-lg">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-2xl font-bold">
                  {user.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors shadow-lg">
                {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Sport Profiles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">My Sport Profiles</h2>
          <Button onClick={openNewProfile} className="rounded-xl gap-2 bg-slate-900 hover:bg-slate-800" size="sm">
            <Plus className="w-4 h-4" />
            Add Sport
          </Button>
        </div>
        
        {profilesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
        ) : sportProfiles?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-4xl mb-3">🏅</p>
            <p className="text-slate-500 font-medium">No sport profiles yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first sport to get started</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sportProfiles?.map(profile => (
              <div key={profile.id} className="bg-white rounded-2xl border border-slate-100 p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <Badge className="bg-orange-50 text-orange-700 text-sm rounded-lg">{profile.sport}</Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditProfile(profile)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit2 className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={() => deleteProfile(profile.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-700 capitalize">{profile.role} · {profile.level}</p>
                  {profile.bio && <p className="text-xs text-slate-500 line-clamp-2">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.team && (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Trophy className="w-3 h-3" />{profile.team}</span>
                    )}
                    {profile.location && (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                    )}
                    {profile.years_experience > 0 && (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{profile.years_experience}yr</span>
                    )}
                  </div>
                  {profile.stats?.length > 0 && (
                    <div className="flex gap-3 pt-2 border-t border-slate-50 mt-2">
                      {profile.stats.slice(0, 3).map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="text-sm font-bold text-slate-900">{s.value}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sport Profile Dialog */}
      <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Edit" : "Add"} Sport Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Sport</Label>
                <Select value={formData.sport} onValueChange={v => setFormData(prev => ({ ...prev, sport: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sport" /></SelectTrigger>
                  <SelectContent>
                    {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Level</Label>
                <Select value={formData.level} onValueChange={v => setFormData(prev => ({ ...prev, level: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Years Experience</Label>
                <Input type="number" value={formData.years_experience || ""} onChange={e => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Bio</Label>
              <Textarea value={formData.bio || ""} onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="rounded-xl resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Team / Club</Label>
                <Input value={formData.team || ""} onChange={e => setFormData(prev => ({ ...prev, team: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Location</Label>
                <Input value={formData.location || ""} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <Button onClick={saveSportProfile} disabled={saving || !formData.sport} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white h-11">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProfile ? "Save Changes" : "Add Sport Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Posts */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">My Posts</h2>
        {myPosts?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400 text-sm">You haven't posted anything yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPosts?.map(post => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}