import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Radio, Eye, VideoOff, Loader2, PlayCircle, Users, Crown, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Switch } from "@/components/ui/switch";
import moment from "moment";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Track & Field", "Swimming", "Cycling", "CrossFit", "Weightlifting", "Martial Arts", "Other"];

export default function Live() {
  const [user, setUser] = useState(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [liveData, setLiveData] = useState({ 
    title: "", 
    description: "", 
    sport: "",
    is_premium: false,
    price: 0,
    stream_url: ""
  });
  const [goingLive, setGoingLive] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: liveStreams, isLoading, refetch } = useQuery({
    queryKey: ["live-streams"],
    queryFn: () => base44.entities.LiveStream.filter({ status: "live" }, "-started_at"),
    refetchInterval: 5000,
  });

  const { data: myActiveStream } = useQuery({
    queryKey: ["my-stream", user?.email],
    queryFn: () => base44.entities.LiveStream.filter({ host_email: user.email, status: "live" }),
    enabled: !!user,
    refetchInterval: 3000,
  });

  const goLive = async () => {
    if (!liveData.title.trim()) return;
    
    setGoingLive(true);
    await base44.entities.LiveStream.create({
      host_email: user.email,
      host_name: user.full_name,
      host_avatar: user.avatar_url,
      title: liveData.title,
      description: liveData.description,
      sport: liveData.sport,
      is_premium: liveData.is_premium,
      price: parseFloat(liveData.price) || 0,
      stream_url: liveData.stream_url,
      status: "live",
      viewers: [],
      started_at: new Date().toISOString(),
    });
    setGoingLive(false);
    setShowGoLive(false);
    setLiveData({ title: "", description: "", sport: "", is_premium: false, price: 0, stream_url: "" });
    refetch();
  };

  const endStream = async () => {
    if (!myActiveStream?.[0]) return;
    
    const stream = myActiveStream[0];
    
    // Generate AI summary from chat messages
    const chatMessages = await base44.entities.LiveChat.filter({ stream_id: stream.id }, "-created_date", 100);
    const chatContext = chatMessages.map(m => `${m.sender_name}: ${m.message}`).join("\n");
    
    const summaryPrompt = `Summarize this live sports stream based on the title, description, and chat messages. Focus on key topics discussed, highlights, and main takeaways. Keep it concise (3-4 sentences).

Title: ${stream.title}
Description: ${stream.description || "No description"}
Sport: ${stream.sport}

Chat Messages:
${chatContext || "No chat messages"}`;

    let summary = "";
    try {
      summary = await base44.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
      });
    } catch (error) {
      console.error("Failed to generate summary:", error);
    }

    await base44.entities.LiveStream.update(stream.id, {
      status: "ended",
      ended_at: new Date().toISOString(),
      ai_summary: summary,
    });
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 p-6 md:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-6 h-6 animate-pulse" />
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Live Training</h1>
                </div>
                <p className="text-white/90 text-sm md:text-base">Stream your workouts and watch others train</p>
              </div>
              {user && !myActiveStream?.[0] && (
                <Button
                  onClick={() => setShowGoLive(!showGoLive)}
                  className="bg-white text-red-600 hover:bg-white/90 rounded-xl gap-2 font-semibold"
                >
                  <Radio className="w-4 h-4" />
                  Go Live
                </Button>
              )}
              {myActiveStream?.[0] && (
                <Button
                  onClick={endStream}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20 rounded-xl"
                >
                  End Stream
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Go Live Form */}
        {showGoLive && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Start Your Live Stream</h2>
            <Input
              placeholder="Stream title (e.g., Morning Basketball Practice)"
              value={liveData.title}
              onChange={e => setLiveData({ ...liveData, title: e.target.value })}
              className="rounded-xl"
            />
            <Textarea
              placeholder="Description (optional)"
              value={liveData.description}
              onChange={e => setLiveData({ ...liveData, description: e.target.value })}
              className="rounded-xl resize-none"
              rows={2}
            />
            <Select value={liveData.sport} onValueChange={sport => setLiveData({ ...liveData, sport })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map(sport => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <Label>Stream URL (Optional)</Label>
              <Input
                value={liveData.stream_url}
                onChange={e => setLiveData({...liveData, stream_url: e.target.value})}
                placeholder="YouTube/Twitch embed URL or leave empty"
                className="rounded-xl"
              />
              <p className="text-xs text-slate-500">YouTube, Twitch, or other embed URL</p>
            </div>

            {user?.subscription_price > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <div>
                      <Label className="text-sm font-medium text-purple-900">Premium Stream</Label>
                      <p className="text-xs text-purple-700">Only subscribers can watch</p>
                    </div>
                  </div>
                  <Switch checked={liveData.is_premium} onCheckedChange={v => setLiveData({...liveData, is_premium: v})} />
                </div>

                {!liveData.is_premium && (
                  <div className="space-y-2">
                    <Label>Pay-Per-View Price (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={liveData.price}
                      onChange={e => setLiveData({...liveData, price: e.target.value})}
                      placeholder="0.00 (Free)"
                      className="rounded-xl"
                    />
                    <p className="text-xs text-slate-500">One-time fee to watch (0 for free)</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={goLive} disabled={goingLive} className="rounded-xl bg-red-600 hover:bg-red-700 flex-1">
                {goingLive ? "Starting..." : "Start Live Stream"}
              </Button>
              <Button onClick={() => setShowGoLive(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Stream Status - Broadcaster Dashboard */}
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
              <Button onClick={endStream} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl font-bold">
                End Stream
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">{myActiveStream[0].viewers?.length || 0}</p>
                <p className="text-white/70 text-xs font-medium">Viewers</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">{moment(myActiveStream[0].started_at).fromNow(true)}</p>
                <p className="text-white/70 text-xs font-medium">Duration</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Link to={createPageUrl("ViewLive") + `?id=${myActiveStream[0].id}`} className="block">
                  <p className="text-sm font-black">View Stream</p>
                  <p className="text-white/70 text-xs">As viewer →</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Live Streams */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-red-500" />
            Live Now
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : liveStreams?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <VideoOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No one is live right now</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to go live!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map(stream => (
                <Link
                  key={stream.id}
                  to={createPageUrl("ViewLive") + `?id=${stream.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative h-48 bg-gradient-to-br from-red-500 to-orange-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform" />
                      </div>
                      <Badge className="absolute top-3 left-3 bg-red-600 text-white gap-1 animate-pulse">
                        <Radio className="w-3 h-3" />
                        LIVE
                      </Badge>
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                        <Eye className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-semibold">
                          {stream.viewers?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={stream.host_avatar} />
                          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                            {stream.host_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{stream.host_name}</p>
                          <p className="text-xs text-slate-500">{moment(stream.started_at).fromNow()}</p>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{stream.title}</h3>
                      {stream.sport && (
                        <Badge variant="secondary" className="text-xs">{stream.sport}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}