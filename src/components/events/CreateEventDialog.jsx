import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Golf", "Swimming", "Boxing", "MMA", "Track", "Volleyball", "Hockey", "Cycling", "Yoga", "CrossFit", "Other"];
const EVENT_TYPES = [
  { value: "competition", label: "Competition 🏆" },
  { value: "workshop", label: "Workshop 📚" },
  { value: "meetup", label: "Meetup 👥" },
  { value: "training", label: "Training 💪" },
  { value: "tournament", label: "Tournament 🥇" },
  { value: "other", label: "Other 📅" },
];

export default function CreateEventDialog({ open, onOpenChange, currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "",
    sport: "",
    date: "",
    time: "",
    end_date: "",
    end_time: "",
    location: "",
    city: "",
    country: "",
    is_virtual: false,
    meeting_link: "",
    max_attendees: "",
    price: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [creating, setCreating] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.event_type || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);

    let imageUrl = "";
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }

    const startDateTime = `${formData.date}T${formData.time}`;
    const endDateTime = formData.end_date && formData.end_time 
      ? `${formData.end_date}T${formData.end_time}`
      : null;

    await base44.entities.Event.create({
      creator_email: currentUser.email,
      creator_name: currentUser.full_name,
      creator_avatar: currentUser.avatar_url,
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      sport: formData.sport || undefined,
      date: new Date(startDateTime).toISOString(),
      end_date: endDateTime ? new Date(endDateTime).toISOString() : undefined,
      location: formData.is_virtual ? undefined : formData.location,
      city: formData.is_virtual ? undefined : formData.city,
      country: formData.is_virtual ? undefined : formData.country,
      is_virtual: formData.is_virtual,
      meeting_link: formData.is_virtual ? formData.meeting_link : undefined,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
      price: formData.price ? parseFloat(formData.price) : 0,
      image_url: imageUrl || undefined,
      attendees: [currentUser.email],
    });

    setCreating(false);
    toast.success("Event created successfully!");
    onOpenChange(false);
    onSuccess?.();
    
    // Reset form
    setFormData({
      title: "", description: "", event_type: "", sport: "", date: "", time: "",
      end_date: "", end_time: "", location: "", city: "", country: "",
      is_virtual: false, meeting_link: "", max_attendees: "", price: "",
    });
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Image upload */}
          <div className="space-y-2">
            <Label>Event Banner (Optional)</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                    className="absolute top-2 right-2 rounded-lg"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-500">Click to upload banner image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Event Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Summer Basketball Tournament"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Event Type *</Label>
              <Select value={formData.event_type} onValueChange={v => setFormData({...formData, event_type: v})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sport</Label>
              <Select value={formData.sport} onValueChange={v => setFormData({...formData, sport: v})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your event..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>End Time (Optional)</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({...formData, end_time: e.target.value})}
                className="rounded-xl"
              />
            </div>

            <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Switch
                checked={formData.is_virtual}
                onCheckedChange={v => setFormData({...formData, is_virtual: v})}
              />
              <Label className="cursor-pointer">This is a virtual/online event</Label>
            </div>

            {formData.is_virtual ? (
              <div className="col-span-2 space-y-2">
                <Label>Meeting Link</Label>
                <Input
                  value={formData.meeting_link}
                  onChange={e => setFormData({...formData, meeting_link: e.target.value})}
                  placeholder="https://zoom.us/j/..."
                  className="rounded-xl"
                />
              </div>
            ) : (
              <>
                <div className="col-span-2 space-y-2">
                  <Label>Location Address</Label>
                  <Input
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="123 Main St, Venue Name"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="New York"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                    placeholder="USA"
                    className="rounded-xl"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Max Attendees (Optional)</Label>
              <Input
                type="number"
                value={formData.max_attendees}
                onChange={e => setFormData({...formData, max_attendees: e.target.value})}
                placeholder="50"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Price (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0.00 (Free)"
                className="rounded-xl"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={creating}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white h-11"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}