import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function LiveNowSection({ user, userPreferences }) {
  const [sportFilter, setSportFilter] = useState("all");
  const [sortBy, setSortBy] = useState("viewers");

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["liveStreams"],
    queryFn: () => base44.entities.LiveStream.filter({ status: "live" }),
    refetchInterval: 5000,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["follows", user?.email],
    queryFn: () => (user ? base44.entities.Follow.filter({ follower_email: user.email }) : []),
    enabled: !!user,
  });

  const followingEmails = follows.map(f => f.following_email);

  const filtered = useMemo(() => {
    let results = [...liveStreams];

    if (sportFilter !== "all") {
      results = results.filter(s => s.sport === sportFilter);
    }

    return results.sort((a, b) => {
      if (sortBy === "viewers") {
        return (b.viewers?.length || 0) - (a.viewers?.length || 0);
      } else if (sortBy === "follows") {
        const aIsFollowed = followingEmails.includes(a.host_email);
        const bIsFollowed = followingEmails.includes(b.host_email);
        return aIsFollowed === bIsFollowed ? 0 : aIsFollowed ? -1 : 1;
      } else if (sortBy === "recent") {
        return new Date(b.started_at) - new Date(a.started_at);
      }
      return 0;
    });
  }, [liveStreams, sportFilter, sortBy, followingEmails]);

  const sports = Array.from(new Set(liveStreams.map(s => s.sport).filter(Boolean)));

  if (liveStreams.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Flame className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400">No streams live right now</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-600" />
          Live Now
        </h2>
        <div className="flex gap-2">
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-32 rounded-xl">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map(sport => (
                <SelectItem key={sport} value={sport}>{sport}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 rounded-xl">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewers">Most Viewers</SelectItem>
              <SelectItem value="follows">Following</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(stream => (
          <Link key={stream.id} to={createPageUrl(`ViewLive?stream_id=${stream.id}`)}>
            <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full">
              <div className="relative h-40 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center overflow-hidden">
                {stream.thumbnail_url ? (
                  <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800" />
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-600 text-white flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3" />
                    LIVE
                  </Badge>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-lg flex items-center gap-1 text-white text-xs font-bold">
                  <Users className="w-3 h-3" />
                  {stream.viewers?.length || 0}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-bold text-sm line-clamp-2">{stream.title}</h3>
                <div className="flex items-center gap-2">
                  <img src={stream.host_avatar} alt={stream.host_name} className="w-6 h-6 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{stream.host_name}</p>
                  </div>
                  {followingEmails.includes(stream.host_email) && (
                    <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                  )}
                </div>
                {stream.sport && (
                  <Badge variant="outline" className="text-xs rounded-lg w-fit">{stream.sport}</Badge>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}