import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Radio, Users, ArrowLeft, Send, Crown, DollarSign, Loader2, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import TipButton from "../components/monetization/TipButton";
import ContentSummary from "../components/content/ContentSummary";

export default function ViewLive() {
  const urlParams = new URLSearchParams(window.location.search);
  const streamId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: stream, isLoading } = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => base44.entities.LiveStream.filter({ id: streamId }).then(s => s[0]),
    enabled: !!streamId,
    refetchInterval: 10000, // Refresh every 10s
  });

  const { data: messages } = useQuery({
    queryKey: ["stream-chat", streamId],
    queryFn: () => base44.entities.LiveChat.filter({ stream_id: streamId }, "-created_date", 100),
    enabled: !!streamId && hasAccess,
    refetchInterval: 3000, // Refresh every 3s
  });

  // Check access permissions
  useEffect(() => {
    if (!stream || !user) {
      setCheckingAccess(false);
      return;
    }

    const checkAccess = async () => {
      // Host always has access
      if (stream.host_email === user.email) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // Free stream
      if (!stream.is_premium && (!stream.price || stream.price === 0)) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // Premium stream - check subscription
      if (stream.is_premium) {
        const subs = await base44.entities.Subscription.filter({
          subscriber_email: user.email,
          creator_email: stream.host_email,
          status: "active"
        });
        setHasAccess(subs.length > 0);
        setCheckingAccess(false);
        return;
      }

      // Pay-per-view - check transaction
      if (stream.price > 0) {
        const transactions = await base44.entities.Transaction.filter({
          from_email: user.email,
          to_email: stream.host_email,
          type: "subscription", // Using subscription type for PPV
          status: "completed"
        });
        // Check if user paid for this stream (simplified - you might want a dedicated transaction type)
        setHasAccess(transactions.length > 0);
        setCheckingAccess(false);
        return;
      }

      setCheckingAccess(false);
    };

    checkAccess();
  }, [stream, user]);

  // Add viewer on mount
  useEffect(() => {
    if (!stream || !user || !hasAccess) return;
    
    const addViewer = async () => {
      const viewers = stream.viewers || [];
      if (!viewers.includes(user.email)) {
        await base44.entities.LiveStream.update(streamId, {
          viewers: [...viewers, user.email]
        });
        queryClient.invalidateQueries({ queryKey: ["stream", streamId] });
      }
    };

    addViewer();

    // Remove viewer on unmount
    return () => {
      const removeViewer = async () => {
        const viewers = stream.viewers || [];
        await base44.entities.LiveStream.update(streamId, {
          viewers: viewers.filter(e => e !== user.email)
        });
      };
      removeViewer();
    };
  }, [stream, user, hasAccess]);

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please login to purchase access");
      return;
    }

    // Create transaction
    await base44.entities.Transaction.create({
      from_email: user.email,
      to_email: stream.host_email,
      type: "subscription",
      amount: stream.price,
      status: "completed",
    });

    // Send notification
    await base44.entities.Notification.create({
      recipient_email: stream.host_email,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_avatar: user.avatar_url,
      type: "follow",
      message: `purchased access to your live stream ($${stream.price})`,
    });

    toast.success("Access granted! Enjoy the stream 🎉");
    setHasAccess(true);
  };

  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    await base44.entities.LiveChat.create({
      stream_id: streamId,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url,
      message: message.trim(),
    });

    setMessage("");
    queryClient.invalidateQueries({ queryKey: ["stream-chat", streamId] });
  };

  const togglePinMessage = async (msg) => {
    if (stream.host_email !== user?.email) return;
    await base44.entities.LiveChat.update(msg.id, { is_pinned: !msg.is_pinned });
    queryClient.invalidateQueries({ queryKey: ["stream-chat", streamId] });
  };

  if (isLoading || checkingAccess) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Stream not found</p>
      </div>
    );
  }

  const isHost = stream.host_email === user?.email;
  const pinnedMessages = messages?.filter(m => m.is_pinned) || [];
  const regularMessages = messages?.filter(m => !m.is_pinned) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to={createPageUrl("Live")} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Live
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-white/50 overflow-hidden shadow-2xl shadow-purple-500/20">
              {hasAccess ? (
                <>
                  <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 relative flex items-center justify-center">
                    {stream.stream_url ? (
                      <iframe
                        src={stream.stream_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center text-white p-8">
                        <Radio className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                        <p className="text-xl font-bold">Live Stream Active</p>
                        <p className="text-slate-300 mt-2">Stream URL not configured</p>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 px-4 py-2 bg-red-600 text-white text-sm font-black rounded-full flex items-center gap-2 shadow-xl shadow-red-500/50 animate-pulse">
                      <Radio className="w-4 h-4" />
                      LIVE
                    </div>
                  </div>
                  <div className="p-6 space-y-4 bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm">
                    <h1 className="text-2xl font-black text-slate-900">{stream.title}</h1>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <Link to={createPageUrl("UserProfile") + `?email=${stream.host_email}`} className="flex items-center gap-3 group">
                        <Avatar className="w-12 h-12 ring-3 ring-purple-200 group-hover:ring-purple-400 transition-all">
                          <AvatarImage src={stream.host_avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                            {stream.host_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{stream.host_name}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="font-semibold">{stream.viewers?.length || 0} watching</span>
                          </div>
                        </div>
                      </Link>
                      {stream.sport && (
                        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-bold">{stream.sport}</Badge>
                      )}
                      {user && stream.host_email !== user.email && (
                        <TipButton
                          creator={{ email: stream.host_email, name: stream.host_name }}
                          contextType="stream"
                          contextId={stream.id}
                          variant="outline"
                          size="sm"
                        />
                      )}
                    </div>
                    {stream.description && (
                      <p className="text-slate-600 leading-relaxed">{stream.description}</p>
                    )}
                    {stream.status === "ended" && stream.ai_summary && (
                      <ContentSummary summary={stream.ai_summary} type="stream" />
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 relative flex items-center justify-center p-8">
                  <div className="text-center text-white max-w-md">
                    {stream.is_premium ? (
                      <>
                        <Crown className="w-20 h-20 mx-auto mb-4 drop-shadow-xl" />
                        <h2 className="text-3xl font-black mb-3 drop-shadow-lg">Premium Stream</h2>
                        <p className="text-white/90 mb-6 font-semibold">Subscribe to {stream.host_name} to watch this exclusive content</p>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-20 h-20 mx-auto mb-4 drop-shadow-xl" />
                        <h2 className="text-3xl font-black mb-3 drop-shadow-lg">Pay-Per-View</h2>
                        <p className="text-white/90 mb-6 font-semibold">One-time payment of ${stream.price} to watch this stream</p>
                        <Button
                          onClick={handlePayment}
                          className="bg-white text-purple-600 hover:bg-white/90 rounded-2xl px-8 py-6 text-lg font-bold shadow-2xl"
                        >
                          Purchase Access - ${stream.price}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Chat */}
          {hasAccess && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-white/50 shadow-2xl shadow-purple-500/20 flex flex-col h-[600px]">
              <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  💬 Live Chat
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold">
                    {messages?.length || 0}
                  </Badge>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {pinnedMessages.map(msg => (
                  <div key={msg.id} className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-3 border-2 border-amber-300 shadow-lg">
                    <div className="flex items-start gap-2">
                      <Pin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={msg.sender_avatar} />
                            <AvatarFallback className="text-xs bg-amber-200">{msg.sender_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <p className="font-bold text-sm text-amber-900 truncate">{msg.sender_name}</p>
                        </div>
                        <p className="text-sm text-amber-900 break-words">{msg.message}</p>
                      </div>
                      {isHost && (
                        <button onClick={() => togglePinMessage(msg)} className="text-amber-600 hover:text-amber-800">
                          <Pin className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {regularMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-2 hover:bg-purple-50/50 rounded-xl p-2 transition-colors group">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.sender_avatar} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-200 to-pink-200">{msg.sender_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{msg.sender_name}</p>
                      <p className="text-sm text-slate-700 break-words">{msg.message}</p>
                    </div>
                    {isHost && (
                      <button onClick={() => togglePinMessage(msg)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-600 transition-all">
                        <Pin className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {messages?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No messages yet. Start the conversation! 💬</p>
                  </div>
                )}
              </div>

              {user && (
                <div className="p-4 border-t border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyPress={e => e.key === "Enter" && sendMessage()}
                      placeholder="Say something..."
                      className="rounded-2xl border-2 border-purple-200 focus:border-purple-400 font-medium"
                    />
                    <Button onClick={sendMessage} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl px-6 font-bold shadow-lg">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}