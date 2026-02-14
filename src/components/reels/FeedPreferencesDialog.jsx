import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SPORTS = [
  "Football", "Basketball", "Tennis", "Swimming", "Running", "Cycling",
  "Gym/Fitness", "Yoga", "Boxing", "MMA", "Baseball", "Soccer",
  "Volleyball", "Golf", "Skiing", "Surfing", "Rock Climbing", "CrossFit"
];

const CONTENT_TYPES = [
  "training", "game", "coaching", "instruction", "motivation", "highlight", "other"
];

export default function FeedPreferencesDialog({ user, onClose }) {
  const queryClient = useQueryClient();
  const [preferredSports, setPreferredSports] = useState([]);
  const [excludedSports, setExcludedSports] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [showLiveStreams, setShowLiveStreams] = useState(true);

  const { data: preferences } = useQuery({
    queryKey: ["feed-preferences", user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.FeedPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["user-follows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users-for-follow"],
    queryFn: () => base44.entities.SportProfile.list("-created_date", 50),
  });

  useEffect(() => {
    if (preferences) {
      setPreferredSports(preferences.preferred_sports || []);
      setExcludedSports(preferences.excluded_sports || []);
      setContentTypes(preferences.content_types || []);
      setShowLiveStreams(preferences.show_live_streams !== false);
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      const data = {
        user_email: user.email,
        preferred_sports: preferredSports,
        excluded_sports: excludedSports,
        content_types: contentTypes,
        show_live_streams: showLiveStreams,
      };

      if (preferences) {
        await base44.entities.FeedPreferences.update(preferences.id, data);
      } else {
        await base44.entities.FeedPreferences.create(data);
      }

      queryClient.invalidateQueries({ queryKey: ["feed-preferences"] });
      toast.success("Preferences saved!");
      onClose();
    } catch (error) {
      toast.error("Failed to save preferences");
    }
  };

  const toggleSportPreference = (sport) => {
    if (preferredSports.includes(sport)) {
      setPreferredSports(preferredSports.filter(s => s !== sport));
    } else {
      setPreferredSports([...preferredSports, sport]);
      setExcludedSports(excludedSports.filter(s => s !== sport));
    }
  };

  const toggleSportExclusion = (sport) => {
    if (excludedSports.includes(sport)) {
      setExcludedSports(excludedSports.filter(s => s !== sport));
    } else {
      setExcludedSports([...excludedSports, sport]);
      setPreferredSports(preferredSports.filter(s => s !== sport));
    }
  };

  const toggleContentType = (type) => {
    if (contentTypes.includes(type)) {
      setContentTypes(contentTypes.filter(t => t !== type));
    } else {
      setContentTypes([...contentTypes, type]);
    }
  };

  const handleUnfollow = async (email) => {
    const follow = follows.find(f => f.following_email === email);
    if (follow) {
      await base44.entities.Follow.delete(follow.id);
      queryClient.invalidateQueries({ queryKey: ["user-follows"] });
      toast.success("Unfollowed");
    }
  };

  const followedUsers = allUsers.filter(u => 
    follows.some(f => f.following_email === u.user_email) && u.user_email !== user?.email
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cyan-400">Feed Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sports Preferences */}
          <div>
            <h3 className="font-bold text-white mb-3">Preferred Sports</h3>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(sport => (
                <button
                  key={sport}
                  onClick={() => toggleSportPreference(sport)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    preferredSports.includes(sport)
                      ? "bg-cyan-500 text-white border-2 border-cyan-400"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Excluded Sports */}
          <div>
            <h3 className="font-bold text-white mb-3">Hide Sports</h3>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(sport => (
                <button
                  key={sport}
                  onClick={() => toggleSportExclusion(sport)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    excludedSports.includes(sport)
                      ? "bg-red-500 text-white border-2 border-red-400"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <h3 className="font-bold text-white mb-3">Content Types</h3>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleContentType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                    contentTypes.includes(type)
                      ? "bg-purple-500 text-white border-2 border-purple-400"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Leave empty to see all types</p>
          </div>

          {/* Live Streams Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-cyan-500/20">
            <div>
              <h3 className="font-bold text-white">Show Live Streams</h3>
              <p className="text-sm text-slate-400">Include live streams in your feed</p>
            </div>
            <Switch
              checked={showLiveStreams}
              onCheckedChange={setShowLiveStreams}
            />
          </div>

          {/* Following Management */}
          {followedUsers.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-3">Following ({followedUsers.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {followedUsers.map(profile => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-cyan-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-slate-700 text-slate-300">
                          {profile.user_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{profile.user_name}</p>
                        <p className="text-xs text-slate-400">{profile.sport}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnfollow(profile.user_email)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-cyan-500/20">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}