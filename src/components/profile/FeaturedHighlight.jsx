import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "../feed/PostCard";
import { toast } from "sonner";

export default function FeaturedHighlight({ user, myPosts }) {
  const qc = useQueryClient();

  const { data: highlights = [] } = useQuery({
    queryKey: ["my-highlights", user?.email],
    queryFn: () => base44.entities.Highlight.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const pinned = highlights.find(h => h.is_pinned && h.item_type === "post");
  const pinnedPost = pinned
    ? myPosts?.find(p => p.id === pinned.item_id) || pinned.item_data
    : null;

  const pinHighlight = async (post) => {
    // Unpin any existing pinned highlight
    const existing = highlights.find(h => h.is_pinned);
    if (existing) {
      await base44.entities.Highlight.update(existing.id, { is_pinned: false });
    }
    // Create or update highlight for this post
    const existingForPost = highlights.find(h => h.item_id === post.id);
    if (existingForPost) {
      await base44.entities.Highlight.update(existingForPost.id, { is_pinned: true });
    } else {
      await base44.entities.Highlight.create({
        user_email: user.email,
        item_type: "post",
        item_id: post.id,
        item_data: post,
        is_pinned: true,
      });
    }
    qc.invalidateQueries({ queryKey: ["my-highlights"] });
    toast.success("Post pinned as featured highlight!");
  };

  const unpin = async () => {
    if (!pinned) return;
    await base44.entities.Highlight.update(pinned.id, { is_pinned: false });
    qc.invalidateQueries({ queryKey: ["my-highlights"] });
    toast.success("Featured highlight removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Pin className="w-5 h-5 text-orange-500" />
          Featured Highlight
        </h2>
        {pinned && (
          <Button onClick={unpin} variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 gap-1 text-xs rounded-xl">
            <X className="w-3.5 h-3.5" /> Remove Pin
          </Button>
        )}
      </div>

      {pinnedPost ? (
        <div className="relative">
          <div className="absolute -top-2 -left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-white" /> Featured
          </div>
          <div className="ring-2 ring-orange-400/50 rounded-3xl overflow-hidden">
            <PostCard post={pinnedPost} currentUser={user} />
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-dashed border-orange-200 rounded-2xl p-6 text-center">
          <Star className="w-10 h-10 text-orange-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No featured post yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Pin your best post to showcase it at the top of your profile</p>
          {myPosts?.length > 0 && (
            <div className="text-left space-y-2 max-h-48 overflow-y-auto">
              {myPosts.slice(0, 5).map(post => (
                <button
                  key={post.id}
                  onClick={() => pinHighlight(post)}
                  className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                >
                  <Pin className="w-4 h-4 text-orange-400 flex-shrink-0 group-hover:text-orange-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{post.content?.slice(0, 60) || "Media post"}...</p>
                    <p className="text-xs text-slate-400">{post.sport || "General"} · {(post.likes?.length || 0)} likes</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}