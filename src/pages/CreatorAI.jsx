import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wand2, Hash, Video, Copy, Loader2, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SPORTS = [
  "Football", "Basketball", "Tennis", "Swimming", "Running", "Cycling",
  "Gym/Fitness", "Yoga", "Boxing", "MMA", "Baseball", "Soccer",
  "Volleyball", "Golf", "Skiing", "Surfing", "Rock Climbing", "CrossFit"
];

export default function CreatorAI() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sport, setSport] = useState("");
  const [topic, setTopic] = useState("");
  const [postIdeas, setPostIdeas] = useState([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [videoScript, setVideoScript] = useState("");
  const [captionInput, setCaptionInput] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const generatePostIdeas = async () => {
    if (!sport) {
      toast.error("Please select a sport");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media content strategist for athletes and sports creators.

Generate 5 engaging post ideas for ${sport} content creators. Consider:
- Current trends in sports social media
- User engagement patterns
- Visual content opportunities
- Educational value
- Entertainment factor
${topic ? `Focus on: ${topic}` : ""}

Return a JSON array of post ideas with this structure:
{
  "ideas": [
    {
      "title": "Post idea title",
      "description": "Detailed description of the post concept",
      "content_type": "image/video/carousel",
      "engagement_potential": "high/medium"
    }
  ]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  content_type: { type: "string" },
                  engagement_potential: { type: "string" }
                }
              }
            }
          }
        }
      });

      setPostIdeas(result.ideas || []);
      toast.success("Post ideas generated!");
    } catch (error) {
      toast.error("Failed to generate ideas");
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async () => {
    if (!captionInput && !sport) {
      toast.error("Please provide a topic or select a sport");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media copywriter for sports content creators.

Create an engaging post caption for:
Sport: ${sport || "General sports"}
Topic: ${captionInput || "Training session"}

The caption should:
- Start with a strong hook
- Include motivational or educational elements
- Be authentic and relatable
- Include 2-3 relevant emojis naturally
- End with a call-to-action or question
- Be 150-200 characters

Return ONLY the caption text, no extra formatting or quotes.`,
        add_context_from_internet: false
      });

      setCaption(result);
      toast.success("Caption generated!");
    } catch (error) {
      toast.error("Failed to generate caption");
    } finally {
      setLoading(false);
    }
  };

  const generateHashtags = async () => {
    if (!sport) {
      toast.error("Please select a sport");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media hashtag expert for sports content.

Generate relevant hashtags for ${sport} content${topic ? ` about ${topic}` : ""}.

Include:
- 5 high-traffic general sports hashtags
- 5 sport-specific hashtags
- 3 niche/trending hashtags
- 2 community hashtags

Return a JSON object:
{
  "hashtags": ["hashtag1", "hashtag2", ...]
}

DO NOT include the # symbol, just the hashtag text.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            hashtags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setHashtags(result.hashtags || []);
      toast.success("Hashtags generated!");
    } catch (error) {
      toast.error("Failed to generate hashtags");
    } finally {
      setLoading(false);
    }
  };

  const generateVideoScript = async () => {
    if (!sport && !topic) {
      toast.error("Please provide a topic or select a sport");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a video script writer for sports reels and short-form content.

Create a 30-60 second video script for:
Sport: ${sport || "General sports"}
Topic: ${topic || "Training tips"}

Structure:
- Hook (3 seconds): Attention-grabbing opening
- Main Content (40-50 seconds): Key points, demonstrations, or story
- CTA (7-10 seconds): Call to action

Format each section with timing and what to show/say.

Example format:
[0-3s] HOOK
Visual: ...
Say: "..."

[3-45s] MAIN CONTENT
Visual: ...
Say: "..."

[45-60s] CTA
Visual: ...
Say: "..."`,
        add_context_from_internet: false
      });

      setVideoScript(result);
      toast.success("Video script generated!");
    } catch (error) {
      toast.error("Failed to generate script");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/50">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            AI Content Creator
          </h1>
          <p className="text-slate-400 text-lg">
            Your intelligent assistant for creating engaging sports content
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6 bg-slate-900/60 backdrop-blur-xl border-cyan-500/30">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-cyan-400 mb-2 block">Sport</label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold text-cyan-400 mb-2 block">Topic/Theme (Optional)</label>
                <Input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., Training tips, Competition prep..."
                  className="bg-slate-800 border-cyan-500/30 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Tools Tabs */}
        <Tabs defaultValue="ideas" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 p-1">
            <TabsTrigger value="ideas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Post Ideas
            </TabsTrigger>
            <TabsTrigger value="caption" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Wand2 className="w-4 h-4 mr-2" />
              Captions
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Hash className="w-4 h-4 mr-2" />
              Hashtags
            </TabsTrigger>
            <TabsTrigger value="script" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Video className="w-4 h-4 mr-2" />
              Video Scripts
            </TabsTrigger>
          </TabsList>

          {/* Post Ideas */}
          <TabsContent value="ideas">
            <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Generate Post Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generatePostIdeas}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Ideas
                </Button>

                {postIdeas.length > 0 && (
                  <div className="space-y-3 mt-6">
                    {postIdeas.map((idea, idx) => (
                      <Card key={idx} className="bg-slate-800/60 border-cyan-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-cyan-400">{idea.title}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              {idea.content_type}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{idea.description}</p>
                          <span className="text-xs text-slate-500">Engagement: {idea.engagement_potential}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Captions */}
          <TabsContent value="caption">
            <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-cyan-400" />
                  Generate Caption
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={captionInput}
                  onChange={e => setCaptionInput(e.target.value)}
                  placeholder="Describe what your post is about..."
                  className="bg-slate-800 border-cyan-500/30 text-white min-h-[100px]"
                />
                <Button
                  onClick={generateCaption}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate Caption
                </Button>

                {caption && (
                  <Card className="bg-slate-800/60 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-slate-300 flex-1">{caption}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(caption)}
                          className="ml-2 text-cyan-400 hover:text-cyan-300"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hashtags */}
          <TabsContent value="hashtags">
            <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-cyan-400" />
                  Generate Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateHashtags}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Hash className="w-4 h-4 mr-2" />}
                  Generate Hashtags
                </Button>

                {hashtags.length > 0 && (
                  <Card className="bg-slate-800/60 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-cyan-400">Recommended Hashtags</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(hashtags.map(h => `#${h}`).join(" "))}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm border border-cyan-500/30"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Scripts */}
          <TabsContent value="script">
            <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-cyan-400" />
                  Generate Video Script
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateVideoScript}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                  Generate Script
                </Button>

                {videoScript && (
                  <Card className="bg-slate-800/60 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-cyan-400">Your Video Script</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(videoScript)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans">
                        {videoScript}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}