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
import { Plus, Edit2, Trophy, MapPin, Clock, Star, Trash2, Loader2, Camera, LogOut, Settings, TrendingUp, BarChart3, Dumbbell, Sparkles, DollarSign, Crown, Award, Zap } from "lucide-react";
import PostCard from "../components/feed/PostCard";
import StatInputDialog from "../components/stats/StatInputDialog";
import StatsChart from "../components/stats/StatsChart";
import ProgramCard from "../components/training/ProgramCard";
import ProgramDialog from "../components/training/ProgramDialog";
import ProgramDetailDialog from "../components/training/ProgramDetailDialog";
import MonetizationSetup from "../components/monetization/MonetizationSetup";
import BadgeDisplay from "../components/gamification/BadgeDisplay";
import FeaturedHighlight from "../components/profile/FeaturedHighlight";
import { Instagram, Twitter, Youtube, Linkedin, Globe, MessageCircle } from "lucide-react";

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
  const [selectedProfileForStats, setSelectedProfileForStats] = useState(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [viewingStatsProfile, setViewingStatsProfile] = useState(null);
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showPersonalInfoDialog, setShowPersonalInfoDialog] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});
  const [showMonetization, setShowMonetization] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setPersonalInfo({
        bio: u.bio || "",
        weight: u.weight || "",
        height: u.height || "",
        age: u.age || "",
        gender: u.gender || "",
        highschool: u.highschool || "",
        highschool_grad_year: u.highschool_grad_year || "",
        college: u.college || "",
        professional_team: u.professional_team || "",
      });
    }).catch(() => base44.auth.redirectToLogin());
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

  const { data: statEntries } = useQuery({
    queryKey: ["my-stats", user?.email, viewingStatsProfile?.id],
    queryFn: () => {
      if (viewingStatsProfile) {
        return base44.entities.StatEntry.filter({ sport_profile_id: viewingStatsProfile.id }, "-date", 50);
      }
      return base44.entities.StatEntry.filter({ user_email: user.email }, "-date", 50);
    },
    enabled: !!user,
  });

  const { data: myPrograms } = useQuery({
    queryKey: ["my-programs", user?.email],
    queryFn: () => base44.entities.TrainingProgram.filter({ creator_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: highlights } = useQuery({
    queryKey: ["my-highlights", user?.email],
    queryFn: () => base44.entities.Highlight.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["my-subscriptions", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ subscriber_email: user.email, status: "active" }),
    enabled: !!user,
  });

  const { data: userPoints } = useQuery({
    queryKey: ["user-points", user?.email],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({ user_email: user.email });
      return points[0] || null;
    },
    enabled: !!user,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["user-badges", user?.email],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: user.email }, "-earned_date"),
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

  const handleSaveStats = async (statsData) => {
    await base44.entities.StatEntry.create({
      user_email: user.email,
      sport_profile_id: selectedProfileForStats.id,
      sport: selectedProfileForStats.sport,
      ...statsData,
    });
    queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    setShowStatsDialog(false);
    setSelectedProfileForStats(null);
  };

  const openStatsInput = (profile) => {
    setSelectedProfileForStats(profile);
    setShowStatsDialog(true);
  };

  const viewStats = (profile) => {
    setViewingStatsProfile(profile);
  };

  const handleSaveProgram = async (programData) => {
    await base44.entities.TrainingProgram.create(programData);
    queryClient.invalidateQueries({ queryKey: ["my-programs"] });
    setShowProgramDialog(false);
  };

  const handleFollowProgram = async (program) => {
    const isFollowing = program.followers?.includes(user.email);
    const newFollowers = isFollowing
      ? program.followers.filter(e => e !== user.email)
      : [...(program.followers || []), user.email];
    await base44.entities.TrainingProgram.update(program.id, { followers: newFollowers });
    queryClient.invalidateQueries({ queryKey: ["my-programs"] });
  };

  const toggleHighlight = async (itemType, itemId, itemData) => {
    const existing = highlights?.find(h => h.item_type === itemType && h.item_id === itemId);
    if (existing) {
      await base44.entities.Highlight.delete(existing.id);
    } else {
      await base44.entities.Highlight.create({
        user_email: user.email,
        item_type: itemType,
        item_id: itemId,
        item_data: itemData,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["my-highlights"] });
  };

  const savePersonalInfo = async () => {
    await base44.auth.updateMe(personalInfo);
    setUser(prev => ({ ...prev, ...personalInfo }));
    setShowPersonalInfoDialog(false);
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
              {user.bio && <p className="text-sm text-slate-600 mt-2 max-w-md">{user.bio}</p>}

              {/* Sport profiles quick badges */}
              {sportProfiles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sportProfiles.map(p => (
                    <Badge key={p.id} className="bg-orange-50 text-orange-700 border border-orange-200 text-xs gap-1">
                      {p.sport}
                      <span className="text-orange-400 capitalize">· {p.level}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Personal info row */}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                {user.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{user.location}</span>}
                {user.age && <span>Age: {user.age}</span>}
                {user.professional_team && <span>• 🏆 {user.professional_team}</span>}
                {user.college && <span>• 🎓 {user.college}</span>}
              </div>

              {/* Social Links */}
              {user.social_links && Object.keys(user.social_links).some(k => user.social_links[k]) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {user.social_links.instagram && (
                    <a href={`https://instagram.com/${user.social_links.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full transition-colors">
                      <Instagram className="w-3 h-3" /> Instagram
                    </a>
                  )}
                  {user.social_links.twitter && (
                    <a href={`https://x.com/${user.social_links.twitter}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full transition-colors">
                      <Twitter className="w-3 h-3" /> X
                    </a>
                  )}
                  {user.social_links.youtube && (
                    <a href={user.social_links.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-full transition-colors">
                      <Youtube className="w-3 h-3" /> YouTube
                    </a>
                  )}
                  {user.social_links.tiktok && (
                    <a href={`https://tiktok.com/@${user.social_links.tiktok}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full transition-colors">
                      <MessageCircle className="w-3 h-3" /> TikTok
                    </a>
                  )}
                  {user.social_links.website && (
                    <a href={user.social_links.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full transition-colors">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("ProfileSettings")}>
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setShowPersonalInfoDialog(true)}>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowMonetization(true)} className="rounded-xl gap-2 border-green-200 text-green-700 hover:bg-green-50">
                <DollarSign className="w-4 h-4" /> Monetization
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => base44.auth.logout()}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Stats */}
      {userPoints && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-amber-600" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Level {userPoints.level} Athlete</h2>
              <p className="text-sm text-amber-700">{userPoints.total_points} Total Points</p>
            </div>
            <Link to={createPageUrl("Leaderboard")}>
              <Button variant="outline" size="sm" className="rounded-xl border-amber-300">
                View Leaderboard
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-600">{userPoints.workouts_completed}</p>
              <p className="text-xs text-slate-600">Workouts</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-600">{userPoints.challenges_completed}</p>
              <p className="text-xs text-slate-600">Challenges</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-600">{userPoints.sessions_attended}</p>
              <p className="text-xs text-slate-600">Sessions</p>
            </div>
          </div>
          {userBadges.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Recent Badges ({userBadges.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {userBadges.slice(0, 5).map(badge => (
                  <div key={badge.id} className="bg-white rounded-lg px-3 py-2 border border-amber-200" title={badge.badge_description}>
                    <span className="text-2xl">{badge.badge_icon}</span>
                  </div>
                ))}
                {userBadges.length > 5 && (
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-200 text-xs text-slate-600">
                    +{userBadges.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription Status */}
      {subscriptions?.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Active Subscriptions</h2>
          </div>
          <div className="space-y-2">
            {subscriptions.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{sub.creator_email}</p>
                  <p className="text-xs text-slate-500">
                    ${sub.amount}/month · Renews {new Date(sub.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Badges */}
      {userBadges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            My Badges
          </h2>
          <BadgeDisplay badges={userBadges} />
        </div>
      )}

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
                    <button onClick={() => openStatsInput(profile)} className="p-1.5 rounded-lg hover:bg-orange-50" title="Log Stats">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                    </button>
                    <button onClick={() => viewStats(profile)} className="p-1.5 rounded-lg hover:bg-blue-50" title="View Analytics">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                    </button>
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

      {/* Personal Info Dialog */}
      <Dialog open={showPersonalInfoDialog} onOpenChange={setShowPersonalInfoDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Bio</Label>
              <Textarea value={personalInfo.bio} onChange={e => setPersonalInfo({...personalInfo, bio: e.target.value})} className="rounded-xl resize-none" rows={3} placeholder="Tell us about yourself..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Age</Label>
                <Input type="number" value={personalInfo.age} onChange={e => setPersonalInfo({...personalInfo, age: parseInt(e.target.value) || ""})} className="rounded-xl" placeholder="25" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Gender</Label>
                <Select value={personalInfo.gender} onValueChange={v => setPersonalInfo({...personalInfo, gender: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Height</Label>
                <Input value={personalInfo.height} onChange={e => setPersonalInfo({...personalInfo, height: e.target.value})} className="rounded-xl" placeholder="6'2&quot;" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Weight (lbs)</Label>
                <Input type="number" value={personalInfo.weight} onChange={e => setPersonalInfo({...personalInfo, weight: parseFloat(e.target.value) || ""})} className="rounded-xl" placeholder="185" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">High School</Label>
                <Input value={personalInfo.highschool} onChange={e => setPersonalInfo({...personalInfo, highschool: e.target.value})} className="rounded-xl" placeholder="Lincoln High" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">HS Grad Year</Label>
                <Input type="number" value={personalInfo.highschool_grad_year} onChange={e => setPersonalInfo({...personalInfo, highschool_grad_year: parseInt(e.target.value) || ""})} className="rounded-xl" placeholder="2020" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">College</Label>
              <Input value={personalInfo.college} onChange={e => setPersonalInfo({...personalInfo, college: e.target.value})} className="rounded-xl" placeholder="UCLA" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Professional Team</Label>
              <Input value={personalInfo.professional_team} onChange={e => setPersonalInfo({...personalInfo, professional_team: e.target.value})} className="rounded-xl" placeholder="Los Angeles Lakers" />
            </div>
            <Button onClick={savePersonalInfo} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white h-11">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Stats Input Dialog */}
      <StatInputDialog
        open={showStatsDialog}
        onClose={() => {
          setShowStatsDialog(false);
          setSelectedProfileForStats(null);
        }}
        sportProfile={selectedProfileForStats}
        onSave={handleSaveStats}
      />

      {/* Training Programs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-500" />
            Training Programs
          </h2>
          <Button onClick={() => setShowProgramDialog(true)} className="rounded-xl gap-2 bg-slate-900 hover:bg-slate-800" size="sm">
            <Plus className="w-4 h-4" />
            Create Program
          </Button>
        </div>
        {myPrograms?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-4xl mb-3">💪</p>
            <p className="text-slate-500 font-medium">No training programs yet</p>
            <p className="text-slate-400 text-sm mt-1">Create structured training plans</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myPrograms?.map(prog => (
              <ProgramCard
                key={prog.id}
                program={prog}
                currentUser={user}
                onFollow={handleFollowProgram}
                onView={setSelectedProgram}
              />
            ))}
          </div>
        )}
      </div>

      <ProgramDialog
        open={showProgramDialog}
        onClose={() => setShowProgramDialog(false)}
        onSave={handleSaveProgram}
        user={user}
      />

      <ProgramDetailDialog
        open={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        program={selectedProgram}
      />

      <MonetizationSetup
        open={showMonetization}
        onOpenChange={setShowMonetization}
        user={user}
        onSuccess={() => base44.auth.me().then(setUser)}
      />

      {/* Highlights */}
      {highlights?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Highlights
          </h2>
          <div className="space-y-4">
            {highlights.map(h => (
              <div key={h.id} className="relative">
                {h.item_type === "post" && h.item_data && (
                  <PostCard post={h.item_data} currentUser={user} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Analytics Section */}
      {viewingStatsProfile && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{viewingStatsProfile.sport} Analytics</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => openStatsInput(viewingStatsProfile)}
                size="sm"
                className="rounded-xl gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
                Log Stats
              </Button>
              <Button
                onClick={() => setViewingStatsProfile(null)}
                size="sm"
                variant="outline"
                className="rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
          <StatsChart
            stats={statEntries?.filter(s => s.sport === viewingStatsProfile.sport)}
            sport={viewingStatsProfile.sport}
          />
        </div>
      )}

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