import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Trophy, MapPin, Clock, Send, Loader2, ArrowLeft, Lightbulb, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import PostCard from "../components/feed/PostCard";

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get("email");
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdviceDialog, setShowAdviceDialog] = useState(false);
  const [adviceTopic, setAdviceTopic] = useState("");
  const [adviceMessage, setAdviceMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser && profileEmail) {
      base44.entities.Follow.filter({ 
        follower_email: currentUser.email, 
        following_email: profileEmail 
      }).then(follows => setIsFollowing(follows.length > 0));
    }
  }, [currentUser, profileEmail]);

  const { data: profiles } = useQuery({
    queryKey: ["user-profiles", profileEmail],
    queryFn: () => base44.entities.SportProfile.filter({ user_email: profileEmail }),
    enabled: !!profileEmail,
  });

  const { data: posts } = useQuery({
    queryKey: ["user-posts", profileEmail],
    queryFn: () => base44.entities.Post.filter({ author_email: profileEmail }, "-created_date", 20),
    enabled: !!profileEmail,
  });

  const profile = profiles?.[0];

  const startConversation = async () => {
    const existing = await base44.entities.Conversation.filter({ participants: currentUser.email });
    const found = existing.find(c => c.participants?.includes(profileEmail));
    
    if (found) {
      navigate(createPageUrl("Messages") + `?conv=${found.id}`);
    } else {
      const conv = await base44.entities.Conversation.create({
        participants: [currentUser.email, profileEmail],
        participant_names: [currentUser.full_name, profile?.user_name || profileEmail],
      });
      navigate(createPageUrl("Messages") + `?conv=${conv.id}`);
    }
  };

  const sendAdviceRequest = async () => {
    setSending(true);
    await base44.entities.AdviceRequest.create({
      from_email: currentUser.email,
      from_name: currentUser.full_name,
      to_email: profileEmail,
      to_name: profile?.user_name,
      sport: profile?.sport,
      topic: adviceTopic,
      message: adviceMessage,
      status: "pending",
    });
    setShowAdviceDialog(false);
    setAdviceTopic("");
    setAdviceMessage("");
    setSending(false);
  };

  const toggleFollow = async () => {
    if (isFollowing) {
      const follows = await base44.entities.Follow.filter({ 
        follower_email: currentUser.email, 
        following_email: profileEmail 
      });
      if (follows[0]) {
        await base44.entities.Follow.delete(follows[0].id);
        setIsFollowing(false);
      }
    } else {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        following_email: profileEmail,
      });
      setIsFollowing(true);
      
      // Create notification
      await base44.entities.Notification.create({
        recipient_email: profileEmail,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "follow",
        message: "started following you",
      });
    }
  };

  if (!profile) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("Explore")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-slate-900 to-slate-800 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-xl font-bold">
                {profile.user_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{profile.user_name}</h1>
              <p className="text-sm text-slate-500">{profile.location}</p>
            </div>
            {currentUser && currentUser.email !== profileEmail && (
              <div className="flex gap-2">
                <Button 
                  onClick={toggleFollow} 
                  variant={isFollowing ? "outline" : "default"}
                  className="rounded-xl gap-2"
                  size="sm"
                >
                  <Users className="w-4 h-4" />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button onClick={startConversation} variant="outline" className="rounded-xl gap-2" size="sm">
                  <MessageCircle className="w-4 h-4" /> Message
                </Button>
                <Button onClick={() => setShowAdviceDialog(true)} className="rounded-xl gap-2 bg-slate-900 hover:bg-slate-800" size="sm">
                  <Lightbulb className="w-4 h-4" /> Ask Advice
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sport Profiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {profiles?.map(sp => (
          <div key={sp.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <Badge className="bg-orange-50 text-orange-700 rounded-lg mb-3">{sp.sport}</Badge>
            <p className="text-sm font-semibold text-slate-700 capitalize">{sp.role} · {sp.level}</p>
            {sp.bio && <p className="text-xs text-slate-500 mt-1">{sp.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {sp.team && <span className="text-xs text-slate-400 flex items-center gap-1"><Trophy className="w-3 h-3" />{sp.team}</span>}
              {sp.years_experience > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{sp.years_experience}yr</span>}
            </div>
            {sp.stats?.length > 0 && (
              <div className="flex gap-4 pt-3 border-t border-slate-50 mt-3">
                {sp.stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm font-bold text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Posts</h2>
        <div className="space-y-4">
          {posts?.map(post => (
            <PostCard key={post.id} post={post} currentUser={currentUser} />
          ))}
        </div>
      </div>

      {/* Advice Dialog */}
      <Dialog open={showAdviceDialog} onOpenChange={setShowAdviceDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ask for Advice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={adviceTopic}
              onChange={e => setAdviceTopic(e.target.value)}
              placeholder="Topic (e.g., shooting form, nutrition, etc.)"
              className="rounded-xl"
            />
            <Textarea
              value={adviceMessage}
              onChange={e => setAdviceMessage(e.target.value)}
              placeholder="Describe what you'd like advice on..."
              className="rounded-xl resize-none"
              rows={4}
            />
            <Button
              onClick={sendAdviceRequest}
              disabled={sending || !adviceTopic.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send Request</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}