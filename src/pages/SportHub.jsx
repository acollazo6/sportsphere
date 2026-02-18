import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "../components/feed/PostCard";
import { Flame, Clock, Sparkles, FileText, ArrowLeft, Users, Heart } from "lucide-react";

export default function SportHub() {
  const urlParams = new URLSearchParams(window.location.search);
  const sport = urlParams.get("sport");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("live");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["sportHub-live", sport],
    queryFn: () => base44.entities.LiveStream.filter({ sport, status: "live" }),
    refetchInterval: 5000,
    enabled: !!sport,
  });

  const { data: upcomingStreams = [] } = useQuery({
    queryKey: ["sportHub-upcoming", sport],
    queryFn: () => base44.entities.ScheduledStream.filter({ sport, status: "upcoming" }, "-scheduled_at", 10),
    enabled: !!sport,
  });

  const { data: highlightPosts = [] } = useQuery({
    queryKey: ["sportHub-highlights", sport],
    queryFn: () => base44.entities.Post.filter({ sport, category: "highlight" }, "-created_date", 6),
    enabled: !!sport,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["sportHub-posts", sport],
    queryFn: () => base44.entities.Post.filter({ sport }, "-created_date", 20),
    enabled: !!sport,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["follows", user?.email],
    queryFn: () => (user ? base44.entities.Follow.filter({ follower_email: user.email }) : []),
    enabled: !!user,
  });

  const followingEmails = follows.map(f => f.following_email);

  if (!sport) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Sport not specified</p>
      </div>
    );
  }

  const StreamCard = ({ stream, isUpcoming }) => (
    <Link to={createPageUrl(`ViewLive?stream_id=${stream.id}`)}>
      <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full flex flex-col">
        <div className="relative h-40 bg-gray-800 flex-shrink-0">
          {stream.thumbnail_url ? (
            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
          <div className="absolute top-2 left-2">
            {isUpcoming ? (
              <Badge className="bg-blue-600 text-white flex items-center gap-1">
                <Clock className="w-3 h-3" />
                UPCOMING
              </Badge>
            ) : (
              <Badge className="bg-red-600 text-white flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                LIVE
              </Badge>
            )}
          </div>
          {!isUpcoming && (
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-lg flex items-center gap-1 text-white text-xs font-bold">
              <Users className="w-3 h-3" />
              {stream.viewers?.length || 0}
            </div>
          )}
        </div>
        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <h3 className="font-bold text-sm line-clamp-2">{stream.title}</h3>
          <div className="flex items-center gap-2">
            {stream.host_avatar && (
              <img src={stream.host_avatar} alt={stream.host_name} className="w-6 h-6 rounded-full object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{stream.host_name}</p>
            </div>
            {followingEmails.includes(stream.host_email) && (
              <Heart className="w-4 h-4 text-red-600 fill-red-600" />
            )}
          </div>
          {stream.description && (
            <p className="text-xs text-gray-600 line-clamp-1">{stream.description}</p>
          )}
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl("Feed")}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">{sport}</h1>
            <p className="text-sm text-gray-500">Complete hub for all {sport} content</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Live Streams Section */}
        {liveStreams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Live Now</h2>
              <Badge className="bg-red-600 text-white">{liveStreams.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map(stream => (
                <StreamCard key={stream.id} stream={stream} isUpcoming={false} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Streams Section */}
        {upcomingStreams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Streams</h2>
              <Badge className="bg-blue-600 text-white">{upcomingStreams.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingStreams.map(stream => (
                <StreamCard key={stream.id} stream={stream} isUpcoming={true} />
              ))}
            </div>
          </div>
        )}

        {/* Highlights Section */}
        {highlightPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-900">Highlight Reels</h2>
              <Badge className="bg-amber-600 text-white">{highlightPosts.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlightPosts.map(post => (
                <PostCard key={post.id} post={post} currentUser={user} />
              ))}
            </div>
          </div>
        )}

        {/* All Posts Section */}
        {allPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Community Posts</h2>
              <Badge className="bg-purple-600 text-white">{allPosts.length}</Badge>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="rounded-2xl bg-gray-200 h-11 w-full">
                <TabsTrigger value="recent" className="flex-1 rounded-xl text-sm font-semibold">Recent</TabsTrigger>
                <TabsTrigger value="training" className="flex-1 rounded-xl text-sm font-semibold">Training</TabsTrigger>
                <TabsTrigger value="game" className="flex-1 rounded-xl text-sm font-semibold">Game</TabsTrigger>
                <TabsTrigger value="coaching" className="flex-1 rounded-xl text-sm font-semibold">Coaching</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-4">
              {allPosts
                .filter(post => activeTab === "recent" || post.category === activeTab)
                .map(post => (
                  <PostCard key={post.id} post={post} currentUser={user} />
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {liveStreams.length === 0 && upcomingStreams.length === 0 && highlightPosts.length === 0 && allPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🏆</p>
            <p className="text-gray-500 font-medium">No {sport} content yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to create {sport} content!</p>
          </div>
        )}
      </div>
    </div>
  );
}