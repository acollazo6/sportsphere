import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Upload, Video, Loader2, CheckCircle, Tag, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import VideoEditor from "../components/video/VideoEditor";

const VISIBILITY_OPTIONS = [
  { value: "coaches_only", label: "Coaches Only" },
  { value: "org", label: "Entire Team" },
  { value: "private", label: "Only Me" },
];

export default function UploadVideo() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", visibility: "coaches_only", tag: "" });
  const [tags, setTags] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [videoMeta, setVideoMeta] = useState({ thumbnailFile: null, thumbnailPreview: null, chapters: [], trimStart: undefined, trimEnd: undefined });

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setOrgId(orgs[0].id); return; }
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      if (memberships[0]) setOrgId(memberships[0].organization_id);
    }).catch(() => {});
  }, []);

  const { data: membership } = useQuery({
    queryKey: ["my-membership", user?.email],
    queryFn: () => base44.entities.OrgMember.filter({ user_email: user.email }).then(r => r[0]),
    enabled: !!user,
  });

  const addTag = () => {
    if (form.tag.trim() && !tags.includes(form.tag.trim())) {
      setTags(t => [...t, form.tag.trim()]);
      setForm(f => ({ ...f, tag: "" }));
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !form.title || !orgId) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
    let thumbnailUrl = undefined;
    if (videoMeta.thumbnailFile) {
      const { file_url: thumb_url } = await base44.integrations.Core.UploadFile({ file: videoMeta.thumbnailFile });
      thumbnailUrl = thumb_url;
    }
    await base44.entities.AthleteVideo.create({
      organization_id: orgId,
      athlete_email: user.email,
      athlete_name: user.full_name,
      title: form.title,
      description: form.description,
      video_url: file_url,
      thumbnail_url: thumbnailUrl,
      sport: membership?.sport || "",
      tags,
      visibility: form.visibility,
      coach_reviewed: false,
      video_chapters: videoMeta.chapters?.length > 0 ? videoMeta.chapters : undefined,
      video_trim: videoMeta.trimStart !== undefined ? { startTime: videoMeta.trimStart, endTime: videoMeta.trimEnd } : undefined,
    });
    setUploading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Video Uploaded!</h2>
        <p className="text-gray-500">Your coach will review it and provide feedback soon.</p>
        <Button onClick={() => { setDone(false); setVideoFile(null); setForm({ title: "", description: "", visibility: "coaches_only", tag: "" }); setTags([]); }}
          className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold">
          Upload Another
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Upload className="w-6 h-6 text-red-900" /> Upload Training Video
        </h1>
        <p className="text-gray-500 text-sm mt-1">Share your training footage with your coaches</p>
      </div>

      {/* Video picker */}
      <div
        onClick={() => document.getElementById("videoInput").click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all"
      >
        {videoFile ? (
          <div className="space-y-2">
            {videoMeta.thumbnailPreview
              ? <img src={videoMeta.thumbnailPreview} alt="thumb" className="w-24 h-16 object-cover rounded-xl mx-auto border-2 border-red-200" />
              : <Video className="w-10 h-10 text-red-900 mx-auto" />
            }
            <p className="font-semibold text-gray-900 text-sm">{videoFile.name}</p>
            <p className="text-xs text-gray-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-500">Click to select video</p>
            <p className="text-xs text-gray-400">MP4, MOV, AVI supported</p>
          </div>
        )}
        <input id="videoInput" type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0])} />
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold mb-1.5 block">Title *</Label>
          <Input placeholder="e.g. Free throw practice - Day 3" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-1.5 block">Description</Label>
          <Textarea placeholder="What did you work on?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl" rows={3} />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-1.5 block">Visibility</Label>
          <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold mb-1.5 block">Skill Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. dribbling, shooting..."
              value={form.tag}
              onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addTag()}
              className="rounded-xl flex-1"
            />
            <Button variant="outline" onClick={addTag} className="rounded-xl"><Tag className="w-4 h-4" /></Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(t => (
                <Badge key={t} className="bg-blue-100 text-blue-700 border-0 gap-1 pr-1.5">
                  {t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={uploading || !videoFile || !form.title}
        className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold py-3 text-base gap-2"
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Video</>}
      </Button>
    </div>
  );
}