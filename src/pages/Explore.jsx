import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Search, Loader2, MapPin, Trophy, TrendingUp, ChevronRight, Plus, Filter, Globe, MapPinned, Flame, Users, BarChart2, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SportFilter from "../components/feed/SportFilter";
import SportHubGrid from "../components/stream/SportHubGrid";
import EventCard from "../components/events/EventCard";
import CreateEventDialog from "../components/events/CreateEventDialog";
import PostCard from "../components/feed/PostCard";

const EVENT_TYPES = ["All", "Competition", "Workshop", "Meetup", "Training", "Tournament", "Other"];

function TrendingSportCard({ sport, count, growth }) {
  const emojis = { Basketball: "🏀", Soccer: "⚽", Football: "🏈", Tennis: "🎾", Swimming: "🏊", Boxing: "🥊", Baseball: "⚾", Golf: "⛳", MMA: "🥋", Track: "🏃", Volleyball: "🏐", Hockey: "🏒", Cycling: "🚴", Yoga: "🧘", CrossFit: "💪" };
  return (
    <Link to={createPageUrl("Feed") + `?sport=${encodeURIComponent(sport)}`}
      className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-orange-500/50 rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-lg hover:shadow-orange-500/10">
      <div className="text-3xl">{emojis[sport] || "🏅"}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{sport}</p>
        <p className="text-xs text-slate-400">{count} posts</p>
      </div>
      {growth > 0 && (
        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
          <TrendingUp className="w-3 h-3" />+{growth}%
        </div>
      )}
    </Link>
  );
}

