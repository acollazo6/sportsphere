import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Shield, Zap, Loader2 } from "lucide-react";

export default function ModerationSuggestions({ message, streamId, isHost, onAction }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!message || !isHost) return;

    const analyzeModerator = async () => {
      setLoading(true);
      try {
        const result = await base44.functions.invoke('analyzeMessageForModeration', {
          message,
          streamId,
        });
        setAnalysis(result.data.analysis);
      } catch (error) {
        console.error('Moderation analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(analyzeModerator, 500);
    return () => clearTimeout(debounce);
  }, [message, streamId, isHost]);

  if (!isHost || !analysis) return null;

  if (analysis.severity === 'none') return null;

  const severityConfig = {
    low: { icon: AlertCircle, color: 'bg-yellow-500/20 border-yellow-500/50', textColor: 'text-yellow-300' },
    medium: { icon: AlertTriangle, color: 'bg-orange-500/20 border-orange-500/50', textColor: 'text-orange-300' },
    high: { icon: Shield, color: 'bg-red-500/20 border-red-500/50', textColor: 'text-red-300' },
  };

  const config = severityConfig[analysis.severity] || severityConfig.low;
  const Icon = config.icon;

  const actionColors = {
    none: 'bg-slate-600',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    mute: 'bg-orange-600 hover:bg-orange-700',
    tempban: 'bg-red-600 hover:bg-red-700',
    ban: 'bg-red-800 hover:bg-red-900',
  };

  return (
    <Card className={`${config.color} border rounded-lg p-3 mb-3`}>
      <CardContent className="p-0">
        <div className="flex gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 ${config.textColor} mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-bold text-sm ${config.textColor} capitalize`}>
                {analysis.severity} severity
              </p>
              {analysis.hasHarmfulLinks && (
                <Badge className="bg-red-600 text-white text-xs">⚠️ Harmful links</Badge>
              )}
            </div>
            <p className="text-xs text-slate-300 mb-2">{analysis.actionReason}</p>
            {analysis.reasons?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {analysis.reasons.map((reason, idx) => (
                  <Badge key={idx} className="bg-slate-700/60 text-slate-200 text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAction(analysis.suggestedAction, message)}
                className={`${actionColors[analysis.suggestedAction]} text-white text-xs h-7`}
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                {analysis.suggestedAction === 'none' ? 'No action' : `${analysis.suggestedAction.charAt(0).toUpperCase() + analysis.suggestedAction.slice(1)} user`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 text-xs h-7"
                onClick={() => setAnalysis(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}