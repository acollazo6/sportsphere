import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ReelCard from "../components/reels/ReelCard";
import { Loader2, Sparkles } from "lucide-react";

export default function Reels() {
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch user's engagement data for personalization
  const { data: follows = [] } = useQuery({
    queryKey: ["user-follows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user,
  });

  const { data: likedPosts = [] } = useQuery({
    queryKey: ["user-likes", user?.email],
    queryFn: () => base44.entities.Post.list("-created_date", 500).then(posts => 
      posts.filter(p => p.likes?.includes(user.email))
    ),
    enabled: !!user,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["user-sport-profiles", user?.email],
    queryFn: () => base44.entities.SportProfile.filter({ user_email: user.email }),
    enabled: !!user,
  });

  // Fetch all content
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["all-posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 100),
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["live-streams-reels"],
    queryFn: () => base44.entities.LiveStream.filter({ status: "live" }),
    refetchInterval: 10000,
  });

  // Personalization algorithm
  const recommendedContent = React.useMemo(() => {
    if (!user || allPosts.length === 0) return allPosts;

    // Get user's preferred sports
    const userSports = userProfiles.map(p => p.sport);
    const likedSports = likedPosts.map(p => p.sport).filter(Boolean);
    const preferredSports = [...new Set([...userSports, ...likedSports])];

    // Get followed users
    const followedEmails = follows.map(f => f.following_email);

    // Score posts
    const scoredPosts = allPosts.map(post => {
      let score = 0;

      // Following bonus (highest priority)
      if (followedEmails.includes(post.author_email)) score += 100;

      // Sport preference bonus
      if (post.sport && preferredSports.includes(post.sport)) score += 50;

      // Category preference (based on liked posts)
      const likedCategories = likedPosts.map(p => p.category).filter(Boolean);
      if (post.category && likedCategories.includes(post.category)) score += 30;

      // Engagement score (quality indicator)
      const engagementRate = ((post.likes?.length || 0) + (post.comments_count || 0)) / Math.max(post.views || 1, 1);
      score += engagementRate * 20;

      // Recency bonus (newer content)
      const daysSincePost = (Date.now() - new Date(post.created_date)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - daysSincePost);

      // Media bonus (posts with media are more engaging)
      if (post.media_urls?.length > 0) score += 15;

      // Don't show user's own posts
      if (post.author_email === user.email) score -= 1000;

      return { ...post, score };
    });

    // Sort by score and return
    return scoredPosts.sort((a, b) => b.score - a.score);
  }, [allPosts, user, userProfiles, likedPosts, follows]);

  // Combine posts and live streams
  const feedItems = React.useMemo(() => {
    const items = [...recommendedContent];
    
    // Insert live streams at strategic positions
    liveStreams.forEach((stream, idx) => {
      const position = idx * 5; // Insert every 5 posts
      if (position < items.length) {
        items.splice(position, 0, { ...stream, type: "stream" });
      } else {
        items.push({ ...stream, type: "stream" });
      }
    });

    return items;
  }, [recommendedContent, liveStreams]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === "ArrowDown" && currentIndex < feedItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, feedItems.length]);

  if (postsLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No content available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <div className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {feedItems.map((item, index) => (
          <div key={item.id} className="snap-start h-screen">
            <ReelCard 
              item={item} 
              currentUser={user}
              isActive={index === currentIndex}
            />
          </div>
        ))}
      </div>

      {/* Personalization indicator */}
      {user && (
        <div className="fixed top-4 left-4 z-50 bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-sm font-bold text-cyan-400">For You</span>
        </div>
      )}
    </div>
  );
}