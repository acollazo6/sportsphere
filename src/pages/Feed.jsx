import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PostCard from "../components/feed/PostCard";
import SportFilter from "../components/feed/SportFilter";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [sportFilter, setSportFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allPosts, isLoading, refetch } = useQuery({
    queryKey: ["feed-posts", sportFilter],
    queryFn: () => {
      if (sportFilter) {
        return base44.entities.Post.filter({ sport: sportFilter }, "-created_date", 50);
      }
      return base44.entities.Post.list("-created_date", 50);
    },
  });

  const posts = allPosts?.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query) ||
      post.sport?.toLowerCase().includes(query) ||
      post.category?.toLowerCase().includes(query)
    );
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

      {/* Sport Filter */}
      <SportFilter selected={sportFilter} onSelect={setSportFilter} />

      {/* Posts */}
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
  );
}