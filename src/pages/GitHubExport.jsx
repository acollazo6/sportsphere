import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Upload, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";

const APP_FILES = [
  { path: "README.md", content: `# SportHub\n\nA sports training and social platform built with React and Base44.\n\n## Features\n- Social feed for athletes and coaches\n- Training plans and session management\n- Live coaching sessions\n- AI-powered coaching assistant\n- Organization/team management\n- Challenges and leaderboards\n- Forums and group discussions\n\n## Tech Stack\n- React 18\n- Tailwind CSS\n- shadcn/ui\n- Base44 Backend (entities, functions, integrations)\n- Recharts, Framer Motion, React Query\n` },
  { path: "ARCHITECTURE.md", content: `# Architecture\n\n## Pages\n- Feed, ForYou, Reels, Discover, Explore\n- Events, Forums, Groups, Challenges\n- LiveCoaching, CoachingSessionDetail\n- Coach (AI Coach), AdminHealth, CreatorAI\n- Analytics, SavedContent, CreatorHub, Premium\n- Leaderboard, Messages, Notifications\n- Advice, Profile, UserProfile\n- OrgDashboard, OrgRoster, OrgMessages, OrgSessions\n- TrainingPlans, TrainingPlanDetail\n- VideoReview, UploadVideo, AthleteInsights\n- MyTraining, ParentView\n- Live, ViewLive\n- CreatePost, Onboarding\n- Terms, Guidelines\n\n## Entities\n- User, Organization, OrgMember, OrgInvite\n- Post, Comment, Follow, Conversation, Message\n- TrainingPlan, TrainingSession, AthleteVideo, AthleteProgress\n- Challenge, ChallengeParticipant, ChallengeUpdate\n- CoachingSession, SessionBooking, SessionMessage\n- LiveStream, LiveChat\n- Forum, ForumReply, Group, GroupPost, GroupReply\n- Event, Notification, NotificationPreferences\n- UserPoints, UserBadge, Highlight, Report\n- CreatorSubscription, Product, Purchase, Transaction\n- Tip, FeedPreferences, SavedContent\n- OrgMessage, StatEntry, AdviceRequest\n- TrainingProgram, SportProfile\n\n## Backend Functions\n- pushToGitHub: Export code to GitHub\n\n## AI Agents\n- support_bot: Customer support agent\n- coach: AI coaching assistant\n` },
];

export default function GitHubExport() {
  const [repoName, setRepoName] = useState("sporthub-app");
  const [description, setDescription] = useState("SportHub - Sports Training & Social Platform");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke("pushToGitHub", {
        repo_name: repoName,
        description,
        files: APP_FILES,
      });
      setResult(response.data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center">
          <Github className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GitHub Export</h1>
          <p className="text-gray-500 text-sm">Push your app documentation & architecture to GitHub</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Repository Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Repository Name</label>
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="sporthub-app"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Repository description"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Files to Push</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {APP_FILES.map((f) => (
              <div key={f.path} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-mono">{f.path}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleExport}
        disabled={loading || !repoName}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Pushing to GitHub...</>
        ) : (
          <><Upload className="w-4 h-4" /> Push to GitHub</>
        )}
      </Button>

      {result && (
        <Card className={`mt-6 border-2 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="pt-5">
            {result.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  Successfully pushed {result.pushed_count} file{result.pushed_count !== 1 ? "s" : ""}!
                </div>
                {result.repo_url && (
                  <a
                    href={result.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {result.repo_url}
                  </a>
                )}
                {result.failed_count > 0 && (
                  <div className="text-sm text-red-600">
                    {result.failed_count} file(s) failed: {result.failed.map(f => f.path).join(", ")}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span>{result.error || "Export failed. Please try again."}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}