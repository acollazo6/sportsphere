import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Radio, Crown, Play, Pause, Bookmark, Info, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { toast } from "sonner";
import moment from "moment";
import SharePostDialog from "../messages/SharePostDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ReelCard({ item, currentUser, isActive }) {
  const queryClient = useQueryClient();
  const isStream = item.type === "stream";
  const [liked, setLiked] = useState(item.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(item.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check if content is saved
  const { data: savedContent } = useQuery({
    queryKey: ["saved-content", currentUser?.email, item.id],
    queryFn: async () => {
      const saved = await base44.entities.SavedContent.filter({
        user_email: currentUser.email,
        content_id: item.id
      });
      return saved[0] || null;
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    setSaved(!!savedContent);
  }, [savedContent]);

  useEffect(() => {
    setLiked(item.likes?.includes(currentUser?.email));
    setLikeCount(item.likes?.length || 0);
  }, [item, currentUser]);

  // Track view when reel becomes active
  useEffect(() => {
    if (isActive && !isStream && currentUser) {
      const trackView = async () => {
        await base44.entities.Post.update(item.id, { 
          views: (item.views || 0) + 1 
        });
      };
      trackView();
    }
  }, [isActive, item.id, isStream, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Please login to like posts");
      return;
    }

    const newLikes = liked
      ? (item.likes || []).filter(e => e !== currentUser.email)
      : [...(item.likes || []), currentUser.email];
    
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    
    await base44.entities.Post.update(item.id, { likes: newLikes });
    
    if (!liked && item.author_email !== currentUser.email) {
      await base44.entities.Notification.create({
        recipient_email: item.author_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "like",
        post_id: item.id,
        message: "liked your post",
      });
    }
  };

  const loadComments = async () => {
    if (!showComments && comments.length === 0) {
      const cmts = await base44.entities.Comment.filter({ post_id: item.id }, "-created_date");
      setComments(cmts);
    }
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!currentUser || !newComment.trim()) return;

    const comment = await base44.entities.Comment.create({
      post_id: item.id,
      author_email: currentUser.email,
      author_name: currentUser.full_name,
      author_avatar: currentUser.avatar_url,
      content: newComment,
    });

    setComments(prev => [comment, ...prev]);
    setNewComment("");
    await base44.entities.Post.update(item.id, { 
      comments_count: (item.comments_count || 0) + 1 
    });

    if (item.author_email !== currentUser.email) {
      await base44.entities.Notification.create({
        recipient_email: item.author_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "comment",
        post_id: item.id,
        comment_id: comment.id,
        message: "commented on your post",
      });
    }
  };

  const handleShare = async () => {
    await base44.entities.Post.update(item.id, { 
      shares: (item.shares || 0) + 1 
    });
    
    if (navigator.share) {
      navigator.share({ 
        title: item.content || item.title, 
        url: window.location.href 
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error("Please login to save content");
      return;
    }

    if (saved) {
      // Unsave
      await base44.entities.SavedContent.delete(savedContent.id);
      setSaved(false);
      toast.success("Removed from saved");
    } else {
      // Save
      await base44.entities.SavedContent.create({
        user_email: currentUser.email,
        content_type: isStream ? "stream" : "post",
        content_id: item.id,
        content_data: item
      });
      setSaved(true);
      toast.success("Saved for later!");
    }
    queryClient.invalidateQueries({ queryKey: ["saved-content"] });
  };

  const isVideo = (url) => url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));

  return (
    <div className="relative h-full w-full bg-slate-950 flex items-center justify-center">
      {/* Background Content */}
      {isStream ? (
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <Radio className="w-24 h-24 text-red-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white text-xl font-bold">Live Stream</p>
          </div>
        </div>
      ) : item.media_urls?.length > 0 ? (
        isVideo(item.media_urls[0]) ? (
          <video
            src={item.media_urls[0]}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            playsInline
            autoPlay={isActive}
            muted
          />
        ) : (
          <img
            src={item.media_urls[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <Link
            to={isStream 
              ? createPageUrl("ViewLive") + `?id=${item.id}`
              : createPageUrl("UserProfile") + `?email=${item.author_email || item.host_email}`
            }
            className="flex items-center gap-3 bg-slate-950/60 backdrop-blur-xl rounded-full px-4 py-2 border border-cyan-500/30"
          >
            <Avatar className="w-10 h-10 ring-2 ring-cyan-500/50">
              <AvatarImage src={item.author_avatar || item.host_avatar} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                {(item.author_name || item.host_name)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-white text-sm">{item.author_name || item.host_name}</p>
              <p className="text-xs text-slate-400">
                {moment(item.created_date || item.started_at).fromNow()}
              </p>
            </div>
          </Link>

          {isStream && (
            <div className="bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
              <Radio className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">LIVE</span>
            </div>
          )}

          {item.is_premium && (
            <div className="bg-amber-500/90 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">Premium</span>
            </div>
          )}
        </div>

        {/* Bottom Content */}
        <div className="flex items-end justify-between gap-4">
          {/* Text Content */}
          <div className="flex-1 space-y-2">
            <h2 className="text-white font-bold text-lg line-clamp-2">
              {item.content || item.title || item.description}
            </h2>
            {item.sport && (
              <div className="inline-block bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/50 px-3 py-1 rounded-full">
                <span className="text-cyan-400 text-sm font-bold">{item.sport}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isStream && (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      liked ? "fill-cyan-400 text-cyan-400" : "text-white"
                    }`}
                  />
                </div>
                <span className="text-white text-sm font-bold">{likeCount}</span>
              </button>

              <button
                onClick={loadComments}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-bold">{item.comments_count || comments.length}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-bold">{item.shares || 0}</span>
              </button>

              <button
                onClick={handleSave}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bookmark
                    className={`w-6 h-6 transition-all ${
                      saved ? "fill-cyan-400 text-cyan-400" : "text-white"
                    }`}
                  />
                </div>
              </button>

              {item.recommendationReasons && (
                <button
                  onClick={() => setShowRecommendation(!showRecommendation)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                </button>
              )}
            </div>
          )}

          {isStream && (
            <Link to={createPageUrl("ViewLive") + `?id=${item.id}`}>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-full px-8 py-6 text-lg font-bold shadow-xl shadow-cyan-500/50">
                Watch Live
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Recommendation Explanation */}
      {showRecommendation && item.recommendationReasons && (
        <div className="absolute top-20 right-4 z-20 bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-4 max-w-xs">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-cyan-400 text-sm">Why recommended?</h3>
            <button onClick={() => setShowRecommendation(false)}>
              <Info className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <ul className="space-y-1">
            {item.recommendationReasons.map((reason, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-2xl border-t-2 border-cyan-500/30 rounded-t-3xl max-h-[60vh] overflow-hidden flex flex-col z-20">
          <div className="p-4 border-b border-cyan-500/20">
            <h3 className="font-bold text-white text-lg">Comments ({comments.length})</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.author_avatar} />
                  <AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                    {comment.author_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-slate-900/60 rounded-2xl p-3 border border-cyan-500/20">
                  <p className="text-xs font-bold text-slate-300 mb-1">{comment.author_name}</p>
                  <p className="text-sm text-slate-400">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-slate-500 py-8">No comments yet. Be the first!</p>
            )}
          </div>

          {currentUser && (
            <div className="p-4 border-t border-cyan-500/20 bg-slate-900/80">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && handleComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-slate-800 border-cyan-500/30 text-white rounded-2xl"
                />
                <Button
                  onClick={handleComment}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl"
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}