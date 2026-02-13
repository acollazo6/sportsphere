import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Search, Loader2, MapPin, Trophy, ChevronRight, Calendar, Users, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SportFilter from "../components/feed/SportFilter";
import moment from "moment";

export default function Explore() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState(null);
  const [eventFilter, setEventFilter] = useState("all");

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
    queryFn: () => base44.entities.Event.list("date", 100),
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
      e.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = eventFilter === "all" || 
      (eventFilter === "local" && e.location) ||
      (eventFilter === "global" && !e.location);
    
    return matchesSearch && matchesFilter;
  });

  const toggleRSVP = async (event) => {
    const isAttending = event.attendees?.includes(user?.email);
    const newAttendees = isAttending
      ? event.attendees.filter(e => e !== user.email)
      : [...(event.attendees || []), user.email];
    
    await base44.entities.Event.update(event.id, { attendees: newAttendees });
    refetchEvents();
  };

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
          placeholder="Search athletes, events, or teams..."
          className="pl-12 h-12 rounded-xl bg-white border-slate-100 text-sm focus:ring-2 focus:ring-orange-200"
        />
      </div>

      <Tabs defaultValue="athletes" className="space-y-4">
        <TabsList className="bg-white border border-slate-100 p-1 rounded-xl">
          <TabsTrigger value="athletes" className="rounded-lg gap-2">
            <Trophy className="w-4 h-4" />
            Athletes
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg gap-2">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
        </TabsList>

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

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", "local", "global"].map(filter => (
              <button
                key={filter}
                onClick={() => setEventFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  eventFilter === filter
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter === "all" ? "All Events" : filter === "local" ? "Local Events" : "Global Events"}
              </button>
            ))}
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filteredEvents?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No upcoming events found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredEvents?.map(event => {
                const isAttending = event.attendees?.includes(user?.email);
                const isFull = event.max_attendees && event.attendees?.length >= event.max_attendees;
                
                return (
                  <div key={event.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <Badge className="bg-orange-100 text-orange-700">
                        {moment(event.date).format("MMM D, YYYY")}
                      </Badge>
                      {event.location ? (
                        <Badge variant="outline" className="text-xs">📍 Local</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">🌍 Global</Badge>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span>{moment(event.date).format("h:mm A")}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-500" />
                        <span>
                          {event.attendees?.length || 0} attending
                          {event.max_attendees && ` / ${event.max_attendees}`}
                        </span>
                      </div>
                    </div>

                    {user && (
                      <Button
                        onClick={() => toggleRSVP(event)}
                        disabled={!isAttending && isFull}
                        className={`w-full rounded-xl ${
                          isAttending
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {isAttending ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            RSVP'd
                          </>
                        ) : isFull ? (
                          "Event Full"
                        ) : (
                          "RSVP"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}