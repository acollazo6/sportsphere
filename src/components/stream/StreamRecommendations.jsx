import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StreamRecommendations({ user, userPreferences }) {
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

  const { data: userSportProfiles = [] } = useQuery({
    queryKey: ["userSportProfiles", user?.email],
    queryFn: () => base44.entities.SportProfile.filter({ user_email: user.email }),
    enabled: !!user,
    staleTime: 60000,
  });

  const followingEmails = follows.map(f => f.following_email);
  const userSports = userSportProfiles.map(p => p.sport);

  const recommendations = useMemo(() => {
    const recommendedSet = new Set();
    let recommended = [];

    // 1. Streams from followed creators
    const fromFollows = liveStreams.filter(s => followingEmails.includes(s.host_email));
    fromFollows.slice(0, 3).forEach(s => {
      recommendedSet.add(s.id);
      recommended.push({ ...s, reason: `${s.host_name} is live` });
    });

    // 2. Streams in user's preferred sports
    const prefSports = userPreferences?.preferred_sports || userSports;
    const fromPreferred = liveStreams.filter(
      s => prefSports.includes(s.sport) && !recommendedSet.has(s.id)
    );
    fromPreferred.slice(0, 3).forEach(s => {
      recommendedSet.add(s.id);
      recommended.push({ ...s, reason: `${s.sport} stream` });
    });

    // 3. High-traffic streams
    const byViewers = [...liveStreams]
      .filter(s => !recommendedSet.has(s.id))
      .sort((a, b) => (b.viewers?.length || 0) - (a.viewers?.length || 0))
      .slice(0, 2);
    byViewers.forEach(s => {
      recommendedSet.add(s.id);
      recommended.push({ ...s, reason: "Trending" });
    });

    return recommended.slice(0, 5);
  }, [liveStreams, followingEmails, userPreferences, userSports]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        Recommended For You
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {recommendations.map(stream => (
          <Link key={stream.id} to={createPageUrl(`ViewLive?stream_id=${stream.id}`)}>
            <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full flex flex-col">
              <div className="relative h-24 bg-gray-800 flex-shrink-0">
                {stream.thumbnail_url ? (
                  <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700" />
                )}
                <Badge className="absolute top-1 left-1 bg-red-600 text-white text-[10px]">LIVE</Badge>
              </div>
              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
                <h3 className="font-semibold text-xs line-clamp-2">{stream.title}</h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {stream.host_avatar && (
                    <img src={stream.host_avatar} alt={stream.host_name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  )}
                  <p className="text-[11px] text-gray-600 truncate">{stream.host_name}</p>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <Badge variant="outline" className="rounded-lg text-[10px] h-5">{stream.reason}</Badge>
                  <span className="text-gray-500 flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {stream.viewers?.length || 0}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}