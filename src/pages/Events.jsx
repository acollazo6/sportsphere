import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, MapPin, Clock, Users, DollarSign, Video, ExternalLink,
  Search, Plus, Filter, Globe, Download, Trophy, Loader2, X, CheckCircle2
} from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import CreateEventDialog from "../components/events/CreateEventDialog";
import AIEventRecommendations from "../components/events/AIEventRecommendations";

const SPORTS = ["All Sports", "Basketball", "Soccer", "Football", "Baseball", "Tennis", "Golf", "Swimming", "Boxing", "MMA", "Track", "Volleyball", "Hockey", "Cycling", "Yoga", "CrossFit", "Other"];

const EVENT_TYPES = [
  { value: "all", label: "All Types", icon: "🎯" },
  { value: "competition", label: "Competition", icon: "🏆" },
  { value: "tournament", label: "Tournament", icon: "🥇" },
  { value: "workshop", label: "Workshop", icon: "📚" },
  { value: "training", label: "Training", icon: "💪" },
  { value: "meetup", label: "Meetup", icon: "👥" },
  { value: "other", label: "Other", icon: "📅" },
];

const typeColors = {
  competition: "bg-red-50 text-red-700 border-red-200",
  tournament: "bg-orange-50 text-orange-700 border-orange-200",
  workshop: "bg-blue-50 text-blue-700 border-blue-200",
  training: "bg-purple-50 text-purple-700 border-purple-200",
  meetup: "bg-green-50 text-green-700 border-green-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

function EventCard({ event, currentUser, onUpdate }) {
  const [isRSVPd, setIsRSVPd] = useState(event.attendees?.includes(currentUser?.email));
  const [attendeeCount, setAttendeeCount] = useState(event.attendees?.length || 0);
  const [loading, setLoading] = useState(false);

  const handleRSVP = async () => {
    if (!currentUser) { toast.error("Please login to register"); return; }
    setLoading(true);
    const newAttendees = isRSVPd
      ? (event.attendees || []).filter(e => e !== currentUser.email)
      : [...(event.attendees || []), currentUser.email];

    if (!isRSVPd && event.max_attendees && newAttendees.length > event.max_attendees) {
      toast.error("Event is full"); setLoading(false); return;
    }
    await base44.entities.Event.update(event.id, { attendees: newAttendees });
    setIsRSVPd(!isRSVPd);
    setAttendeeCount(newAttendees.length);
    toast.success(isRSVPd ? "Registration cancelled" : "Successfully registered!");
    onUpdate?.();
    setLoading(false);
  };

  const addToCalendar = () => {
    const startDate = moment(event.date).format("YYYYMMDDTHHmmss");
    const endDate = event.end_date
      ? moment(event.end_date).format("YYYYMMDDTHHmmss")
      : moment(event.date).add(2, "hours").format("YYYYMMDDTHHmmss");
    const location = event.is_virtual ? (event.meeting_link || "Online") : (event.location || "");
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SportHub//Event//EN\nBEGIN:VEVENT\nUID:${event.id}@sporthub\nDTSTAMP:${moment().format("YYYYMMDDTHHmmss")}\nDTSTART:${startDate}\nDTEND:${endDate}\nSUMMARY:${event.title}\nDESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}\nLOCATION:${location}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Event exported — open the file to add to your calendar!");
  };

  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;
  const isPast = moment(event.date).isBefore(moment());
  const typeData = EVENT_TYPES.find(t => t.value === event.event_type) || EVENT_TYPES[0];
  const spotsLeft = event.max_attendees ? event.max_attendees - attendeeCount : null;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col ${isPast ? "opacity-60" : ""}`}>
      {event.image_url ? (
        <div className="h-44 relative overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          {isPast && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-lg">Event Ended</span></div>}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${typeColors[event.event_type] || typeColors.other} border text-xs font-semibold`}>
              {typeData.icon} {typeData.label}
            </Badge>
            {event.is_virtual && <Badge className="bg-indigo-600 text-white text-xs border-0">🌐 Virtual</Badge>}
          </div>
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-r from-red-900 to-red-700 flex items-center gap-3 px-5 relative">
          <span className="text-3xl">{typeData.icon}</span>
          {event.is_virtual && <Badge className="absolute top-3 right-3 bg-white/20 text-white text-xs border-white/30">🌐 Virtual</Badge>}
          <Badge className="absolute top-3 left-3 bg-white/20 text-white text-xs border-white/30">{typeData.label}</Badge>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title + sport */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-900 leading-tight">{event.title}</h3>
            {event.sport && <Badge variant="outline" className="text-xs shrink-0">{event.sport}</Badge>}
          </div>
          {event.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>}
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-900 shrink-0" />
            <span className="font-medium">{moment(event.date).format("ddd, MMM D, YYYY")}</span>
            <Clock className="w-4 h-4 text-gray-400 ml-1" />
            <span>{moment(event.date).format("h:mm A")}</span>
          </div>
          {event.is_virtual ? (
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-500 shrink-0" />
              {event.meeting_link ? (
                <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  Join Online <ExternalLink className="w-3 h-3" />
                </a>
              ) : <span className="text-gray-400">Online Event</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-900 shrink-0" />
              <span className="truncate">{[event.location, event.city, event.country].filter(Boolean).join(", ") || "Location TBA"}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{attendeeCount} attending{event.max_attendees ? ` · ${spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}` : ""}</span>
            </div>
            {event.price > 0 && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-700">${event.price}</span>
              </div>
            )}
            {!event.price && <Badge className="bg-green-50 text-green-700 text-xs border-green-200">Free</Badge>}
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Avatar className="w-7 h-7">
            <AvatarImage src={event.creator_avatar} />
            <AvatarFallback className="bg-red-100 text-red-900 text-xs font-bold">{event.creator_name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500">by <span className="font-medium text-gray-700">{event.creator_name}</span></span>
        </div>

        {/* Actions */}
        {!isPast && (
          <div className="flex gap-2 mt-auto">
            <Button
              onClick={handleRSVP}
              disabled={loading || (!isRSVPd && isFull)}
              size="sm"
              className={`flex-1 rounded-xl font-semibold ${
                isRSVPd
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                  : isFull
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white shadow"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isRSVPd ? <><CheckCircle2 className="w-4 h-4 mr-1" />Registered</> : isFull ? "Event Full" : "Register"}
            </Button>
            <Button
              onClick={addToCalendar}
              variant="outline"
              size="sm"
              className="rounded-xl px-3 border-gray-300 hover:border-red-300"
              title="Add to Calendar"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Events() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("All Sports");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("upcoming");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState("discover");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allEvents = [], isLoading, refetch } = useQuery({
    queryKey: ["events-all"],
    queryFn: () => base44.entities.Event.list("date", 300),
  });

  const filtered = allEvents.filter(e => {
    const now = moment();
    const evDate = moment(e.date);

    // Date range
    if (dateFilter === "upcoming" && evDate.isBefore(now)) return false;
    if (dateFilter === "past" && evDate.isAfter(now)) return false;
    if (dateFilter === "today" && !evDate.isSame(now, "day")) return false;
    if (dateFilter === "this_week" && !evDate.isBetween(now.startOf("week"), moment().endOf("week"))) return false;
    if (dateFilter === "this_month" && !evDate.isSame(now, "month")) return false;
    if (dateFilter === "custom") {
      if (dateFrom && evDate.isBefore(moment(dateFrom))) return false;
      if (dateTo && evDate.isAfter(moment(dateTo).endOf("day"))) return false;
    }

    if (sportFilter !== "All Sports" && e.sport !== sportFilter) return false;
    if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
    if (locationFilter === "virtual" && !e.is_virtual) return false;
    if (locationFilter === "in_person" && e.is_virtual) return false;

    if (search) {
      const q = search.toLowerCase();
      return e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.sport?.toLowerCase().includes(q);
    }
    return true;
  });

  const myEvents = allEvents.filter(e => e.attendees?.includes(user?.email));

  const activeFiltersCount = [
    sportFilter !== "All Sports",
    typeFilter !== "all",
    locationFilter !== "all",
    dateFilter !== "upcoming",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSportFilter("All Sports");
    setTypeFilter("all");
    setLocationFilter("all");
    setDateFilter("upcoming");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,white_0%,transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black mb-1">Event Discovery</h1>
            <p className="text-white/80 text-lg">Find tournaments, workshops, and sports events near you</p>
            <div className="flex gap-4 mt-3 text-sm text-white/70">
              <span>🏆 {allEvents.filter(e => moment(e.date).isAfter(moment())).length} upcoming events</span>
              <span>🌐 {allEvents.filter(e => e.is_virtual).length} virtual</span>
            </div>
          </div>
          {user && (
            <Button onClick={() => setShowCreate(true)} className="bg-white text-red-900 hover:bg-gray-100 font-bold rounded-xl shadow-lg">
              <Plus className="w-5 h-5 mr-2" /> Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
          <TabsTrigger value="discover" className="rounded-lg">🔍 Discover</TabsTrigger>
          {user && <TabsTrigger value="registered" className="rounded-lg">✅ My Events ({myEvents.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="discover" className="space-y-5 mt-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, sports, locations..."
              className="pl-12 h-12 rounded-xl border-gray-200 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-800">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-red-900 text-white text-xs">{activeFiltersCount}</Badge>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-700 hover:underline font-medium">Clear all</button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Sport */}
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="rounded-xl border-gray-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Type */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="rounded-xl border-gray-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location */}
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="rounded-xl border-gray-200 text-sm">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><span className="flex items-center gap-2"><Globe className="w-4 h-4" />All Locations</span></SelectItem>
                  <SelectItem value="in_person"><span className="flex items-center gap-2"><MapPin className="w-4 h-4" />In Person</span></SelectItem>
                  <SelectItem value="virtual"><span className="flex items-center gap-2"><Video className="w-4 h-4" />Virtual Only</span></SelectItem>
                </SelectContent>
              </Select>

              {/* Date */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="rounded-xl border-gray-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">📅 Upcoming</SelectItem>
                  <SelectItem value="today">📍 Today</SelectItem>
                  <SelectItem value="this_week">🗓️ This Week</SelectItem>
                  <SelectItem value="this_month">📆 This Month</SelectItem>
                  <SelectItem value="past">🕒 Past Events</SelectItem>
                  <SelectItem value="custom">✏️ Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom date range */}
            {dateFilter === "custom" && (
              <div className="flex gap-3 items-center">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl border-gray-200 text-sm" />
                <span className="text-gray-400 text-sm">to</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl border-gray-200 text-sm" />
              </div>
            )}

            {/* Type pill buttons */}
            <div className="flex gap-2 flex-wrap">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    typeFilter === t.value
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{filtered.length}</span> events found
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <p className="text-5xl mb-3">📅</p>
              <p className="font-semibold text-gray-700">No events found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new event</p>
              {activeFiltersCount > 0 && (
                <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4 rounded-xl">Clear Filters</Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(event => (
                <EventCard key={event.id} event={event} currentUser={user} onUpdate={refetch} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Events */}
        {user && (
          <TabsContent value="registered" className="space-y-5 mt-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-1">Your Registered Events</h2>
              <p className="text-sm text-gray-500">Events you've signed up for. Download .ics to add them to your calendar.</p>
            </div>
            {myEvents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-4xl mb-3">🎟️</p>
                <p className="font-semibold text-gray-700">No registrations yet</p>
                <p className="text-sm text-gray-400 mt-1">Discover and register for events above</p>
                <Button onClick={() => setTab("discover")} className="mt-4 rounded-xl bg-red-900 hover:bg-red-800">Browse Events</Button>
              </div>
            ) : (
              <>
                {/* Upcoming */}
                {myEvents.filter(e => moment(e.date).isAfter(moment())).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {myEvents.filter(e => moment(e.date).isAfter(moment())).map(event => (
                        <EventCard key={event.id} event={event} currentUser={user} onUpdate={refetch} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Past */}
                {myEvents.filter(e => moment(e.date).isBefore(moment())).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-4">Past Events</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {myEvents.filter(e => moment(e.date).isBefore(moment())).map(event => (
                        <EventCard key={event.id} event={event} currentUser={user} onUpdate={refetch} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>

      <CreateEventDialog open={showCreate} onOpenChange={setShowCreate} currentUser={user} onSuccess={refetch} />
    </div>
  );
}