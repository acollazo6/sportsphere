import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ChatModeration({ messages, streamId, isHost }) {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [safetyScore, setSafetyScore] = useState(100);

  useEffect(() => {
    if (!isHost || messages.length < 5) return;

    const analyzeChatDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await base44.functions.invoke('analyzeChat', {
          action: 'moderate',
          messages: messages.map(m => ({
            id: m.id,
            message: m.message,
            sender_name: m.sender_name
          }))
        });

        setFlaggedMessages(result.data?.flagged_messages || []);
        setSafetyScore(result.data?.overall_safety_score || 100);
      } catch (error) {
        console.error('Chat analysis error:', error);
      }
      setLoading(false);
    }, 3000); // Wait 3s after new messages before analyzing

    return () => clearTimeout(analyzeChatDebounce);
  }, [messages, isHost]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await base44.entities.LiveChat.delete(messageId);
      setFlaggedMessages(f => f.filter(m => m.message_id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  if (!isHost || flaggedMessages.length === 0) return null;

  return (
    <div className="border-t border-slate-700 pt-3 mt-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-blue-400" />
        <p className="text-xs font-bold text-blue-400">Moderation ({flaggedMessages.length})</p>
        <Badge className={`text-xs ${safetyScore > 70 ? 'bg-green-900 text-green-300' : safetyScore > 40 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
          {safetyScore}% Safe
        </Badge>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {flaggedMessages.map((flag, idx) => (
          <div key={idx} className={`p-2 rounded-lg border ${flag.severity === 'high' ? 'border-red-600 bg-red-900/20' : flag.severity === 'medium' ? 'border-yellow-600 bg-yellow-900/20' : 'border-orange-600 bg-orange-900/20'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-300 truncate">{flag.reason}</p>
                <Badge variant="outline" className="text-[10px] mt-1">{flag.severity}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteMessage(flag.message_id)}
                className="w-6 h-6 p-0 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}