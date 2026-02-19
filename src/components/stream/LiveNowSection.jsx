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
    refetchInterval: 60000,
    staleTime: 50000,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["follows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user,
    staleTime: 60000,
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

  if (liveStreams.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <Flame className="w-4 h-4 text-red-600 animate-pulse" />
        Live Now
        <Badge className="bg-red-600 text-white text-[10px] px-1.5">{liveStreams.length}</Badge>
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
        {filtered.map(stream => (
          <Link key={stream.id} to={createPageUrl(`ViewLive?stream_id=${stream.id}`)} style={{ scrollSnapAlign: "start" }}>
            <div className="flex-shrink-0 w-48 rounded-2xl overflow-hidden bg-white border border-slate-100 hover:shadow-lg transition-all">
              <div className="relative h-28 bg-gray-900">
                {stream.thumbnail_url ? (
                  <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-900 to-orange-700" />
                )}
                <Badge className="absolute top-2 left-2 bg-red-600 text-white text-[10px] gap-1 animate-pulse px-1.5 py-0.5">
                  <Flame className="w-2.5 h-2.5" /> LIVE
                </Badge>
                <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded-md flex items-center gap-1 text-white text-[10px] font-bold">
                  <Users className="w-2.5 h-2.5" />
                  {stream.viewers?.length || 0}
                </div>
              </div>
              <div className="p-2.5 space-y-1.5">
                <p className="font-bold text-xs line-clamp-2 text-slate-900">{stream.title}</p>
                <div className="flex items-center gap-1.5">
                  {stream.host_avatar ? (
                    <img src={stream.host_avatar} alt={stream.host_name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex-shrink-0" />
                  )}
                  <p className="text-[11px] text-slate-500 truncate">{stream.host_name}</p>
                  {followingEmails.includes(stream.host_email) && (
                    <Heart className="w-3 h-3 text-red-600 fill-red-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}