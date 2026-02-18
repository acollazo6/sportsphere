import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Users, History, TrendingUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ModerationDashboard({ streamId, isHost }) {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [userBehavior, setUserBehavior] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHost || !streamId) return;
    loadModerationData();
    const interval = setInterval(loadModerationData, 10000);
    return () => clearInterval(interval);
  }, [streamId, isHost]);

  const loadModerationData = async () => {
    try {
      // Fetch all messages from stream
      const messages = await base44.entities.LiveChat.filter(
        { stream_id: streamId },
        '-created_date',
        200
      );

      // Filter flagged messages (those with moderation data)
      const flagged = messages.filter(m => m.moderation_status && m.moderation_status !== 'clean');
      setFlaggedMessages(flagged);

      // Fetch moderation actions taken
      const actions = await base44.entities.Notification.filter(
        { type: 'moderation_action' },
        '-created_date',
        50
      );
      setModerationHistory(actions);

      // Analyze user behavior
      const senderMap = {};
      messages.forEach(msg => {
        if (!senderMap[msg.sender_email]) {
          senderMap[msg.sender_email] = {
            name: msg.sender_name,
            messageCount: 0,
            flaggedCount: 0,
            lastActive: msg.created_date,
          };
        }
        senderMap[msg.sender_email].messageCount++;
        if (msg.moderation_status && msg.moderation_status !== 'clean') {
          senderMap[msg.sender_email].flaggedCount++;
        }
        senderMap[msg.sender_email].lastActive = msg.created_date;
      });
      setUserBehavior(senderMap);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load moderation data:', error);
      setLoading(false);
    }
  };

  const handleUserAction = async (userEmail, action) => {
    try {
      await base44.entities.Notification.create({
        recipient_email: userEmail,
        type: 'moderation_action',
        message: `You received a ${action} for violating community guidelines`,
        related_item_type: 'stream',
        related_item_id: streamId,
      });

      // Record action in history
      await base44.entities.Notification.create({
        recipient_email: userEmail,
        type: 'moderation_action',
        message: `Host applied: ${action}`,
        related_item_type: 'stream',
        related_item_id: streamId,
      });

      toast.success(`${action} applied to user`);
      await loadModerationData();
    } catch (error) {
      toast.error('Failed to apply action');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await base44.entities.LiveChat.delete(messageId);
      toast.success('Message deleted');
      await loadModerationData();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const riskUsers = Object.entries(userBehavior)
    .map(([email, data]) => ({
      email,
      ...data,
      riskScore: data.flaggedCount > 0 ? Math.round((data.flaggedCount / data.messageCount) * 100) : 0,
    }))
    .filter(u => u.riskScore > 20)
    .sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="flagged" className="w-full">
        <TabsList className="bg-slate-800/60 border border-slate-700 w-full justify-start">
          <TabsTrigger value="flagged" className="data-[state=active]:bg-red-600 gap-2">
            <AlertTriangle className="w-4 h-4" />
            Flagged ({flaggedMessages.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-orange-600 gap-2">
            <Users className="w-4 h-4" />
            At-Risk Users ({riskUsers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 gap-2">
            <History className="w-4 h-4" />
            History ({moderationHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Flagged Messages */}
        <TabsContent value="flagged" className="space-y-2 mt-4">
          {flaggedMessages.length === 0 ? (
            <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
              <p className="text-slate-400 text-sm">No flagged messages</p>
            </Card>
          ) : (
            flaggedMessages.map(msg => (
              <Card key={msg.id} className="bg-slate-800/60 border-red-500/30 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-white truncate">{msg.sender_name}</p>
                      <Badge className="bg-red-600 text-white text-xs">{msg.moderation_status}</Badge>
                    </div>
                    <p className="text-sm text-slate-300 break-words">{msg.message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-shrink-0 h-8 px-2"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* At-Risk Users */}
        <TabsContent value="users" className="space-y-2 mt-4">
          {riskUsers.length === 0 ? (
            <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
              <p className="text-slate-400 text-sm">No high-risk users</p>
            </Card>
          ) : (
            riskUsers.map(user => (
              <Card key={user.email} className="bg-slate-800/60 border-orange-500/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {user.flaggedCount} of {user.messageCount} messages flagged
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className="bg-orange-600 text-white text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {user.riskScore}% risk
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white h-7 text-xs"
                        onClick={() => handleUserAction(user.email, 'warning')}
                      >
                        Warn
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
                        onClick={() => handleUserAction(user.email, 'tempban')}
                      >
                        Ban
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Moderation History */}
        <TabsContent value="history" className="space-y-2 mt-4">
          {moderationHistory.length === 0 ? (
            <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
              <p className="text-slate-400 text-sm">No moderation actions yet</p>
            </Card>
          ) : (
            moderationHistory.map((action, idx) => (
              <Card key={idx} className="bg-slate-800/60 border-slate-700 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{action.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(action.created_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}