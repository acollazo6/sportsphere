import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SharePostDialog({ post, user, onClose }) {
  const [sending, setSending] = useState(null); // convId being sent to

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["my-conversations", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Conversation.list("-updated_date", 50);
      return all.filter(c => c.participants?.includes(user.email));
    },
    enabled: !!user,
  });

  const getOtherName = (conv) => {
    if (conv.is_group) return conv.group_name || "Group Chat";
    const idx = conv.participants?.indexOf(user.email);
    return conv.participant_names?.[idx === 0 ? 1 : 0] || "Unknown";
  };

  const getOtherAvatar = (conv) => {
    if (conv.is_group) return "";
    const idx = conv.participants?.indexOf(user.email);
    return conv.participant_avatars?.[idx === 0 ? 1 : 0] || "";
  };

  const shareToConv = async (conv) => {
    setSending(conv.id);
    await base44.entities.Message.create({
      conversation_id: conv.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: "",
      shared_post_id: post.id,
      shared_post_data: {
        id: post.id,
        content: post.content,
        author_name: post.author_name,
        media_urls: post.media_urls,
        sport: post.sport,
      },
    });
    await base44.entities.Conversation.update(conv.id, {
      last_message: `📎 Shared a post`,
      last_message_time: new Date().toISOString(),
      unread_by: conv.participants.filter(p => p !== user.email),
    });
    setSending(null);
    toast.success("Post shared!");
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            Share Post
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : !conversations?.length ? (
            <p className="text-center text-slate-400 py-8 text-sm">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <div key={conv.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={getOtherAvatar(conv)} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-bold text-sm">
                    {getOtherName(conv)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="flex-1 font-semibold text-sm text-slate-900 truncate">{getOtherName(conv)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareToConv(conv)}
                  disabled={!!sending}
                  className="rounded-xl flex-shrink-0"
                >
                  {sending === conv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}