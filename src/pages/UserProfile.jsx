import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Trophy, MapPin, Clock, Send, Loader2, ArrowLeft, Lightbulb, Users, Heart, Crown, ShoppingBag, Star, CheckCircle, UserCheck, UserPlus, Hourglass, Instagram, Twitter, Youtube, Globe, Pin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import PostCard from "../components/feed/PostCard";
import SubscriptionTiers from "../components/monetization/SubscriptionTiers";

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get("email");
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdviceDialog, setShowAdviceDialog] = useState(false);
  const [adviceTopic, setAdviceTopic] = useState("");
  const [adviceMessage, setAdviceMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [followStatus, setFollowStatus] = useState(null); // null | "pending" | "accepted"

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser && profileEmail) {
      base44.entities.Follow.filter({ 
        follower_email: currentUser.email, 
        following_email: profileEmail 
      }).then(follows => {
        if (follows.length > 0) setFollowStatus(follows[0].status || "accepted");
        else setFollowStatus(null);
      });
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
    if (followStatus) {
      const follows = await base44.entities.Follow.filter({ 
        follower_email: currentUser.email, 
        following_email: profileEmail 
      });
      if (follows[0]) {
        await base44.entities.Follow.delete(follows[0].id);
        setFollowStatus(null);
      }
    } else {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        following_email: profileEmail,
        status: "pending",
      });
      setFollowStatus("pending");

      await base44.entities.Notification.create({
        recipient_email: profileEmail,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "follow_request",
        message: "wants to follow you",
        follow_requester_email: currentUser.email,
      });
    }
  };

  const { data: pinnedHighlight } = useQuery({
    queryKey: ["pinned-highlight", profileEmail],
    queryFn: async () => {
      const highlights = await base44.entities.Highlight.filter({ user_email: profileEmail });
      return highlights.find(h => h.is_pinned && h.item_type === "post") || null;
    },
    enabled: !!profileEmail,
  });

  // Fetch the user record directly for name/avatar fallback
  const { data: userRecord } = useQuery({
    queryKey: ["user-record", profileEmail],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === profileEmail) || null;
    },
    enabled: !!profileEmail,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["follower-count", profileEmail],
    queryFn: () => base44.entities.Follow.filter({ following_email: profileEmail, status: "accepted" }),
    enabled: !!profileEmail,
  });

  const { data: followingCount } = useQuery({
    queryKey: ["following-count", profileEmail],
    queryFn: () => base44.entities.Follow.filter({ follower_email: profileEmail, status: "accepted" }),
    enabled: !!profileEmail,
  });

  const displayName = profile?.user_name || userRecord?.full_name || profileEmail;
  const displayAvatar = profile?.avatar_url || userRecord?.avatar_url;

  if (!profileEmail) return (
    <div className="text-center py-20 text-slate-400">No user specified.</div>
  );

  const isLoading = !posts && !userRecord && !profiles;

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("Explore")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-slate-900 to-slate-800 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-xl font-bold">
                {displayName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
              {profile?.location && <p className="text-sm text-slate-500">{profile.location}</p>}
              <div className="flex gap-4 mt-2 text-sm text-slate-500">
                <span><strong className="text-slate-800">{followerCount?.length ?? 0}</strong> followers</span>
                <span><strong className="text-slate-800">{followingCount?.length ?? 0}</strong> following</span>
                <span><strong className="text-slate-800">{posts?.length ?? 0}</strong> posts</span>
              </div>
            </div>
            {currentUser && currentUser.email !== profileEmail && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={toggleFollow}
                  size="sm"
                  className={`rounded-xl gap-2 font-bold transition-all ${
                    followStatus === "accepted"
                      ? "bg-green-50 text-green-700 border border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      : followStatus === "pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-300"
                      : "bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:from-orange-600 hover:to-amber-500 shadow-md"
                  }`}
                >
                  {followStatus === "accepted" ? (
                    <><UserCheck className="w-4 h-4" /> Following</>
                  ) : followStatus === "pending" ? (
                    <><Hourglass className="w-4 h-4" /> Requested</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </Button>
                <Button onClick={startConversation} variant="outline" className="rounded-xl gap-2" size="sm">
                  <MessageCircle className="w-4 h-4" /> Message
                </Button>
                <Button onClick={() => setShowAdviceDialog(true)} variant="outline" className="rounded-xl gap-2" size="sm">
                  <Lightbulb className="w-4 h-4" /> Advice
                </Button>
                <Link to={createPageUrl("CreatorShop") + `?creator=${profileEmail}`}>
                  <Button variant="outline" className="rounded-xl gap-2" size="sm">
                    <ShoppingBag className="w-4 h-4" /> Shop
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">About</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Favorite Sports */}
      {profiles?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Favorite Sports
          </h2>
          <div className="flex flex-wrap gap-2">
            {profiles.map(sp => (
              <span key={sp.id} className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-1 text-sm font-semibold">
                🏅 {sp.sport}
                <span className="text-orange-400 text-xs capitalize">· {sp.level}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sport Profiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {profiles?.map(sp => (
          <div key={sp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-orange-50 text-orange-700 border-orange-200 rounded-lg">{sp.sport}</Badge>
              <span className="text-xs text-slate-400 capitalize font-medium">{sp.role}</span>
            </div>
            <p className="text-sm font-semibold text-slate-700 capitalize">{sp.level} level</p>
            {sp.bio && <p className="text-xs text-slate-500 leading-relaxed">{sp.bio}</p>}
            <div className="flex flex-wrap gap-3">
              {sp.team && <span className="text-xs text-slate-500 flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500" />{sp.team}</span>}
              {sp.years_experience > 0 && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" />{sp.years_experience} yr exp</span>}
              {sp.location && <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" />{sp.location}</span>}
            </div>

            {/* Achievements */}
            {sp.achievements?.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" /> Achievements
                </p>
                <ul className="space-y-1">
                  {sp.achievements.map((ach, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {ach}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sp.stats?.length > 0 && (
              <div className="flex gap-4 pt-3 border-t border-slate-100">
                {sp.stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm font-bold text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subscription Tiers */}
      {currentUser && currentUser.email !== profileEmail && (
        <SubscriptionTiers
          creator={{ email: profileEmail, name: profile.user_name }}
          currentUser={currentUser}
        />
      )}

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