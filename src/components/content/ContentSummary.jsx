import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";

export default function ContentSummary({ summary, type = "stream" }) {
  if (!summary) return null;

  return (
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
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}