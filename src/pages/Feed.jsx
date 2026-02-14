import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PostCard from "../components/feed/PostCard";
import SportFilter from "../components/feed/SportFilter";
import FeedPreferencesDialog from "../components/reels/FeedPreferencesDialog";
import { Loader2, Search, Settings2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [sportFilter, setSportFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ["feed-preferences", user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.FeedPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const { data: allPosts, isLoading, refetch } = useQuery({
    queryKey: ["feed-posts", sportFilter],
    queryFn: () => {
      if (sportFilter) {
        return base44.entities.Post.filter({ sport: sportFilter }, "-created_date", 50);
      }
      return base44.entities.Post.list("-created_date", 50);
    },
  });

  // Apply user preferences filtering
  const filteredPosts = allPosts?.filter(post => {
    // Exclude sports
    if (preferences?.excluded_sports?.includes(post.sport)) {
      return false;
    }
    
    // If user has preferred sports, only show those
    if (preferences?.preferred_sports?.length > 0) {
      if (!preferences.preferred_sports.includes(post.sport)) {
        return false;
      }
    }
    
    // Filter by content types if specified
    if (preferences?.content_types?.length > 0) {
      if (!preferences.content_types.includes(post.category)) {
        return false;
      }
    }
    
    return true;
  });

  const posts = filteredPosts?.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query) ||
      post.sport?.toLowerCase().includes(query) ||
      post.category?.toLowerCase().includes(query)
    );
  });

  // Get highlight reels for preferred sports
  const highlightSports = preferences?.preferred_sports?.length > 0 
    ? preferences.preferred_sports 
    : ["Basketball", "Soccer", "Football", "Tennis"];

  const { data: highlightReels } = useQuery({
    queryKey: ["highlight-reels", highlightSports],
    queryFn: async () => {
      const reels = await Promise.all(
        highlightSports.map(async (sport) => {
          const sportPosts = await base44.entities.Post.filter(
            { sport, category: "highlight" }, 
            "-created_date", 
            5
          );
          return { sport, posts: sportPosts };
        })
      );
      return reels.filter(reel => reel.posts.length > 0);
    },
    enabled: highlightSports.length > 0,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-6 md:p-8 text-white shadow-2xl shadow-purple-500/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight drop-shadow-lg">Your Sports Feed 🔥</h1>
          <p className="text-white/90 mt-2 text-sm md:text-base font-semibold drop-shadow">Discover training, highlights, and motivation from athletes worldwide.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search posts, users, sports... 🔍"
          className="pl-12 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-purple-100 focus:border-purple-400 h-14 shadow-xl shadow-purple-500/10 font-medium placeholder:text-slate-400 transition-all"
        />
      </div>

      {/* Preferences & Sport Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SportFilter selected={sportFilter} onSelect={setSportFilter} />
        </div>
        {user && (
          <Button
            onClick={() => setShowPreferences(true)}
            variant="outline"
            className="rounded-2xl gap-2 border-cyan-400/30 hover:border-cyan-400/50 hover:bg-cyan-50 text-slate-700"
          >
            <Settings2 className="w-4 h-4" />
            Preferences
          </Button>
        )}
      </div>

      {/* Preferences Summary */}
      {preferences?.preferred_sports?.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-200">
          <p className="text-sm font-semibold text-slate-700 mb-2">Your Preferred Sports:</p>
          <div className="flex flex-wrap gap-2">
            {preferences.preferred_sports.map(sport => (
              <Badge key={sport} className="bg-cyan-500 text-white">{sport}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Highlight Reels */}
      {highlightReels?.length > 0 && !searchQuery && !sportFilter && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Highlight Reels</h2>
          </div>
          {highlightReels.map(reel => (
            <div key={reel.sport} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">{reel.sport} Highlights 🔥</h3>
                <Badge className="bg-amber-100 text-amber-700">{reel.posts.length}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {reel.posts.map(post => (
                  <PostCard key={post.id} post={post} currentUser={user} onUpdate={refetch} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular Posts */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Latest Posts</h2>
        {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🏟️</p>
          <p className="text-slate-500 font-medium">No posts yet</p>
          <p className="text-slate-400 text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts?.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onUpdate={refetch} />
          ))}
        </div>
        )}
      </div>

      {/* Preferences Dialog */}
      {showPreferences && user && (
        <FeedPreferencesDialog
          user={user}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}