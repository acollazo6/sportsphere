import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircleQuestion, ChevronUp, Star, CheckCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function StreamQA({ streamId, user, isHost, isLive }) {
  const qc = useQueryClient();
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: questions = [] } = useQuery({
    queryKey: ["stream-qa", streamId],
    queryFn: () => base44.entities.StreamQuestion.filter({ stream_id: streamId }, "-created_date", 50),
    enabled: !!streamId,
    refetchInterval: 4000,
  });

  const submitQuestion = async () => {
    if (!questionText.trim()) return;
    if (!user) return toast.error("Log in to ask a question");
    setSubmitting(true);
    await base44.entities.StreamQuestion.create({
      stream_id: streamId,
      asker_email: user.email,
      asker_name: user.full_name,
      asker_avatar: user.avatar_url,
      question: questionText.trim(),
      upvotes: [],
      is_highlighted: false,
      is_answered: false,
    });
    qc.invalidateQueries({ queryKey: ["stream-qa", streamId] });
    setQuestionText("");
    setSubmitting(false);
    toast.success("Question submitted! 🙋");
  };

  const upvote = async (q) => {
    if (!user) return toast.error("Log in to upvote");
    if (q.upvotes?.includes(user.email)) return;
    await base44.entities.StreamQuestion.update(q.id, {
      upvotes: [...(q.upvotes || []), user.email],
    });
    qc.invalidateQueries({ queryKey: ["stream-qa", streamId] });
  };

  const highlight = async (q) => {
    await base44.entities.StreamQuestion.update(q.id, { is_highlighted: !q.is_highlighted });
    qc.invalidateQueries({ queryKey: ["stream-qa", streamId] });
  };

  const markAnswered = async (q) => {
    await base44.entities.StreamQuestion.update(q.id, { is_answered: true, is_highlighted: false });
    qc.invalidateQueries({ queryKey: ["stream-qa", streamId] });
  };

  const highlighted = questions.filter(q => q.is_highlighted);
  const pending = questions.filter(q => !q.is_highlighted && !q.is_answered)
    .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
  const answered = questions.filter(q => q.is_answered);

  return (
    <div className="space-y-3 flex flex-col h-full">
      {/* Highlighted question */}
      {highlighted.map(q => (
        <div key={q.id} className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-black text-yellow-400 uppercase tracking-wide">Answering Now</span>
          </div>
          <div className="flex items-start gap-2">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={q.asker_avatar} />
              <AvatarFallback className="text-[9px] bg-slate-700 text-white">{q.asker_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-300">{q.asker_name}</p>
              <p className="text-sm text-white leading-snug">{q.question}</p>
            </div>
          </div>
          {isHost && (
            <div className="flex gap-2 pt-1">
              <Button onClick={() => markAnswered(q)} size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 rounded-lg gap-1 font-bold">
                <CheckCircle className="w-3 h-3" /> Mark Answered
              </Button>
              <Button onClick={() => highlight(q)} size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white rounded-lg">
                Dismiss
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Question list */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {pending.length === 0 && answered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">No questions yet</p>
        )}

        {pending.map(q => {
          const hasUpvoted = q.upvotes?.includes(user?.email);
          return (
            <div key={q.id} className="flex items-start gap-2 bg-slate-800/60 rounded-xl p-2.5 group hover:bg-slate-800 transition-colors">
              {/* Upvote */}
              <button
                onClick={() => upvote(q)}
                disabled={hasUpvoted}
                className={`flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0 transition-colors
                  ${hasUpvoted ? "text-red-400" : "text-slate-500 hover:text-red-400"}`}
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-[10px] font-black leading-none">{q.upvotes?.length || 0}</span>
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={q.asker_avatar} />
                    <AvatarFallback className="text-[8px] bg-slate-600 text-white">{q.asker_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-slate-400 font-medium truncate">{q.asker_name}</span>
                </div>
                <p className="text-sm text-slate-200 leading-snug break-words">{q.question}</p>
              </div>

              {isHost && isLive && (
                <button
                  onClick={() => highlight(q)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 transition-all"
                  title="Highlight this question"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {answered.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Answered</p>
            {answered.map(q => (
              <div key={q.id} className="flex items-start gap-2 bg-slate-900/40 rounded-xl p-2.5 opacity-60">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 break-words line-through">{q.question}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit question */}
      {isLive && user && !isHost && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <Textarea
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            placeholder="Ask a question..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm resize-none"
            rows={2}
          />
          <Button
            onClick={submitQuestion}
            disabled={submitting || !questionText.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm gap-2 h-8"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit Question
          </Button>
        </div>
      )}
    </div>
  );
}