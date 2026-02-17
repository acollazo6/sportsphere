import React from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { MessageSquare, Eye, Heart } from "lucide-react";

export default function RecommendedForums({ topics = [] }) {
  if (!topics.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-bold text-white">Hot Forum Topics</h2>
      </div>
      <div className="space-y-2">
        {topics.slice(0, 5).map(topic => (
          <Link
            key={topic.id}
            to={createPageUrl("ForumTopic") + `?id=${topic.id}`}
            className="flex items-start gap-3 bg-slate-800/80 border border-slate-700 hover:border-green-500/50 rounded-2xl p-4 transition-all hover:scale-[1.01]"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{topic.title}</p>
              <p className="text-slate-400 text-xs line-clamp-1 mt-0.5">{topic.content}</p>
              <div className="flex items-center gap-3 mt-2">
                {topic.sport && <Badge className="bg-green-500/20 text-green-300 text-xs">{topic.sport}</Badge>}
                <span className="text-xs text-slate-500 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{topic.replies_count || 0}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3" />{topic.views || 0}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1"><Heart className="w-3 h-3" />{topic.likes?.length || 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}