import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Track & Field", "Swimming", "Cycling", "CrossFit", "Weightlifting", "Martial Arts", "Other"];

export default function CreateGroupDialog({ open, onOpenChange, user, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: "",
    category: "sport_specific",
    location: "",
    is_public: true,
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setCreating(true);
    try {
      await base44.entities.Group.create({
        ...formData,
        creator_email: user.email,
        admins: [user.email],
        members: [user.email],
      });
      toast.success("Group created successfully!");
      onOpenChange(false);
      setFormData({ name: "", description: "", sport: "", category: "sport_specific", location: "", is_public: true });
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to create group");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Group Name *</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., NYC Basketball League"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's this group about?"
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sport</Label>
              <Select value={formData.sport} onValueChange={sport => setFormData({ ...formData, sport })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={category => setFormData({ ...formData, category })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sport_specific">Sport-Specific</SelectItem>
                  <SelectItem value="training_goal">Training Goal</SelectItem>
                  <SelectItem value="local_community">Local Community</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <Input
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., New York, NY"
              className="rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white"
          >
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}