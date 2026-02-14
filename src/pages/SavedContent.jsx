import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "../components/feed/PostCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";

export default function SavedContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: savedItems = [], isLoading, refetch } = useQuery({
    queryKey: ["saved-content", user?.email],
    queryFn: () => base44.entities.SavedContent.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const handleDelete = async (id) => {
    await base44.entities.SavedContent.delete(id);
    toast.success("Removed from saved");
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/50">
            <Bookmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Saved Content
          </h1>
          <p className="text-slate-400 text-center text-lg">
            {savedItems.length} {savedItems.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        {/* Saved Items */}
        {savedItems.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-400 mb-2">No saved content yet</h2>
            <p className="text-slate-500 mb-6">Save posts and streams to view them later</p>
            <Link to={createPageUrl("Reels")}>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                Explore Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedItems.map(saved => {
              const content = saved.content_data;
              const isStream = saved.content_type === "stream";

              return (
                <div key={saved.id} className="relative">
                  {isStream ? (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{content.title}</h3>
                          <p className="text-slate-400 mb-4">{content.description}</p>
                          <Link to={createPageUrl("ViewLive") + `?id=${content.id}`}>
                            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                              Watch Stream
                            </Button>
                          </Link>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(saved.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <PostCard post={content} currentUser={user} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(saved.id)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}