import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Share2, Play, MoreHorizontal, Bookmark, Flag, AlertTriangle, Star, Eye, Crown, Sparkles, ZoomIn, Trash2 } from "lucide-react";
import SharePostDialog from "../messages/SharePostDialog";
import MediaViewer from "./MediaViewer";
import ContentSummary from "../content/ContentSummary";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import moment from "moment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MentionInput from "./MentionInput";

const categoryIcons = {
  training: "🏋️",
  game: "🏟️",
  coaching: "📋",
  instruction: "📚",
  motivation: "🔥",
  highlight: "⭐",
  other: "💬",
};

export default function PostCard({ post, currentUser, onUpdate }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(post.comments_disabled || false);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Highlight.filter({ user_email: currentUser.email, item_type: "post", item_id: post.id })
      .then(highlights => setIsHighlighted(highlights.length > 0))
      .catch(() => {});
    
    // Track view
    trackView();

    // Check subscription access for premium posts
    if (post.is_premium && post.author_email !== currentUser.email) {
      base44.entities.Subscription.filter({
        subscriber_email: currentUser.email,
        creator_email: post.author_email,
        status: "active"
      }).then(subs => setHasAccess(subs.length > 0));
    } else {
      setHasAccess(true);
    }
  }, [currentUser, post.id]);

  const trackView = async () => {
    if (!currentUser) return;
    const newViews = (post.views || 0) + 1;
    await base44.entities.Post.update(post.id, { views: newViews });
  };

  const handleLike = async () => {
    const newLikes = liked
      ? (post.likes || []).filter(e => e !== currentUser.email)
      : [...(post.likes || []), currentUser.email];
    
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    await base44.entities.Post.update(post.id, { likes: newLikes });
    
    // Create notification
    if (!liked && post.author_email !== currentUser.email) {
      await base44.entities.Notification.create({
        recipient_email: post.author_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "like",
        post_id: post.id,
        message: "liked your post",
      });
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const cmts = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
      setComments(cmts);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    // AI Content moderation for comments
    try {
      const result = await base44.functions.invoke("moderateContent", {
        content_type: "comment",
        content_id: `pending_${Date.now()}`,
        content_text: newComment,
        author_email: currentUser.email,
        author_name: currentUser.full_name,
      });
      if (result?.data?.action === "auto_remove" && result?.data?.severity === "critical") {
        toast.error("Your comment was blocked as it violates community guidelines.");
        return;
      }
      if (result?.data?.action === "flag_for_review") {
        toast.warning("Your comment has been flagged for review before appearing publicly.");
      }
    } catch (e) {
      // moderation error shouldn't block commenting
    }
    
    // Extract mentions (@username)
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentions = [...newComment.matchAll(mentionRegex)].map(m => m[1]);
    
    const comment = await base44.entities.Comment.create({
      post_id: post.id,
      author_email: currentUser.email,
      author_name: currentUser.full_name,
      author_avatar: currentUser.avatar_url,
      content: newComment,
    });
    setComments(prev => [comment, ...prev]);
    setNewComment("");
    await base44.entities.Post.update(post.id, { comments_count: (post.comments_count || 0) + 1 });
    
    // Create notifications
    if (post.author_email !== currentUser.email) {
      await base44.entities.Notification.create({
        recipient_email: post.author_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "comment",
        post_id: post.id,
        comment_id: comment.id,
        message: "commented on your post",
      });
    }
    
    // Notify mentioned users
    if (mentions.length > 0) {
      const allUsers = await base44.entities.User.list();
      for (const mention of mentions) {
        const mentionedUser = allUsers.find(u => u.full_name?.toLowerCase() === mention.toLowerCase());
        if (mentionedUser && mentionedUser.email !== currentUser.email) {
          await base44.entities.Notification.create({
            recipient_email: mentionedUser.email,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name,
            actor_avatar: currentUser.avatar_url,
            type: "mention",
            post_id: post.id,
            comment_id: comment.id,
            message: "mentioned you in a comment",
          });
        }
      }
    }
  };

  const isVideo = (url) => url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video'));

  const submitReport = async () => {
    if (!reportReason) return;
    setSubmittingReport(true);
    await base44.entities.Report.create({
      reporter_email: currentUser.email,
      reported_item_type: "post",
      reported_item_id: post.id,
      reason: reportReason,
      details: reportDetails,
      status: "pending",
    });
    setShowReportDialog(false);
    setReportReason("");
    setReportDetails("");
    setSubmittingReport(false);
    alert("Report submitted. Our team will review it shortly.");
  };

  const toggleHighlight = async () => {
    if (isHighlighted) {
      const highlights = await base44.entities.Highlight.filter({ user_email: currentUser.email, item_type: "post", item_id: post.id });
      if (highlights[0]) {
        await base44.entities.Highlight.delete(highlights[0].id);
        setIsHighlighted(false);
      }
    } else {
      await base44.entities.Highlight.create({
        user_email: currentUser.email,
        item_type: "post",
        item_id: post.id,
        item_data: post,
      });
      setIsHighlighted(true);
    }
  };

  const generateSummary = async () => {
    if (!hasVideoContent()) return;
    
    setGeneratingSummary(true);
    try {
      const summaryPrompt = `Summarize this sports video post in 3-4 concise sentences. Focus on what the video shows, key techniques or moments, and main takeaways.

Title/Content: ${post.content}
Sport: ${post.sport || "General"}
Category: ${post.category || "Unknown"}

Provide a brief, engaging summary that helps viewers decide if they want to watch the video.`;

      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
      });

      await base44.entities.Post.update(post.id, { ai_summary: summary });
      post.ai_summary = summary;
      setShowSummary(true);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const hasVideoContent = () => {
    return post.media_urls?.some(url => isVideo(url));
  };

  return (
    <article className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-cyan-400/20 overflow-hidden shadow-2xl shadow-cyan-400/10 hover:shadow-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-[1.01]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 bg-gradient-to-r from-slate-800/90 to-slate-800/50 backdrop-blur-sm border-b border-cyan-400/10">
        <Link to={createPageUrl("UserProfile") + `?email=${post.author_email}`} className="flex items-center gap-3 group">
          <Avatar className="w-11 h-11 ring-2 ring-cyan-500/30 group-hover:ring-cyan-500/60 transition-all">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
              {post.author_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">{post.author_name || "Anonymous"}</p>
            <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {post.sport && (
            <Badge className="bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg">
              {post.sport}
            </Badge>
          )}
          {post.category && (
            <span className="text-sm">{categoryIcons[post.category]}</span>
          )}
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasVideoContent() && !post.ai_summary && (
                  <DropdownMenuItem onClick={generateSummary} disabled={generatingSummary} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </DropdownMenuItem>
                )}
                {currentUser.email === post.author_email && (
                  <DropdownMenuItem onClick={toggleHighlight} className="gap-2">
                    <Star className={`w-4 h-4 ${isHighlighted ? "fill-amber-500 text-amber-500" : ""}`} />
                    {isHighlighted ? "Remove from" : "Add to"} Highlights
                  </DropdownMenuItem>
                )}
                {currentUser.email === post.author_email && (
                  <DropdownMenuItem onClick={async () => {
                    const newVal = !commentsDisabled;
                    setCommentsDisabled(newVal);
                    await base44.entities.Post.update(post.id, { comments_disabled: newVal });
                    if (newVal) setShowComments(false);
                  }} className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {commentsDisabled ? "Enable Comments" : "Turn Off Comments"}
                  </DropdownMenuItem>
                )}
                {currentUser.email !== post.author_email && (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-red-600 gap-2">
                    <Flag className="w-4 h-4" /> Report Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Premium Badge */}
      {post.is_premium && !hasAccess && (
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Premium Content</span>
          </div>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className={post.is_premium && !hasAccess ? "relative" : ""}>
          {post.is_premium && !hasAccess && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10" />
          )}
          <p className={`px-4 pb-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap ${
            post.is_premium && !hasAccess ? "line-clamp-2 blur-sm" : ""
          }`}>
            {post.content.split(/(@\w+(?:\s+\w+)*)/g).map((part, i) => 
              part.startsWith('@') ? (
                <span key={i} className="text-cyan-400 font-medium">{part}</span>
              ) : (
                part
              )
            )}
          </p>
        </div>
      )}

      {/* AI Analysis for Video Posts */}
      {hasVideoContent() && hasAccess && (
        <div className="px-4 pb-3">
          <ContentSummary content={post} type="post" showButton={!post.ai_summary} />
        </div>
      )}

      {/* Media */}
      {post.media_urls?.length > 0 && hasAccess && (
        <div className="relative bg-black">
          {/* Main media — click to open fullscreen viewer */}
          <div
            className="cursor-pointer group relative"
            onClick={() => { setViewerStartIndex(currentMediaIndex); setViewerOpen(true); }}
          >
            {isVideo(post.media_urls[currentMediaIndex]) ? (
              <div className="relative">
                <video
                  src={post.media_urls[currentMediaIndex]}
                  className="w-full max-h-[420px] object-contain bg-black"
                  onClick={e => e.stopPropagation()}
                  controls
                />
                {/* Click overlay to open viewer (only on non-controls area) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden">
                <img
                  src={post.media_urls[currentMediaIndex]}
                  alt=""
                  className="w-full max-h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="bg-black/0 group-hover:bg-black/40 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multi-image grid for 2+ images */}
          {post.media_urls.length > 1 && (
            <div className="flex gap-1 p-1 bg-black">
              {post.media_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentMediaIndex(i); setViewerStartIndex(i); setViewerOpen(true); }}
                  className={`flex-1 h-12 rounded overflow-hidden border-2 transition-all ${
                    i === currentMediaIndex ? "border-cyan-400" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {isVideo(url) ? (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/60 text-xs">▶</div>
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen viewer */}
      {viewerOpen && post.media_urls?.length > 0 && (
        <MediaViewer
          mediaUrls={post.media_urls}
          startIndex={viewerStartIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-cyan-400/10 bg-gradient-to-r from-slate-800/50 to-slate-800/30">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                liked ? "fill-cyan-400 text-cyan-400 scale-110" : "text-slate-500 group-hover:text-cyan-400"
              }`}
            />
            <span className={`text-sm font-medium ${liked ? "text-cyan-400" : "text-slate-500"}`}>
              {likeCount}
            </span>
          </button>

          <button
            onClick={commentsDisabled ? undefined : loadComments}
            className={`flex items-center gap-1.5 group ${commentsDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
            title={commentsDisabled ? "Comments are turned off" : ""}
          >
            <MessageCircle className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            <span className="text-sm font-medium text-slate-500">{post.comments_count || 0}</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setShowShareDialog(true)}
              className="flex items-center gap-1.5 group"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-slate-500">{post.shares || 0}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Eye className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-500">{post.views || 0}</span>
          </div>


        </div>
        <Bookmark className="w-5 h-5 text-slate-600 hover:text-cyan-400 cursor-pointer transition-colors" />
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-cyan-400/10 p-4 space-y-3 bg-gradient-to-br from-slate-800/30 to-slate-800/20">
          <div className="flex gap-2">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              placeholder="Add a comment... (type @ to mention)"
              className="flex-1 text-sm bg-slate-800/80 text-slate-200 placeholder:text-slate-500 rounded-xl px-4 py-2.5 border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400/40 resize-none min-h-[42px] max-h-[120px]"
            />
            <Button
              onClick={addComment}
              size="sm"
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/30"
            >
              Post
            </Button>
          </div>
          {loadingComments ? (
            <div className="text-center py-4 text-sm text-slate-500">Loading...</div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar className="w-7 h-7 ring-1 ring-cyan-500/20">
                    <AvatarImage src={c.author_avatar} />
                    <AvatarFallback className="text-xs bg-slate-700 text-slate-300">{c.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-3 py-2 flex-1 border border-cyan-400/20">
                    <p className="text-xs font-semibold text-slate-200">{c.author_name}</p>
                    <p className="text-sm text-slate-400">
                      {c.content.split(/(@\w+(?:\s+\w+)*)/g).map((part, i) => 
                        part.startsWith('@') ? (
                          <span key={i} className="text-cyan-400 font-medium">{part}</span>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Post Dialog */}
      {showShareDialog && currentUser && (
        <SharePostDialog
          post={post}
          user={currentUser}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Report Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-slate-500">Help us keep SportHub safe and focused on sports.</p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="politics">Political Content</SelectItem>
                  <SelectItem value="profanity">Profanity / Offensive Language</SelectItem>
                  <SelectItem value="cyberbullying">Cyberbullying</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Additional Details (Optional)</label>
              <Textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                placeholder="Provide more context..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <Button
              onClick={submitReport}
              disabled={!reportReason || submittingReport}
              className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {submittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}