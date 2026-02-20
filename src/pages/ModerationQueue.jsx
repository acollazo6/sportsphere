import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Trash2, Eye, ShieldAlert, Bot, User, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

const SEVERITY_COLORS = {
  low: "bg-yellow-100 text-yellow-800 border-yellow-200",
  medium: "bg-orange-100 text-orange-800 border-orange-200",
  high: "bg-red-100 text-red-800 border-red-200",
  critical: "bg-red-900 text-red-100 border-red-700",
};

const STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-700",
  approved: "bg-green-100 text-green-700",
  removed: "bg-red-100 text-red-700",
  dismissed: "bg-gray-100 text-gray-500",
};

function FlagCard({ flag, onDecision }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const decide = async (action) => {
    setLoading(true);
    await onDecision(flag, action, note);
    setLoading(false);
  };

  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs font-bold border ${SEVERITY_COLORS[flag.severity] || "bg-slate-100 text-slate-700"}`}>
              {flag.severity?.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">{flag.content_type}</Badge>
            <Badge className={`text-xs ${STATUS_COLORS[flag.status]}`}>{flag.status}</Badge>
            {flag.source === "ai" ? (
              <span className="flex items-center gap-1 text-xs text-violet-600 font-medium"><Bot className="w-3 h-3" />AI Flagged</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-medium"><User className="w-3 h-3" />User Report</span>
            )}
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">{moment(flag.created_date).fromNow()}</span>
        </div>

        {/* Violations */}
        {flag.violations?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flag.violations.map(v => (
              <Badge key={v} variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">{v.replace(/_/g, " ")}</Badge>
            ))}
          </div>
        )}

        {/* Author */}
        <p className="text-xs text-slate-500">By <span className="font-semibold text-slate-700">{flag.author_name || flag.author_email}</span></p>

        {/* Content preview */}
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 border border-slate-100">
          <p className={expanded ? "" : "line-clamp-3"}>{flag.content_text}</p>
          {flag.content_text?.length > 200 && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-slate-400 hover:text-slate-600 mt-1">
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* AI explanation */}
        {flag.ai_explanation && (
          <div className="flex items-start gap-2 text-xs text-violet-700 bg-violet-50 rounded-lg p-2.5 border border-violet-100">
            <Bot className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{flag.ai_explanation}</span>
            {flag.ai_confidence && (
              <span className="ml-auto shrink-0 font-bold">{Math.round(flag.ai_confidence * 100)}% confident</span>
            )}
          </div>
        )}

        {/* Actions — only for pending */}
        {flag.status === "pending" && (
          <div className="space-y-2 pt-1">
            <Textarea
              placeholder="Optional review note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className="text-xs rounded-xl resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => decide("approved")}
                disabled={loading}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                onClick={() => decide("removed")}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => decide("dismissed")}
                disabled={loading}
                className="flex-1 rounded-xl gap-1.5"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Review note if already reviewed */}
        {flag.status !== "pending" && flag.review_note && (
          <p className="text-xs text-slate-500 italic">Note: {flag.review_note}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ModerationQueue() {
  const [user, setUser] = React.useState(null);
  const [tab, setTab] = useState("pending");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: flags = [], isLoading, refetch } = useQuery({
    queryKey: ["moderation-flags", tab],
    queryFn: () => base44.entities.ModerationFlag.filter(
      tab === "all" ? {} : { status: tab },
      "-created_date",
      100
    ),
    enabled: !!user && user.role === "admin",
    staleTime: 30000,
  });

  const handleDecision = async (flag, action, note) => {
    await base44.entities.ModerationFlag.update(flag.id, {
      status: action,
      reviewed_by: user.email,
      review_note: note || undefined,
    });

    // If removing, delete the actual content
    if (action === "removed") {
      if (flag.content_type === "post") {
        await base44.entities.Post.delete(flag.content_id).catch(() => {});
      } else if (flag.content_type === "comment") {
        await base44.entities.Comment.delete(flag.content_id).catch(() => {});
      }
      toast.success("Content removed.");
    } else if (action === "approved") {
      toast.success("Content approved and cleared.");
    } else {
      toast.success("Flag dismissed.");
    }

    queryClient.invalidateQueries({ queryKey: ["moderation-flags"] });
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  if (user.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-semibold">Admin access required.</p>
      </div>
    );
  }

  const pendingCount = flags.filter(f => f.status === "pending").length;
  const criticalCount = flags.filter(f => f.severity === "critical" && f.status === "pending").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-red-400" />
            <div>
              <h1 className="text-2xl font-black">Moderation Queue</h1>
              <p className="text-slate-400 text-sm mt-0.5">AI-powered content review</p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-600 text-slate-300 hover:text-white gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Pending Review", value: flags.filter(f => f.status === "pending").length, color: "text-amber-400" },
            { label: "Critical", value: criticalCount, color: "text-red-400" },
            { label: "Resolved Today", value: flags.filter(f => f.status !== "pending" && moment(f.updated_date).isSame(moment(), "day")).length, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full rounded-2xl bg-slate-100 h-11">
          <TabsTrigger value="pending" className="flex-1 rounded-xl gap-2 text-sm font-semibold">
            Pending {pendingCount > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="removed" className="flex-1 rounded-xl text-sm font-semibold">Removed</TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 rounded-xl text-sm font-semibold">Approved</TabsTrigger>
          <TabsTrigger value="all" className="flex-1 rounded-xl text-sm font-semibold">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No {tab === "all" ? "" : tab} flags</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sort critical first */}
          {[...flags]
            .sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
            })
            .map(flag => (
              <FlagCard key={flag.id} flag={flag} onDecision={handleDecision} />
            ))}
        </div>
      )}
    </div>
  );
}