import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Radio, Users, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";

export default function ViewLive() {
  const urlParams = new URLSearchParams(window.location.search);
  const streamId = urlParams.get("id");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: stream, isLoading } = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => base44.entities.LiveStream.filter({ id: streamId }).then(s => s[0]),
    enabled: !!streamId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (stream && user && !stream.viewers?.includes(user.email)) {
      base44.entities.LiveStream.update(streamId, {
        viewers: [...(stream.viewers || []), user.email],
      });
    }
  }, [stream, user, streamId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <Radio className="w-12 h-12 animate-pulse mx-auto mb-2" />
          <p>Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (!stream || stream.status === "ended") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h2 className="text-2xl font-bold mb-2">Stream Ended</h2>
        <p className="text-slate-400 mb-4">This live stream has ended</p>
        <Link to={createPageUrl("Live")}>
          <Button className="rounded-xl">Browse Live Streams</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Radio className="w-24 h-24 animate-pulse mx-auto mb-4 text-red-500" />
          <p className="text-xl font-semibold mb-2">Live Stream in Progress</p>
          <p className="text-slate-400 text-sm">Video streaming coming soon</p>
        </div>

        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Live")}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Badge className="bg-red-600 text-white gap-1 animate-pulse">
                <Radio className="w-3 h-3" />
                LIVE
              </Badge>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-semibold">
                  {stream.viewers?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stream info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-10 h-10 ring-2 ring-white/30">
              <AvatarImage src={stream.host_avatar} />
              <AvatarFallback className="bg-slate-800 text-white">
                {stream.host_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-white">{stream.host_name}</p>
              <p className="text-xs text-white/70">Started {moment(stream.started_at).fromNow()}</p>
            </div>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">{stream.title}</h2>
          {stream.description && (
            <p className="text-sm text-white/80">{stream.description}</p>
          )}
          {stream.sport && (
            <Badge variant="secondary" className="mt-2 text-xs">{stream.sport}</Badge>
          )}
        </div>
      </div>

      {/* Chat section */}
      <div className="h-1/3 bg-slate-900 border-t border-slate-800 flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b border-slate-800">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">Live Chat</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">Chat coming soon</p>
            <p className="text-slate-600 text-xs mt-1">Real-time messaging will be available shortly</p>
          </div>
        </div>
        {user && (
          <div className="p-3 border-t border-slate-800">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Say something..."
                className="rounded-xl bg-slate-800 border-slate-700 text-white"
              />
              <Button size="icon" className="rounded-xl bg-red-600 hover:bg-red-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}