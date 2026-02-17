import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function NewChatDialog({ user, onSelectConversation, onClose }) {
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all-sport-profiles-chat"],
    queryFn: () => base44.entities.SportProfile.list("-created_date", 200),
  });

  // Deduplicate by user_email, exclude self
  const seen = new Set();
  const users = (profiles || []).filter(p => {
    if (p.user_email === user.email || seen.has(p.user_email)) return false;
    seen.add(p.user_email);
    return true;
  });

  const filtered = search.trim()
    ? users.filter(p =>
        p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        p.sport?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const startChat = async (profile) => {
    // Check for existing conversation
    const existing = await base44.entities.Conversation.list("-updated_date", 50);
    const found = existing.find(c =>
      c.participants?.includes(user.email) && c.participants?.includes(profile.user_email)
    );
    if (found) {
      onSelectConversation(found.id);
    } else {
      const conv = await base44.entities.Conversation.create({
        participants: [user.email, profile.user_email],
        participant_names: [user.full_name, profile.user_name || profile.user_email],
        participant_avatars: [user.avatar_url || "", profile.avatar_url || ""],
      });
      onSelectConversation(conv.id);
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            New Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or sport..."
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 -mx-2 px-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No users found</p>
            ) : (
              filtered.map(profile => (
                <button
                  key={profile.user_email}
                  onClick={() => startChat(profile)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-bold">
                      {profile.user_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{profile.user_name || profile.user_email}</p>
                    <p className="text-xs text-slate-400 truncate">{profile.sport} · {profile.level}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}