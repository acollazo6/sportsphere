import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ReelCard from "../components/reels/ReelCard";
import { Loader2, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedPreferencesDialog from "../components/reels/FeedPreferencesDialog";

export default function Reels() {
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ["feed-preferences", user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.FeedPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

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

  // Personalization algorithm with preferences
  const recommendedContent = React.useMemo(() => {
    if (!user || allPosts.length === 0) return allPosts;

    // Get user's preferred sports
    const userSports = userProfiles.map(p => p.sport);
    const likedSports = likedPosts.map(p => p.sport).filter(Boolean);
    const preferredSports = [...new Set([...userSports, ...likedSports, ...(preferences?.preferred_sports || [])])];
    const excludedSports = preferences?.excluded_sports || [];

    // Get followed users
    const followedEmails = follows.map(f => f.following_email);

    // Filter and score posts
    const scoredPosts = allPosts
      .filter(post => {
        // Filter by excluded sports
        if (excludedSports.length > 0 && post.sport && excludedSports.includes(post.sport)) {
          return false;
        }
        // Filter by content types if set
        if (preferences?.content_types?.length > 0 && post.category && !preferences.content_types.includes(post.category)) {
          return false;
        }
        return true;
      })
      .map(post => {
        let score = 0;
        const reasons = [];

        // Following bonus (highest priority)
        if (followedEmails.includes(post.author_email)) {
          score += 100;
          reasons.push("You follow this creator");
        }

        // Sport preference bonus
        if (post.sport && preferredSports.includes(post.sport)) {
          score += 50;
          reasons.push(`You're interested in ${post.sport}`);
        }

        // Category preference (based on liked posts)
        const likedCategories = likedPosts.map(p => p.category).filter(Boolean);
        if (post.category && likedCategories.includes(post.category)) {
          score += 30;
          reasons.push(`You like ${post.category} content`);
        }

        // Engagement score (quality indicator)
        const engagementRate = ((post.likes?.length || 0) + (post.comments_count || 0)) / Math.max(post.views || 1, 1);
        if (engagementRate > 0.1) {
          score += engagementRate * 20;
          reasons.push("Popular content");
        }

        // Recency bonus (newer content)
        const daysSincePost = (Date.now() - new Date(post.created_date)) / (1000 * 60 * 60 * 24);
        if (daysSincePost < 2) {
          score += Math.max(0, 20 - daysSincePost);
          reasons.push("Recent post");
        }

        // Media bonus (posts with media are more engaging)
        if (post.media_urls?.length > 0) score += 15;

        // Don't show user's own posts
        if (post.author_email === user.email) score -= 1000;

        if (reasons.length === 0) reasons.push("Recommended for you");

        return { ...post, score, recommendationReasons: reasons };
      });

    // Sort by score and return
    return scoredPosts.sort((a, b) => b.score - a.score);
  }, [allPosts, user, userProfiles, likedPosts, follows, preferences]);

  // Combine posts and live streams
  const feedItems = React.useMemo(() => {
    const items = [...recommendedContent];
    
    // Only add live streams if user preference allows
    if (preferences?.show_live_streams !== false) {
      liveStreams.forEach((stream, idx) => {
        const position = idx * 5; // Insert every 5 posts
        if (position < items.length) {
          items.splice(position, 0, { ...stream, type: "stream", recommendationReasons: ["Live now"] });
        } else {
          items.push({ ...stream, type: "stream", recommendationReasons: ["Live now"] });
        }
      });
    }

    return items;
  }, [recommendedContent, liveStreams, preferences]);

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

      {/* Personalization controls */}
      {user && (
        <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-4 py-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm font-bold text-cyan-400">For You</span>
          </div>
          <Button
            onClick={() => setShowPreferences(true)}
            size="icon"
            className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 hover:bg-slate-800"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
          </Button>
        </div>
      )}

      {/* Preferences Dialog */}
      {showPreferences && (
        <FeedPreferencesDialog
          user={user}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}