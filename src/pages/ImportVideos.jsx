import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Youtube, Heart, Bookmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SPORTS = [
  "Basketball", "Football", "Soccer", "Tennis", "Baseball", "Hockey",
  "Volleyball", "Cricket", "Rugby", "Golf", "Swimming", "Gymnastics",
  "Track & Field", "Skateboarding", "Surfing", "MMA", "Boxing"
];

export default function ImportVideos() {
  const [user, setUser] = useState(null);
  const [sport, setSport] = useState("Basketball");
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [likedVideos, setLikedVideos] = useState(new Set());
  const [savedVideos, setSavedVideos] = useState(new Set());
  const [category, setCategory] = useState("highlight");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSearch = async (pageToken = null) => {
    setLoading(true);
    const query = searchQuery.trim() || sport;
    
    const { data } = await base44.functions.invoke('fetchExternalVideos', {
      sport,
      query,
      source: 'youtube',
      limit: 12,
      pageToken
    });

    setVideos(data.videos || []);
    setNextPageToken(data.nextPageToken || null);
    setLoading(false);
  };

  const handleImport = async (video) => {
    if (!user) {
      toast.error("Please login to import videos");
      return;
    }

    const externalVideo = await base44.entities.ExternalVideo.create({
      user_email: user.email,
      source: 'youtube',
      platform_id: video.platform_id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      embed_url: video.embed_url,
      video_url: video.video_url,
      sport: video.sport,
      category,
      channel: video.channel,
      published_at: video.published_at
    });

    toast.success(`"${video.title}" imported!`);
  };

  const toggleLike = (videoId) => {
    const newLiked = new Set(likedVideos);
    if (newLiked.has(videoId)) {
      newLiked.delete(videoId);
    } else {
      newLiked.add(videoId);
    }
    setLikedVideos(newLiked);
  };

  const toggleSave = (videoId) => {
    const newSaved = new Set(savedVideos);
    if (newSaved.has(videoId)) {
      newSaved.delete(videoId);
    } else {
      newSaved.add(videoId);
    }
    setSavedVideos(newSaved);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Import Video Highlights</h1>
          <p className="text-gray-600">Search and import highlights from YouTube for your favorite sports</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highlight">Highlight</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="motivation">Motivation</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-xl"
            />

            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-xl font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>
        </div>

        {/* Videos Grid */}
        {loading && videos.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Youtube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Search to find highlight videos</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {videos.map((video) => (
                <div key={video.platform_id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Youtube className="w-12 h-12 text-white" />
                    </a>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{video.title}</h3>
                      <p className="text-xs text-gray-500">{video.channel}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                        {video.sport}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        {category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleLike(video.platform_id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              likedVideos.has(video.platform_id) ? "fill-red-500 text-red-500" : "text-gray-400"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => toggleSave(video.platform_id)}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              savedVideos.has(video.platform_id) ? "fill-amber-500 text-amber-500" : "text-gray-400"
                            }`}
                          />
                        </button>
                      </div>
                      <Button
                        onClick={() => handleImport(video)}
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg gap-1 font-bold"
                      >
                        <Download className="w-3 h-3" />
                        Import
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {nextPageToken && (
              <div className="flex justify-center mb-8">
                <Button
                  onClick={() => handleSearch(nextPageToken)}
                  variant="outline"
                  className="rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold"
                >
                  Load More Videos
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}