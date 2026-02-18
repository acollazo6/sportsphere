import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Radio, Users, ArrowLeft, Crown, DollarSign, Loader2, Share2, Bell, CheckCircle, MessageSquare, BarChart2, MessageCircleQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import TipButton from "../components/monetization/TipButton";
import ContentSummary from "../components/content/ContentSummary";
import StreamChat from "../components/live/StreamChat";
import LiveReactions from "../components/live/LiveReactions";
import StreamPolls from "../components/live/StreamPolls";
import StreamQA from "../components/live/StreamQA";
import StreamSummaryPanel from "../components/live/StreamSummaryPanel";
import HighlightClipGenerator from "../components/live/HighlightClipGenerator";
import moment from "moment";

export default function ViewLive() {
  const urlParams = new URLSearchParams(window.location.search);
  const streamId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [panelTab, setPanelTab] = useState("chat");
  const [activeSummaryTab, setActiveSummaryTab] = useState("summary");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: stream, isLoading } = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => base44.entities.LiveStream.filter({ id: streamId }).then(s => s[0]),
    enabled: !!streamId,
    refetchInterval: 8000,
  });

  const { data: messages, refetch: refetchChat } = useQuery({
    queryKey: ["stream-chat", streamId],
    queryFn: () => base44.entities.LiveChat.filter({ stream_id: streamId }, "created_date", 100),
    enabled: !!streamId && hasAccess,
    refetchInterval: 2000,
  });

  // Real-time subscription to new chat messages
  useEffect(() => {
    if (!streamId || !hasAccess) return;
    const unsub = base44.entities.LiveChat.subscribe((event) => {
      if (event.data?.stream_id === streamId) {
        queryClient.invalidateQueries({ queryKey: ["stream-chat", streamId] });
      }
    });
    return unsub;
  }, [streamId, hasAccess]);

  // Check follow status
  useEffect(() => {
    if (!user || !stream) return;
    base44.entities.Follow.filter({ follower_email: user.email, following_email: stream.host_email, status: "accepted" })
      .then(f => setIsFollowing(f.length > 0));
  }, [user, stream]);

  // Access check
  useEffect(() => {
    if (!stream || !user) { setCheckingAccess(false); return; }
    const check = async () => {
      if (stream.host_email === user.email) { setHasAccess(true); setCheckingAccess(false); return; }
      if (!stream.is_premium && (!stream.price || stream.price === 0)) { setHasAccess(true); setCheckingAccess(false); return; }
      if (stream.is_premium) {
        const subs = await base44.entities.Subscription.filter({ subscriber_email: user.email, creator_email: stream.host_email, status: "active" });
        setHasAccess(subs.length > 0);
      } else if (stream.price > 0) {
        const txs = await base44.entities.Transaction.filter({ from_email: user.email, to_email: stream.host_email, type: "ppv" });
        setHasAccess(txs.some(t => t.stream_id === streamId));
      }
      setCheckingAccess(false);
    };
    check();
  }, [stream, user]);

  // Add/remove viewer
  useEffect(() => {
    if (!stream || !user || !hasAccess) return;
    const viewers = stream.viewers || [];
    if (!viewers.includes(user.email)) {
      base44.entities.LiveStream.update(streamId, { viewers: [...viewers, user.email] });
    }
    setViewerCount((stream.viewers?.length || 0) + 1);
    return () => {
      base44.entities.LiveStream.update(streamId, {
        viewers: (stream.viewers || []).filter(e => e !== user.email)
      });
    };
  }, [stream?.id, user?.email, hasAccess]);

  const handlePayment = async () => {
    if (!user) { toast.error("Please login to purchase access"); return; }
    await base44.entities.Transaction.create({
      from_email: user.email, to_email: stream.host_email,
      type: "ppv", amount: stream.price, status: "completed", stream_id: streamId,
    });
    await base44.entities.Notification.create({
      recipient_email: stream.host_email, actor_email: user.email,
      actor_name: user.full_name, actor_avatar: user.avatar_url,
      type: "follow", message: `purchased access to your live stream ($${stream.price})`,
    });
    toast.success("Access granted! Enjoy the stream 🎉");
    setHasAccess(true);
  };

  const handleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      const follows = await base44.entities.Follow.filter({ follower_email: user.email, following_email: stream.host_email });
      if (follows[0]) await base44.entities.Follow.delete(follows[0].id);
      setIsFollowing(false);
      toast.success("Unfollowed");
    } else {
      await base44.entities.Follow.create({ follower_email: user.email, following_email: stream.host_email, status: "accepted" });
      await base44.entities.Notification.create({
        recipient_email: stream.host_email, actor_email: user.email,
        actor_name: user.full_name, type: "follow", message: "started following you",
      });
      setIsFollowing(true);
      toast.success("Following! You'll see their content in your feed.");
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    const trimmed = message.trim();
    setMessage("");
    await base44.entities.LiveChat.create({
      stream_id: streamId,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url,
      message: trimmed,
      is_host_tag: stream.host_email === user.email,
    });
    queryClient.invalidateQueries({ queryKey: ["stream-chat", streamId] });
  };

  const togglePin = async (msg) => {
    if (stream.host_email !== user?.email) return;
    await base44.entities.LiveChat.update(msg.id, { is_pinned: !msg.is_pinned });
    queryClient.invalidateQueries({ queryKey: ["stream-chat", streamId] });
  };

  const shareStream = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Stream link copied! 📋");
  };

  if (isLoading || checkingAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">Stream not found</p>
        <Link to={createPageUrl("Live")} className="text-red-600 mt-3 inline-block font-semibold">← Back to Live</Link>
      </div>
    );
  }

  const isHost = stream.host_email === user?.email;
  const isLive = stream.status === "live";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-3 py-4">
        {/* Back */}
        <Link to={createPageUrl("Live")} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Live
        </Link>

        <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)] min-h-[600px]">
          {/* Video + Info */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            {/* Video Player */}
            <div className="bg-black rounded-2xl overflow-hidden flex-shrink-0">
              {hasAccess ? (
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 relative">
                    {stream.stream_url ? (
                      <iframe
                        src={stream.stream_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white p-8">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center">
                            <Radio className="w-10 h-10 text-red-400 animate-pulse" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{stream.title}</p>
                          <p className="text-slate-400">Stream is active — host hasn't added a stream URL yet</p>
                          {isHost && (
                            <p className="text-amber-400 text-sm mt-3">
                              Tip: Add a YouTube/Twitch embed URL when you go live so viewers can watch!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {isLive && (
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Badge className="bg-red-600 text-white gap-1.5 font-bold text-xs px-3 py-1 animate-pulse">
                          <Radio className="w-3 h-3" /> LIVE
                        </Badge>
                        <Badge className="bg-black/70 text-white gap-1 font-semibold text-xs px-2 py-1">
                          <Users className="w-3 h-3" /> {stream.viewers?.length || 0}
                        </Badge>
                      </div>
                    )}
                    {!isLive && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-slate-600 text-white font-bold text-xs px-3 py-1">ENDED</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-slate-900 to-red-950 flex items-center justify-center p-8">
                  <div className="text-center text-white max-w-md">
                    {stream.is_premium ? (
                      <>
                        <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                        <h2 className="text-2xl font-black mb-2">Premium Stream</h2>
                        <p className="text-slate-300 mb-6">Subscribe to {stream.host_name} to watch this exclusive stream</p>
                        <Link to={createPageUrl("UserProfile") + `?email=${stream.host_email}`}>
                          <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl px-8">
                            View Subscription Plans
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-400" />
                        <h2 className="text-2xl font-black mb-2">Pay-Per-View</h2>
                        <p className="text-slate-300 mb-6">One-time payment of <span className="text-green-400 font-bold">${stream.price}</span> to watch</p>
                        <Button onClick={handlePayment} className="bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl px-8">
                          Purchase Access — ${stream.price}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info / Summary & Clips */}
            {!isLive && (
              <div className="max-h-96 overflow-y-auto">
                {activeSummaryTab === "summary" ? (
                  <StreamSummaryPanel stream={stream} transcript={messages?.map(m => m.message).join("\n") || ""} />
                ) : (
                  <HighlightClipGenerator stream={stream} />
                )}
              </div>
            )}

            <div className="bg-slate-900 rounded-2xl p-4 flex-shrink-0">
              <h1 className="text-xl font-black text-white mb-3">{stream.title}</h1>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Link to={createPageUrl("UserProfile") + `?email=${stream.host_email}`}>
                    <Avatar className="w-10 h-10 ring-2 ring-red-500/50">
                      <AvatarImage src={stream.host_avatar} />
                      <AvatarFallback className="bg-red-700 text-white font-bold">{stream.host_name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <p className="text-white font-bold text-sm">{stream.host_name}</p>
                    <p className="text-slate-400 text-xs">{moment(stream.started_at).fromNow()}</p>
                  </div>
                  {user && !isHost && (
                    <Button
                      onClick={handleFollow}
                      size="sm"
                      variant={isFollowing ? "outline" : "default"}
                      className={`rounded-xl text-xs font-bold ${isFollowing ? "border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400" : "bg-red-600 hover:bg-red-700 text-white"}`}
                    >
                      {isFollowing ? (
                        <><CheckCircle className="w-3 h-3" /> Following</>
                      ) : (
                        <><Bell className="w-3 h-3" /> Follow</>
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {stream.sport && <Badge className="bg-slate-700 text-slate-300 font-semibold text-xs">{stream.sport}</Badge>}
                  <Button onClick={shareStream} variant="ghost" size="sm" className="text-slate-400 hover:text-white rounded-xl">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {user && !isHost && (
                    <TipButton
                      creator={{ email: stream.host_email, name: stream.host_name }}
                      contextType="stream"
                      contextId={stream.id}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {stream.description && (
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">{stream.description}</p>
              )}

              {stream.status === "ended" && stream.ai_summary && (
                <div className="mt-3 p-3 bg-slate-800 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 mb-1">✨ AI Stream Summary</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{stream.ai_summary}</p>
                </div>
              )}

              {/* Reactions */}
              {hasAccess && isLive && user && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2 font-medium">React to the stream:</p>
                  <LiveReactions streamId={streamId} user={user} />
                </div>
              )}
            </div>
          </div>

          {/* Chat / Polls / Q&A Panel or Summary Tabs */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden min-h-0 max-h-[80vh] lg:max-h-full">
            {/* Tab Header */}
            <div className="px-4 pt-3 pb-0 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-1">
                {(isLive ? [
                   { key: "chat", icon: MessageSquare, label: "Chat" },
                   { key: "polls", icon: BarChart2, label: "Polls" },
                   { key: "qa", icon: MessageCircleQuestion, label: "Q&A" },
                 ] : [
                   { key: "summary", icon: MessageSquare, label: "Summary" },
                   { key: "clips", icon: BarChart2, label: "Highlights" },
                 ]).map(tab => (
                   <button
                     key={tab.key}
                     onClick={() => isLive ? setPanelTab(tab.key) : setActiveSummaryTab(tab.key)}
                     className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors
                       ${(isLive ? panelTab : activeSummaryTab) === tab.key
                         ? "border-red-500 text-white"
                         : "border-transparent text-slate-400 hover:text-slate-200"}`}
                   >
                     <tab.icon className="w-3.5 h-3.5" />
                     {tab.label}
                     {tab.key === "chat" && isLive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                   </button>
                 ))}
              </div>
            </div>

            {isLive ? (
               hasAccess ? (
                 <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                   {panelTab === "chat" && (
                     <StreamChat
                       messages={messages}
                       user={user}
                       isHost={isHost}
                       message={message}
                       setMessage={setMessage}
                       onSend={sendMessage}
                       onPin={togglePin}
                     />
                   )}
                   {panelTab === "polls" && (
                     <div className="flex-1 overflow-y-auto p-4">
                       <StreamPolls streamId={streamId} user={user} isHost={isHost} isLive={isLive} />
                     </div>
                   )}
                   {panelTab === "qa" && (
                     <div className="flex-1 flex flex-col overflow-hidden p-4 min-h-0">
                       <StreamQA streamId={streamId} user={user} isHost={isHost} isLive={isLive} />
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center p-6">
                   <div className="text-center">
                     <p className="text-4xl mb-3">🔒</p>
                     <p className="text-slate-400 text-sm font-medium">Purchase access to join the chat</p>
                   </div>
                 </div>
               )
             ) : (
               <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                 {activeSummaryTab === "summary" && (
                   <div className="flex-1 overflow-y-auto p-4">
                     <StreamSummaryPanel stream={stream} transcript={messages?.map(m => m.message).join("\n") || ""} />
                   </div>
                 )}
                 {activeSummaryTab === "clips" && (
                   <div className="flex-1 overflow-y-auto p-4">
                     <HighlightClipGenerator stream={stream} />
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}