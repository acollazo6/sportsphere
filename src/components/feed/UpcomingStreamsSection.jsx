import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Bell, BellOff, Crown, DollarSign, Users, Radio, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import moment from "moment";
import { toast } from "sonner";

function StreamCard({ stream, user, reminders, onReminderToggle }) {
  const isReminderSet = reminders?.includes(stream.id);
  const isOwn = stream.host_email === user?.email;
  const startsIn = moment(stream.scheduled_at).fromNow();
  const isSoon = moment(stream.scheduled_at).diff(moment(), "hours") <= 24;

  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-red-200 transition-all">
      {/* Top color bar */}
      <div className={`h-1.5 w-full ${isSoon ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`} />

      <div className="p-4 space-y-3">
        {/* Host */}
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("UserProfile") + `?email=${stream.host_email}`}>
            <Avatar className="w-7 h-7">
              <AvatarImage src={stream.host_avatar} />
              <AvatarFallback className="text-[10px] bg-red-100 text-red-700 font-bold">{stream.host_name?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <Link to={createPageUrl("UserProfile") + `?email=${stream.host_email}`} className="text-xs font-semibold text-gray-700 hover:text-red-700 truncate">
            {stream.host_name}
          </Link>
          {isSoon && <Badge className="ml-auto bg-red-100 text-red-700 text-[9px] px-1.5 py-0 flex-shrink-0">Soon</Badge>}
        </div>

        {/* Title */}
        <p className="text-sm font-black text-gray-900 leading-snug line-clamp-2">{stream.title}</p>

        {/* Meta */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3 h-3 flex-shrink-0 text-purple-500" />
            <span>{moment(stream.scheduled_at).format("MMM D, YYYY")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3 flex-shrink-0 text-blue-500" />
            <span>{moment(stream.scheduled_at).format("h:mm A")} · {stream.duration_minutes}min</span>
          </div>
          {stream.rsvp_emails?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>{stream.rsvp_emails.length} going</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {stream.sport && <Badge variant="secondary" className="text-[10px] px-2">{stream.sport}</Badge>}
          {stream.is_premium && (
            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-2 gap-0.5">
              <Crown className="w-2.5 h-2.5" /> Premium
            </Badge>
          )}
          {stream.price > 0 && !stream.is_premium && (
            <Badge className="bg-green-100 text-green-700 text-[10px] px-2 gap-0.5">
              <DollarSign className="w-2.5 h-2.5" />{stream.price}
            </Badge>
          )}
          {!stream.is_premium && !stream.price && (
            <Badge className="bg-blue-100 text-blue-700 text-[10px] px-2">Free</Badge>
          )}
        </div>

        {/* Starts in + Reminder */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400 font-medium">{startsIn}</span>
          {user && !isOwn && (
            <button
              onClick={() => onReminderToggle(stream)}
              className={`flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 transition-all
                ${isReminderSet
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-700"}`}
            >
              {isReminderSet ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
              {isReminderSet ? "Remind" : "Remind Me"}
            </button>
          )}
          {isOwn && (
            <Badge className="bg-slate-100 text-slate-500 text-[10px]">Your stream</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UpcomingStreamsSection({ user }) {
  const qc = useQueryClient();

  const { data: streams = [] } = useQuery({
    queryKey: ["upcoming-streams-feed"],
    queryFn: () => base44.entities.ScheduledStream.filter({ status: "upcoming" }, "scheduled_at", 20),
    refetchInterval: 60000,
  });

  // Load user reminders (RSVPs)
  const { data: myRsvps = [] } = useQuery({
    queryKey: ["my-rsvps", user?.email],
    queryFn: async () => {
      const all = await base44.entities.ScheduledStream.filter({ status: "upcoming" }, "scheduled_at", 50);
      return all.filter(s => s.rsvp_emails?.includes(user.email)).map(s => s.id);
    },
    enabled: !!user,
  });

  const upcoming = streams.filter(s => new Date(s.scheduled_at) > new Date());

  const toggleReminder = async (stream) => {
    if (!user) return toast.error("Log in to set reminders");
    const hasRsvp = stream.rsvp_emails?.includes(user.email);
    const updated = hasRsvp
      ? stream.rsvp_emails.filter(e => e !== user.email)
      : [...(stream.rsvp_emails || []), user.email];

    await base44.entities.ScheduledStream.update(stream.id, { rsvp_emails: updated });
    qc.invalidateQueries({ queryKey: ["upcoming-streams-feed"] });
    qc.invalidateQueries({ queryKey: ["my-rsvps", user?.email] });

    if (!hasRsvp) {
      toast.success("Reminder set! We'll notify you before the stream. 🔔");
    } else {
      toast.success("Reminder removed.");
    }
  };

  if (upcoming.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Upcoming Streams</h2>
          <Badge className="bg-red-100 text-red-700 font-bold text-xs">{upcoming.length}</Badge>
        </div>
        <Link to={createPageUrl("Live")} className="text-xs text-slate-500 hover:text-red-600 font-semibold flex items-center gap-0.5 transition-colors">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {upcoming.map(stream => (
          <StreamCard
            key={stream.id}
            stream={stream}
            user={user}
            reminders={myRsvps}
            onReminderToggle={toggleReminder}
          />
        ))}
      </div>
    </div>
  );
}