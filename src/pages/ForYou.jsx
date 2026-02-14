import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from "../components/feed/PostCard";
import ReelCard from "../components/reels/ReelCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ForYou() {
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Get user preferences and engagement history
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

  const { data: myPosts } = useQuery({
    queryKey: ["my-engagement", user?.email],
    queryFn: () => base44.entities.Post.filter({ author_email: user.email }, "-created_date", 10),
    enabled: !!user,
  });

  // Fetch all posts
  const { data: allPosts, isLoading } = useQuery({
    queryKey: ["recommended-posts", refreshKey],
    queryFn: async () => {
      const posts = await base44.entities.Post.list("-created_date", 100);
      
      if (!user) return posts.slice(0, 20);

      // Get sports from user's engagement
      const mySports = [...new Set(myPosts?.map(p => p.sport).filter(Boolean) || [])];
      const prefSports = preferences?.preferred_sports || [];
      const allSports = [...new Set([...mySports, ...prefSports])];
      
      // Get followed creators
      const followedEmails = follows?.map(f => f.following_email) || [];

      // Score posts based on relevance
      const scoredPosts = posts.map(post => {
        let score = 0;
        
        // Boost posts from followed creators
        if (followedEmails.includes(post.author_email)) score += 100;
        
        // Boost posts from preferred sports
        if (allSports.includes(post.sport)) score += 50;
        
        // Boost engaging content
        score += (post.likes?.length || 0) * 2;
        score += (post.comments_count || 0) * 5;
        score += (post.views || 0) * 0.1;
        
        // Recency boost (newer posts get higher scores)
        const hoursSincePost = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
        if (hoursSincePost < 24) score += 30;
        else if (hoursSincePost < 72) score += 15;
        
        // Diversity penalty for own posts
        if (post.author_email === user.email) score -= 50;
        
        return { ...post, score };
      });

      // Sort by score and return top 30
      return scoredPosts.sort((a, b) => b.score - a.score).slice(0, 30);
    },
    enabled: !!user,
  });

  // Trending posts (high engagement recently)
  const { data: trendingPosts } = useQuery({
    queryKey: ["trending-posts"],
    queryFn: async () => {
      const posts = await base44.entities.Post.list("-created_date", 100);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      return posts
        .filter(p => new Date(p.created_date).getTime() > dayAgo)
        .map(p => ({
          ...p,
          engagement: (p.likes?.length || 0) * 2 + (p.comments_count || 0) * 5 + (p.views || 0) * 0.1
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);
    },
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
            <p className="text-white/90 text-lg">Personalized content based on your interests</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for different content types */}
      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="bg-slate-800/80 border border-slate-700 w-full justify-start">
          <TabsTrigger value="recommended" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Recommended
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : allPosts?.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/80 rounded-3xl border border-slate-700">
              <p className="text-slate-400">No posts available</p>
            </div>
          ) : (
            allPosts?.map(post => <PostCard key={post.id} post={post} currentUser={user} />)
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4 mt-6">
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-orange-500/30 mb-4">
            <p className="text-sm text-slate-300">
              <TrendingUp className="w-4 h-4 inline mr-2 text-orange-400" />
              Top posts from the last 24 hours with the highest engagement
            </p>
          </div>
          {trendingPosts?.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/80 rounded-3xl border border-slate-700">
              <p className="text-slate-400">No trending posts yet</p>
            </div>
          ) : (
            trendingPosts?.map(post => (
              <div key={post.id} className="relative">
                <Badge className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  🔥 Trending
                </Badge>
                <PostCard post={post} currentUser={user} />
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}