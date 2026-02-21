import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, MessageCircle, Film, TrendingUp, BarChart3, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center gap-1 shadow-sm">
      <Icon className={`w-5 h-5 ${color}`} />
      <p className="text-2xl font-black text-slate-900">{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}

export default function ReelsStatsPanel({ posts = [], isOwnProfile = false, onDelete }) {
  const [localDeleted, setLocalDeleted] = useState([]);
  const reels = useMemo(() => posts.filter(p => p.media_type === "video" && !localDeleted.includes(p.id)), [posts, localDeleted]);

  const totalViews = useMemo(() => reels.reduce((sum, p) => sum + (p.views || 0), 0), [reels]);
  const totalLikes = useMemo(() => reels.reduce((sum, p) => sum + (p.likes?.length || 0), 0), [reels]);
  const totalComments = useMemo(() => reels.reduce((sum, p) => sum + (p.comments_count || 0), 0), [reels]);

  const sportBreakdown = useMemo(() => {
    const map = {};
    reels.forEach(p => {
      if (p.sport) map[p.sport] = (map[p.sport] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reels]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    reels.forEach(p => {
      if (p.category) map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reels]);

  const topReels = useMemo(() =>
    [...reels].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3),
    [reels]
  );

  if (reels.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
        <Film className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm font-medium">No reels uploaded yet</p>
        {isOwnProfile && (
          <Link to={createPageUrl("CreateReel")}>
            <button className="mt-3 text-xs text-blue-600 font-semibold hover:underline">Upload your first reel →</button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Engagement Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox icon={Film} label="Reels" value={reels.length} color="text-blue-600" />
        <StatBox icon={Eye} label="Views" value={totalViews} color="text-indigo-500" />
        <StatBox icon={Heart} label="Likes" value={totalLikes} color="text-rose-500" />
        <StatBox icon={MessageCircle} label="Comments" value={totalComments} color="text-emerald-500" />
      </div>

      {/* Sport & Category Breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        {sportBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-bold text-slate-800">Sports</p>
            </div>
            <div className="space-y-2">
              {sportBreakdown.map(([sport, count]) => (
                <div key={sport} className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                      style={{ width: `${(count / reels.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-20 truncate">{sport}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-bold text-slate-800">Categories</p>
            </div>
            <div className="space-y-2">
              {categoryBreakdown.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"
                      style={{ width: `${(count / reels.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-20 truncate capitalize">{cat}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Reels */}
      {topReels.length > 0 && (
        <div>
          <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Top Reels
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {topReels.map((reel, i) => (
              <div key={reel.id} className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[9/16] max-h-52 group cursor-pointer">
                {isOwnProfile && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Delete this reel?")) return;
                      await base44.entities.Post.delete(reel.id);
                      setLocalDeleted(prev => [...prev, reel.id]);
                      if (onDelete) onDelete(reel.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                )}
                <video
                  src={reel.media_urls?.[0]}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-500" : "bg-orange-700"}`}>
                    #{i + 1}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-white text-xs">
                  <Eye className="w-3 h-3" /> {reel.views || 0}
                  <Heart className="w-3 h-3 ml-1" /> {reel.likes?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}