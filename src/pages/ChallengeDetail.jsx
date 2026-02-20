import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, Calendar, Trophy, Target, Loader2, Share2, CheckCircle2, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";
import PostChallengeUpdateDialog from "../components/challenges/PostChallengeUpdateDialog";
import ChallengeUpdateCard from "../components/challenges/ChallengeUpdateCard";

export default function ChallengeDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const challengeId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => base44.entities.Challenge.filter({ id: challengeId }).then(res => res[0]),
    enabled: !!challengeId,
  });

  const { data: participants } = useQuery({
    queryKey: ["challenge-participants", challengeId],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ challenge_id: challengeId }),
    enabled: !!challengeId,
  });

  const { data: updates } = useQuery({
    queryKey: ["challenge-updates", challengeId],
    queryFn: () => base44.entities.ChallengeUpdate.filter({ challenge_id: challengeId }, "-created_date"),
    enabled: !!challengeId,
  });

  const myParticipation = participants?.find(p => p.user_email === user?.email);
  const hasJoined = !!myParticipation;

  const handleJoinChallenge = async () => {
    await base44.entities.ChallengeParticipant.create({
      challenge_id: challengeId,
      user_email: user.email,
      user_name: user.full_name,
      user_avatar: user.avatar_url,
      status: "active",
      joined_date: new Date().toISOString(),
    });

    await base44.entities.Challenge.update(challengeId, {
      participants_count: (challenge.participants_count || 0) + 1,
    });

    // Notify challenge creator
    if (challenge.creator_email && challenge.creator_email !== user.email) {
      await base44.entities.Notification.create({
        recipient_email: challenge.creator_email,
        actor_email: user.email,
        actor_name: user.full_name,
        actor_avatar: user.avatar_url,
        type: "challenge_joined",
        challenge_id: challengeId,
        message: `joined your challenge "${challenge.title}"`,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["challenge-participants"] });
    queryClient.invalidateQueries({ queryKey: ["challenge"] });
  };

  const handleLeaveChallenge = async () => {
    if (myParticipation) {
      await base44.entities.ChallengeParticipant.delete(myParticipation.id);
      await base44.entities.Challenge.update(challengeId, {
        participants_count: Math.max(0, (challenge.participants_count || 1) - 1),
      });
      queryClient.invalidateQueries({ queryKey: ["challenge-participants"] });
      queryClient.invalidateQueries({ queryKey: ["challenge"] });
    }
  };

  if (isLoading || !challenge) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  const daysRemaining = moment(challenge.end_date).diff(moment(), "days");
  const daysSinceStart = moment().diff(moment(challenge.start_date), "days");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("Challenges")} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Challenges
      </Link>

      {/* Challenge Header */}
      <div className="bg-slate-900/90 rounded-3xl border-2 border-cyan-400/20 overflow-hidden shadow-2xl">
        {challenge.image_url && (
          <div className="h-64 bg-slate-800 overflow-hidden">
            <img src={challenge.image_url} alt={challenge.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-200 mb-3">{challenge.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={challenge.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-700 text-slate-300"}>
                  {challenge.status}
                </Badge>
                {challenge.difficulty && (
                  <Badge className="bg-orange-100 text-orange-700">{challenge.difficulty}</Badge>
                )}
                {challenge.sport && (
                  <Badge className="bg-cyan-100 text-cyan-700">{challenge.sport}</Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-slate-300 mb-6 leading-relaxed">{challenge.description}</p>

          {challenge.goal_description && (
            <div className="bg-slate-800/60 rounded-2xl p-4 mb-6 border border-cyan-400/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-200">Challenge Goal</h3>
              </div>
              <p className="text-slate-300 text-sm">{challenge.goal_description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-700">
              <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-200">{challenge.duration_days}</p>
              <p className="text-xs text-slate-500">Days</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-700">
              <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-200">{challenge.participants_count || 0}</p>
              <p className="text-xs text-slate-500">Participants</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-700">
              <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-200">{Math.max(0, daysRemaining)}</p>
              <p className="text-xs text-slate-500">Days Left</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-700">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-200">{updates?.length || 0}</p>
              <p className="text-xs text-slate-500">Updates</p>
            </div>
          </div>

          {/* My Progress */}
          {hasJoined && myParticipation && (
            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-2xl p-6 mb-6 border border-cyan-400/30">
              <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                Your Progress
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Completion</span>
                    <span className="text-cyan-400 font-bold">{myParticipation.progress_percentage}%</span>
                  </div>
                  <Progress value={myParticipation.progress_percentage} className="h-3" />
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Days Completed: {myParticipation.days_completed}</span>
                  <span>Status: <Badge className="ml-1">{myParticipation.status}</Badge></span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {user && !hasJoined && (
              <Button
                onClick={handleJoinChallenge}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold h-12 rounded-2xl"
              >
                Join Challenge
              </Button>
            )}
            {user && hasJoined && (
              <>
                <Button
                  onClick={() => setShowUpdateDialog(true)}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold h-12 rounded-2xl"
                >
                  Post Update
                </Button>
                <Button
                  onClick={handleLeaveChallenge}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                >
                  Leave
                </Button>
              </>
            )}
            <Button variant="outline" className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-900/20">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-700">
            <Avatar className="w-12 h-12">
              <AvatarImage src={challenge.creator_avatar} />
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {challenge.creator_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-slate-500">Created by</p>
              <p className="font-semibold text-slate-300">{challenge.creator_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Updates Feed */}
      <div>
        <h2 className="text-2xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Progress Updates
        </h2>
        {updates?.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/80 rounded-3xl border border-slate-700">
            <p className="text-slate-400">No updates yet. Be the first to share your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates?.map(update => (
              <ChallengeUpdateCard
                key={update.id}
                update={update}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post Update Dialog */}
      {showUpdateDialog && user && (
        <PostChallengeUpdateDialog
          challenge={challenge}
          user={user}
          participation={myParticipation}
          onClose={() => setShowUpdateDialog(false)}
        />
      )}
    </div>
  );
}