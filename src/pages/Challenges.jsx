import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trophy, Users, Calendar, Target, Flame, TrendingUp, Loader2 } from "lucide-react";
import CreateChallengeDialog from "../components/challenges/CreateChallengeDialog";
import moment from "moment";

export default function Challenges() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["challenges", filter],
    queryFn: async () => {
      if (filter === "my-challenges") {
        return base44.entities.Challenge.filter({ creator_email: user.email }, "-created_date");
      } else if (filter === "joined") {
        const myParticipations = await base44.entities.ChallengeParticipant.filter({ user_email: user.email });
        const challengeIds = myParticipations.map(p => p.challenge_id);
        const allChallenges = await base44.entities.Challenge.list("-created_date");
        return allChallenges.filter(c => challengeIds.includes(c.id));
      } else if (filter === "active") {
        const all = await base44.entities.Challenge.list("-created_date");
        return all.filter(c => c.status === "active");
      }
      return base44.entities.Challenge.list("-created_date", 50);
    },
    enabled: (filter !== "my-challenges" && filter !== "joined") || !!user,
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

  const getStatusColor = (status) => {
    const colors = {
      upcoming: "bg-blue-100 text-blue-700",
      active: "bg-green-100 text-green-700",
      completed: "bg-slate-100 text-slate-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-12 h-12" />
            <h1 className="text-4xl font-black">Challenges 🏆</h1>
          </div>
          <p className="text-white/90 text-lg mb-6">Push your limits, track your progress, and achieve your goals with our community challenges</p>
          {user && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-white text-orange-600 hover:bg-orange-50 gap-2 font-bold"
            >
              <Plus className="w-5 h-5" />
              Create Challenge
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Challenges", icon: Trophy },
          { value: "active", label: "Active Now", icon: Flame },
          { value: "joined", label: "My Joined", icon: Users },
          { value: "my-challenges", label: "Created by Me", icon: Target },
        ].map(f => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 ${
                filter === f.value
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Challenges Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : challenges?.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/80 rounded-3xl border border-slate-700">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No challenges found</p>
          <p className="text-slate-500 text-sm mt-1">Create your first challenge to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {challenges?.map(challenge => (
            <Link
              key={challenge.id}
              to={createPageUrl("ChallengeDetail") + `?id=${challenge.id}`}
              className="group"
            >
              <div className="bg-slate-900/90 rounded-3xl border-2 border-cyan-400/20 overflow-hidden hover:border-cyan-400/60 transition-all hover:scale-[1.02] shadow-xl hover:shadow-cyan-400/20">
                {challenge.image_url && (
                  <div className="h-40 bg-slate-800 overflow-hidden">
                    <img
                      src={challenge.image_url}
                      alt={challenge.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-200 group-hover:text-cyan-400 transition-colors mb-2">
                        {challenge.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(challenge.status)}>
                          {challenge.status}
                        </Badge>
                        {challenge.difficulty && (
                          <Badge className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                        )}
                        {challenge.sport && (
                          <Badge className="bg-cyan-100 text-cyan-700">{challenge.sport}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{challenge.description}</p>

                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {challenge.duration_days} days
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {challenge.participants_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {moment(challenge.start_date).format("MMM D")}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={challenge.creator_avatar} />
                      <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                        {challenge.creator_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-slate-500">Created by</p>
                      <p className="text-sm font-semibold text-slate-300">{challenge.creator_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Challenge Dialog */}
      {showCreateDialog && user && (
        <CreateChallengeDialog
          user={user}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}