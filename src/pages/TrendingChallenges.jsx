import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { TrendingUp, Loader2, Trophy, Users, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import moment from "moment";

export default function TrendingChallenges() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Trending challenges (most participants recently)
  const { data: trendingChallenges, isLoading } = useQuery({
    queryKey: ["trending-challenges"],
    queryFn: async () => {
      const challenges = await base44.entities.Challenge.list("-created_date", 50);
      
      return challenges
        .filter(c => c.status === "active")
        .sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0))
        .slice(0, 10);
    },
  });

  // Trending by sport
  const { data: challengesBySport } = useQuery({
    queryKey: ["challenges-by-sport"],
    queryFn: async () => {
      const challenges = await base44.entities.Challenge.filter({ status: "active" });
      const sports = [...new Set(challenges.map(c => c.sport).filter(Boolean))];
      
      return sports.map(sport => ({
        sport,
        challenges: challenges
          .filter(c => c.sport === sport)
          .sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0))
          .slice(0, 3)
      })).filter(s => s.challenges.length > 0);
    },
  });

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: "bg-green-100 text-green-700",
      intermediate: "bg-yellow-100 text-yellow-700",
      advanced: "bg-orange-100 text-orange-700",
      expert: "bg-red-100 text-red-700",
    };
    return colors[difficulty] || "bg-slate-100 text-slate-700";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-black flex items-center gap-3 mb-3">
          <Flame className="w-10 h-10" />
          Trending Challenges
        </h1>
        <p className="text-white/90 text-lg">Most popular challenges happening right now</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-800/80 border border-slate-700">
          <TabsTrigger value="all">All Trending</TabsTrigger>
          <TabsTrigger value="by-sport">By Sport</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {trendingChallenges?.map((challenge, idx) => (
              <Link
                key={challenge.id}
                to={createPageUrl("ChallengeDetail") + `?id=${challenge.id}`}
                className="group"
              >
                <div className="bg-slate-900/90 rounded-2xl border-2 border-orange-400/30 overflow-hidden hover:border-orange-400/60 transition-all hover:scale-[1.02] shadow-xl relative">
                  {idx < 3 && (
                    <Badge className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      #{idx + 1}
                    </Badge>
                  )}
                  {challenge.image_url && (
                    <div className="h-32 bg-slate-800 overflow-hidden">
                      <img src={challenge.image_url} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-orange-400 transition-colors mb-2">
                      {challenge.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {challenge.difficulty && (
                        <Badge className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                      )}
                      {challenge.sport && (
                        <Badge className="bg-cyan-100 text-cyan-700">{challenge.sport}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {challenge.participants_count || 0} joined
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {challenge.duration_days} days
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-sport" className="space-y-6 mt-6">
          {challengesBySport?.map(({ sport, challenges }) => (
            <div key={sport}>
              <h2 className="text-2xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-orange-500" />
                {sport}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {challenges.map(challenge => (
                  <Link
                    key={challenge.id}
                    to={createPageUrl("ChallengeDetail") + `?id=${challenge.id}`}
                    className="group"
                  >
                    <div className="bg-slate-900/90 rounded-2xl border-2 border-slate-700 overflow-hidden hover:border-orange-400/60 transition-all hover:scale-[1.02] shadow-xl">
                      {challenge.image_url && (
                        <div className="h-24 bg-slate-800 overflow-hidden">
                          <img src={challenge.image_url} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-orange-400 transition-colors mb-2 line-clamp-2">
                          {challenge.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Users className="w-3 h-3" />
                          {challenge.participants_count || 0}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}