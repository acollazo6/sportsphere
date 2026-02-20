import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Radio, Eye, VideoOff, Loader2, PlayCircle, Users, Crown, Clock, Sparkles, Search, X, Filter, Upload, Settings2, Zap, Shield, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Switch } from "@/components/ui/switch";
import StreamSearch from "../components/discover/StreamSearch";
import moment from "moment";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Track & Field", "Swimming", "Cycling", "CrossFit", "Weightlifting", "Martial Arts", "Other"];

function StreamCard({ stream, isLive }) {
  return (
    <Link to={createPageUrl("ViewLive") + `?id=${stream.id}`} className="group">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all">
        <div className={`relative h-44 ${isLive ? "bg-gradient-to-br from-red-600 to-orange-500" : "bg-gradient-to-br from-slate-700 to-slate-900"}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle className="w-14 h-14 text-white/60 group-hover:text-white/90 group-hover:scale-110 transition-all" />
          </div>
          {isLive ? (
            <Badge className="absolute top-3 left-3 bg-red-600 text-white gap-1 animate-pulse text-xs font-black">
              <Radio className="w-3 h-3" /> LIVE
            </Badge>
          ) : (
            <Badge className="absolute top-3 left-3 bg-slate-600 text-white text-xs font-semibold">VOD</Badge>
          )}
          <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-lg flex items-center gap-1">
            {isLive ? <Eye className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
            <span className="text-white text-xs font-semibold">
              {isLive ? (stream.viewers?.length || 0) : moment(stream.ended_at || stream.started_at).fromNow()}
            </span>
          </div>
          {stream.thumbnail_url && (
            <img src={stream.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
        </div>
        <div className="p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={stream.host_avatar} />
              <AvatarFallback className="text-[10px] bg-slate-200">{stream.host_name?.[0]}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-semibold text-slate-600 truncate">{stream.host_name}</p>
          </div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1.5">{stream.title}</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {stream.sport && <Badge variant="secondary" className="text-xs px-2">{stream.sport}</Badge>}
            {stream.is_premium && <Badge className="bg-amber-100 text-amber-700 text-xs px-2"><Crown className="w-2.5 h-2.5 mr-1" />Premium</Badge>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Live() {
  const [user, setUser] = useState(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [liveData, setLiveData] = useState({ title: "", description: "", sport: "", is_premium: false, price: 0, stream_url: "" });
  const [streamQuality, setStreamQuality] = useState("1080p");
  const [maxDuration, setMaxDuration] = useState("unlimited");
  const [vodFile, setVodFile] = useState(null);
  const [vodUploading, setVodUploading] = useState(false);
  const [vodUrl, setVodUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [liveMode, setLiveMode] = useState("live"); // "live" | "upload"
  const [goingLive, setGoingLive] = useState(false);
  const [tab, setTab] = useState("live");
  const [filters, setFilters] = useState({ query: "", sport: "all", sort: "recent" });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: liveStreams, isLoading: loadingLive, refetch } = useQuery({
    queryKey: ["live-streams"],
    queryFn: () => base44.entities.LiveStream.filter({ status: "live" }, "-started_at"),
    refetchInterval: 5000,
  });

  const { data: pastStreams, isLoading: loadingPast } = useQuery({
    queryKey: ["past-streams"],
    queryFn: () => base44.entities.LiveStream.filter({ status: "ended" }, "-ended_at", 60),
  });

  const { data: myActiveStream } = useQuery({
    queryKey: ["my-stream", user?.email],
    queryFn: () => base44.entities.LiveStream.filter({ host_email: user.email, status: "live" }),
    enabled: !!user,
    refetchInterval: 3000,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["follows-live", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email, status: "accepted" }),
    enabled: !!user,
  });

  const { data: preferences } = useQuery({
    queryKey: ["prefs-live", user?.email],
    queryFn: async () => { const p = await base44.entities.FeedPreferences.filter({ user_email: user.email }); return p[0]; },
    enabled: !!user,
  });

  const followedEmails = useMemo(() => follows.map(f => f.following_email), [follows]);
  const interests = preferences?.preferred_sports || [];

  const applyFilters = (streams) => {
    if (!streams) return [];
    let result = [...streams];
    const q = filters.query.toLowerCase();
    if (q) result = result.filter(s => s.title?.toLowerCase().includes(q) || s.host_name?.toLowerCase().includes(q));
    if (filters.sport !== "all") result = result.filter(s => s.sport === filters.sport);
    if (filters.sort === "popular") result.sort((a, b) => (b.viewers?.length || 0) - (a.viewers?.length || 0));
    else if (filters.sort === "recent") result.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
    return result;
  };

  // Recommended: followed creators or matching interests
  const recommended = useMemo(() => {
    const pool = [...(liveStreams || []), ...(pastStreams || [])];
    return pool.filter(s => followedEmails.includes(s.host_email) || interests.includes(s.sport))
      .sort((a, b) => {
        const scoreA = (followedEmails.includes(a.host_email) ? 10 : 0) + (interests.includes(a.sport) ? 5 : 0) + (a.viewers?.length || 0);
        const scoreB = (followedEmails.includes(b.host_email) ? 10 : 0) + (interests.includes(b.sport) ? 5 : 0) + (b.viewers?.length || 0);
        return scoreB - scoreA;
      }).slice(0, 6);
  }, [liveStreams, pastStreams, followedEmails, interests]);

  const filteredLive = applyFilters(liveStreams);
  const filteredPast = applyFilters(pastStreams);

  const handleVodUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVodFile(file);
    setVodUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setVodUrl(file_url);
    setVodUploading(false);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setThumbnailUrl(file_url);
  };

  const goLive = async () => {
    if (!liveData.title.trim()) return;
    setGoingLive(true);
    const isVod = liveMode === "upload";
    await base44.entities.LiveStream.create({
      host_email: user.email, host_name: user.full_name, host_avatar: user.avatar_url,
      title: liveData.title, description: liveData.description, sport: liveData.sport,
      is_premium: liveData.is_premium, price: parseFloat(liveData.price) || 0,
      stream_url: isVod ? vodUrl : liveData.stream_url,
      thumbnail_url: thumbnailUrl || undefined,
      status: isVod ? "ended" : "live",
      viewers: [],
      started_at: new Date().toISOString(),
      ended_at: isVod ? new Date().toISOString() : undefined,
      ai_tags: streamQuality ? [`quality:${streamQuality}`] : [],
    });
    setGoingLive(false);
    setShowGoLive(false);
    setLiveData({ title: "", description: "", sport: "", is_premium: false, price: 0, stream_url: "" });
    setVodFile(null); setVodUrl(""); setThumbnailFile(null); setThumbnailUrl("");
    refetch();
  };

  const endStream = async () => {
    if (!myActiveStream?.[0]) return;
    const stream = myActiveStream[0];
    const chatMessages = await base44.entities.LiveChat.filter({ stream_id: stream.id }, "-created_date", 100);
    const chatContext = chatMessages.map(m => `${m.sender_name}: ${m.message}`).join("\n");
    let summary = "";
    try {
      summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this live sports stream in 3-4 sentences. Title: ${stream.title}. Sport: ${stream.sport}. Chat: ${chatContext || "No chat messages"}`,
      });
    } catch (e) {}
    await base44.entities.LiveStream.update(stream.id, { status: "ended", ended_at: new Date().toISOString(), ai_summary: summary });
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-orange-500 p-6 md:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f6f4f4e61dd2806b88ed2/15137601c_392DC896-FFC0-4491-BCB6-20C0C160BF03.png"
            alt="SportSphere"
            className="absolute right-6 top-1/2 -translate-y-1/2 h-20 w-20 object-contain opacity-20 pointer-events-none"
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-6 h-6 animate-pulse" />
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Live Streams & VODs</h1>
              </div>
              <p className="text-white/85 text-sm md:text-base">Watch live training, past streams, and highlights</p>
            </div>
            {user && !myActiveStream?.[0] && (
              <Button onClick={() => setShowGoLive(!showGoLive)} className="bg-white text-red-700 hover:bg-white/90 rounded-xl gap-2 font-black shadow-xl">
                <Radio className="w-4 h-4 animate-pulse" /> Go Live
              </Button>
            )}
          </div>
        </div>

        {/* Go Live / Upload Form */}
        {showGoLive && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100">
              <button
                onClick={() => setLiveMode("live")}
                className={`flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all ${liveMode === "live" ? "bg-white text-red-600 border-b-2 border-red-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Radio className="w-4 h-4" /> Go Live
              </button>
              <button
                onClick={() => setLiveMode("upload")}
                className={`flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all ${liveMode === "upload" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Upload className="w-4 h-4" /> Upload Video
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic info */}
              <div className="space-y-3">
                <Input placeholder="Title *" value={liveData.title} onChange={e => setLiveData({ ...liveData, title: e.target.value })} className="rounded-xl" />
                <Textarea placeholder="Description (optional)" value={liveData.description} onChange={e => setLiveData({ ...liveData, description: e.target.value })} className="rounded-xl resize-none" rows={2} />
                <Select value={liveData.sport} onValueChange={sport => setLiveData({ ...liveData, sport })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sport" /></SelectTrigger>
                  <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {liveMode === "live" ? (
                /* ── Live mode ── */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Stream URL (YouTube / Twitch embed)</Label>
                    <Input value={liveData.stream_url} onChange={e => setLiveData({ ...liveData, stream_url: e.target.value })} placeholder="Paste embed URL (optional)" className="rounded-xl" />
                  </div>

                  {/* Quality & Duration settings */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Stream Quality</Label>
                      <Select value={streamQuality} onValueChange={setStreamQuality}>
                        <SelectTrigger className="rounded-lg h-9 text-sm bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480p">480p — SD</SelectItem>
                          <SelectItem value="720p">720p — HD</SelectItem>
                          <SelectItem value="1080p">1080p — Full HD</SelectItem>
                          <SelectItem value="4K">4K — Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Max Duration</Label>
                      <Select value={maxDuration} onValueChange={setMaxDuration}>
                        <SelectTrigger className="rounded-lg h-9 text-sm bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30min">30 minutes</SelectItem>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="2h">2 hours</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quality indicator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{streamQuality === "4K" ? "Ultra HD requires strong upload bandwidth (25+ Mbps)" : streamQuality === "1080p" ? "Full HD recommended for sports content (10+ Mbps)" : streamQuality === "720p" ? "HD — good balance of quality & stability (5+ Mbps)" : "SD — best for low bandwidth connections (2+ Mbps)"}</span>
                  </div>
                </div>
              ) : (
                /* ── Upload mode ── */
                <div className="space-y-3">
                  {/* Video upload */}
                  <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${vodUrl ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-blue-300 bg-slate-50"}`}>
                    {vodUrl ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <PlayCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-green-700">Video uploaded!</p>
                        <p className="text-xs text-green-600 truncate max-w-xs mx-auto">{vodFile?.name}</p>
                        <button onClick={() => { setVodFile(null); setVodUrl(""); }} className="text-xs text-red-500 hover:text-red-700 underline">Remove</button>
                      </div>
                    ) : vodUploading ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                        <p className="text-sm text-slate-500">Uploading video…</p>
                      </div>
                    ) : (
                      <label className="cursor-pointer space-y-2 block">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-slate-600">Click to upload video</p>
                        <p className="text-xs text-slate-400">MP4, MOV, AVI up to 2GB</p>
                        <input type="file" accept="video/*" onChange={handleVodUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Thumbnail upload */}
                  <div className="flex items-center gap-3">
                    <div className={`w-20 h-14 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden ${thumbnailUrl ? "border-transparent" : "border-slate-200"}`}>
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="thumb" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-xs text-slate-400 text-center leading-tight px-1">No thumb</span>
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 transition-all text-sm text-slate-600 font-medium">
                        <Upload className="w-4 h-4" /> Upload Thumbnail (optional)
                      </div>
                      <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Quality tag for VOD */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Video Quality Tag</Label>
                    <Select value={streamQuality} onValueChange={setStreamQuality}>
                      <SelectTrigger className="rounded-xl h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="480p">480p — SD</SelectItem>
                        <SelectItem value="720p">720p — HD</SelectItem>
                        <SelectItem value="1080p">1080p — Full HD</SelectItem>
                        <SelectItem value="4K">4K — Ultra HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Premium toggle */}
              {user?.subscription_price > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <Label className="text-sm font-medium text-purple-900">Premium subscribers only</Label>
                  </div>
                  <Switch checked={liveData.is_premium} onCheckedChange={v => setLiveData({ ...liveData, is_premium: v })} />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={goLive}
                  disabled={goingLive || (liveMode === "upload" && !vodUrl)}
                  className={`rounded-xl flex-1 font-bold ${liveMode === "live" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {goingLive
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</>
                    : liveMode === "live"
                      ? <><Radio className="w-4 h-4 mr-2 animate-pulse" />Start Live Stream</>
                      : <><Upload className="w-4 h-4 mr-2" />Publish VOD</>
                  }
                </Button>
                <Button onClick={() => setShowGoLive(false)} variant="outline" className="rounded-xl px-5">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Active broadcast dashboard */}
        {myActiveStream?.[0] && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-300 rounded-full animate-ping" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">● LIVE</span>
                    <h3 className="font-black text-lg">You're Broadcasting</h3>
                  </div>
                  <p className="text-white/80 text-sm">{myActiveStream[0].title}</p>
                </div>
              </div>
              <Button onClick={endStream} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl font-bold">End Stream</Button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-2xl font-black">{myActiveStream[0].viewers?.length || 0}</p>
                <p className="text-white/70 text-xs font-medium">Viewers</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xl font-black">{moment(myActiveStream[0].started_at).fromNow(true)}</p>
                <p className="text-white/70 text-xs font-medium">Duration</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <Link to={createPageUrl("ViewLive") + `?id=${myActiveStream[0].id}`}>
                  <p className="text-sm font-black">View →</p>
                  <p className="text-white/70 text-xs">As viewer</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recommended for You */}
        {user && recommended.length > 0 && (
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Recommended For You
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map(s => <StreamCard key={s.id} stream={s} isLive={s.status === "live"} />)}
            </div>
          </div>
        )}

        {/* Tabs: Live / Past */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="rounded-xl bg-slate-100 h-10">
              <TabsTrigger value="live" className="rounded-lg gap-1.5 text-sm font-bold">
                <Radio className="w-3.5 h-3.5" /> Live Now {liveStreams?.length > 0 && <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 ml-0.5">{liveStreams.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-lg gap-1.5 text-sm font-bold">
                <PlayCircle className="w-3.5 h-3.5" /> Past Streams
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters — shared */}
          <div className="mt-3">
            <StreamSearch filters={filters} onChange={setFilters} />
          </div>

          <TabsContent value="live" className="mt-4">
            {loadingLive ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
            ) : filteredLive.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-slate-100">
                <VideoOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">{filters.query || filters.sport !== "all" ? "No streams match your filters" : "No one is live right now"}</p>
                <p className="text-slate-400 text-sm mt-1">Be the first to go live!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLive.map(s => <StreamCard key={s.id} stream={s} isLive={true} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {loadingPast ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
            ) : filteredPast.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-slate-100">
                <VideoOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">{filters.query || filters.sport !== "all" ? "No past streams match your filters" : "No past streams yet"}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPast.map(s => <StreamCard key={s.id} stream={s} isLive={false} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}