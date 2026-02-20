import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PostCard from "../components/feed/PostCard";
import SportFilter from "../components/feed/SportFilter";
import FeedPreferencesDialog from "../components/reels/FeedPreferencesDialog";
import UpcomingStreamsSection from "../components/feed/UpcomingStreamsSection";
import LiveNowSection from "../components/stream/LiveNowSection";
import StreamRecommendations from "../components/stream/StreamRecommendations";
import { Loader2, Search, Settings2, Sparkles, Users, Camera, Radio, Film, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedPagination, { PAGE_SIZE } from "@/components/feed/FeedPagination";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [sportFilter, setSportFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [page, setPage] = useState(1);
  const [feedTab, setFeedTab] = useState("forYou");
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const resetPage = () => setPage(1);

  useEffect(() => {
    if (!showSportDropdown) return;
    const close = () => setShowSportDropdown(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showSportDropdown]);

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
    staleTime: 5 * 60 * 1000,
  });

  const { data: followedUsers } = useQuery({
    queryKey: ["follows", user?.email],
    queryFn: async () => {
      const follows = await base44.entities.Follow.filter({ follower_email: user.email, status: "accepted" });
      return follows.map(f => f.following_email);
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: allPosts, isLoading, refetch } = useQuery({
    queryKey: ["feed-posts", sportFilter],
    queryFn: () => {
      if (sportFilter) {
        return base44.entities.Post.filter({ sport: sportFilter }, "-created_date", 50);
      }
      return base44.entities.Post.list("-created_date", 50);
    },
    staleTime: 60000,
    refetchInterval: 120000,
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

  // Following tab: only show posts from followed users, chronological
  const followingPosts = filteredPosts?.filter(post =>
    followedUsers?.includes(post.author_email)
  );

  const activePosts = feedTab === "following" ? followingPosts : filteredPosts;

  const searchedPosts = activePosts
    ?.map(post => {
      if (!searchQuery) return { ...post, _score: 0 };
      const q = searchQuery.toLowerCase();
      let score = 0;
      if (post.author_name?.toLowerCase() === q) score += 100;
      if (post.sport?.toLowerCase() === q) score += 80;
      if (post.author_name?.toLowerCase().includes(q)) score += 40;
      if (post.sport?.toLowerCase().includes(q)) score += 30;
      if (post.content?.toLowerCase().includes(q)) score += 20;
      if (post.category?.toLowerCase().includes(q)) score += 10;
      if (post.ai_tags?.some(t => t.toLowerCase().includes(q))) score += 15;
      return { ...post, _score: score };
    })
    .filter(post => !searchQuery || post._score > 0)
    .sort((a, b) => searchQuery ? b._score - a._score : 0);

  const totalPosts = searchedPosts?.length || 0;
  const posts = searchedPosts?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get highlight reels for preferred sports
  const highlightSports = preferences?.preferred_sports?.length > 0 
    ? preferences.preferred_sports 
    : ["Basketball", "Soccer", "Football", "Tennis"];

  const { data: highlightReels } = useQuery({
    queryKey: ["highlight-reels", highlightSports],
    queryFn: async () => {
      // Single request instead of N parallel requests to avoid rate limits
      const allHighlights = await base44.entities.Post.filter(
        { category: "highlight" },
        "-created_date",
        40
      );
      // Group by sport client-side
      const bySport = {};
      for (const post of allHighlights) {
        if (highlightSports.includes(post.sport)) {
          if (!bySport[post.sport]) bySport[post.sport] = [];
          if (bySport[post.sport].length < 5) bySport[post.sport].push(post);
        }
      }
      return Object.entries(bySport)
        .map(([sport, posts]) => ({ sport, posts }))
        .filter(r => r.posts.length > 0);
    },
    enabled: highlightSports.length > 0,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const SPORTS_LIST = [
    { name: "Basketball", emoji: "🏀" }, { name: "Soccer", emoji: "⚽" },
    { name: "Football", emoji: "🏈" }, { name: "Baseball", emoji: "⚾" },
    { name: "Tennis", emoji: "🎾" }, { name: "Golf", emoji: "⛳" },
    { name: "Swimming", emoji: "🏊" }, { name: "Boxing", emoji: "🥊" },
    { name: "MMA", emoji: "🥋" }, { name: "Track", emoji: "🏃" },
    { name: "Volleyball", emoji: "🏐" }, { name: "Hockey", emoji: "🏒" },
    { name: "Cycling", emoji: "🚴" }, { name: "Yoga", emoji: "🧘" },
    { name: "CrossFit", emoji: "💪" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
        <Input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); resetPage(); }}
          placeholder="Search posts, users, sports... 🔍"
          className="pl-12 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-purple-100 focus:border-purple-400 h-12 shadow-xl shadow-purple-500/10 font-medium placeholder:text-slate-400 transition-all"
        />
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Link to={createPageUrl("CreatePost")}>
          <button className="w-full flex flex-col items-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-red-900 to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
            <Camera className="w-5 h-5" />
            <span className="text-xs font-bold">Post Photo/Video</span>
          </button>
        </Link>
        <Link to={createPageUrl("Live")}>
          <button className="w-full flex flex-col items-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
            <Radio className="w-5 h-5" />
            <span className="text-xs font-bold">Go Live</span>
          </button>
        </Link>
        <Link to={createPageUrl("Reels")}>
          <button className="w-full flex flex-col items-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
            <Film className="w-5 h-5" />
            <span className="text-xs font-bold">Reels</span>
          </button>
        </Link>
      </div>

      {/* Sport Filter Dropdown */}
      <div className="relative" onMouseDown={e => e.stopPropagation()}>
        <button
          onClick={() => setShowSportDropdown(s => !s)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-red-300 shadow-sm transition-all font-semibold text-slate-700"
        >
          <span className="flex items-center gap-2">
            {sportFilter ? (
              <>
                <span>{SPORTS_LIST.find(s => s.name === sportFilter)?.emoji}</span>
                <span>{sportFilter}</span>
              </>
            ) : (
              <>
                <span>🌟</span>
                <span>All Sports</span>
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            {sportFilter && (
              <button
                onClick={e => { e.stopPropagation(); setSportFilter(null); resetPage(); setShowSportDropdown(false); }}
                className="p-1 rounded-full hover:bg-red-100 text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSportDropdown ? "rotate-180" : ""}`} />
          </div>
        </button>

        {showSportDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 p-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">Choose a Sport</p>
            <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setSportFilter(null); resetPage(); setShowSportDropdown(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${!sportFilter ? "bg-red-900 text-white" : "hover:bg-slate-100 text-slate-600"}`}
              >
                <span>🌟</span><span>All</span>
              </button>
              {SPORTS_LIST.map(s => (
                <button
                  key={s.name}
                  onClick={() => { setSportFilter(s.name); resetPage(); setShowSportDropdown(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${sportFilter === s.name ? "bg-red-900 text-white" : "hover:bg-slate-100 text-slate-600"}`}
                >
                  <span>{s.emoji}</span><span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feed Tabs */}
      {user && (
        <Tabs value={feedTab} onValueChange={v => { setFeedTab(v); resetPage(); }} className="w-full">
          <TabsList className="w-full rounded-2xl bg-slate-100 h-11">
            <TabsTrigger value="forYou" className="flex-1 rounded-xl gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4" /> For You
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1 rounded-xl gap-2 text-sm font-semibold">
              <Users className="w-4 h-4" /> Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Preferences Button */}
      {user && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowPreferences(true)}
            variant="outline"
            className="rounded-2xl gap-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 text-sm"
          >
            <Settings2 className="w-4 h-4" />
            Feed Preferences
          </Button>
        </div>
      )}

      {/* Live Now Section */}
      {!searchQuery && !sportFilter && (
        <LiveNowSection user={user} userPreferences={preferences} />
      )}

      {/* Upcoming Streams */}
      {!searchQuery && !sportFilter && (
        <UpcomingStreamsSection user={user} />
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
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {feedTab === "following" ? "From People You Follow" : "Latest Posts"}
        </h2>
        {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">{feedTab === "following" ? "👥" : "🏟️"}</p>
          <p className="text-slate-500 font-medium">{feedTab === "following" ? "No posts from people you follow yet" : "No posts yet"}</p>
          <p className="text-slate-400 text-sm mt-1">{feedTab === "following" ? "Follow athletes to see their content here!" : "Be the first to share something!"}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts?.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onUpdate={refetch} />
          ))}
        </div>
        )}
        <FeedPagination total={totalPosts} page={page} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
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