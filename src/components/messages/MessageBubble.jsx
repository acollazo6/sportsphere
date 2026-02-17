import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Languages, ChevronDown, Play } from "lucide-react";
import moment from "moment";

const LANGUAGE_NAMES = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  pt: "Portuguese", zh: "Chinese", ja: "Japanese", ar: "Arabic",
  hi: "Hindi", ru: "Russian", it: "Italian", ko: "Korean",
};

export default function MessageBubble({ msg, isMine, preferredLanguage }) {
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleTranslate = async () => {
    if (translated) {
      setShowOriginal(prev => !prev);
      return;
    }
    setTranslating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following message to ${LANGUAGE_NAMES[preferredLanguage] || "English"}. Return ONLY the translated text, nothing else.\n\nMessage: "${msg.content}"`,
    });
    setTranslated(result);
    setTranslating(false);
  };

  const displayText = translated && !showOriginal ? translated : msg.content;
  const isTranslated = !!translated && !showOriginal;

  return (
    <div className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      {!isMine && (
        <Avatar className="w-7 h-7 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-slate-200 text-xs">{msg.sender_name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col max-w-[75%]">
        {!isMine && <span className="text-xs text-slate-500 mb-0.5 px-1">{msg.sender_name}</span>}
        <div className={`rounded-2xl overflow-hidden ${isMine ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
          {msg.media_url && msg.media_type === "video" ? (
            <video src={msg.media_url} controls className="max-w-[240px] rounded-t-2xl" />
          ) : msg.media_url ? (
            <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
              <img src={msg.media_url} alt="" className="max-w-[240px] rounded-t-2xl block" />
            </a>
          ) : null}
          {displayText && (
            <div className="px-4 py-2.5">
              <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
              {isTranslated && (
                <p className={`text-[10px] mt-1 ${isMine ? "text-slate-400" : "text-slate-400"}`}>
                  Translated · <button onClick={() => setShowOriginal(true)} className="underline">Show original</button>
                </p>
              )}
              {showOriginal && translated && (
                <p className={`text-[10px] mt-1 ${isMine ? "text-slate-400" : "text-slate-400"}`}>
                  Original · <button onClick={() => setShowOriginal(false)} className="underline">Show translation</button>
                </p>
              )}
            </div>
          )}
          {!msg.content && msg.media_url && <div className="pb-1" />}
        </div>

        {/* Translate button (only for text messages) */}
        {msg.content && preferredLanguage && (
          <button
            onClick={handleTranslate}
            disabled={translating}
            className={`flex items-center gap-1 mt-1 text-[10px] px-1 transition-colors ${
              isMine ? "self-end text-slate-500 hover:text-orange-400" : "self-start text-slate-400 hover:text-orange-500"
            }`}
          >
            {translating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Languages className="w-3 h-3" />
            )}
            {translating ? "Translating..." : isTranslated ? "Translated" : `Translate`}
          </button>
        )}

        <span className={`text-[10px] text-slate-400 mt-0.5 px-1 ${isMine ? "self-end" : "self-start"}`}>
          {moment(msg.created_date).format("h:mm A")}
        </span>
      </div>
    </div>
  );
}