import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Loader2, RefreshCw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from "../components/feed/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecommendedCoaches from "../components/recommendations/RecommendedCoaches";
import RecommendedEvents from "../components/recommendations/RecommendedEvents";
import RecommendedForums from "../components/recommendations/RecommendedForums";
import RecommendedUsers from "../components/recommendations/RecommendedUsers";
import RecommendedPrograms from "../components/recommendations/RecommendedPrograms";
import { getAIRankedPosts } from "../components/feed/AIFeedRanker";

export default function ForYou() {
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiRanked, setAiRanked] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ["feed-preferences", user?.email],
    queryFn: () => base44.entities.FeedPreferences.filter({ user_email: user.email }).then(r => r[0]),
    enabled: !!user,
  });

  const { data: follows } = useQuery({
    queryKey: ["follows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user,
  });

  const { data: myProfiles } = useQuery({
    queryKey: ["my-sport-profiles", user?.email],
    queryFn: () => base44.entities.SportProfile.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: likedPosts } = useQuery({
    queryKey: ["liked-posts", user?.email],
    queryFn: () => base44.entities.Post.list("-created_date", 50).then(posts =>
      posts.filter(p => p.likes?.includes(user.email))
    ),
    enabled: !!user,
  });

  // Derive user's sports and location from profile
  const userSports = useMemo(() => {
    const sports = new Set([
      ...(myProfiles?.map(p => p.sport).filter(Boolean) || []),
      ...(preferences?.preferred_sports || []),
      ...(likedPosts?.map(p => p.sport).filter(Boolean) || []),
    ]);
    return [...sports];
  }, [myProfiles, preferences, likedPosts]);

  const userLocation = myProfiles?.[0]?.location || null;

  const triggerAIRanking = async (posts) => {
    if (!user || !posts?.length) return;
    setAiLoading(true);
    setUseAI(true);
    const ranked = await getAIRankedPosts({
      user, posts, userSports,
      follows, likedPosts, myProfiles,
    });
    setAiRanked(ranked);
    setAiLoading(false);
  };

  // Recommended posts (scored)
  const { data: recommendedPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["recommended-posts", refreshKey, user?.email],
    queryFn: async () => {
      const posts = await base44.entities.Post.list("-created_date", 150);
      if (!user) return posts.slice(0, 20);
      const followedEmails = follows?.map(f => f.following_email) || [];
      const likedSports = [...new Set(likedPosts?.map(p => p.sport).filter(Boolean) || [])];
      const allSports = [...new Set([...userSports, ...likedSports])];

      const scored = posts
        .filter(p => p.author_email !== user.email)
        .map(post => {
          let score = 0;
          if (followedEmails.includes(post.author_email)) score += 120;
          if (allSports.includes(post.sport)) score += 60;
          score += (post.likes?.length || 0) * 2;
          score += (post.comments_count || 0) * 5;
          score += (post.views || 0) * 0.1;
          const hours = (Date.now() - new Date(post.created_date).getTime()) / 3600000;
          if (hours < 24) score += 40;
          else if (hours < 72) score += 20;
          else if (hours > 168) score -= 10;
          return { ...post, score };
        });

      return scored.sort((a, b) => b.score - a.score).slice(0, 30);
    },
    enabled: !!user && follows !== undefined,
  });

  // Trending posts
  const { data: trendingPosts } = useQuery({
    queryKey: ["trending-posts", refreshKey],
    queryFn: async () => {
      const posts = await base44.entities.Post.list("-created_date", 100);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return posts
        .filter(p => new Date(p.created_date).getTime() > dayAgo)
        .map(p => ({ ...p, engagement: (p.likes?.length || 0) * 2 + (p.comments_count || 0) * 5 + (p.views || 0) * 0.1 }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);
    },
  });

  // Recommended coaches (sessions aligned with sports)
  const { data: recommendedSessions } = useQuery({
    queryKey: ["recommended-sessions", userSports.join(",")],
    queryFn: async () => {
      const sessions = await base44.entities.CoachingSession.list("-created_date", 50);
      const upcoming = sessions.filter(s => s.status === "scheduled");
      if (!userSports.length) return upcoming.slice(0, 4);
      const matched = upcoming.filter(s => userSports.includes(s.sport));
      const rest = upcoming.filter(s => !userSports.includes(s.sport));
      return [...matched, ...rest].slice(0, 6);
    },
    enabled: !!user,
  });

  // Recommended events
  const { data: recommendedEvents } = useQuery({
    queryKey: ["recommended-events", userSports.join(","), userLocation],
    queryFn: async () => {
      const events = await base44.entities.Event.list("-created_date", 100);
      const future = events.filter(e => new Date(e.date) > new Date());
      const scored = future.map(e => {
        let score = 0;
        if (userSports.includes(e.sport)) score += 50;
        if (userLocation && (e.city?.toLowerCase().includes(userLocation.toLowerCase()) || e.country?.toLowerCase().includes(userLocation.toLowerCase()))) score += 40;
        if (e.is_virtual) score += 10;
        return { ...e, score };
      });
      return scored.sort((a, b) => b.score - a.score).slice(0, 4);
    },
    enabled: !!user,
  });

  // Recommended forum topics
  const { data: recommendedForums } = useQuery({
    queryKey: ["recommended-forums", userSports.join(",")],
    queryFn: async () => {
      const forums = await base44.entities.Forum.list("-created_date", 100);
      const scored = forums.map(f => {
        let score = 0;
        if (userSports.includes(f.sport)) score += 50;
        score += (f.replies_count || 0) * 3;
        score += (f.likes?.length || 0) * 2;
        score += (f.views || 0) * 0.1;
        const hours = (Date.now() - new Date(f.created_date || f.last_activity).getTime()) / 3600000;
        if (hours < 48) score += 20;
        return { ...f, score };
      });
      return scored.sort((a, b) => b.score - a.score).slice(0, 5);
    },
    enabled: !!user,
  });

  // Recommended users (similar sports/level)
  const { data: recommendedUsers } = useQuery({
    queryKey: ["recommended-users", userSports.join(","), user?.email],
    queryFn: async () => {
      const followedEmails = new Set(follows?.map(f => f.following_email) || []);
      const profiles = await base44.entities.SportProfile.list("-created_date", 200);
      const myLevels = new Set(myProfiles?.map(p => p.level).filter(Boolean) || []);
      const others = profiles.filter(p =>
        p.user_email !== user.email &&
        !followedEmails.has(p.user_email)
      );
      const scored = others.map(p => {
        let score = 0;
        if (userSports.includes(p.sport)) score += 60;
        if (myLevels.has(p.level)) score += 30;
        if (userLocation && p.location?.toLowerCase().includes(userLocation.toLowerCase())) score += 40;
        return { ...p, score };
      });
      // Deduplicate by user_email
      const seen = new Set();
      return scored
        .sort((a, b) => b.score - a.score)
        .filter(p => { if (seen.has(p.user_email)) return false; seen.add(p.user_email); return true; })
        .slice(0, 6);
    },
    enabled: !!user && follows !== undefined && myProfiles !== undefined,
  });

  // Recommended training programs
  const { data: recommendedPrograms } = useQuery({
    queryKey: ["recommended-programs", userSports.join(",")],
    queryFn: async () => {
      const programs = await base44.entities.TrainingProgram.list("-created_date", 50);
      if (!userSports.length) return programs.slice(0, 4);
      const matched = programs.filter(p => userSports.includes(p.sport));
      const rest = programs.filter(p => !userSports.includes(p.sport));
      return [...matched, ...rest].slice(0, 4);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Sign in for personalized recommendations</h2>
        <p className="text-slate-400">Get content tailored to your interests and preferences</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-3 mb-3">
              <Sparkles className="w-10 h-10" />
              For You
            </h1>
            <p className="text-white/90 text-base">Personalized to your sports, location, and activity</p>
            {userSports.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {userSports.slice(0, 5).map(s => (
                  <Badge key={s} className="bg-white/20 text-white border-white/30">{s}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => setRefreshKey(k => k + 1)}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 gap-2 flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="bg-slate-800/80 border border-slate-700 w-full justify-start overflow-x-auto">
          <TabsTrigger value="recommended" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600">
            <Sparkles className="w-4 h-4 mr-2" />Recommended
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600">
            <TrendingUp className="w-4 h-4 mr-2" />Trending
          </TabsTrigger>
          <TabsTrigger value="discover" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600">
            Discover
          </TabsTrigger>
        </TabsList>

        {/* Recommended Posts */}
        <TabsContent value="recommended" className="space-y-4 mt-6">
          {/* AI Ranking Banner */}
          <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {useAI ? "AI-Personalized Feed" : "Smart Feed"}
                </p>
                <p className="text-xs text-slate-400">
                  {useAI
                    ? "Ranked by AI using your likes, follows & sports"
                    : "Enable AI to deeply personalize based on your interactions"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (useAI) { setUseAI(false); setAiRanked(null); }
                else triggerAIRanking(recommendedPosts);
              }}
              disabled={aiLoading || postsLoading}
              className={`shrink-0 rounded-xl text-xs font-semibold ${
                useAI
                  ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              }`}
            >
              {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Ranking…</> : useAI ? "Turn Off" : <><Sparkles className="w-3.5 h-3.5 mr-1" />AI Rank</>}
            </Button>
          </div>

          {postsLoading || aiLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              {aiLoading && <p className="text-sm text-slate-400">AI is analyzing your interests…</p>}
            </div>
          ) : recommendedPosts?.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/80 rounded-3xl border border-slate-700">
              <p className="text-slate-400">No posts available. Follow some athletes to personalize your feed!</p>
            </div>
          ) : useAI && aiRanked ? (
            aiRanked.map(({ post, reason }) => (
              <div key={post.id} className="relative">
                {reason && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">{reason}</span>
                  </div>
                )}
                <PostCard post={post} currentUser={user} />
              </div>
            ))
          ) : (
            recommendedPosts?.map(post => <PostCard key={post.id} post={post} currentUser={user} />)
          )}
        </TabsContent>

        {/* Trending Posts */}
        <TabsContent value="trending" className="space-y-4 mt-6">
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-orange-500/30 mb-4">
            <p className="text-sm text-slate-300">
              <TrendingUp className="w-4 h-4 inline mr-2 text-orange-400" />
              Top posts from the last 24 hours with highest engagement
            </p>
          </div>
          {trendingPosts?.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/80 rounded-3xl border border-slate-700">
              <p className="text-slate-400">No trending posts yet</p>
            </div>
          ) : (
            trendingPosts?.map(post => (
              <div key={post.id} className="relative">
                <Badge className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white">🔥 Trending</Badge>
                <PostCard post={post} currentUser={user} />
              </div>
            ))
          )}
        </TabsContent>

        {/* Discover Tab: events, coaches, forums, users, programs */}
        <TabsContent value="discover" className="space-y-8 mt-6">
          <RecommendedEvents events={recommendedEvents} />
          <RecommendedCoaches sessions={recommendedSessions} userSports={userSports} />
          <RecommendedForums topics={recommendedForums} />
          <RecommendedPrograms programs={recommendedPrograms} />
          <RecommendedUsers profiles={recommendedUsers} currentUser={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}