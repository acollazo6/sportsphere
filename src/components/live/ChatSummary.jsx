import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ChatSummary({ messages, streamTitle, streamDescription }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (messages.length < 10) return;

    setLoading(true);
    try {
      const result = await base44.functions.invoke('analyzeChat', {
        action: 'sentiment_summary',
        messages: messages.map(m => ({ message: m.message }))
      });

      setSummary(result.data);
    } catch (error) {
      console.error('Summary error:', error);
    }
    setLoading(false);
  };

  if (!messages || messages.length < 10) {
    return (
      <div className="text-center py-4 text-slate-400 text-xs">
        Need at least 10 messages to analyze
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!summary ? (
        <Button
          onClick={generateSummary}
          disabled={loading}
          className="w-full gap-2 bg-blue-900 hover:bg-blue-800 text-blue-100"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analyze Chat Sentiment
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-300">Overall Sentiment</p>
              <Badge className={`text-xs ${summary.overall_sentiment === 'positive' ? 'bg-green-900 text-green-300' : summary.overall_sentiment === 'neutral' ? 'bg-slate-700 text-slate-300' : 'bg-red-900 text-red-300'}`}>
                {summary.overall_sentiment?.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-green-400 font-bold">{summary.sentiment_breakdown?.positive || 0}%</p>
                <p className="text-slate-400 text-[10px]">Positive</p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-slate-400 font-bold">{summary.sentiment_breakdown?.neutral || 0}%</p>
                <p className="text-slate-400 text-[10px]">Neutral</p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p className="text-red-400 font-bold">{summary.sentiment_breakdown?.negative || 0}%</p>
                <p className="text-slate-400 text-[10px]">Negative</p>
              </div>
            </div>

            <div className="bg-slate-800 p-2 rounded">
              <p className="text-xs font-bold text-slate-300 mb-1">Engagement</p>
              <Badge variant="outline" className="text-xs">{summary.engagement_level?.toUpperCase()}</Badge>
            </div>

            {summary.key_topics?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-300 mb-1">Top Topics</p>
                <div className="flex flex-wrap gap-1">
                  {summary.key_topics.slice(0, 3).map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{topic}</Badge>
                  ))}
                </div>
              </div>
            )}

            {summary.summary && (
              <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                <p className="text-xs text-slate-300 leading-relaxed">{summary.summary}</p>
              </div>
            )}
          </div>

          <Button
            onClick={() => setSummary(null)}
            variant="outline"
            className="w-full text-xs"
          >
            Refresh Analysis
          </Button>
        </>
      )}
    </div>
  );
}