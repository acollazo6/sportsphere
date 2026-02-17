import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, Lightbulb, TrendingUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TRENDING_TOPICS = [
  { label: "Morning workout motivation", prompt: "Write a motivational morning workout post" },
  { label: "Post-game reflection", prompt: "Write a reflective post after a tough game" },
  { label: "Training tip of the day", prompt: "Share a quick training tip for athletes" },
  { label: "Recovery routine", prompt: "Write about the importance of rest and recovery" },
  { label: "Goal setting", prompt: "Write an inspiring post about setting athletic goals" },
  { label: "Team spirit", prompt: "Write a hype post about teamwork and team spirit" },
];

export default function AIPostGenerator({ sport, category, onUseContent }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate"); // generate | trending | ideas

  const generate = async (customPrompt) => {
    const usePrompt = customPrompt || prompt;
    if (!usePrompt.trim()) return;
    setLoading(true);
    setGenerated("");
    const sportContext = sport ? `for ${sport}` : "for sports in general";
    const categoryContext = category ? `in the "${category}" category` : "";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports social media content creator. Write an engaging, authentic social media post ${sportContext} ${categoryContext}.

User's request: "${usePrompt}"

Guidelines:
- Keep it 2-4 sentences max (concise for social media)
- Use 1-3 relevant emojis naturally within the text
- Sound authentic, not corporate or overly promotional
- Focus on sports, training, motivation, or community
- Do NOT use hashtags
- Return ONLY the post text, nothing else`,
    });
    setGenerated(result?.trim() || "");
    setLoading(false);
  };

  const generateIdeas = async () => {
    setLoading(true);
    setGenerated("");
    const sportContext = sport ? `for ${sport}` : "for sports in general";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 5 creative and engaging sports social media post ideas ${sportContext}. 
Format as a numbered list, one idea per line. Each idea should be a single sentence describing what the post would be about. Keep each idea short and punchy.
Return ONLY the numbered list.`,
    });
    setGenerated(result?.trim() || "");
    setLoading(false);
  };

  return (
    <div className="border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-purple-100/50 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-purple-900">AI Post Writer</span>
        <span className="text-xs text-purple-500 mr-1">Generate content with AI</span>
        {open ? <ChevronUp className="w-4 h-4 text-purple-500" /> : <ChevronDown className="w-4 h-4 text-purple-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-purple-200">
          {/* Tabs */}
          <div className="flex gap-1 pt-3">
            {[
              { id: "generate", label: "Generate", icon: Wand2 },
              { id: "trending", label: "Trending", icon: TrendingUp },
              { id: "ideas", label: "Brainstorm", icon: Lightbulb },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setGenerated(""); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-white text-purple-700 hover:bg-purple-100 border border-purple-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Generate tab */}
          {activeTab === "generate" && (
            <div className="space-y-2">
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={`E.g. "Write about hitting a personal best in the gym" or "Motivate my followers after a loss"`}
                className="text-sm bg-white border-purple-200 rounded-xl resize-none min-h-[70px] focus:ring-purple-300"
              />
              <Button
                onClick={() => generate()}
                disabled={loading || !prompt.trim()}
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Writing...</> : <><Wand2 className="w-4 h-4 mr-1" /> Generate Post</>}
              </Button>
            </div>
          )}

          {/* Trending tab */}
          {activeTab === "trending" && (
            <div className="space-y-1.5">
              <p className="text-xs text-purple-600 font-medium">Tap a topic to generate a post:</p>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_TOPICS.map(topic => (
                  <button
                    key={topic.label}
                    onClick={() => { setPrompt(topic.prompt); generate(topic.prompt); }}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-400 transition-colors disabled:opacity-50"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ideas tab */}
          {activeTab === "ideas" && (
            <div className="space-y-2">
              <p className="text-xs text-purple-600">
                Get 5 content ideas{sport ? ` for ${sport}` : ""} to spark your creativity.
              </p>
              <Button
                onClick={generateIdeas}
                disabled={loading}
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Brainstorming...</> : <><Lightbulb className="w-4 h-4 mr-1" /> Get Ideas</>}
              </Button>
            </div>
          )}

          {/* Result */}
          {loading && !generated && (
            <div className="flex items-center gap-2 text-purple-500 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is writing...</span>
            </div>
          )}

          {generated && (
            <div className="bg-white border border-purple-200 rounded-xl p-3 space-y-2">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{generated}</p>
              <div className="flex gap-2 pt-1 border-t border-purple-100">
                {activeTab !== "ideas" && (
                  <Button
                    onClick={() => onUseContent(generated)}
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs h-8"
                  >
                    Use This Post
                  </Button>
                )}
                <Button
                  onClick={() => activeTab === "ideas" ? generateIdeas() : generate()}
                  size="sm"
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl text-xs h-8"
                  disabled={loading}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}