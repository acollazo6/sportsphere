import React, { useRef, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Pin, AlertTriangle } from "lucide-react";
import moment from "moment";
import ChatModeration from "./ChatModeration";
import ChatFAQ from "./ChatFAQ";
import ModerationSuggestions from "./ModerationSuggestions";
import ModerationDashboard from "./ModerationDashboard";

export default function StreamChat({ messages, user, isHost, message, setMessage, onSend, onPin, streamTitle = "", streamDescription = "", streamId = "" }) {
  const [chatTab, setChatTab] = useState("messages");
  const [moderationAction, setModerationAction] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const pinnedMessages = messages?.filter(m => m.is_pinned) || [];
  const regularMessages = messages?.filter(m => !m.is_pinned) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-200 overflow-x-auto">
        {[
          { key: "messages", label: "Chat" },
          { key: "moderation", label: "Moderation", hidden: !isHost },
          { key: "dashboard", label: "Dashboard", hidden: !isHost },
          { key: "faq", label: "FAQ" }
        ]
          .filter(tab => !tab.hidden)
          .map(tab => (
            <button
              key={tab.key}
              onClick={() => setChatTab(tab.key)}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                chatTab === tab.key
                  ? "border-red-600 text-slate-800"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Messages Tab */}
      {chatTab === "messages" && (
        <>
          {/* Pinned messages */}
          {pinnedMessages.length > 0 && (
            <div className="px-4 pt-3 space-y-2">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                  <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-800">{msg.sender_name}</p>
                    <p className="text-xs text-amber-900 break-words">{msg.message}</p>
                  </div>
                  {isHost && (
                    <button onClick={() => onPin(msg)} className="text-amber-400 hover:text-amber-600">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {regularMessages.length === 0 && pinnedMessages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-slate-400 text-sm">No messages yet. Start the chat!</p>
              </div>
            )}

            {regularMessages.map(msg => {
              const isMe = msg.sender_email === user?.email;
              const isHostMsg = msg.sender_email === msg.host_email;
              return (
                <div key={msg.id} className="flex items-start gap-2 group hover:bg-slate-50 rounded-xl p-1.5 transition-colors">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src={msg.sender_avatar} />
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-purple-200 to-pink-200 font-bold">
                      {msg.sender_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className={`font-bold text-xs truncate ${isMe ? "text-red-700" : "text-slate-800"}`}>
                        {msg.sender_name}
                        {msg.is_host_tag && (
                          <Badge className="ml-1 bg-red-600 text-white text-[9px] px-1 py-0">Host</Badge>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 flex-shrink-0">{moment(msg.created_date).fromNow(true)}</p>
                    </div>
                    <p className="text-sm text-slate-700 break-words leading-snug">{msg.message}</p>
                  </div>
                  {isHost && (
                    <button
                      onClick={() => onPin(msg)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-500 transition-all flex-shrink-0"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </>
      )}

      {/* Moderation Tab */}
      {chatTab === "moderation" && isHost && (
        <div className="flex-1 overflow-y-auto p-4">
          <ChatModeration messages={messages} streamId={""} isHost={isHost} />
        </div>
      )}

      {/* FAQ Tab */}
      {chatTab === "faq" && (
        <div className="flex-1 overflow-y-auto p-4">
          <ChatFAQ streamTitle={streamTitle} streamDescription={streamDescription} isHost={isHost} />
        </div>
      )}

      {/* Input */}
      {user ? (
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSend()}
              placeholder="Say something..."
              className="rounded-xl text-sm h-9 border-slate-200"
            />
            <Button
              onClick={onSend}
              disabled={!message.trim()}
              className="bg-red-600 hover:bg-red-700 rounded-xl px-3 h-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Log in to chat</p>
        </div>
      )}
    </div>
  );
}