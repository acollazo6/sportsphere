import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Loader2, MessageCircle, User, Plus, Search, ImagePlus, X, Play, Languages, Users } from "lucide-react";
import NewChatDialog from "../components/messages/NewChatDialog";
import MessageBubble from "../components/messages/MessageBubble";
import VoiceRecorder from "../components/messages/VoiceRecorder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" }, { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" }, { code: "de", label: "🇩🇪 Deutsch" },
  { code: "pt", label: "🇧🇷 Português" }, { code: "zh", label: "🇨🇳 中文" },
  { code: "ja", label: "🇯🇵 日本語" }, { code: "ar", label: "🇸🇦 العربية" },
  { code: "hi", label: "🇮🇳 हिन्दी" }, { code: "ru", label: "🇷🇺 Русский" },
  { code: "it", label: "🇮🇹 Italiano" }, { code: "ko", label: "🇰🇷 한국어" },
];

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const convParam = urlParams.get("conv");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedConv, setSelectedConv] = useState(convParam || null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState(() => localStorage.getItem("msg_lang") || "en");
  const [isTyping, setIsTyping] = useState(false); // current user is typing
  const [typingUsers, setTypingUsers] = useState([]); // other users typing
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConv) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === selectedConv) {
        refetchMessages();
        // Mark as read when new message arrives
        if (event.data.sender_email !== user?.email) {
          base44.entities.Message.update(event.id, {
            read_by: [...(event.data.read_by || []), user?.email].filter((v, i, a) => a.indexOf(v) === i),
          });
        }
      }
    });
    return unsubscribe;
  }, [selectedConv, user]);

  // Real-time typing indicators
  useEffect(() => {
    if (!selectedConv || !user) return;
    const unsubscribe = base44.entities.TypingIndicator.subscribe((event) => {
      if (event.data?.conversation_id === selectedConv && event.data?.user_email !== user.email) {
        if (event.type === "delete") {
          setTypingUsers(prev => prev.filter(e => e !== event.data.user_email));
        } else {
          const updatedAt = new Date(event.data.updated_at);
          const age = Date.now() - updatedAt.getTime();
          if (age < 5000) {
            setTypingUsers(prev => [...new Set([...prev, event.data.user_email])]);
            // Remove after 5s
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(e => e !== event.data.user_email));
            }, 5000);
          }
        }
      }
    });
    return unsubscribe;
  }, [selectedConv, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations?.find(c => c.id === selectedConv);

  const getOtherName = (conv) => {
    if (!conv || !user) return "Unknown";
    const idx = conv.participants?.indexOf(user.email);
    return conv.participant_names?.[idx === 0 ? 1 : 0] || conv.participants?.find(p => p !== user.email) || "Unknown";
  };

  const getOtherAvatar = (conv) => {
    if (!conv || !user) return "";
    const idx = conv.participants?.indexOf(user.email);
    return conv.participant_avatars?.[idx === 0 ? 1 : 0] || "";
  };

  const filteredConversations = conversations?.filter(conv => {
    if (!convSearch.trim()) return true;
    return getOtherName(conv)?.toLowerCase().includes(convSearch.toLowerCase());
  });

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !mediaFile) || sending) return;
    setSending(true);
    let media_url = null;
    if (mediaFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      media_url = file_url;
    }
    await base44.entities.Message.create({
      conversation_id: selectedConv,
      sender_email: user.email,
      sender_name: user.full_name,
      content: newMessage,
      media_url,
      media_type: mediaType,
    });
    const lastMsg = media_url ? (newMessage.trim() ? newMessage : `📎 ${mediaType === "video" ? "Video" : "Image"}`) : newMessage;
    await base44.entities.Conversation.update(selectedConv, {
      last_message: lastMsg,
      last_message_time: new Date().toISOString(),
      unread_by: selectedConversation.participants.filter(p => p !== user.email),
    });
    setNewMessage("");
    clearMedia();
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
    {showNewChat && (
      <NewChatDialog
        user={user}
        onSelectConversation={(convId) => { setSelectedConv(convId); queryClient.invalidateQueries({ queryKey: ["my-conversations"] }); }}
        onClose={() => setShowNewChat(false)}
      />
    )}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Messages</h2>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                  title="New message"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  value={convSearch}
                  onChange={e => setConvSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : filteredConversations?.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">
                    {conversations?.length === 0 ? "No conversations yet" : "No results found"}
                  </p>
                  {conversations?.length === 0 && (
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Start a new chat
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations?.map(conv => (
                  <button
                   key={conv.id}
                   onClick={() => setSelectedConv(conv.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                     selectedConv === conv.id ? "bg-orange-50 border-orange-100" : ""
                   }`}
                  >
                   <div className="relative flex-shrink-0">
                     <Avatar className="w-11 h-11">
                       <AvatarImage src={getOtherAvatar(conv)} />
                       <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-semibold">
                         {getOtherName(conv)?.[0]?.toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                   </div>
                   <div className="flex-1 min-w-0 text-left">
                     <div className="flex items-center justify-between">
                       <p className="font-semibold text-sm text-slate-900 truncate">{getOtherName(conv)}</p>
                       {conv.last_message_time && (
                         <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                           {moment(conv.last_message_time).fromNow()}
                         </span>
                       )}
                     </div>
                     <p className="text-xs text-slate-400 truncate">{conv.last_message || "No messages yet"}</p>
                   </div>
                   {conv.unread_by?.includes(user.email) && (
                     <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0" />
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
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={getOtherAvatar(selectedConversation)} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-semibold text-sm">
                      {getOtherName(selectedConversation)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{getOtherName(selectedConversation)}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Languages className="w-3 h-3" /> AI translation active</p>
                  </div>
                  <Select value={preferredLanguage} onValueChange={(v) => { setPreferredLanguage(v); localStorage.setItem("msg_lang", v); }}>
                    <SelectTrigger className="w-32 h-8 text-xs rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code} className="text-xs">{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    messages?.map(msg => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isMine={msg.sender_email === user.email}
                        preferredLanguage={preferredLanguage}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100 space-y-2">
                  {/* Media preview */}
                  {mediaPreview && (
                    <div className="relative inline-block">
                      {mediaType === "video" ? (
                        <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-slate-900">
                          <video src={mediaPreview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white opacity-80" />
                          </div>
                        </div>
                      ) : (
                        <img src={mediaPreview} alt="preview" className="w-32 h-20 object-cover rounded-xl" />
                      )}
                      <button
                        onClick={clearMedia}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                      title="Attach image or video"
                    >
                      <ImagePlus className="w-5 h-5" />
                    </button>
                    <VoiceRecorder
                      onTranscribed={(text) => setNewMessage(prev => prev ? prev + " " + text : text)}
                      disabled={sending}
                    />
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type or record a message..."
                      className="flex-1 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-orange-200"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !mediaFile) || sending}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 flex-shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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