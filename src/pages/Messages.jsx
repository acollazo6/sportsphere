import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Loader2, MessageCircle, User, Plus, Search } from "lucide-react";
import NewChatDialog from "../components/messages/NewChatDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const convParam = urlParams.get("conv");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedConv, setSelectedConv] = useState(convParam || null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ["my-conversations", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Conversation.list("-updated_date", 50);
      return all.filter(c => c.participants?.includes(user.email));
    },
    enabled: !!user,
  });

  const { data: messages, isLoading: msgsLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["conv-messages", selectedConv],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedConv }, "created_date", 100),
    enabled: !!selectedConv,
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedConv) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.conversation_id === selectedConv) {
        refetchMessages();
      }
    });
    return unsubscribe;
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations?.find(c => c.id === selectedConv);

  const getOtherName = (conv) => {
    if (!conv || !user) return "Unknown";
    const idx = conv.participants?.indexOf(user.email);
    return conv.participant_names?.[idx === 0 ? 1 : 0] || conv.participants?.find(p => p !== user.email) || "Unknown";
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await base44.entities.Message.create({
      conversation_id: selectedConv,
      sender_email: user.email,
      sender_name: user.full_name,
      content: newMessage,
    });
    await base44.entities.Conversation.update(selectedConv, {
      last_message: newMessage,
      last_message_time: new Date().toISOString(),
      unread_by: selectedConversation.participants.filter(p => p !== user.email),
    });
    setNewMessage("");
    queryClient.invalidateQueries({ queryKey: ["my-conversations"] });
    setSending(false);
  };

  const markAsRead = async () => {
    if (!selectedConversation || !selectedConversation.unread_by?.includes(user.email)) return;
    await base44.entities.Conversation.update(selectedConv, {
      unread_by: selectedConversation.unread_by.filter(e => e !== user.email),
    });
    queryClient.invalidateQueries({ queryKey: ["my-conversations"] });
  };

  useEffect(() => {
    if (selectedConv && selectedConversation) {
      markAsRead();
    }
  }, [selectedConv]);

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : conversations?.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No conversations yet</p>
                </div>
              ) : (
                conversations?.map(conv => (
                  <button
                   key={conv.id}
                   onClick={() => setSelectedConv(conv.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                     selectedConv === conv.id ? "bg-orange-50" : ""
                   }`}
                  >
                   <div className="relative">
                     <Avatar className="w-11 h-11">
                       <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-semibold">
                         {getOtherName(conv)?.[0]?.toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                   </div>
                   <div className="flex-1 min-w-0 text-left">
                     <p className="font-semibold text-sm text-slate-900 truncate">{getOtherName(conv)}</p>
                     <p className="text-xs text-slate-400 truncate">{conv.last_message || "No messages yet"}</p>
                   </div>
                   {conv.unread_by?.includes(user.email) && (
                     <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                   )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!selectedConv ? "hidden md:flex" : "flex"}`}>
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Select a conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                  <button onClick={() => setSelectedConv(null)} className="md:hidden p-1">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-semibold text-sm">
                        {getOtherName(selectedConversation)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{getOtherName(selectedConversation)}</p>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                  <Link 
                    to={createPageUrl("UserProfile") + `?email=${selectedConversation?.participants?.find(p => p !== user.email)}`}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5 text-slate-600" />
                  </Link>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                  ) : (
                    messages?.map(msg => {
                      const isMine = msg.sender_email === user.email;
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && (
                            <Avatar className="w-7 h-7 mt-1">
                              <AvatarFallback className="bg-slate-200 text-xs">{msg.sender_name?.[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col max-w-[75%]">
                            {!isMine && <span className="text-xs text-slate-500 mb-0.5 px-1">{msg.sender_name}</span>}
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              {msg.media_url && (
                                <img src={msg.media_url} alt="" className="mt-2 rounded-lg max-w-full" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                              {moment(msg.created_date).format("h:mm A")}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-orange-200"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}