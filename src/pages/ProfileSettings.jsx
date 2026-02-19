import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Loader2, Instagram, Twitter, Youtube, Linkedin, Globe, MessageCircle, Phone, Mail, Check, Upload, X } from "lucide-react";
import { toast } from "sonner";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "username", prefix: "instagram.com/" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "username", prefix: "x.com/" },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "channel URL or handle", prefix: "" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "username", prefix: "linkedin.com/in/" },
  { key: "website", label: "Website", icon: Globe, placeholder: "https://yoursite.com", prefix: "" },
  { key: "tiktok", label: "TikTok", icon: MessageCircle, placeholder: "username", prefix: "tiktok.com/@" },
];

export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    bio: "",
    cover_url: "",
    location: "",
    website: "",
    preferred_sports: [],
    skill_level: "",
    social_links: {},
    contact_preferences: {
      allow_messages: true,
      allow_email_contact: false,
      allow_phone_contact: false,
      preferred_contact: "messages",
    },
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        bio: u.bio || "",
        cover_url: u.cover_url || "",
        location: u.location || "",
        website: u.website || "",
        preferred_sports: u.preferred_sports || [],
        skill_level: u.skill_level || "",
        social_links: u.social_links || {},
        contact_preferences: u.contact_preferences || {
          allow_messages: true,
          allow_email_contact: false,
          allow_phone_contact: false,
          preferred_contact: "messages",
        },
        contact_email: u.contact_email || "",
        contact_phone: u.contact_phone || "",
      });
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setUser(prev => ({ ...prev, ...form }));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Profile settings saved!");
  };

  const setSocialLink = (key, value) => {
    setForm(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: value } }));
  };

  const setContactPref = (key, value) => {
    setForm(prev => ({ ...prev, contact_preferences: { ...prev.contact_preferences, [key]: value } }));
  };

  if (!user) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Profile")} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-sm text-slate-500">Customize how others see you</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white gap-2 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Cover Photo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900 group cursor-pointer">
          {form.cover_url ? (
            <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Add a cover photo</p>
              </div>
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            {coverUploading
              ? <Loader2 className="w-8 h-8 text-white animate-spin" />
              : <div className="flex items-center gap-2 text-white font-semibold"><Camera className="w-5 h-5" /> Change Cover</div>
            }
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </label>
        </div>

        {/* Avatar row */}
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-xl font-bold">
                {user.full_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors shadow-lg">
              {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Camera className="w-3.5 h-3.5 text-white" />}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div className="mt-3">
            <p className="font-bold text-slate-900">{user.full_name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-slate-900">Basic Info</h2>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-500">Bio</Label>
          <Textarea
            value={form.bio}
            onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell the community about yourself — your sport, experience, goals..."
            className="rounded-xl resize-none"
            rows={4}
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-slate-900">Social Links</h2>
        <p className="text-sm text-slate-500 -mt-2">Add your social profiles so fans can find you everywhere.</p>
        <div className="space-y-3">
          {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, placeholder, prefix }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <Label className="text-xs font-medium text-slate-500 mb-1 block">{label}</Label>
                <div className="flex items-center gap-1">
                  {prefix && <span className="text-xs text-slate-400 hidden sm:block whitespace-nowrap">{prefix}</span>}
                  <Input
                    value={form.social_links[key] || ""}
                    onChange={e => setSocialLink(key, e.target.value)}
                    placeholder={placeholder}
                    className="rounded-xl text-sm h-9"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-900">Communication Preferences</h2>
        <p className="text-sm text-slate-500 -mt-2">Control how others can reach you on SportHub.</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Allow Direct Messages</p>
                <p className="text-xs text-slate-400">Other users can message you on SportHub</p>
              </div>
            </div>
            <Switch
              checked={form.contact_preferences.allow_messages}
              onCheckedChange={v => setContactPref("allow_messages", v)}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Show Email for Contact</p>
                <p className="text-xs text-slate-400">Display a contact email on your public profile</p>
              </div>
            </div>
            <Switch
              checked={form.contact_preferences.allow_email_contact}
              onCheckedChange={v => setContactPref("allow_email_contact", v)}
            />
          </div>

          {form.contact_preferences.allow_email_contact && (
            <div className="space-y-1.5 pl-7">
              <Label className="text-xs font-medium text-slate-500">Contact Email (public)</Label>
              <Input
                value={form.contact_email}
                onChange={e => setForm(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contact@example.com"
                type="email"
                className="rounded-xl h-9 text-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Show Phone Number</p>
                <p className="text-xs text-slate-400">Display a phone number for coaching/business inquiries</p>
              </div>
            </div>
            <Switch
              checked={form.contact_preferences.allow_phone_contact}
              onCheckedChange={v => setContactPref("allow_phone_contact", v)}
            />
          </div>

          {form.contact_preferences.allow_phone_contact && (
            <div className="space-y-1.5 pl-7">
              <Label className="text-xs font-medium text-slate-500">Phone Number (public)</Label>
              <Input
                value={form.contact_phone}
                onChange={e => setForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                type="tel"
                className="rounded-xl h-9 text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-medium text-slate-500">Preferred Contact Method</Label>
            <Select
              value={form.contact_preferences.preferred_contact}
              onValueChange={v => setContactPref("preferred_contact", v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="messages">SportHub Messages</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone / WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram DM</SelectItem>
                <SelectItem value="twitter">X / Twitter DM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save button at bottom */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl h-12 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white font-semibold text-base gap-2"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : null}
        {saving ? "Saving…" : saved ? "Saved!" : "Save Profile Settings"}
      </Button>
    </div>
  );
}