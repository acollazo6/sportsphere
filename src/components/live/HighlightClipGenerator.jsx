import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Scissors, Plus, FileVideo } from "lucide-react";

export default function HighlightClipGenerator({ stream, onClipCreated }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });

  const handleAddClip = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Call LLM to generate clip metadata and editing suggestions
      const clipMetadata = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a video editing expert. For a sports stream highlight clip, provide:
1. Suggested hooks (attention-grabbing opening lines)
2. Editing pacing (fast, moderate, slow)
3. Suggested music genre
4. Hashtags for social media promotion
5. Description for the clip

Stream: ${stream.title}
Segment: From ${formData.startTime} to ${formData.endTime}
Title: ${formData.title}
Description: ${formData.description}

Respond as JSON: { hooks: string[], pace: string, musicGenre: string, hashtags: string[], clipDescription: string }`,
        response_json_schema: {
          type: 'object',
          properties: {
            hooks: { type: 'array', items: { type: 'string' } },
            pace: { type: 'string' },
            musicGenre: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } },
            clipDescription: { type: 'string' }
          }
        }
      });

      const newClip = {
        id: Date.now(),
        ...formData,
        ...clipMetadata,
        status: 'pending_generation',
        streamId: stream.id,
      };

      setClips([...clips, newClip]);
      setFormData({ title: "", description: "", startTime: "", endTime: "" });
      setOpenDialog(false);
      onClipCreated?.(newClip);
    } catch (error) {
      alert("Failed to generate clip: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-lg">Highlight Clips</h3>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Create Clip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Highlight Clip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Clip Title *
                </label>
                <Input
                  placeholder="e.g., Incredible Dunk"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="What makes this moment special?"
                  className="h-20"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Start Time (MM:SS) *
                  </label>
                  <Input
                    placeholder="00:15"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    End Time (MM:SS) *
                  </label>
                  <Input
                    placeholder="00:30"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddClip}
                disabled={loading}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileVideo className="w-4 h-4" />
                    Create Clip
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clips List */}
      {clips.length > 0 ? (
        <div className="space-y-3">
          {clips.map((clip) => (
            <div key={clip.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900">{clip.title}</h4>
                  <p className="text-xs text-gray-600">
                    {clip.startTime} - {clip.endTime}
                  </p>
                </div>
                <Badge
                  className={clip.status === 'pending_generation' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}
                >
                  {clip.status === 'pending_generation' ? 'Processing' : 'Ready'}
                </Badge>
              </div>

              {clip.hooks && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Suggested Hooks:</p>
                  <ul className="space-y-1">
                    {clip.hooks.map((hook, idx) => (
                      <li key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                        • {hook}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {clip.hashtags && (
                <div className="flex flex-wrap gap-1">
                  {clip.hashtags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {clip.pace && (
                <div className="flex gap-3 text-xs">
                  <span className="bg-white px-2 py-1 rounded">Pace: <strong>{clip.pace}</strong></span>
                  <span className="bg-white px-2 py-1 rounded">Music: <strong>{clip.musicGenre}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-4 text-center">No clips created yet. Start by creating your first highlight!</p>
      )}
    </Card>
  );
}