import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Check, Share2, Twitter, Facebook, MessageCircle, Linkedin, Rss } from "lucide-react";

export default function SocialShareDialog({ open, onClose, title, summary, user }) {
  const [shareText, setShareText] = useState(summary || "");
  const [copied, setCopied] = useState(false);
  const [postingToFeed, setPostingToFeed] = useState(false);

  const appUrl = window.location.origin;
  const shareUrl = `${appUrl}${window.location.pathname}`;

  const encodedText = encodeURIComponent(shareText + "\n\n" + shareUrl);

  const socialLinks = [
    {
      label: "Twitter / X",
      icon: Twitter,
      color: "bg-black hover:bg-gray-800",
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodedText}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const shareToFeed = async () => {
    if (!user) return;
    setPostingToFeed(true);
    try {
      await base44.entities.Post.create({
        author_email: user.email,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        content: shareText,
        category: "training",
      });
      toast.success("Shared to your feed!");
      onClose();
    } catch {
      toast.error("Failed to share to feed");
    } finally {
      setPostingToFeed(false);
    }
  };

  const openSocial = (url) => {
    window.open(url, "_blank", "width=600,height=500");
  };

  // Use native share if available
  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: shareText, url: shareUrl });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Editable message */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium">Your message</p>
            <Textarea
              value={shareText}
              onChange={e => setShareText(e.target.value)}
              className="resize-none text-sm"
              rows={4}
            />
          </div>

          {/* Share to in-app feed */}
          <Button
            onClick={shareToFeed}
            disabled={postingToFeed || !shareText.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white gap-2"
          >
            <Rss className="w-4 h-4" />
            {postingToFeed ? "Posting..." : "Share to SportHub Feed"}
          </Button>

          {/* Copy link */}
          <Button
            variant="outline"
            onClick={copyLink}
            className="w-full gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link & Text"}
          </Button>

          {/* Social buttons */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Share on social media</p>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map(({ label, icon: Icon, color, url }) => (
                <button
                  key={label}
                  onClick={() => openSocial(url)}
                  className={`flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${color}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {typeof navigator.share === "function" && (
            <Button variant="ghost" onClick={nativeShare} className="w-full gap-2 text-slate-600">
              <Share2 className="w-4 h-4" />
              More sharing options
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}