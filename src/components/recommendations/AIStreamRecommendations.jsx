import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Play, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function AIStreamRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const result = await base44.functions.invoke('analyzeUserBehavior');
        setRecommendations(result.data.recommendations);

        // Fetch actual stream data
        if (result.data.recommendations?.recommendedLiveStreams) {
          const streamIds = result.data.recommendations.recommendedLiveStreams.map(r => r.id);
          for (const id of streamIds.slice(0, 10)) {
            const streamData = await base44.entities.LiveStream.filter({ id });
            if (streamData[0]) {
              setStreams(prev => ({ ...prev, [id]: streamData[0] }));
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
        <CardContent className="p-8 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <p className="text-slate-300">Loading personalized recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
        <CardContent className="p-6">
          <p className="text-slate-400 text-sm">Unable to load recommendations</p>
        </CardContent>
      </Card>
    );
  }

  const liveStreamsToShow = recommendations.recommendedLiveStreams?.slice(0, 5) || [];
  const upcomingStreamsToShow = recommendations.recommendedUpcomingStreams?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* AI Recommendations Header */}
      <Card className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 border border-purple-700/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl">
              <Sparkles className="w-6 h-6 text-purple-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-white mb-1">Personalized For You</h2>
              <p className="text-purple-200 text-sm">{recommendations.summary}</p>
              {recommendations.topInterests?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {recommendations.topInterests.map((interest, idx) => (
                    <Badge key={idx} className="bg-purple-600 text-white text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Now Section */}
      {liveStreamsToShow.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500" />
            Live Now - Just For You
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {liveStreamsToShow.map((rec, idx) => {
              const stream = streams[rec.id];
              if (!stream) return null;
              return (
                <Link key={rec.id} to={createPageUrl("ViewLive") + `?id=${stream.id}`}>
                  <Card className="bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer h-full overflow-hidden group">
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                      {stream.thumbnail_url && (
                        <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Badge className="bg-red-600 text-white text-xs font-bold animate-pulse">
                          LIVE
                        </Badge>
                        <Badge className="bg-black/70 text-white text-xs">
                          {stream.viewers?.length || 0} watching
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="font-bold text-white text-sm mb-2 line-clamp-2">{stream.title}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-xs font-bold">
                          {stream.host_name?.[0]?.toUpperCase()}
                        </div>
                        <p className="text-slate-300 text-xs font-medium">{stream.host_name}</p>
                      </div>
                      {stream.sport && (
                        <Badge className="bg-slate-800 text-slate-300 text-xs">{stream.sport}</Badge>
                      )}
                      <p className="text-purple-300 text-xs mt-2 font-medium">✨ {rec.reason}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {upcomingStreamsToShow.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Upcoming Streams You'll Love
          </h3>
          <div className="space-y-2">
            {upcomingStreamsToShow.map((rec, idx) => (
              <Card key={idx} className="bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{rec.title}</p>
                      <p className="text-blue-300 text-xs mt-1">💡 {rec.reason}</p>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-shrink-0">
                      Notify Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}