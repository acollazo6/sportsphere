import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreatePostDialog({ open, onOpenChange, groupId, user, onSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setCreating(true);
    try {
      await base44.entities.GroupPost.create({
        group_id: groupId,
        author_email: user.email,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        title,
        content,
        likes: [],
        replies_count: 0,
      });
      toast.success("Discussion posted!");
      onOpenChange(false);
      setTitle("");
      setContent("");
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to post");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Start a Discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title (Optional)</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's this about?"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share your thoughts, ask a question..."
              className="rounded-xl resize-none"
              rows={5}
            />
          </div>

          <Button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-slate-900"
          >
            {creating ? "Posting..." : "Post Discussion"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}