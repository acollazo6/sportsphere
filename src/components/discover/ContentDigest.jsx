import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles, Mail, RefreshCw, ChevronRight, Radio, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import moment from "moment";
import { toast } from "sonner";

export default function ContentDigest({ user, followedEmails, interests }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const generateDigest = async () => {
    if (!user) return;
    setLoading(true);
    setDigest(null);

    const [posts, streams, events] = await Promise.all([
      base44.entities.Post.list("-created_date", 50),
      base44.entities.LiveStream.list("-started_at", 20),
      base44.entities.Event.list("-date", 20),
    ]);

    // Filter to followed creators + interests
    const relevantPosts = posts.filter(p =>
      followedEmails?.includes(p.author_email) || interests?.includes(p.sport)
    ).slice(0, 6);

    const relevantStreams = streams.filter(s =>
      followedEmails?.includes(s.host_email) || interests?.includes(s.sport)
    ).slice(0, 4);

    const upcomingEvents = events.filter(e =>
      interests?.includes(e.sport) && new Date(e.date) > new Date()
    ).slice(0, 3);

    const prompt = `You are a sports content curator. Create a personalized weekly digest email for a sports fan.

User interests: ${interests?.join(", ") || "General sports"}
Following ${followedEmails?.length || 0} creators

Recent content from their network:
Posts: ${relevantPosts.map(p => `"${p.content?.slice(0, 60)}" by ${p.author_name} (${p.sport})`).join("; ")}
Streams: ${relevantStreams.map(s => `"${s.title}" by ${s.host_name} (${s.sport}, ${s.status})`).join("; ")}
Events: ${upcomingEvents.map(e => `"${e.title}" on ${moment(e.date).format("MMM D")}`).join("; ")}

Write an engaging, concise weekly digest with:
1. A punchy headline (max 10 words)
2. A brief intro (1-2 sentences, enthusiastic)
3. 2-3 "highlights" items (each: title, short description 1 sentence)
4. A motivational closing line

Return JSON:
{
  "headline": string,
  "intro": string,
  "highlights": [{"title": string, "description": string, "type": "post"|"stream"|"event"}],
  "closing": string
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          intro: { type: "string" },
          highlights: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, type: { type: "string" } } } },
          closing: { type: "string" }
        }
      }
    });

    setDigest({ ...result, posts: relevantPosts, streams: relevantStreams, events: upcomingEvents });
    setLoading(false);
  };

  const sendEmail = async () => {
    if (!digest || !user) return;
    const body = `
<h1 style="color:#7f1d1d">${digest.headline}</h1>
<p>${digest.intro}</p>
<h2>This Week's Highlights</h2>
<ul>
${digest.highlights.map(h => `<li><strong>${h.title}</strong> — ${h.description}</li>`).join("")}
</ul>
<p><em>${digest.closing}</em></p>
<hr/>
<p style="font-size:12px;color:#666">SportHub · <a href="#">Manage preferences</a></p>
    `;
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `🔥 Your SportHub Digest: ${digest.headline}`,
      body,
    });
    toast.success("Digest sent to your email! 📬");
    setSent(true);
  };

  const typeIcon = (type) => {
    if (type === "stream") return <Radio className="w-3.5 h-3.5 text-red-500" />;
    if (type === "event") return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
    return <FileText className="w-3.5 h-3.5 text-purple-500" />;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-cyan-400" />
          <h3 className="font-black text-white">Your Weekly Digest</h3>
        </div>
        <Button
          onClick={generateDigest}
          disabled={loading}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl gap-1.5 font-bold text-xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {digest ? "Regenerate" : "Generate Digest"}
        </Button>
      </div>

      {!digest && !loading && (
        <div className="p-6 text-center">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Generate your personalized digest based on followed creators & interests</p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Curating your digest...</p>
        </div>
      )}

      {digest && !loading && (
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-black text-white mb-1">{digest.headline}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{digest.intro}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Week's Highlights</p>
            {digest.highlights?.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl">
                <div className="mt-0.5 flex-shrink-0">{typeIcon(h.type)}</div>
                <div>
                  <p className="text-sm font-bold text-white">{h.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent posts from followed */}
          {digest.posts?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Your Network</p>
              {digest.posts.slice(0, 3).map(post => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-xl">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src={post.author_avatar} />
                    <AvatarFallback className="text-[10px] bg-slate-700 text-slate-300">{post.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-semibold truncate">{post.author_name}</p>
                    <p className="text-xs text-slate-400 truncate">{post.content?.slice(0, 60)}...</p>
                  </div>
                  {post.sport && <Badge className="bg-slate-700 text-slate-300 text-[10px] px-1.5">{post.sport}</Badge>}
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-cyan-400 italic border-t border-slate-700 pt-3">{digest.closing}</p>

          <div className="flex gap-2">
            <Button
              onClick={sendEmail}
              disabled={sent}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold gap-2"
              size="sm"
            >
              {sent ? "✓ Sent!" : <><Mail className="w-3.5 h-3.5" /> Send to My Email</>}
            </Button>
            <Button
              onClick={generateDigest}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-400 hover:text-white rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}