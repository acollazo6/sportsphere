import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Flame, Target, Crown } from "lucide-react";

export default function Leaderboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: topUsers = [] } = useQuery({
    queryKey: ["leaderboard-points"],
    queryFn: () => base44.entities.UserPoints.list("-total_points", 50),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const getUserInfo = (email) => allUsers.find(u => u.email === email);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getLevel = (points) => Math.floor(points / 100) + 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-10 h-10" />
          <h1 className="text-4xl font-black">Leaderboard</h1>
        </div>
        <p className="text-white/90 text-lg">Top athletes in the SportHub community</p>
      </div>

      {/* User's Current Rank */}
      {user && topUsers.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-red-900">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-red-900 text-white">
                    {user.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-red-700 font-semibold">Your Rank</p>
                  <p className="text-2xl font-black text-red-900">
                    #{topUsers.findIndex(u => u.user_email === user.email) + 1 || "Unranked"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-700 font-semibold">Total Points</p>
                <p className="text-2xl font-black text-red-900">
                  {topUsers.find(u => u.user_email === user.email)?.total_points || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {topUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((idx) => {
            const userPoints = topUsers[idx];
            const userInfo = getUserInfo(userPoints?.user_email);
            if (!userPoints || !userInfo) return null;
            const rank = idx + 1;
            return (
              <Link key={rank} to={createPageUrl(`UserProfile?email=${userPoints.user_email}`)}>
                <Card className={`border-2 transition-all hover:scale-105 ${
                  rank === 1 ? "border-yellow-500 bg-yellow-50" :
                  rank === 2 ? "border-gray-400 bg-gray-50" :
                  "border-orange-600 bg-orange-50"
                }`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      {getRankIcon(rank)}
                    </div>
                    <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-gray-200">
                      <AvatarImage src={userInfo.avatar_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {userInfo.full_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-gray-900 mb-1">{userInfo.full_name}</p>
                    <p className="text-2xl font-black text-red-900 mb-1">{userPoints.total_points}</p>
                    <Badge className="bg-red-900 text-white text-xs">Level {userPoints.level}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Rest of Leaderboard */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Rankings</h2>
          <div className="space-y-3">
            {topUsers.map((userPoints, idx) => {
              const userInfo = getUserInfo(userPoints.user_email);
              if (!userInfo) return null;
              const rank = idx + 1;
              return (
                <Link
                  key={userPoints.id}
                  to={createPageUrl(`UserProfile?email=${userPoints.user_email}`)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
                >
                  <div className="w-8 text-center">
                    {getRankIcon(rank) || (
                      <span className="text-lg font-bold text-gray-500">#{rank}</span>
                    )}
                  </div>
                  <Avatar className="w-12 h-12 border-2 border-gray-200">
                    <AvatarImage src={userInfo.avatar_url} />
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      {userInfo.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{userInfo.full_name}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span>🏋️ {userPoints.workouts_completed} workouts</span>
                      <span>🎯 {userPoints.challenges_completed} challenges</span>
                      <span>📝 {userPoints.posts_created} posts</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-900">{userPoints.total_points}</p>
                    <Badge className="bg-gray-100 text-gray-700 text-xs mt-1">
                      Level {userPoints.level}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}