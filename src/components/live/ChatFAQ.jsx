import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ChatFAQ({ streamTitle, streamDescription, isHost }) {
  const [faqs, setFaqs] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [showAddFAQ, setShowAddFAQ] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAddFAQ = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setFaqs([...faqs, { question: newQuestion, answer: newAnswer }]);
    setNewQuestion("");
    setNewAnswer("");
    setShowAddFAQ(false);
    toast.success("FAQ added!");
  };

  const getAIResponse = async () => {
    if (!aiQuestion.trim()) {
      toast.error("Enter a question");
      return;
    }

    setLoadingAI(true);
    try {
      const result = await base44.functions.invoke('analyzeChat', {
        action: 'faq_response',
        question: aiQuestion,
        streamTitle,
        streamDescription,
        faqs
      });

      setAiResponse(result.data?.response || "");
    } catch (error) {
      toast.error("Failed to generate response");
      console.error(error);
    }
    setLoadingAI(false);
  };

  const handleSendAIResponse = async () => {
    if (!aiResponse.trim()) return;
    // In a real scenario, you'd post this to the chat
    setAiQuestion("");
    setAiResponse("");
    toast.success("Response sent to chat!");
  };

  return (
    <div className="space-y-3">
      {/* FAQ Management (Host Only) */}
      {isHost && (
        <div className="border-t border-slate-700 pt-3">
          {!showAddFAQ ? (
            <Button
              onClick={() => setShowAddFAQ(true)}
              variant="outline"
              className="w-full text-xs gap-2"
            >
              <MessageCircle className="w-3 h-3" />
              Add FAQ
            </Button>
          ) : (
            <div className="space-y-2 bg-slate-800 p-2 rounded">
              <Input
                placeholder="Question"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                className="text-xs h-8"
              />
              <Input
                placeholder="Answer"
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                className="text-xs h-8"
              />
              <div className="flex gap-1">
                <Button
                  onClick={handleAddFAQ}
                  size="sm"
                  className="flex-1 text-xs h-7 bg-blue-900 hover:bg-blue-800"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setShowAddFAQ(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-400">Saved FAQs</p>
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-800 p-1.5 rounded text-[10px]">
                  <p className="font-semibold text-slate-300">{faq.question}</p>
                  <p className="text-slate-400 text-[9px]">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI FAQ Response Generator */}
      <div className="border-t border-slate-700 pt-3 space-y-2">
        <p className="text-xs font-bold text-slate-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI FAQ Response
        </p>

        <Input
          placeholder="Viewer question"
          value={aiQuestion}
          onChange={e => setAiQuestion(e.target.value)}
          onKeyPress={e => e.key === "Enter" && getAIResponse()}
          className="text-xs h-8"
        />

        <Button
          onClick={getAIResponse}
          disabled={loadingAI}
          className="w-full text-xs h-8 gap-2 bg-purple-900 hover:bg-purple-800"
        >
          {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generate Response
        </Button>

        {aiResponse && (
          <div className="bg-slate-800 p-2 rounded space-y-2">
            <p className="text-xs text-slate-300 leading-relaxed">{aiResponse}</p>
            {isHost && (
              <Button
                onClick={handleSendAIResponse}
                size="sm"
                className="w-full text-xs h-7 bg-green-900 hover:bg-green-800"
              >
                Send to Chat
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}