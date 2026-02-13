import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, Loader2, Plus, MessageSquare, Video, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CoachPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const messagesEndRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    base44.agents.listConversations({ agent_name: "coach" }).then(convos => {
      setConversations(convos);
      if (convos.length > 0 && !currentConversation) {
        loadConversation(convos[0].id);
      }
    }).catch(err => {
      console.error("Failed to load conversations:", err);
    });
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentConversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
      setMessages(data.messages);
    });
    return unsubscribe;
  }, [currentConversation?.id]);

  const loadConversation = async (convId) => {
    const conv = await base44.agents.getConversation(convId);
    setCurrentConversation(conv);
    setMessages(conv.messages || []);
  };

  const createNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "coach",
      metadata: {
        name: "New Coaching Session",
        description: "AI Coach conversation",
      },
    });
    setConversations([conv, ...conversations]);
    setCurrentConversation(conv);
    setMessages([]);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !videoFile) || !currentConversation) return;
    setSending(true);
    try {
      const messageData = {
        role: "user",
        content: input || "Please analyze this video and provide feedback on technique and form.",
      };

      if (videoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
        messageData.file_urls = [file_url];
      }

      await base44.agents.addMessage(currentConversation, messageData);
      setInput("");
      setVideoFile(null);
      setVideoPreview(null);
    } catch (err) {
      toast.error("Failed to send message");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50MB");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Coach</h1>
              <p className="text-sm text-slate-500">Personalized training insights & guidance</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar - Conversations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 h-fit lg:sticky lg:top-4">
            <Button onClick={createNewConversation} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white mb-3 gap-2">
              <Plus className="w-4 h-4" />
              New Session
            </Button>
            <div className="space-y-1">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    currentConversation?.id === conv.id
                      ? "bg-orange-50 text-orange-700"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium truncate">
                      {conv.metadata?.name || "Coaching Session"}
                    </span>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">No sessions yet</p>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
            {currentConversation ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to level up your training?</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Ask me to analyze your stats, create a custom training plan, upload a video for technique analysis, or get advice on improving your performance!
                      </p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-sm">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                       msg.role === "user"
                         ? "bg-slate-900 text-white"
                         : "bg-slate-50 text-slate-800"
                      }`}>
                       {msg.role === "user" ? (
                         <>
                           {msg.file_urls && msg.file_urls.length > 0 && (
                             <div className="mb-2">
                               {msg.file_urls.map((url, i) => (
                                 <video
                                   key={i}
                                   src={url}
                                   controls
                                   className="rounded-lg max-w-full mb-2"
                                   style={{ maxHeight: "200px" }}
                                 />
                               ))}
                             </div>
                           )}
                           <p className="text-sm leading-relaxed">{msg.content}</p>
                         </>
                       ) : (
                          <ReactMarkdown
                            className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="ml-4 mb-2 list-disc">{children}</ul>,
                              ol: ({ children }) => <ol className="ml-4 mb-2 list-decimal">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-orange-600">{children}</strong>,
                              h3: ({ children }) => <h3 className="font-semibold text-base mb-2 mt-3 first:mt-0">{children}</h3>,
                              code: ({ children }) => <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100">
                  {videoPreview && (
                    <div className="mb-3 relative inline-block">
                      <video
                        src={videoPreview}
                        controls
                        className="rounded-lg border border-slate-200"
                        style={{ maxHeight: "120px", maxWidth: "200px" }}
                      />
                      <button
                        onClick={removeVideo}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={videoFile ? "Add a note about this video (optional)..." : "Ask about your performance, request a training plan, upload a video for analysis..."}
                        className="rounded-xl resize-none min-h-[50px] max-h-[120px]"
                        rows={2}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                      <Button
                        onClick={() => videoInputRef.current?.click()}
                        variant="outline"
                        className="rounded-xl"
                        disabled={sending}
                      >
                        <Video className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={sendMessage}
                        disabled={(!input.trim() && !videoFile) || sending}
                        className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white"
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">Start a new coaching session</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}