function PopularAthleteCard({ profile, postCount, likeCount, currentUser }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Follow.filter({ follower_email: currentUser.email, following_email: profile.user_email })
      .then(f => setFollowing(f.length > 0)).catch(() => {});
  }, [currentUser, profile.user_email]);

  const handleFollow = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (following) {
      const follows = await base44.entities.Follow.filter({ follower_email: currentUser.email, following_email: profile.user_email });
      if (follows[0]) { await base44.entities.Follow.delete(follows[0].id); setFollowing(false); }
    } else {
      await base44.entities.Follow.create({ follower_email: currentUser.email, following_email: profile.user_email, status: "accepted" });
      setFollowing(true);
    }
  };

  return (
    <Link to={createPageUrl("UserProfile") + `?email=${profile.user_email}`}
      className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 ring-2 ring-orange-100">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-bold">
            {profile.user_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-sm">{profile.user_name}</p>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-xs rounded-lg">{profile.sport}</Badge>
            {profile.level && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs rounded-lg capitalize">{profile.level}</Badge>}
          </div>
        </div>
        {currentUser && currentUser.email !== profile.user_email && (
          <Button
            size="sm"
            variant={following ? "outline" : "default"}
            onClick={handleFollow}
            className={`text-xs rounded-xl shrink-0 ${following ? "border-slate-200" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
          >
            {following ? "Following" : "Follow"}
          </Button>
        )}
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700">{postCount}</p>
          <p className="text-xs text-slate-400">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700">{likeCount}</p>
          <p className="text-xs text-slate-400">Likes received</p>
        </div>
        {profile.location && (
          <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
            <MapPin className="w-3 h-3" />{profile.location}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Explore() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Trending posts
  const { data: allPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["explore-all-posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 200),
  });

  // Sport profiles for popular athletes
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["explore-profiles", sportFilter],
    queryFn: () => sportFilter
      ? base44.entities.SportProfile.filter({ sport: sportFilter }, "-created_date", 100)
      : base44.entities.SportProfile.list("-created_date", 100),
  });

  // Events
  const { data: allEvents, isLoading: loadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.Event.list("date", 200),
  });

  // Trending posts: ranked by engagement in last 48h
  const trendingPosts = useMemo(() => {
    if (!allPosts) return [];
    const cutoff = Date.now() - 48 * 3600000;
    return allPosts
      .filter(p => new Date(p.created_date).getTime() > cutoff)
      .map(p => ({ ...p, _score: (p.likes?.length || 0) * 3 + (p.comments_count || 0) * 6 + (p.views || 0) * 0.2 + (p.shares || 0) * 4 }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 15);
  }, [allPosts]);

  // Popular athletes: profiles scored by total post likes + post count
  const popularAthletes = useMemo(() => {
    if (!profiles || !allPosts) return [];
    const postsByAuthor = {};
    const likesByAuthor = {};
    allPosts.forEach(p => {
      postsByAuthor[p.author_email] = (postsByAuthor[p.author_email] || 0) + 1;
      likesByAuthor[p.author_email] = (likesByAuthor[p.author_email] || 0) + (p.likes?.length || 0);
    });
    const seen = new Set();
    return profiles
      .filter(p => { if (seen.has(p.user_email)) return false; seen.add(p.user_email); return true; })
      .map(p => ({
        profile: p,
        postCount: postsByAuthor[p.user_email] || 0,
        likeCount: likesByAuthor[p.user_email] || 0,
        score: (postsByAuthor[p.user_email] || 0) * 5 + (likesByAuthor[p.user_email] || 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [profiles, allPosts]);

  // Emerging sports categories: ranked by post volume and growth
  const emergingSports = useMemo(() => {
    if (!allPosts) return [];
    const now = Date.now();
    const week = 7 * 24 * 3600000;
    const sportStats = {};
    allPosts.forEach(p => {
      if (!p.sport) return;
      if (!sportStats[p.sport]) sportStats[p.sport] = { total: 0, recent: 0 };
      sportStats[p.sport].total++;
      if (now - new Date(p.created_date).getTime() < week) sportStats[p.sport].recent++;
    });
    return Object.entries(sportStats)
      .map(([sport, { total, recent }]) => ({
        sport,
        count: total,
        growth: total > 0 ? Math.round((recent / Math.max(total - recent, 1)) * 100) : 0,
      }))
      .sort((a, b) => b.count + b.growth - (a.count + a.growth))
      .slice(0, 8);
  }, [allPosts]);

  // Filtered search on posts
  const searchedPosts = useMemo(() => {
    if (!search) return trendingPosts;
    const q = search.toLowerCase();
    return (allPosts || []).filter(p =>
      p.content?.toLowerCase().includes(q) ||
      p.author_name?.toLowerCase().includes(q) ||
      p.sport?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [search, allPosts, trendingPosts]);

  const filteredProfiles = profiles?.filter(p =>
    !search ||
    p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sport?.toLowerCase().includes(search.toLowerCase())
  );

  const upcomingEvents = allEvents?.filter(e => new Date(e.date) > new Date());
  const filteredEvents = upcomingEvents?.filter(e => {
    const matchesSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
    const matchesType = eventTypeFilter === "all" || e.event_type?.toLowerCase() === eventTypeFilter.toLowerCase();
    const matchesLoc = locationFilter === "all" ||
      (locationFilter === "virtual" && e.is_virtual) ||
      (locationFilter === "local" && !e.is_virtual && user && e.city?.toLowerCase() === user.city?.toLowerCase()) ||
      (locationFilter === "global" && !e.is_virtual);
    return matchesSearch && matchesType && matchesLoc;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-3xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-black flex items-center gap-3 mb-2">
          <Flame className="w-10 h-10" />
          Explore
        </h1>
        <p className="text-white/90 text-sm">Trending posts, rising athletes & emerging sports worldwide</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search posts, athletes, sports, events..."
          className="pl-12 h-12 rounded-2xl bg-white border-slate-200 text-sm focus:ring-2 focus:ring-orange-200 shadow-sm"
        />
      </div>

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList className="bg-white border border-slate-100 p-1 rounded-xl w-full grid grid-cols-5">
          <TabsTrigger value="trending" className="rounded-lg text-xs sm:text-sm">
            <Flame className="w-4 h-4 mr-1 sm:mr-2" />Trending
          </TabsTrigger>
          <TabsTrigger value="athletes" className="rounded-lg text-xs sm:text-sm">
            <Trophy className="w-4 h-4 mr-1 sm:mr-2" />Athletes
          </TabsTrigger>
          <TabsTrigger value="sports" className="rounded-lg text-xs sm:text-sm">
            <BarChart2 className="w-4 h-4 mr-1 sm:mr-2" />Sports
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg text-xs sm:text-sm">
            <Zap className="w-4 h-4 mr-1 sm:mr-2" />Events
          </TabsTrigger>
          <TabsTrigger value="browse" className="rounded-lg text-xs sm:text-sm">
            <Globe className="w-4 h-4 mr-1 sm:mr-2" />Browse
          </TabsTrigger>
        </TabsList>

        {/* Trending Posts */}
        <TabsContent value="trending" className="space-y-4">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-sm text-orange-700 flex items-center gap-2 font-medium">
              <TrendingUp className="w-4 h-4" />
              Most engaging posts in the last 48 hours
            </p>
          </div>
          {loadingPosts ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-300" /></div>
          ) : searchedPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-slate-500 font-medium">No posts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchedPosts.map((post, i) => (
                <div key={post.id}>
                  {!search && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-base font-black text-orange-500">#{i + 1}</span>
                      <span className="text-xs text-slate-400">{Math.round(post._score || 0)} engagement score</span>
                    </div>
                  )}
                  <PostCard post={post} currentUser={user} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Popular Athletes */}
        <TabsContent value="athletes" className="space-y-4">
          <SportFilter selected={sportFilter} onSelect={setSportFilter} />
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <p className="text-sm text-orange-700 font-medium">Ranked by total posts & likes received</p>
          </div>
          {loadingProfiles || loadingPosts ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-300" /></div>
          ) : popularAthletes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-5xl mb-3">🏅</p>
              <p className="text-slate-500 font-medium">No athletes found</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {popularAthletes
                .filter(({ profile }) => !search || profile.user_name?.toLowerCase().includes(search.toLowerCase()) || profile.sport?.toLowerCase().includes(search.toLowerCase()))
                .map(({ profile, postCount, likeCount }, i) => (
                  <div key={profile.id} className="relative">
                    {i < 3 && (
                      <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-xs font-black text-white shadow">
                        #{i + 1}
                      </div>
                    )}
                    <PopularAthleteCard profile={profile} postCount={postCount} likeCount={likeCount} currentUser={user} />
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Emerging Sports */}
        <TabsContent value="sports" className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700 font-medium">Sports ranked by post volume & weekly growth rate</p>
          </div>
          {loadingPosts ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-300" /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {emergingSports.map(({ sport, count, growth }) => (
                <TrendingSportCard key={sport} sport={sport} count={count} growth={growth} />
              ))}
            </div>
          )}
          {emergingSports.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-5xl mb-3">📊</p>
              <p className="text-slate-500">No sport data yet</p>
            </div>
          )}
        </TabsContent>

        {/* Events */}
        <TabsContent value="events" className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><span className="flex items-center gap-2"><Globe className="w-4 h-4" /> All Events</span></SelectItem>
                  <SelectItem value="local"><span className="flex items-center gap-2"><MapPinned className="w-4 h-4" /> Local (My City)</span></SelectItem>
                  <SelectItem value="global"><span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Global (In-Person)</span></SelectItem>
                  <SelectItem value="virtual"><span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Virtual Only</span></SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Event Type" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.toLowerCase()} value={type.toLowerCase()}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {user && (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white gap-2 shadow-lg shadow-orange-500/25"
              >
                <Plus className="w-4 h-4" />Create Event
              </Button>
            </div>
          )}

          {loadingEvents ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
          ) : filteredEvents?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-5xl mb-3">📅</p>
              <p className="text-slate-500 font-medium">No upcoming events found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredEvents?.map(event => (
                <EventCard key={event.id} event={event} currentUser={user} onUpdate={refetchEvents} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

        {/* Browse Sports */}
        <TabsContent value="browse" className="space-y-4">
          <SportHubGrid />
        </TabsContent>
      </Tabs>

      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        currentUser={user}
        onSuccess={refetchEvents}
      />
    </div>
  );
}