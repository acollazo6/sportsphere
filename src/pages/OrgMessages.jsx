import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Loader2 } from "lucide-react";
import ModeratedMessageInput from "@/components/org/ModeratedMessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CHANNELS = [
  { id: "general", label: "# general" },
  { id: "coaches", label: "# coaches" },
  { id: "athletes", label: "# athletes" },
];

export default function OrgMessages() {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [channel, setChannel] = useState("general");

  const bottomRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const orgs = await base44.entities.Organization.filter({ owner_email: u.email });
      if (orgs[0]) { setOrgId(orgs[0].id); setMembership({ role: "admin" }); return; }
      const memberships = await base44.entities.OrgMember.filter({ user_email: u.email });
      if (memberships[0]) { setOrgId(memberships[0].organization_id); setMembership(memberships[0]); }
    }).catch(() => {});
  }, []);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["org-messages", orgId, channel],
    queryFn: () => base44.entities.OrgMessage.filter({ organization_id: orgId, channel }),
    enabled: !!orgId,
    refetchInterval: 5000,
  });

  const sorted = messages?.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sorted.length]);

  const ROLE_COLORS = { admin: "text-red-600", coach: "text-purple-600", athlete: "text-blue-600", parent: "text-pink-600" };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6 text-red-900" /> Team Messages
      </h1>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Channels sidebar */}
        <div className="w-40 shrink-0 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Channels</p>
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => setChannel(ch.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                channel === ch.id ? "bg-red-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : sorted.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No messages yet. Start the conversation!</div>
            ) : sorted.map(msg => {
              const isMe = msg.sender_email === user?.email;
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-xs">
                      {msg.sender_name?.[0] || msg.sender_email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {!isMe && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${ROLE_COLORS[msg.sender_role] || "text-gray-700"}`}>{msg.sender_name || msg.sender_email}</span>
                        <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] py-0">{msg.sender_role}</Badge>
                      </div>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-red-900 text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <ModeratedMessageInput
              placeholder={`Message #${channel}...`}
              onSend={(msg) => {
                const sendIt = async () => {
                  if (!orgId || !user) return;
                  await base44.entities.OrgMessage.create({
                    organization_id: orgId,
                    sender_email: user.email,
                    sender_name: user.full_name,
                    sender_role: membership?.role || "athlete",
                    channel,
                    content: msg,
                  });
                  qc.invalidateQueries(["org-messages", orgId, channel]);
                };
                sendIt();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}