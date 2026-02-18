import React, { useState } from "base44";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ModeratedMessageInput({ onSend, placeholder = "Type a message..." }) {
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setChecking(true);
    setFlagged(false);

    // AI moderation check
    const moderationResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a content moderation system for a sports training platform used by athletes (including minors), coaches, and parents.

Analyze this message for policy violations:
"${text}"

Check for: harassment, hate speech, bullying, inappropriate sexual content, threats, severe profanity, or content inappropriate for minors.
Normal sports slang and mild frustration are OK.`,
      response_json_schema: {
        type: "object",
        properties: {
          flagged: { type: "boolean" },
          reason: { type: "string" },
          severity: { type: "string", enum: ["none", "low", "medium", "high"] }
        }
      }
    });

    setChecking(false);

    if (moderationResult.flagged && moderationResult.severity !== "low") {
      setFlagged(true);
      return;
    }

    onSend(text.trim());
    setText("");
    setFlagged(false);
  };

  return (
    <div className="space-y-2">
      {flagged && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Your message may violate community guidelines. Please revise before sending.
          <button onClick={() => setFlagged(false)} className="ml-auto text-red-400 hover:text-red-600 font-bold">Dismiss</button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={e => { setText(e.target.value); setFlagged(false); }}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={placeholder}
          className="rounded-xl flex-1"
          disabled={checking}
        />
        <Button onClick={handleSend} disabled={checking || !text.trim()} className="bg-red-900 hover:bg-red-800 text-white rounded-xl px-4">
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}