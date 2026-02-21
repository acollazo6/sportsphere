import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Clock, AlertCircle, Tag, Star, RefreshCw } from "lucide-react";

export default function StreamSummaryPanel({ stream, transcript, onSummaryGenerated }) {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(stream?.ai_summary || null);
  const [highlights, setHighlights] = useState([]);
  const [tags, setTags] = useState(stream?.ai_tags || []);
  const [error, setError] = useState(null);

  // Auto-generate summary when stream has ended and no summary exists yet
  useEffect(() => {
    if (stream?.status === "ended" && !stream?.ai_summary && !overview && !loading) {
      generateSummary();
    }
  }, [stream?.id]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('generateStreamSummary', {
        stream_id: stream.id,
        transcript: transcript || "",
        title: stream.title,
        description: stream.description,
        sport: stream.sport,
      });

      setOverview(response.data.overview);
      setHighlights(response.data.highlights || []);
      setTags(response.data.tags || []);
      onSummaryGenerated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasSummary = overview || highlights.length > 0 || tags.length > 0;

  return (
    <Card className="p-4 bg-slate-900 border-slate-800 text-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base">AI Stream Summary</h3>
        </div>
        <Button
          onClick={generateSummary}
          disabled={loading}
          size="sm"
          className="gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasSummary ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {hasSummary ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8 gap-2 text-amber-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Analyzing stream content…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-2 p-3 bg-red-900/40 rounded-lg text-red-300 border border-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Failed to generate summary</p>
            <p className="text-red-400 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Overview */}
          {overview && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Overview</p>
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <p className="text-sm text-slate-200 leading-relaxed">{overview}</p>
              </div>
            </div>
          )}

          {/* Key Moments */}
          {highlights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Key Moments
              </p>
              <div className="space-y-2">
                {highlights.map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 p-3 rounded-lg border-l-4 ${
                      h.importance === 'high'
                        ? 'border-l-red-500 bg-red-900/20'
                        : 'border-l-amber-500 bg-amber-900/20'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Star className={`w-4 h-4 ${h.importance === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {h.timestamp && (
                        <span className="text-xs font-bold text-slate-400 mb-0.5 block">{h.timestamp}</span>
                      )}
                      <p className="text-sm text-slate-200">{h.description}</p>
                    </div>
                    <Badge
                      className={`self-start text-xs flex-shrink-0 ${
                        h.importance === 'high'
                          ? 'bg-red-700 text-white'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      {h.importance}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Suggested Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <Badge key={idx} className="bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-default text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!overview && highlights.length === 0 && tags.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Click "Generate" to create an AI summary of this stream</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}