import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Inbox, Send, Check, X, Clock, MessageCircle } from "lucide-react";
import moment from "moment";

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-blue-50 text-blue-700",
  replied: "bg-green-50 text-green-700",
  declined: "bg-slate-100 text-slate-500",
};

export default function Advice() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [replyDialog, setReplyDialog] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: received, isLoading: receivedLoading } = useQuery({
    queryKey: ["advice-received", user?.email],
    queryFn: () => base44.entities.AdviceRequest.filter({ to_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: sent, isLoading: sentLoading } = useQuery({
    queryKey: ["advice-sent", user?.email],
    queryFn: () => base44.entities.AdviceRequest.filter({ from_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const handleReply = async () => {
    setReplying(true);
    await base44.entities.AdviceRequest.update(replyDialog.id, {
      reply: replyText,
      status: "replied",
    });
    queryClient.invalidateQueries({ queryKey: ["advice-received"] });
    setReplyDialog(null);
    setReplyText("");
    setReplying(false);
  };

  const updateStatus = async (id, status) => {
    await base44.entities.AdviceRequest.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ["advice-received"] });
  };

  const RequestCard = ({ req, isReceived }) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-bold">
              {(isReceived ? req.from_name : req.to_name)?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-slate-900">
              {isReceived ? req.from_name : req.to_name}
            </p>
            <p className="text-xs text-slate-400">{moment(req.created_date).fromNow()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {req.sport && <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-xs rounded-lg">{req.sport}</Badge>}
          <Badge className={`${statusColors[req.status]} text-xs rounded-lg capitalize`}>{req.status}</Badge>
        </div>
      </div>
      
      <div>
        <p className="font-medium text-sm text-slate-800">{req.topic}</p>
        {req.message && <p className="text-sm text-slate-500 mt-1">{req.message}</p>}
      </div>

      {req.reply && (
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <p className="text-xs font-medium text-green-700 mb-1">Reply:</p>
          <p className="text-sm text-green-800">{req.reply}</p>
        </div>
      )}

      {isReceived && req.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="rounded-xl gap-1.5 bg-slate-900" onClick={() => { setReplyDialog(req); setReplyText(""); }}>
            <MessageCircle className="w-3.5 h-3.5" /> Reply
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => updateStatus(req.id, "accepted")}>
            <Check className="w-3.5 h-3.5" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-slate-400" onClick={() => updateStatus(req.id, "declined")}>
            <X className="w-3.5 h-3.5" /> Decline
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Advice Hub</h1>
        <p className="text-slate-500 text-sm mt-1">Request and share sports expertise</p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="bg-slate-100 rounded-xl p-1 w-full">
          <TabsTrigger value="received" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Inbox className="w-4 h-4 mr-2" /> Received ({received?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Send className="w-4 h-4 mr-2" /> Sent ({sent?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4 space-y-3">
          {receivedLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : received?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No advice requests received yet</p>
            </div>
          ) : received?.map(r => <RequestCard key={r.id} req={r} isReceived />)}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-3">
          {sentLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : sent?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Send className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">You haven't sent any advice requests yet</p>
            </div>
          ) : sent?.map(r => <RequestCard key={r.id} req={r} isReceived={false} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {replyDialog?.from_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Question: {replyDialog?.topic}</p>
              <p className="text-sm text-slate-600">{replyDialog?.message}</p>
            </div>
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Share your advice..."
              className="rounded-xl resize-none"
              rows={4}
            />
            <Button
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white"
            >
              {replying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}