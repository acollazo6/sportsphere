import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Loader2, FileText, Tag, ChevronDown, ChevronUp } from "lucide-react";

export default function ContentSummary({ content, type = "stream", showButton = false, onSummaryGenerated }) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const generateSummary = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      // Enhanced AI analysis for video content
      const analysisPrompt = `Analyze this ${type === "post" ? "sports video post" : "live stream"} and provide comprehensive analysis.

${type === "post" ? `Post content: ${content.content}` : `Stream title: ${content.title}\nStream description: ${content.description}`}
Sport: ${content.sport || "Unknown"}

Provide detailed JSON analysis with:
1. "transcript": Detailed description of what's happening in the video (as if transcribing narration)
2. "summary": Brief 2-3 sentence summary of key highlights
3. "tags": Array of detected actions, techniques, equipment, or key moments (e.g., "dunk", "three-pointer", "squat", "deadlift", "goal", "pass", "serve")
4. "key_moments": Array of important moments with descriptions
5. "techniques": Array of techniques or skills demonstrated
6. "accessibility_description": Detailed description for visually impaired users

Return JSON only.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: type === "post" && content.media_urls?.length > 0 ? [content.media_urls[0]] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string" },
            summary: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            key_moments: { type: "array", items: { type: "object" } },
            techniques: { type: "array", items: { type: "string" } },
            accessibility_description: { type: "string" }
          }
        }
      });

      const updateData = {
        ai_summary: analysis.summary,
        ai_transcript: analysis.transcript || analysis.accessibility_description,
        ai_tags: analysis.tags || [],
        ai_analysis: {
          key_moments: analysis.key_moments || [],
          techniques_detected: analysis.techniques || [],
          skills_shown: analysis.tags || []
        }
      };

      await base44.entities[type === "post" ? "Post" : "LiveStream"].update(content.id, updateData);

      onSummaryGenerated?.(analysis.summary);
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Failed to generate analysis:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (!content) return null;

  // Display existing summary/analysis or button to generate
  return (
    <div className="mt-4 space-y-3">
      {content.ai_summary ? (
        <>
          {/* Main Summary Card */}
          <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-white">AI Summary</h3>
                <div className="ml-auto flex items-center gap-1 text-xs text-purple-300">
                  <Clock className="w-3 h-3" />
                  Quick read
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {content.ai_summary}
              </p>
            </CardContent>
          </Card>

          {/* AI Tags */}
          {content.ai_tags && content.ai_tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap px-1">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              {content.ai_tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="bg-purple-950/50 text-purple-300 border-purple-500/30 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Video Transcript */}
          {content.ai_transcript && (
            <div className="space-y-2">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {showTranscript ? "Hide" : "View"} Video Transcript
                {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showTranscript && (
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-3 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                    {content.ai_transcript}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Key Techniques */}
          {content.ai_analysis?.techniques_detected && content.ai_analysis.techniques_detected.length > 0 && (
            <Card className="bg-slate-900/50 border-purple-500/30">
              <CardContent className="p-3">
                <h5 className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Techniques Detected
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {content.ai_analysis.techniques_detected.map((tech, idx) => (
                    <Badge key={idx} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : showButton && (
        <Button
          onClick={generateSummary}
          disabled={generating}
          variant="outline"
          className="w-full rounded-xl border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing video with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Analysis & Transcript
            </>
          )}
        </Button>
      )}
    </div>
  );
}