import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Sparkles, Loader2, CheckCircle, Star, Upload } from "lucide-react";
import VideoFormAnalysis from "@/components/org/VideoFormAnalysis";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VideoReview() {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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

  const { data: videos, isLoading } = useQuery({
    queryKey: ["org-videos", orgId, role, user?.email],
    queryFn: () => {
      if (role === "athlete") return base44.entities.AthleteVideo.filter({ organization_id: orgId, athlete_email: user.email });
      return base44.entities.AthleteVideo.filter({ organization_id: orgId });
    },
    enabled: !!orgId && !!role,
  });

  const pending = videos?.filter(v => !v.coach_reviewed) || [];
  const reviewed = videos?.filter(v => v.coach_reviewed) || [];

  const generateAIAnalysis = async (video) => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports coach analyzing an athlete's training video.

Video title: ${video.title}
Sport: ${video.sport || "General"}
Athlete description: ${video.description || "Not provided"}
Tags: ${video.tags?.join(", ") || "None"}

Provide a concise, constructive coaching analysis. Focus on:
1. Likely strengths based on the sport and description
2. Common areas to work on for this type of training
3. 2-3 specific actionable recommendations

Keep it encouraging and practical. 3-4 sentences max.`,
    });
    setFeedback(result);
    setAiLoading(false);
  };

  const saveFeedback = async () => {
    if (!selectedVideo || !feedback) return;
    setSaving(true);
    await base44.entities.AthleteVideo.update(selectedVideo.id, {
      coach_reviewed: true,
      coach_feedback: feedback,
      coach_rating: rating || null,
    });
    qc.invalidateQueries(["org-videos"]);
    setSaving(false);
    setSelectedVideo(null);
    setFeedback("");
    setRating(0);
  };

  const VideoCard = ({ video }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedVideo(video); setFeedback(video.coach_feedback || ""); setRating(video.coach_rating || 0); }}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-20 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0">
            {video.thumbnail_url
              ? <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="thumb" />
              : <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-gray-400" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm truncate">{video.title}</h3>
              {video.coach_reviewed && <Badge className="bg-green-100 text-green-700 border-0 text-xs">Reviewed</Badge>}
            </div>
            <p className="text-xs text-gray-500 mt-1">{video.athlete_name || video.athlete_email} • {video.sport}</p>
            {video.coach_rating > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= video.coach_rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Video className="w-6 h-6 text-red-900" /> Training Videos</h1>
        <p className="text-gray-500 text-sm mt-0.5">{pending.length} pending review</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Video list */}
        <div>
          <Tabs defaultValue="pending">
            <TabsList className="rounded-xl mb-4">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({reviewed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="space-y-3">
              {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                : pending.length === 0 ? <p className="text-gray-400 text-sm text-center py-10">All videos reviewed! 🎉</p>
                : pending.map(v => <VideoCard key={v.id} video={v} />)}
            </TabsContent>
            <TabsContent value="reviewed" className="space-y-3">
              {reviewed.map(v => <VideoCard key={v.id} video={v} />)}
            </TabsContent>
          </Tabs>
        </div>

        {/* Feedback panel */}
        <div>
          {selectedVideo ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="font-black text-gray-900">{selectedVideo.title}</h3>
                  <p className="text-sm text-gray-500">{selectedVideo.athlete_name} • {selectedVideo.sport}</p>
                </div>
                {selectedVideo.video_url && (
                  <video src={selectedVideo.video_url} controls className="w-full rounded-xl aspect-video bg-black" />
                )}
                {/* Star rating */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setRating(s)}>
                        <Star className={`w-6 h-6 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition-colors`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Coach Feedback</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateAIAnalysis(selectedVideo)}
                      disabled={aiLoading}
                      className="rounded-xl text-purple-700 border-purple-300 hover:bg-purple-50 gap-1.5 text-xs"
                    >
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Assist
                    </Button>
                  </div>
                  <Textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Write your coaching feedback here..."
                    className="rounded-xl"
                    rows={5}
                  />
                </div>
                <Button onClick={saveFeedback} disabled={saving || !feedback} className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Feedback
                </Button>

                <div className="border-t border-gray-100 pt-4">
                  <VideoFormAnalysis video={selectedVideo} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
              Select a video to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}