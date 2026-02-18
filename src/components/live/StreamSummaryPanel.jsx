import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Clock, AlertCircle } from "lucide-react";

export default function StreamSummaryPanel({ stream, transcript, onSummaryGenerated }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(stream?.ai_summary || null);
  const [highlights, setHighlights] = useState([]);
  const [error, setError] = useState(null);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('generateStreamSummary', {
        stream_id: stream.id,
        transcript: transcript || `Title: ${stream.title}. Description: ${stream.description}`,
        title: stream.title,
        description: stream.description,
      });

      setSummary(response.data.summary);
      setHighlights(response.data.highlights || []);
      onSummaryGenerated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Summary Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-lg">Stream Summary</h3>
          </div>
          {!summary && !loading && (
            <Button onClick={generateSummary} size="sm" className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-amber-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Analyzing stream...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to generate summary</p>
              <p className="text-sm">{error}</p>
              <Button onClick={generateSummary} size="sm" variant="outline" className="mt-2">
                Try again
              </Button>
            </div>
          </div>
        )}

        {summary && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}
      </div>

      {/* Highlights Section */}
      {highlights.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <h4 className="font-semibold text-sm text-gray-900">Key Moments</h4>
          <div className="space-y-2">
            {highlights.map((highlight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  highlight.importance === 'high'
                    ? 'border-l-red-600 bg-red-50'
                    : 'border-l-yellow-600 bg-yellow-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    {highlight.timestamp && (
                      <Badge variant="outline" className="mb-1">
                        {highlight.timestamp}
                      </Badge>
                    )}
                    <p className="text-sm text-gray-700">{highlight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak Moments Tags */}
      {stream.ai_tags?.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <h4 className="font-semibold text-sm text-gray-900">Peak Moments</h4>
          <div className="flex flex-wrap gap-2">
            {stream.ai_tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}