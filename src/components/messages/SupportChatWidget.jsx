import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

export default function SupportChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  const openChat = async () => {
    setOpen(true);
    if (conversation) return;
    const convo = await base44.agents.createConversation({
      agent_name: "support_bot",
      metadata: { name: "SportHub Support" },
    });
    setMessages(convo.messages || []);
    setConversation(convo);
    // Send a welcome prompt
    await base44.agents.addMessage(convo, {
      role: "user",
      content: "__init__",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  // Filter out the hidden init message
  const visibleMessages = messages.filter(m => !(m.role === "user" && m.content === "__init__"));

  return (
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={openChat}
          className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-50 w-14 h-14 bg-gradient-to-br from-red-900 to-red-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          title="SportHub Support"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" style={{ maxHeight: "520px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">SportHub Support</p>
              <p className="text-xs text-red-200">AI-powered · always here</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: "320px", maxHeight: "380px" }}>
            {visibleMessages.length === 0 && (
              <div className="text-center text-gray-400 text-sm pt-8">
                <Bot className="w-10 h-10 mx-auto mb-2 text-red-200" />
                <p className="font-medium text-gray-600">Hi! I'm your SportHub assistant.</p>
                <p className="text-xs mt-1">Ask me anything about features, troubleshooting, or how to use the app!</p>
              </div>
            )}
            {visibleMessages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-red-800" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isUser
                      ? "bg-red-900 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}>
                    {isUser ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-red-800" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestion chips */}
          {visibleMessages.length <= 1 && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t bg-white">
              {["How do I share media?", "Translation not working", "Voice to text help", "Report a user"].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t bg-white">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask anything..."
              className="flex-1 rounded-xl text-sm h-9"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending || !conversation}
              size="icon"
              className="h-9 w-9 rounded-xl bg-red-900 hover:bg-red-800 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}