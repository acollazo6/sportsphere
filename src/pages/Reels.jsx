import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";

export default function Reels() {
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: following } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user,
  });

  const { data: allPosts, isLoading } = useQuery({
    queryKey: ["video-posts"],
    queryFn: () => base44.entities.Post.filter({ media_type: "video" }, "-created_date", 100),
  });

  const followingEmails = following?.map(f => f.following_email) || [];
  const videoPosts = allPosts?.filter(post => 
    followingEmails.includes(post.author_email) || post.author_email === user?.email
  ) || [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videoPosts]);

  const handleLike = async (post) => {
    const liked = post.likes?.includes(user?.email);
    const newLikes = liked
      ? post.likes.filter(e => e !== user.email)
      : [...(post.likes || []), user.email];
    
    await base44.entities.Post.update(post.id, { likes: newLikes });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (videoPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-4">
        <Play className="w-16 h-16 mb-4 text-slate-400" />
        <h2 className="text-xl font-bold mb-2">No Reels Yet</h2>
        <p className="text-slate-400 text-center">Follow athletes to see their training videos</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {videoPosts.map((post, index) => {
        const liked = post.likes?.includes(user?.email);
        const isVideo = post.media_urls?.[0];
        
        return (
          <div key={post.id} className="h-screen snap-start relative flex items-center justify-center">
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={isVideo}
              loop
              muted={muted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

            {/* Top info */}
            <div className="absolute top-4 left-4 right-20 z-10">
              <Link 
                to={createPageUrl("UserProfile") + `?email=${post.author_email}`}
                className="flex items-center gap-3"
              >
                <Avatar className="w-11 h-11 ring-2 ring-white/30">
                  <AvatarImage src={post.author_avatar} />
                  <AvatarFallback className="bg-slate-800 text-white">
                    {post.author_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-white drop-shadow-lg">{post.author_name}</p>
                  <p className="text-xs text-white/80">{moment(post.created_date).fromNow()}</p>
                </div>
              </Link>
            </div>

            {/* Right actions */}
            <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-6">
              <button
                onClick={() => handleLike(post)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      liked ? "fill-red-500 text-red-500" : "text-white"
                    }`}
                  />
                </div>
                <span className="text-xs text-white font-semibold drop-shadow-lg">
                  {post.likes?.length || 0}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white font-semibold drop-shadow-lg">
                  {post.comments_count || 0}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>

              <button
                onClick={() => setMuted(!muted)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {muted ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>
            </div>

            {/* Bottom caption */}
            <div className="absolute bottom-20 left-4 right-20 z-10">
              {post.content && (
                <p className="text-white text-sm drop-shadow-lg line-clamp-3">
                  {post.content}
                </p>
              )}
              {post.sport && (
                <p className="text-white/80 text-xs mt-1">#{post.sport}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}