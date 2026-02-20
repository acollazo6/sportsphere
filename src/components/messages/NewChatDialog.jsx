import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, MessageCircle, Users, X, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function NewChatDialog({ user, onSelectConversation, onClose }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]); // array of profile objects
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState("dm"); // "dm" | "group"
  const [groupName, setGroupName] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all-sport-profiles-chat"],
    queryFn: () => base44.entities.SportProfile.list("-created_date", 200),
  });

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

  const toggleSelect = (profile) => {
    setSelected(prev => {
      const exists = prev.find(p => p.user_email === profile.user_email);
      if (exists) return prev.filter(p => p.user_email !== profile.user_email);
      if (mode === "dm") return [profile]; // DM: only one
      return [...prev, profile];
    });
  };

  const startChat = async () => {
    if (selected.length === 0) return;
    setCreating(true);

    const participants = [user.email, ...selected.map(p => p.user_email)];
    const participantNames = [user.full_name || user.email, ...selected.map(p => p.user_name || p.user_email)];
    const participantAvatars = [user.avatar_url || "", ...selected.map(p => p.avatar_url || "")];

    // For DM, check for existing conversation
    if (selected.length === 1) {
      const existing = await base44.entities.Conversation.list("-updated_date", 50);
      const found = existing.find(c =>
        c.participants?.includes(user.email) && c.participants?.includes(selected[0].user_email) && c.participants?.length === 2
      );
      if (found) {
        onSelectConversation(found.id);
        onClose();
        return;
      }
    }

    const conv = await base44.entities.Conversation.create({
      participants,
      participant_names: participantNames,
      participant_avatars: participantAvatars,
      group_name: selected.length > 1 ? (groupName.trim() || participantNames.slice(1).join(", ")) : undefined,
      is_group: selected.length > 1,
    });

    onSelectConversation(conv.id);
    setCreating(false);
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

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("dm"); setSelected(prev => prev.slice(0, 1)); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "dm" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Direct Message
          </button>
          <button
            onClick={() => setMode("group")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "group" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-4 h-4" /> Group Chat
          </button>
        </div>

        {/* Group name */}
        {mode === "group" && (
          <Input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name (optional)"
            className="rounded-xl"
          />
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(p => (
              <div key={p.user_email} className="flex items-center gap-1 bg-orange-100 text-orange-700 rounded-full px-2.5 py-1 text-xs font-medium">
                {p.user_name || p.user_email}
                <button onClick={() => toggleSelect(p)}><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

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

        <div className="max-h-64 overflow-y-auto space-y-1 -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No users found</p>
          ) : (
            filtered.map(profile => {
              const isSelected = selected.some(p => p.user_email === profile.user_email);
              return (
                <button
                  key={profile.user_email}
                  onClick={() => toggleSelect(profile)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50"
                  }`}
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
                  {isSelected && <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <Button
          onClick={startChat}
          disabled={selected.length === 0 || creating}
          className="w-full rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            selected.length > 1 ? `Create Group (${selected.length} people)` : "Start Chat"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}