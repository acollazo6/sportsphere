import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ThumbsUp, MessageCircle, Eye, Send, Flag } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import { awardPoints } from "../components/gamification/PointsHelper";

const CATEGORIES = [
  { value: "training_tips", label: "Training Tips", icon: "💪" },
  { value: "workout_plans", label: "Workout Plans", icon: "📋" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "injury_prevention", label: "Injury Prevention", icon: "🩹" },
  { value: "gear_reviews", label: "Gear Reviews", icon: "⚙️" },
  { value: "motivation", label: "Motivation", icon: "🔥" },
  { value: "general_discussion", label: "General Discussion", icon: "💬" },
];

export default function ForumTopic() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const topicId = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: topic } = useQuery({
    queryKey: ["forum", topicId],
    queryFn: async () => {
      const topics = await base44.entities.Forum.filter({ id: topicId });
      if (topics[0]) {
        await base44.entities.Forum.update(topics[0].id, {
          views: (topics[0].views || 0) + 1
        });
      }
      return topics[0];
    },
    enabled: !!topicId,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ["forum-replies", topicId],
    queryFn: () => base44.entities.ForumReply.filter({ forum_id: topicId }, "created_date"),
    enabled: !!topicId,
  });

  const handleLikeTopic = async () => {
    if (!user || !topic) return;
    const likes = topic.likes || [];
    const hasLiked = likes.includes(user.email);
    await base44.entities.Forum.update(topic.id, {
      likes: hasLiked ? likes.filter(e => e !== user.email) : [...likes, user.email]
    });
    queryClient.invalidateQueries({ queryKey: ["forum"] });
  };

  const handleLikeReply = async (reply) => {
    if (!user) return;
    const likes = reply.likes || [];
    const hasLiked = likes.includes(user.email);
    await base44.entities.ForumReply.update(reply.id, {
      likes: hasLiked ? likes.filter(e => e !== user.email) : [...likes, user.email]
    });
    queryClient.invalidateQueries({ queryKey: ["forum-replies"] });
  };

  const handlePostReply = async () => {
    if (!replyContent.trim() || !user) return;

    try {
      await base44.entities.ForumReply.create({
        forum_id: topicId,
        author_email: user.email,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        content: replyContent,
        likes: [],
      });

      await base44.entities.Forum.update(topicId, {
        replies_count: (topic.replies_count || 0) + 1,
        last_activity: new Date().toISOString(),
      });

      if (topic.author_email !== user.email) {
        await base44.entities.Notification.create({
          recipient_email: topic.author_email,
          actor_email: user.email,
          actor_name: user.full_name,
          actor_avatar: user.avatar_url,
          type: "comment",
          message: `replied to your forum topic: ${topic.title}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["forum-replies"] });
      queryClient.invalidateQueries({ queryKey: ["forum"] });
      
      // Award points for forum reply
      await awardPoints(user.email, "FORUM_REPLY");
      
      setReplyContent("");
      toast.success("Reply posted!");
    } catch (error) {
      toast.error("Failed to post reply");
    }
  };

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading topic...</p>
      </div>
    );
  }

  const category = CATEGORIES.find(c => c.value === topic.category) || CATEGORIES[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("Forums")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-900">
        <ArrowLeft className="w-4 h-4" /> Back to Forums
      </Link>

      {/* Topic */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Link to={createPageUrl(`UserProfile?email=${topic.author_email}`)}>
              <Avatar className="w-14 h-14 border-2 border-gray-200">
                <AvatarImage src={topic.author_avatar} />
                <AvatarFallback className="bg-gray-200 text-gray-700">
                  {topic.author_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Link to={createPageUrl(`UserProfile?email=${topic.author_email}`)} className="text-sm font-semibold text-gray-700 hover:text-red-900">
                  {topic.author_name}
                </Link>
                <span className="text-sm text-gray-400">{moment(topic.created_date).fromNow()}</span>
                <Badge className="bg-red-100 text-red-900 text-xs">
                  {category.icon} {category.label}
                </Badge>
                {topic.sport && (
                  <Badge variant="outline" className="text-xs">{topic.sport}</Badge>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{topic.content}</p>
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleLikeTopic}
                  variant="ghost"
                  size="sm"
                  className={user && topic.likes?.includes(user.email) ? "text-red-900" : "text-gray-500"}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {topic.likes?.length || 0}
                </Button>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  {topic.replies_count || 0} replies
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  {topic.views || 0} views
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {user && (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10 border-2 border-gray-200">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gray-200 text-gray-700">
                  {user.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="border-gray-300 resize-none"
                  rows={4}
                />
                <Button
                  onClick={handlePostReply}
                  disabled={!replyContent.trim()}
                  className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </h2>
        {replies.map(reply => (
          <Card key={reply.id} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Link to={createPageUrl(`UserProfile?email=${reply.author_email}`)}>
                  <Avatar className="w-10 h-10 border-2 border-gray-200">
                    <AvatarImage src={reply.author_avatar} />
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      {reply.author_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={createPageUrl(`UserProfile?email=${reply.author_email}`)} className="text-sm font-semibold text-gray-900 hover:text-red-900">
                      {reply.author_name}
                    </Link>
                    <span className="text-sm text-gray-400">{moment(reply.created_date).fromNow()}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{reply.content}</p>
                  <Button
                    onClick={() => handleLikeReply(reply)}
                    variant="ghost"
                    size="sm"
                    className={user && reply.likes?.includes(user.email) ? "text-red-900" : "text-gray-500"}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {reply.likes?.length || 0}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}