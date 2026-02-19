import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

const MAJOR_SPORTS = [
  "Basketball",
  "Soccer",
  "Football",
  "Tennis",
  "Baseball",
  "Hockey",
  "Golf",
  "Volleyball",
  "Swimming",
  "Track & Field",
];

export default function SportHubGrid() {
  const { data: liveStreams = [] } = useQuery({
    queryKey: ["allLiveStreams"],
    queryFn: () => base44.entities.LiveStream.filter({ status: "live" }),
    refetchInterval: 10000,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["allPosts"],
    queryFn: () => base44.entities.Post.list("-created_date", 100),
  });

  const { data: scheduledStreams = [] } = useQuery({
    queryKey: ["allScheduledStreams"],
    queryFn: () => base44.entities.ScheduledStream.filter({ status: "upcoming" }, "-scheduled_at", 50),
  });

  const sportStats = useMemo(() => {
    const stats = {};
    MAJOR_SPORTS.forEach(sport => {
      stats[sport] = {
        live: liveStreams.filter(s => s.sport === sport).length,
        upcoming: scheduledStreams.filter(s => s.sport === sport).length,
        posts: posts.filter(p => p.sport === sport).length,
        total: 0,
      };
      stats[sport].total = stats[sport].live + stats[sport].upcoming + stats[sport].posts;
    });
    return stats;
  }, [liveStreams, scheduledStreams, posts]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-600" />
        <h2 className="text-2xl font-bold text-gray-900">Browse Sports</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {MAJOR_SPORTS.map(sport => {
          const stat = sportStats[sport];
          return (
            <Link key={sport} to={createPageUrl(`SportHub?sport=${sport}`)}>
              <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full p-4 flex flex-col items-center justify-center text-center space-y-2 bg-gradient-to-br hover:from-blue-50 hover:to-purple-50">
                <div className="text-3xl">🏆</div>
                <h3 className="font-bold text-sm text-gray-900">{sport}</h3>
                {stat.total > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {stat.total} items
                  </Badge>
                )}
                <div className="flex gap-1 justify-center text-[10px] text-gray-500 w-full">
                  {stat.live > 0 && <span className="text-red-600 font-semibold">{stat.live} 🔴</span>}
                  {stat.upcoming > 0 && <span className="text-blue-600 font-semibold">{stat.upcoming} 📅</span>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}