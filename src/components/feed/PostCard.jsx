import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Share2, Play, MoreHorizontal, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import moment from "moment";

const categoryIcons = {
  training: "🏋️",
  game: "🏟️",
  coaching: "📋",
  instruction: "📚",
  motivation: "🔥",
  highlight: "⭐",
  other: "💬",
};

export default function PostCard({ post, currentUser, onUpdate }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleLike = async () => {
    const newLikes = liked
      ? (post.likes || []).filter(e => e !== currentUser.email)
      : [...(post.likes || []), currentUser.email];
    
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    await base44.entities.Post.update(post.id, { likes: newLikes });
  };

  const loadComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const cmts = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
      setComments(cmts);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const comment = await base44.entities.Comment.create({
      post_id: post.id,
      author_email: currentUser.email,
      author_name: currentUser.full_name,
      author_avatar: currentUser.avatar_url,
      content: newComment,
    });
    setComments(prev => [comment, ...prev]);
    setNewComment("");
    await base44.entities.Post.update(post.id, { comments_count: (post.comments_count || 0) + 1 });
  };

  const isVideo = (url) => url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video'));

  return (
    <article className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <Link to={createPageUrl("UserProfile") + `?email=${post.author_email}`} className="flex items-center gap-3">
          <Avatar className="w-11 h-11 ring-2 ring-orange-100">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-bold">
              {post.author_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-slate-900">{post.author_name || "Anonymous"}</p>
            <p className="text-xs text-slate-400">{moment(post.created_date).fromNow()}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {post.sport && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
              {post.sport}
            </Badge>
          )}
          {post.category && (
            <span className="text-sm">{categoryIcons[post.category]}</span>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div className="relative bg-slate-100">
          {isVideo(post.media_urls[currentMediaIndex]) ? (
            <video
              src={post.media_urls[currentMediaIndex]}
              controls
              className="w-full max-h-[500px] object-contain bg-black"
            />
          ) : (
            <img
              src={post.media_urls[currentMediaIndex]}
              alt=""
              className="w-full max-h-[500px] object-cover"
            />
          )}
          {post.media_urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.media_urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentMediaIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentMediaIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                liked ? "fill-red-500 text-red-500 scale-110" : "text-slate-400 group-hover:text-red-400"
              }`}
            />
            <span className={`text-sm font-medium ${liked ? "text-red-500" : "text-slate-500"}`}>
              {likeCount}
            </span>
          </button>

          <button onClick={loadComments} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-sm font-medium text-slate-500">{post.comments_count || 0}</span>
          </button>
        </div>
        <Bookmark className="w-5 h-5 text-slate-300 hover:text-slate-600 cursor-pointer transition-colors" />
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addComment()}
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-slate-50 rounded-xl px-4 py-2.5 border-0 focus:ring-2 focus:ring-orange-200 outline-none"
            />
            <Button
              onClick={addComment}
              size="sm"
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              Post
            </Button>
          </div>
          {loadingComments ? (
            <div className="text-center py-4 text-sm text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={c.author_avatar} />
                    <AvatarFallback className="text-xs bg-slate-200">{c.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-slate-700">{c.author_name}</p>
                    <p className="text-sm text-slate-600">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}