import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Plus, Trash2, CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

function PollBar({ option, totalVotes, hasVoted, isMyVote, onVote, disabled }) {
  const pct = totalVotes > 0 ? Math.round((option.votes?.length || 0) / totalVotes * 100) : 0;
  return (
    <button
      onClick={() => !disabled && !hasVoted && onVote(option.id)}
      disabled={disabled || hasVoted}
      className={`w-full relative rounded-xl border text-left overflow-hidden transition-all
        ${isMyVote ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}
        ${!hasVoted && !disabled ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Progress fill */}
      <div
        className={`absolute inset-0 transition-all duration-700 rounded-xl ${isMyVote ? "bg-red-100" : "bg-gray-100"}`}
        style={{ width: hasVoted ? `${pct}%` : "0%" }}
      />
      <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          {isMyVote && <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-800">{option.text}</span>
        </div>
        {hasVoted && (
          <span className={`text-xs font-black flex-shrink-0 ${isMyVote ? "text-red-700" : "text-gray-500"}`}>{pct}%</span>
        )}
      </div>
    </button>
  );
}

function ActivePoll({ poll, user, isHost, onClose }) {
  const qc = useQueryClient();
  const [voting, setVoting] = useState(false);
  const totalVotes = poll.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;
  const myVoteOptionId = poll.options?.find(o => o.votes?.includes(user?.email))?.id;

  const vote = async (optionId) => {
    if (!user) return toast.error("Log in to vote");
    setVoting(true);
    const updatedOptions = poll.options.map(o => ({
      ...o,
      votes: o.id === optionId ? [...(o.votes || []), user.email] : (o.votes || [])
    }));
    await base44.entities.StreamPoll.update(poll.id, { options: updatedOptions });
    qc.invalidateQueries({ queryKey: ["stream-polls", poll.stream_id] });
    setVoting(false);
    toast.success("Vote cast!");
  };

  const endPoll = async () => {
    await base44.entities.StreamPoll.update(poll.id, { is_active: false });
    qc.invalidateQueries({ queryKey: ["stream-polls", poll.stream_id] });
    onClose?.();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3 border border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm font-black text-white leading-snug">{poll.question}</p>
        </div>
        {isHost && (
          <button onClick={endPoll} className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {poll.options?.map(opt => (
          <PollBar
            key={opt.id}
            option={opt}
            totalVotes={totalVotes}
            hasVoted={!!myVoteOptionId}
            isMyVote={myVoteOptionId === opt.id}
            onVote={vote}
            disabled={voting}
          />
        ))}
      </div>

      <p className="text-[11px] text-slate-500 text-right">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
    </div>
  );
}

function CreatePollForm({ streamId, user, onCreated }) {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const setOption = (i, val) => setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  const addOption = () => options.length < 6 && setOptions(prev => [...prev, ""]);
  const removeOption = (i) => options.length > 2 && setOptions(prev => prev.filter((_, idx) => idx !== i));

  const create = async () => {
    if (!question.trim()) return toast.error("Enter a question");
    const filled = options.filter(o => o.trim());
    if (filled.length < 2) return toast.error("Add at least 2 options");
    setCreating(true);
    await base44.entities.StreamPoll.create({
      stream_id: streamId,
      creator_email: user.email,
      question: question.trim(),
      options: filled.map((text, i) => ({ id: String(i + 1), text: text.trim(), votes: [] })),
      is_active: true,
    });
    qc.invalidateQueries({ queryKey: ["stream-polls", streamId] });
    toast.success("Poll launched! 🗳️");
    setQuestion(""); setOptions(["", ""]);
    setCreating(false);
    onCreated?.();
  };

  return (
    <div className="space-y-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Create Poll</p>
      <Input
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask your viewers something..."
        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 rounded-xl text-sm"
      />
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={opt}
              onChange={e => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 rounded-xl text-sm h-8"
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} className="text-slate-500 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button onClick={addOption} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Add option
          </button>
        )}
      </div>
      <Button onClick={create} disabled={creating} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl text-sm gap-2">
        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
        Launch Poll
      </Button>
    </div>
  );
}

export default function StreamPolls({ streamId, user, isHost, isLive }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: polls = [] } = useQuery({
    queryKey: ["stream-polls", streamId],
    queryFn: () => base44.entities.StreamPoll.filter({ stream_id: streamId }, "-created_date", 10),
    enabled: !!streamId,
    refetchInterval: 4000,
  });

  const activePolls = polls.filter(p => p.is_active);
  const pastPolls = polls.filter(p => !p.is_active);

  return (
    <div className="space-y-3">
      {isHost && isLive && (
        <div>
          {showCreate ? (
            <CreatePollForm streamId={streamId} user={user} onCreated={() => setShowCreate(false)} />
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-2 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Poll
            </button>
          )}
        </div>
      )}

      {activePolls.map(poll => (
        <ActivePoll key={poll.id} poll={poll} user={user} isHost={isHost} />
      ))}

      {pastPolls.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Past Polls</p>
          {pastPolls.map(poll => (
            <ActivePoll key={poll.id} poll={poll} user={user} isHost={false} />
          ))}
        </div>
      )}

      {polls.length === 0 && !showCreate && (
        <p className="text-xs text-slate-500 text-center py-3">No polls yet</p>
      )}
    </div>
  );
}