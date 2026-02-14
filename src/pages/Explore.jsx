import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Search, Loader2, MapPin, Trophy, ChevronRight, Plus, Filter, Globe, MapPinned } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SportFilter from "../components/feed/SportFilter";
import EventCard from "../components/events/EventCard";
import CreateEventDialog from "../components/events/CreateEventDialog";

const SPORTS = ["Basketball", "Soccer", "Football", "Baseball", "Tennis", "Golf", "Swimming", "Boxing", "MMA", "Track", "Volleyball", "Hockey", "Cycling", "Yoga", "CrossFit", "Other"];
const EVENT_TYPES = ["All", "Competition", "Workshop", "Meetup", "Training", "Tournament", "Other"];

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

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["explore-profiles", sportFilter],
    queryFn: () => {
      if (sportFilter) {
        return base44.entities.SportProfile.filter({ sport: sportFilter }, "-created_date", 50);
      }
      return base44.entities.SportProfile.list("-created_date", 50);
    },
  });

  const { data: allEvents, isLoading: loadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.Event.list("date", 200),
  });

  const filteredProfiles = profiles?.filter(p =>
    !search || 
    p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sport?.toLowerCase().includes(search.toLowerCase()) ||
    p.team?.toLowerCase().includes(search.toLowerCase())
  );

  const upcomingEvents = allEvents?.filter(e => new Date(e.date) > new Date());
  const filteredEvents = upcomingEvents?.filter(e => {
    const matchesSearch = !search || 
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase()) ||
      e.city?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesEventType = eventTypeFilter === "all" || 
      e.event_type?.toLowerCase() === eventTypeFilter.toLowerCase();
    
    const matchesLocation = locationFilter === "all" ||
      (locationFilter === "virtual" && e.is_virtual) ||
      (locationFilter === "local" && !e.is_virtual && user && e.city?.toLowerCase() === user.city?.toLowerCase()) ||
      (locationFilter === "global" && !e.is_virtual);
    
    return matchesSearch && matchesEventType && matchesLocation;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Explore</h1>
        <p className="text-slate-500 text-sm mt-1">Discover athletes, events, and sports communities</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search athletes, events, locations..."
          className="pl-12 h-12 rounded-xl bg-white border-slate-100 text-sm focus:ring-2 focus:ring-orange-200"
        />
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-white border border-slate-100 p-1 rounded-xl w-full grid grid-cols-2">
          <TabsTrigger value="events" className="rounded-lg">
            🎯 Events
          </TabsTrigger>
          <TabsTrigger value="athletes" className="rounded-lg">
            <Trophy className="w-4 h-4 mr-2" />
            Athletes
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Event Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> All Events</span>
                  </SelectItem>
                  <SelectItem value="local">
                    <span className="flex items-center gap-2"><MapPinned className="w-4 h-4" /> Local (My City)</span>
                  </SelectItem>
                  <SelectItem value="global">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Global (In-Person)</span>
                  </SelectItem>
                  <SelectItem value="virtual">
                    <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Virtual Only</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.toLowerCase()} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Create Event Button */}
          {user && (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white gap-2 shadow-lg shadow-orange-500/25"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </div>
          )}

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filteredEvents?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-5xl mb-3">📅</p>
              <p className="text-slate-500 font-medium">No upcoming events found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredEvents?.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  currentUser={user}
                  onUpdate={refetchEvents}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Athletes Tab */}
        <TabsContent value="athletes" className="space-y-4">
          <SportFilter selected={sportFilter} onSelect={setSportFilter} />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filteredProfiles?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-slate-500 font-medium">No profiles found</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredProfiles?.map(profile => (
                <Link
                  key={profile.id}
                  to={createPageUrl("UserProfile") + `?email=${profile.user_email}`}
                  className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14 ring-2 ring-slate-100">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-bold text-lg">
                        {profile.user_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">{profile.user_name}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-xs rounded-lg">
                          {profile.sport}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-lg capitalize">
                          {profile.role}
                        </Badge>
                        {profile.level && (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs rounded-lg capitalize">
                            {profile.level}
                          </Badge>
                        )}
                      </div>
                      {profile.team && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> {profile.team}
                        </p>
                      )}
                      {profile.location && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        currentUser={user}
        onSuccess={refetchEvents}
      />
    </div>
  );
}