import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, RefreshCw, MapPin, Calendar, Users, DollarSign, Video, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import moment from "moment";
import { toast } from "sonner";

function RecommendedEventCard({ event, match, currentUser, onRSVP }) {
  const [isRSVPd, setIsRSVPd] = useState(event.attendees?.includes(currentUser?.email));
  const [loading, setLoading] = useState(false);

  const handleRSVP = async () => {
    if (!currentUser) return;
    setLoading(true);
    const newAttendees = isRSVPd
      ? (event.attendees || []).filter(e => e !== currentUser.email)
      : [...(event.attendees || []), currentUser.email];
    await base44.entities.Event.update(event.id, { attendees: newAttendees });
    setIsRSVPd(!isRSVPd);
    toast.success(isRSVPd ? "Registration cancelled" : "Successfully registered!");
    onRSVP?.();
    setLoading(false);
  };

  const addToCalendar = () => {
    const startDate = moment(event.date).format("YYYYMMDDTHHmmss");
    const endDate = event.end_date
      ? moment(event.end_date).format("YYYYMMDDTHHmmss")
      : moment(event.date).add(2, "hours").format("YYYYMMDDTHHmmss");
    const location = event.is_virtual ? (event.meeting_link || "Online") : (event.location || "");
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${event.id}@sporthub\nDTSTART:${startDate}\nDTEND:${endDate}\nSUMMARY:${event.title}\nLOCATION:${location}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Added to calendar!");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {event.image_url ? (
        <div className="h-36 overflow-hidden relative">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2">
            <Badge className="bg-purple-600 text-white text-xs border-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {match?.score || "AI Pick"}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center px-4 relative">
          <span className="text-white font-bold text-sm">{event.sport || "Sport Event"}</span>
          <Badge className="absolute top-2 right-2 bg-white/20 text-white text-xs border-white/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {match?.score || "AI Pick"}
          </Badge>
        </div>
      )}

      <div className="p-4 space-y-2.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{event.title}</h3>
            {event.sport && <Badge variant="outline" className="text-xs shrink-0">{event.sport}</Badge>}
          </div>
          {match?.reason && (
            <p className="text-xs text-purple-600 mt-1 flex items-start gap-1">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{match.reason}</span>
            </p>
          )}
        </div>

        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-red-900" />
            <span>{moment(event.date).format("ddd, MMM D")} · {moment(event.date).format("h:mm A")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {event.is_virtual ? (
              <><Video className="w-3.5 h-3.5 text-indigo-500" /><span>Virtual Event</span></>
            ) : (
              <><MapPin className="w-3.5 h-3.5 text-red-900" /><span className="truncate">{[event.city, event.country].filter(Boolean).join(", ") || event.location || "TBA"}</span></>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.attendees?.length || 0} attending</span>
            {event.price > 0
              ? <span className="flex items-center gap-1 text-green-700 font-semibold"><DollarSign className="w-3.5 h-3.5" />{event.price}</span>
              : <span className="text-green-600 font-semibold">Free</span>
            }
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleRSVP}
            disabled={loading}
            size="sm"
            className={`flex-1 rounded-xl text-xs font-semibold h-8 ${
              isRSVPd
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                : "bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white"
            }`}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : isRSVPd ? <><CheckCircle2 className="w-3 h-3 mr-1" />Registered</> : "Register"}
          </Button>
          <Button onClick={addToCalendar} variant="outline" size="sm" className="rounded-xl px-2.5 h-8 border-gray-200">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AIEventRecommendations({ user, allEvents, onRSVP }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const getRecommendations = async () => {
    if (!user) return;
    setLoading(true);

    // Gather context about the user
    const [sportProfiles, attendedEvents, feedPrefs] = await Promise.all([
      base44.entities.SportProfile.filter({ user_email: user.email }),
      base44.entities.Event.filter({ attendees: user.email }),
      base44.entities.FeedPreferences.filter({ user_email: user.email }),
    ]);

    const userSports = sportProfiles.map(p => p.sport).filter(Boolean);
    const userLocation = sportProfiles.find(p => p.location)?.location || "";
    const pastSports = attendedEvents.map(e => e.sport).filter(Boolean);
    const pastTypes = attendedEvents.map(e => e.event_type).filter(Boolean);
    const preferredSports = feedPrefs[0]?.preferred_sports || [];

    const upcomingEvents = allEvents
      .filter(e => moment(e.date).isAfter(moment()))
      .filter(e => !e.attendees?.includes(user.email))
      .slice(0, 50);

    if (upcomingEvents.length === 0) {
      setRecommendations([]);
      setHasLoaded(true);
      setLoading(false);
      return;
    }

    const eventsContext = upcomingEvents.map(e => ({
      id: e.id,
      title: e.title,
      sport: e.sport,
      type: e.event_type,
      date: e.date,
      city: e.city,
      country: e.country,
      is_virtual: e.is_virtual,
      price: e.price,
      attendees: e.attendees?.length || 0,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports event recommendation engine. Given a user's profile and a list of upcoming events, recommend the TOP 6 most relevant events for them.

USER PROFILE:
- Sports: ${[...userSports, ...preferredSports].join(", ") || "General sports interest"}
- Location: ${userLocation || "Not specified"}
- Past event types attended: ${[...new Set(pastTypes)].join(", ") || "None yet"}
- Sports from past events: ${[...new Set(pastSports)].join(", ") || "None yet"}

UPCOMING EVENTS (JSON):
${JSON.stringify(eventsContext, null, 2)}

Return a JSON object with a "recommendations" array of up to 6 objects:
- "event_id": the event's id string
- "score": a short string like "98% match" or "Great fit"
- "reason": a single short sentence (max 12 words) explaining why this event matches the user

Prioritize: sport match > location match > past attendance patterns > free/affordable > virtual if no location match.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_id: { type: "string" },
                score: { type: "string" },
                reason: { type: "string" },
              }
            }
          }
        }
      }
    });

    const recs = result?.recommendations || [];
    const enriched = recs
      .map(r => {
        const event = upcomingEvents.find(e => e.id === r.event_id);
        return event ? { event, match: { score: r.score, reason: r.reason } } : null;
      })
      .filter(Boolean);

    setRecommendations(enriched);
    setHasLoaded(true);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">AI Event Recommendations</h2>
              <p className="text-sm text-gray-500 mt-0.5">Personalized picks based on your sports, location, and past events</p>
            </div>
          </div>
          {hasLoaded && (
            <Button
              onClick={getRecommendations}
              variant="outline"
              size="sm"
              disabled={loading}
              className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {!hasLoaded && (
          <Button
            onClick={getRecommendations}
            disabled={loading}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing your profile...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Find Events For Me</>
            )}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
          <p className="text-gray-600 font-medium">AI is finding your perfect events…</p>
          <p className="text-xs text-gray-400">Analyzing your sports, location, and attendance history</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasLoaded && recommendations.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-gray-700">No recommendations yet</p>
          <p className="text-sm text-gray-400 mt-1">Add sport profiles or wait for new events to be added</p>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <>
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{recommendations.length}</span> events handpicked for you
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map(({ event, match }) => (
              <RecommendedEventCard
                key={event.id}
                event={event}
                match={match}
                currentUser={user}
                onRSVP={onRSVP}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}