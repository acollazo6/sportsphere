import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check } from "lucide-react";
import moment from "moment";

export default function EventCard({ event, currentUser, onUpdate }) {
  const [isAttending, setIsAttending] = useState(event.attendees?.includes(currentUser?.email));
  const isFull = event.max_attendees && event.attendees?.length >= event.max_attendees;

  const toggleAttendance = async () => {
    const newAttendees = isAttending
      ? event.attendees?.filter(e => e !== currentUser.email) || []
      : [...(event.attendees || []), currentUser.email];
    
    setIsAttending(!isAttending);
    await base44.entities.Event.update(event.id, { attendees: newAttendees });
    onUpdate?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">{event.title}</h3>
        <p className="text-sm text-slate-600">{event.description}</p>
      </div>

      <div className="space-y-2 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>{moment(event.date).format("MMM D, YYYY · h:mm A")}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>{event.location}</span>
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

      <Button
        onClick={toggleAttendance}
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
            Attending
          </>
        ) : isFull ? (
          "Event Full"
        ) : (
          "Attend Event"
        )}
      </Button>
    </div>
  );
}