import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VideoFormAnalysis({ video }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(video.ai_summary || null);
  const [aiTags, setAiTags] = useState(video.ai_tags || []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert sports biomechanics coach analyzing an athlete's training video.

Video Title: ${video.title}
Sport: ${video.sport || "General athletics"}
Description: ${video.description || "Not provided"}
Athlete Tags: ${video.tags?.join(", ") || "None"}

Based on the sport and context, provide a detailed form and technique analysis covering:
1. Likely movement patterns for this type of training
2. Common form checkpoints for ${video.sport || "this sport"} that should be verified
3. Specific technique cues and corrections
4. Safety considerations and injury prevention notes
5. Overall assessment and next steps

Be specific, technical yet accessible, and constructive. Format clearly with sections.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_assessment: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          areas_to_improve: { type: "array", items: { type: "string" } },
          technique_cues: { type: "array", items: { type: "string" } },
          safety_notes: { type: "string" },
          detected_tags: { type: "array", items: { type: "string" } },
        }
      }
    });

    // Save results to the video record
    await base44.entities.AthleteVideo.update(video.id, {
      ai_summary: result.overall_assessment,
      ai_tags: result.detected_tags || [],
    });

    setAnalysis(result.overall_assessment);
    setAiTags(result.detected_tags || []);
    setAnalyzing(false);

    return result;
  };

  const [detailedResult, setDetailedResult] = useState(null);

  const handleAnalyze = async () => {
    const result = await runAnalysis();
    setDetailedResult(result);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-purple-600" /> AI Form Analysis
          <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">Beta</Badge>
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="rounded-xl text-purple-700 border-purple-300 hover:bg-purple-50 gap-1.5 text-xs"
        >
          {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {analyzing ? "Analyzing..." : analysis ? "Re-analyze" : "Analyze Form"}
        </Button>
      </div>

      {analyzing && (
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-purple-700 font-medium">Analyzing movement patterns...</p>
          <p className="text-xs text-purple-500 mt-1">This may take a few seconds</p>
        </div>
      )}

      {!analyzing && detailedResult && (
        <div className="space-y-3">
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-1">Overall Assessment</p>
            <p className="text-sm text-gray-700">{detailedResult.overall_assessment}</p>
          </div>

          {detailedResult.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 mb-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Strengths</p>
              <ul className="space-y-1">
                {detailedResult.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detailedResult.areas_to_improve?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-orange-700 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Areas to Improve</p>
              <ul className="space-y-1">
                {detailedResult.areas_to_improve.map((a, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-orange-400 mt-0.5">→</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detailedResult.technique_cues?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-blue-700 mb-1.5">Technique Cues</p>
              <ul className="space-y-1">
                {detailedResult.technique_cues.map((cue, i) => (
                  <li key={i} className="text-xs text-gray-600 bg-blue-50 rounded-lg p-2">{cue}</li>
                ))}
              </ul>
            </div>
          )}

          {detailedResult.safety_notes && (
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
              <p className="text-xs font-bold text-yellow-700 mb-0.5">Safety Note</p>
              <p className="text-xs text-gray-600">{detailedResult.safety_notes}</p>
            </div>
          )}

          {aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {aiTags.map(tag => (
                <Badge key={tag} className="bg-purple-100 text-purple-700 border-0 text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {!analyzing && !detailedResult && analysis && (
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-sm text-gray-700">{analysis}</p>
          {aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {aiTags.map(tag => (
                <Badge key={tag} className="bg-purple-100 text-purple-700 border-0 text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}