import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PostCard from "../components/feed/PostCard";
import SportFilter from "../components/feed/SportFilter";
import { Loader2 } from "lucide-react";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [sportFilter, setSportFilter] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["feed-posts", sportFilter],
    queryFn: () => {
      if (sportFilter) {
        return base44.entities.Post.filter({ sport: sportFilter }, "-created_date", 50);
      }
      return base44.entities.Post.list("-created_date", 50);
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your Sports Feed</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base">Discover training, highlights, and motivation from athletes worldwide.</p>
        </div>
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