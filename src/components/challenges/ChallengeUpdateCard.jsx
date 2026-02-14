import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle } from "lucide-react";
import moment from "moment";

export default function ChallengeUpdateCard({ update, currentUser }) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(update.likes?.includes(currentUser?.email));

  const handleLike = async () => {
    if (!currentUser) return;

    const newLikes = liked
      ? update.likes.filter(email => email !== currentUser.email)
      : [...(update.likes || []), currentUser.email];

    await base44.entities.ChallengeUpdate.update(update.id, { likes: newLikes });
    setLiked(!liked);
    queryClient.invalidateQueries({ queryKey: ["challenge-updates"] });
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl border-2 border-cyan-400/20 p-6 hover:border-cyan-400/40 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={update.user_avatar} />
          <AvatarFallback className="bg-slate-700 text-slate-300">
            {update.user_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-slate-200">{update.user_name}</p>
            {update.day_number && (
              <Badge className="bg-amber-100 text-amber-700">Day {update.day_number}</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">{moment(update.created_date).fromNow()}</p>
        </div>
      </div>

      <p className="text-slate-300 mb-4 leading-relaxed whitespace-pre-wrap">{update.content}</p>

      {update.media_urls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {update.media_urls.map((url, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden border border-cyan-400/20">
              <img src={url} alt={`Update ${idx + 1}`} className="w-full h-48 object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
        <Button
          onClick={handleLike}
          variant="ghost"
          size="sm"
          className={`gap-2 ${liked ? "text-red-400" : "text-slate-400"} hover:text-red-400`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          {update.likes?.length || 0}
        </Button>
      </div>
    </div>
  );
}