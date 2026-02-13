import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreateEventDialog({ open, onOpenChange, groupId, user, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    max_attendees: "",
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.error("Please fill in required fields");
      return;
    }

    setCreating(true);
    try {
      await base44.entities.Event.create({
        group_id: groupId,
        creator_email: user.email,
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        attendees: [user.email],
      });
      toast.success("Event created!");
      onOpenChange(false);
      setFormData({ title: "", description: "", date: "", location: "", max_attendees: "" });
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to create event");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Event Title *</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Weekend Pickup Game"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event details..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Where will this take place?"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Max Attendees (Optional)</Label>
            <Input
              type="number"
              value={formData.max_attendees}
              onChange={e => setFormData({ ...formData, max_attendees: e.target.value })}
              placeholder="Leave empty for unlimited"
              className="rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-slate-900"
          >
            {creating ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}