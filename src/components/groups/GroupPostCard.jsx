import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";

export default function GroupPostCard({ post, currentUser, onUpdate }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState("");

  const { data: replies, refetch: refetchReplies } = useQuery({
    queryKey: ["group-replies", post.id],
    queryFn: () => base44.entities.GroupReply.filter({ post_id: post.id }, "created_date"),
    enabled: showReplies,
  });

  const toggleLike = async () => {
    const newLikes = liked
      ? post.likes?.filter(e => e !== currentUser.email) || []
      : [...(post.likes || []), currentUser.email];
    
    setLiked(!liked);
    await base44.entities.GroupPost.update(post.id, { likes: newLikes });
    onUpdate?.();
  };

  const addReply = async () => {
    if (!newReply.trim()) return;
    await base44.entities.GroupReply.create({
      post_id: post.id,
      author_email: currentUser.email,
      author_name: currentUser.full_name,
      author_avatar: currentUser.avatar_url,
      content: newReply,
    });
    await base44.entities.GroupPost.update(post.id, {
      replies_count: (post.replies_count || 0) + 1,
    });
    setNewReply("");
    refetchReplies();
    onUpdate?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-slate-200 text-slate-600">
              {post.author_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-slate-900">{post.author_name}</p>
            <p className="text-xs text-slate-400">{moment(post.created_date).fromNow()}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {post.title && <h3 className="font-bold text-slate-900">{post.title}</h3>}
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.media_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="rounded-lg w-full object-cover max-h-48" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
        <button onClick={toggleLike} className="flex items-center gap-1.5 group">
          <Heart className={`w-5 h-5 transition-all ${liked ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-red-400"}`} />
          <span className="text-sm font-medium text-slate-500">{post.likes?.length || 0}</span>
        </button>
        <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-1.5 group">
          <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
          <span className="text-sm font-medium text-slate-500">{post.replies_count || 0}</span>
        </button>
      </div>

      {/* Replies */}
      {showReplies && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            <Input
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addReply()}
              placeholder="Write a reply..."
              className="rounded-xl bg-slate-50 border-0"
            />
            <Button onClick={addReply} size="sm" className="rounded-xl bg-slate-900">
              Reply
            </Button>
          </div>
          <div className="space-y-2">
            {replies?.map(reply => (
              <div key={reply.id} className="flex gap-2.5">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-slate-200">{reply.author_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-semibold text-slate-700">{reply.author_name}</p>
                  <p className="text-sm text-slate-600">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}