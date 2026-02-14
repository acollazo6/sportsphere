import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, TrendingUp, Radio, Calendar, Users, Loader2, ExternalLink, Play, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";

export default function Discover() {
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: follows = [] } = useQuery({
    queryKey: ["follows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user,
  });

  const { data: preferences } = useQuery({
    queryKey: ["preferences", user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.FeedPreferences.filter({ user_email: user.email });
      return prefs[0];
    },
    enabled: !!user,
  });

  const { data: sportProfiles = [] } = useQuery({
    queryKey: ["my-profiles", user?.email],
    queryFn: () => base44.entities.SportProfile.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: viewedPosts = [] } = useQuery({
    queryKey: ["viewed-posts", user?.email],
    queryFn: async () => {
      const posts = await base44.entities.Post.list("-updated_date", 50);
      return posts.filter(p => p.views > 0);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    generateRecommendations();
  }, [user, follows, preferences, sportProfiles]);

  const generateRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const [liveStreams, events, groups, posts] = await Promise.all([
        base44.entities.LiveStream.filter({ status: "live" }),
        base44.entities.Event.list("-date", 20),
        base44.entities.Group.list("-created_date", 20),
        base44.entities.Post.list("-created_date", 30)
      ]);

      const followedCreators = follows.map(f => f.following_email);
      const userSports = sportProfiles.map(p => p.sport);
      const preferredSports = preferences?.preferred_sports || [];
      const allInterests = [...new Set([...userSports, ...preferredSports])];

      const prompt = `You are a sports content recommendation AI. Analyze the user's profile and suggest the most relevant content.

User Profile:
- Interested Sports: ${allInterests.join(", ") || "None specified"}
- Following ${followedCreators.length} creators
- Has viewed content in categories: training, coaching, highlights

Available Content:
Live Streams (${liveStreams.length}):
${liveStreams.slice(0, 5).map(s => `- "${s.title}" by ${s.host_name} (${s.sport})`).join("\n")}

Upcoming Events (${events.length}):
${events.slice(0, 5).map(e => `- "${e.title}" (${e.sport}, ${e.event_type}) on ${moment(e.date).format("MMM D")}`).join("\n")}

Groups (${groups.length}):
${groups.slice(0, 5).map(g => `- "${g.name}" (${g.sport}, ${g.category})`).join("\n")}

Recent Posts (${posts.length}):
${posts.slice(0, 5).map(p => `- by ${p.author_name} (${p.sport}, ${p.category})`).join("\n")}

Based on the user's interests, provide personalized recommendations. Return a JSON object with this structure:
{
  "featured_stream": <stream_id or null>,
  "recommended_events": [<event_id>, <event_id>],
  "recommended_groups": [<group_id>, <group_id>],
  "trending_posts": [<post_id>, <post_id>, <post_id>],
  "reasoning": "<brief explanation of why these recommendations fit>"
}`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            featured_stream: { type: ["string", "null"] },
            recommended_events: { type: "array", items: { type: "string" } },
            recommended_groups: { type: "array", items: { type: "string" } },
            trending_posts: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      const recs = {
        featuredStream: liveStreams.find(s => s.id === aiResponse.featured_stream),
        events: events.filter(e => aiResponse.recommended_events?.includes(e.id)).slice(0, 3),
        groups: groups.filter(g => aiResponse.recommended_groups?.includes(g.id)).slice(0, 3),
        posts: posts.filter(p => aiResponse.trending_posts?.includes(p.id)).slice(0, 5),
        reasoning: aiResponse.reasoning,
        fromFollowed: {
          streams: liveStreams.filter(s => followedCreators.includes(s.host_email)),
          posts: posts.filter(p => followedCreators.includes(p.author_email)).slice(0, 3)
        }
      };

      setRecommendations(recs);
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    } finally {
      setLoadingRecs(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Login to Discover</h2>
            <p className="text-slate-400">Get personalized recommendations based on your interests</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingRecs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Generating personalized recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/50 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Discover
          </h1>
          <p className="text-slate-400 text-lg">Personalized recommendations just for you</p>
          {recommendations?.reasoning && (
            <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
              {recommendations.reasoning}
            </p>
          )}
        </div>

        {/* Featured Live Stream */}
        {recommendations?.featuredStream && (
          <Card className="bg-slate-900/60 backdrop-blur-xl border-red-500/30 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-950/50 border-b border-red-500/20">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-400">FEATURED LIVE NOW</span>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-red-500/50">
                    <AvatarImage src={recommendations.featuredStream.host_avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-xl">
                      {recommendations.featuredStream.host_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{recommendations.featuredStream.title}</h3>
                    <p className="text-slate-400 text-sm mb-3">{recommendations.featuredStream.host_name}</p>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-red-600 text-white">
                        {recommendations.featuredStream.sport}
                      </Badge>
                      <span className="text-slate-500 text-sm flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {recommendations.featuredStream.viewers?.length || 0} watching
                      </span>
                    </div>
                    <Link to={createPageUrl("ViewLive") + `?id=${recommendations.featuredStream.id}`}>
                      <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Live
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* From Creators You Follow */}
        {recommendations?.fromFollowed && (recommendations.fromFollowed.streams.length > 0 || recommendations.fromFollowed.posts.length > 0) && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              From Creators You Follow
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.fromFollowed.streams.map(stream => (
                <Link key={stream.id} to={createPageUrl("ViewLive") + `?id=${stream.id}`}>
                  <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4">
                      <Badge className="bg-red-600 text-white mb-2">
                        <Radio className="w-3 h-3 mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                      <h3 className="font-bold text-white mb-2 line-clamp-2">{stream.title}</h3>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={stream.host_avatar} />
                          <AvatarFallback className="text-xs">{stream.host_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-400">{stream.host_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {recommendations.fromFollowed.posts.map(post => (
                <Card key={post.id} className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                  <CardContent className="p-4">
                    <Badge className="bg-cyan-600 text-white mb-2">{post.sport}</Badge>
                    <p className="text-white text-sm mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback className="text-xs">{post.author_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-400">{post.author_name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Events */}
        {recommendations?.events && recommendations.events.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Recommended Events
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.events.map(event => (
                <Card key={event.id} className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <Badge className="bg-blue-600 text-white capitalize">{event.event_type}</Badge>
                    <h3 className="font-bold text-white line-clamp-2">{event.title}</h3>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p>{moment(event.date).format("MMM D, YYYY")}</p>
                      <p>{event.location || event.city}</p>
                    </div>
                    <Link to={createPageUrl("Explore") + "?tab=events"}>
                      <Button variant="outline" size="sm" className="w-full border-cyan-500/30 text-cyan-400">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Groups */}
        {recommendations?.groups && recommendations.groups.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Groups You Might Like
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.groups.map(group => (
                <Link key={group.id} to={createPageUrl("GroupDetail") + `?id=${group.id}`}>
                  <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4 space-y-3">
                      <Badge className="bg-green-600 text-white">{group.sport}</Badge>
                      <h3 className="font-bold text-white line-clamp-2">{group.name}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{group.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        {group.members?.length || 0} members
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Posts */}
        {recommendations?.posts && recommendations.posts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Trending Content
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.posts.map(post => (
                <Card key={post.id} className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                          {post.author_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{post.author_name}</p>
                        <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
                      </div>
                      {post.sport && (
                        <Badge className="bg-cyan-600 text-white">{post.sport}</Badge>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>{post.comments_count || 0} comments</span>
                      <span>{post.views || 0} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Button onClick={generateRecommendations} variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
          <Sparkles className="w-4 h-4 mr-2" />
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
}