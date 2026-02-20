import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, TrendingUp, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VideoFormAnalysis({ videoFile, videoUrl, onAnalysisComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeForm = async () => {
    if (!videoFile && !videoUrl) {
      toast.error("Please select a video first");
      return;
    }

    setAnalyzing(true);
    try {
      let fileUrl = videoUrl;
      if (videoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
        fileUrl = file_url;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert sports form analyst. Analyze this training video and provide detailed form correction feedback.

Provide your analysis in the following JSON structure:
{
  "overallScore": 0-100,
  "strengths": ["strength1", "strength2", ...],
  "areasForImprovement": [
    {
      "area": "specific area",
      "issue": "what's wrong",
      "correction": "how to fix it",
      "impact": "why it matters",
      "priority": "high/medium/low"
    }
  ],
  "safetyIssues": ["issue1", "issue2"] or [],
  "performanceTips": ["tip1", "tip2", ...],
  "nextSteps": ["step1", "step2", ...]
}`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            areasForImprovement: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  issue: { type: "string" },
                  correction: { type: "string" },
                  impact: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            safetyIssues: { type: "array", items: { type: "string" } },
            performanceTips: { type: "array", items: { type: "string" } },
            nextSteps: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
      onAnalysisComplete?.(result);
      toast.success("Form analysis complete!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze video. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={analyzeForm}
        disabled={analyzing || (!videoFile && !videoUrl)}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white gap-2"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Form...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Analyze Form & Technique
          </>
        )}
      </Button>

      {analysis && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Overall Form Score</p>
                <p className="text-4xl font-black text-blue-600">{analysis.overallScore}</p>
              </div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{analysis.overallScore}%</span>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${analysis.overallScore}%` }}
              />
            </div>
          </Card>

          {/* Safety Issues */}
          {analysis.safetyIssues && analysis.safetyIssues.length > 0 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ Safety Issues</h4>
                  <ul className="space-y-1">
                    {analysis.safetyIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-800">• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">✓ Strengths</h4>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-green-800">• {strength}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Areas for Improvement */}
          {analysis.areasForImprovement && analysis.areasForImprovement.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Areas for Improvement
              </h4>
              {analysis.areasForImprovement.map((item, i) => (
                <Card
                  key={i}
                  className={`p-4 border-l-4 ${
                    item.priority === "high"
                      ? "border-l-red-500 bg-red-50"
                      : item.priority === "medium"
                      ? "border-l-yellow-500 bg-yellow-50"
                      : "border-l-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-slate-900">{item.area}</h5>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.priority === "high"
                          ? "bg-red-200 text-red-800"
                          : item.priority === "medium"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-blue-200 text-blue-800"
                      }`}
                    >
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    <strong>Issue:</strong> {item.issue}
                  </p>
                  <p className="text-sm text-slate-700 mb-2">
                    <strong>Correction:</strong> {item.correction}
                  </p>
                  <p className="text-sm text-slate-600 italic">
                    <strong>Why it matters:</strong> {item.impact}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Performance Tips */}
          {analysis.performanceTips && analysis.performanceTips.length > 0 && (
            <Card className="p-4 border-purple-200 bg-purple-50">
              <h4 className="font-semibold text-purple-900 mb-3">💡 Performance Tips</h4>
              <ul className="space-y-2">
                {analysis.performanceTips.map((tip, i) => (
                  <li key={i} className="text-sm text-purple-800">• {tip}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Next Steps */}
          {analysis.nextSteps && analysis.nextSteps.length > 0 && (
            <Card className="p-4 border-indigo-200 bg-indigo-50">
              <h4 className="font-semibold text-indigo-900 mb-3">📋 Recommended Next Steps</h4>
              <ol className="space-y-2">
                {analysis.nextSteps.map((step, i) => (
                  <li key={i} className="text-sm text-indigo-800">
                    <span className="font-semibold">{i + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}