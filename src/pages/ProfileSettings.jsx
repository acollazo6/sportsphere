import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Camera, Loader2, Check, Bell, Globe, Activity,
  User, Heart, MessageCircle, UserPlus, AtSign, Trophy, Radio,
  DollarSign, Lightbulb, Smartphone, Mail, Share2, FileText,
  Instagram, Twitter, Youtube, Linkedin, Phone, Upload
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

// ─── Constants ──────────────────────────────────────────────────────────────
const LANGUAGES = [
  { value: "en", label: "🇬🇧 English" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "fr", label: "🇫🇷 Français" },
  { value: "de", label: "🇩🇪 Deutsch" },
  { value: "pt", label: "🇧🇷 Português" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "ja", label: "🇯🇵 日本語" },
  { value: "ar", label: "🇸🇦 العربية" },
  { value: "hi", label: "🇮🇳 हिन्दी" },
  { value: "ru", label: "🇷🇺 Русский" },
];

const NOTIF_SETTINGS = [
  { group: "Social", items: [
    { key: "likes", label: "Likes on your posts", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { key: "comments", label: "Comments on your posts", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
    { key: "mentions", label: "Mentions (@you)", icon: AtSign, color: "text-orange-500", bg: "bg-orange-50" },
  ]},
  { group: "Followers", items: [
    { key: "follows", label: "New followers", icon: UserPlus, color: "text-green-500", bg: "bg-green-50" },
    { key: "follow_requests", label: "Follow requests", icon: UserPlus, color: "text-amber-500", bg: "bg-amber-50" },
  ]},
  { group: "Messages & Advice", items: [
    { key: "messages", label: "Direct messages", icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
    { key: "advice_requests", label: "Advice requests", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50" },
  ]},
  { group: "Streams & Events", items: [
    { key: "stream_reminders", label: "Stream reminders", icon: Radio, color: "text-red-600", bg: "bg-red-50" },
    { key: "challenge_updates", label: "Challenge updates", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  ]},
  { group: "Monetization", items: [
    { key: "tips", label: "Tips received", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { key: "subscriptions", label: "Subscription updates", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ]},
];

const DEFAULT_NOTIF_PREFS = NOTIF_SETTINGS.flatMap(g => g.items).reduce((acc, s) => ({
  ...acc,
  [`${s.key}_inapp`]: true,
  [`${s.key}_email`]: ["follows", "follow_requests", "messages", "mentions", "advice_requests", "tips", "subscriptions"].includes(s.key),
}), {});

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  // Identity form
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    cover_url: "",
    location: "",
    preferred_sports: [],
    skill_level: "",
    social_links: {},
    contact_email: "",
    contact_phone: "",
    contact_preferences: { allow_messages: true, allow_email_contact: false, allow_phone_contact: false },
  });

  // Language
  const [language, setLanguage] = useState(() => localStorage.getItem("sporthub_language") || "en");

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        full_name: u.full_name || "",
        bio: u.bio || "",
        cover_url: u.cover_url || "",
        location: u.location || "",
        preferred_sports: u.preferred_sports || [],
        skill_level: u.skill_level || "",
        social_links: u.social_links || {},
        contact_email: u.contact_email || "",
        contact_phone: u.contact_phone || "",
        contact_preferences: u.contact_preferences || { allow_messages: true, allow_email_contact: false, allow_phone_contact: false },
      });
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  // Fetch notification preferences
  const { data: existingNotifPrefs } = useQuery({
    queryKey: ["notification-preferences", user?.email],
    queryFn: async () => {
      const res = await base44.entities.NotificationPreferences.filter({ user_email: user.email });
      return res[0] || null;
    },
    enabled: !!user,
  });
  useEffect(() => {
    if (existingNotifPrefs) setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...existingNotifPrefs });
  }, [existingNotifPrefs]);

  // Activity history
  const { data: myPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts-settings", user?.email],
    queryFn: () => base44.entities.Post.filter({ author_email: user.email }, "-created_date", 30),
    enabled: !!user && activeTab === "activity",
  });

  const { data: sharedMessages, isLoading: sharesLoading } = useQuery({
    queryKey: ["my-shared-posts", user?.email],
    queryFn: () => base44.entities.Message.filter({ sender_email: user.email }, "-created_date", 50),
    enabled: !!user && activeTab === "activity",
  });

  const sharedPosts = sharedMessages?.filter(m => !!m.shared_post_id) || [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    setUser(prev => ({ ...prev, avatar_url: file_url }));
    setAvatarUploading(false);
    toast.success("Profile photo updated");
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, cover_url: file_url }));
    setCoverUploading(false);
    toast.success("Cover photo updated");
  };

  const handleSaveIdentity = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setUser(prev => ({ ...prev, ...form }));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Profile saved!");
  };

  const handleSaveLanguage = () => {
    localStorage.setItem("sporthub_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    toast.success("Language preference saved!");
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    const data = { user_email: user.email, ...notifPrefs };
    if (existingNotifPrefs) {
      await base44.entities.NotificationPreferences.update(existingNotifPrefs.id, data);
    } else {
      await base44.entities.NotificationPreferences.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    toast.success("Notification preferences saved!");
    setSavingNotifs(false);
  };

  const toggleNotif = (key, channel) => {
    setNotifPrefs(p => ({ ...p, [`${key}_${channel}`]: !p[`${key}_${channel}`] }));
  };

  if (!user) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Profile")} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile, language, and notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full rounded-2xl bg-slate-100 p-1 h-auto">
          <TabsTrigger value="identity" className="rounded-xl flex items-center gap-1.5 text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="w-3.5 h-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="language" className="rounded-xl flex items-center gap-1.5 text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="w-3.5 h-3.5" /> Language
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-xl flex items-center gap-1.5 text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity className="w-3.5 h-3.5" /> Activity
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl flex items-center gap-1.5 text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="w-3.5 h-3.5" /> Alerts
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Identity ─────────────────────────────────────────────── */}
        <TabsContent value="identity" className="space-y-5 mt-5">
          {/* Cover + Avatar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 group cursor-pointer">
              {form.cover_url
                ? <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-slate-600"><Upload className="w-7 h-7 mx-auto mb-1" /><p className="text-xs mt-1">Add cover photo</p></div>
              }
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {coverUploading
                  ? <Loader2 className="w-7 h-7 text-white animate-spin" />
                  : <div className="flex items-center gap-2 text-white text-sm font-semibold"><Camera className="w-4 h-4" /> Change Cover</div>
                }
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
            <div className="px-6 pb-5 -mt-9 relative">
              <div className="relative inline-block">
                <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-xl font-bold">
                    {user.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 shadow-lg">
                  {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <div className="mt-2">
                <p className="font-bold text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-slate-900">Display Name</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Name shown to others</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Your full name"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Bio & Location */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-slate-900">About You</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Bio</Label>
              <Textarea
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell the community about yourself..."
                className="rounded-xl resize-none"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-slate-400 text-right">{form.bio.length}/300</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Location</Label>
              <Input
                value={form.location}
                onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-slate-900">Social Links</h2>
            {[
              { key: "instagram", label: "Instagram", Icon: Instagram, prefix: "instagram.com/", placeholder: "username" },
              { key: "twitter", label: "X / Twitter", Icon: Twitter, prefix: "x.com/", placeholder: "username" },
              { key: "youtube", label: "YouTube", Icon: Youtube, prefix: "", placeholder: "channel URL" },
              { key: "linkedin", label: "LinkedIn", Icon: Linkedin, prefix: "linkedin.com/in/", placeholder: "username" },
            ].map(({ key, label, Icon, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <Label className="text-xs font-medium text-slate-400">{label}</Label>
                  <Input
                    value={form.social_links[key] || ""}
                    onChange={e => setForm(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: e.target.value } }))}
                    placeholder={placeholder}
                    className="rounded-xl text-sm h-9"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveIdentity}
            disabled={saving}
            className="w-full rounded-xl h-11 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white font-semibold gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Profile"}
          </Button>
        </TabsContent>

        {/* ── Tab: Language ─────────────────────────────────────────────── */}
        <TabsContent value="language" className="space-y-5 mt-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Translation Language</h2>
                <p className="text-xs text-slate-500">Messages will be translated to this language</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500">Preferred language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-xl h-11 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
              <p className="font-semibold">How it works</p>
              <p className="text-xs text-blue-600">In the Messages section, every message bubble shows a "Translate" button. Tapping it will translate the message into your chosen language.</p>
            </div>

            <Button
              onClick={handleSaveLanguage}
              className="w-full rounded-xl h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold"
            >
              Save Language Preference
            </Button>
          </div>
        </TabsContent>

        {/* ── Tab: Activity ─────────────────────────────────────────────── */}
        <TabsContent value="activity" className="space-y-5 mt-5">
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Posts Created", value: myPosts?.length ?? "—", icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
              { label: "Posts Shared", value: sharedPosts.length ?? "—", icon: Share2, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Total Likes", value: myPosts?.reduce((s, p) => s + (p.likes?.length || 0), 0) ?? "—", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Posts Created */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" /> Posts Created
            </h2>
            {postsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            ) : !myPosts?.length ? (
              <p className="text-sm text-slate-400 py-4 text-center">No posts yet</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {myPosts.map(post => (
                  <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    {post.media_urls?.[0] && (
                      <img src={post.media_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2">{post.content || "(no text)"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-slate-400">{moment(post.created_date).fromNow()}</span>
                        {post.sport && <Badge variant="outline" className="text-[10px] py-0 h-4">{post.sport}</Badge>}
                        <span className="text-[11px] text-slate-400 flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.likes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posts Shared */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" /> Posts Shared via Messages
            </h2>
            {sharesLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            ) : !sharedPosts.length ? (
              <p className="text-sm text-slate-400 py-4 text-center">You haven't shared any posts yet</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {sharedPosts.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    {msg.shared_post_data?.media_urls?.[0] && (
                      <img src={msg.shared_post_data.media_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500">Shared post by {msg.shared_post_data?.author_name || "Unknown"}</p>
                      <p className="text-sm text-slate-700 line-clamp-1 mt-0.5">{msg.shared_post_data?.content || "(no text)"}</p>
                      <span className="text-[11px] text-slate-400">{moment(msg.created_date).fromNow()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Notifications ────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-5 mt-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-end gap-6 pr-1 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-3">
              <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> In-App</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
            </div>

            {NOTIF_SETTINGS.map(group => (
              <div key={group.group}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{group.group}</p>
                <div className="space-y-1">
                  {group.items.map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${s.color}`} />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <Switch
                            checked={!!notifPrefs[`${s.key}_inapp`]}
                            onCheckedChange={() => toggleNotif(s.key, "inapp")}
                          />
                          <Switch
                            checked={!!notifPrefs[`${s.key}_email`]}
                            onCheckedChange={() => toggleNotif(s.key, "email")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-medium">
                🔔 Push banners always appear for follows, messages, and mentions regardless of email settings.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveNotifs}
            disabled={savingNotifs}
            className="w-full rounded-xl h-11 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-semibold gap-2"
          >
            {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {savingNotifs ? "Saving…" : "Save Notification Preferences"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}