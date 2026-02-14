import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, MapPin, Users, Clock, DollarSign, Video, ExternalLink, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { toast } from "sonner";

const eventTypeColors = {
  competition: "bg-red-50 text-red-700 border-red-200",
  workshop: "bg-blue-50 text-blue-700 border-blue-200",
  meetup: "bg-green-50 text-green-700 border-green-200",
  training: "bg-purple-50 text-purple-700 border-purple-200",
  tournament: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const eventTypeIcons = {
  competition: "🏆",
  workshop: "📚",
  meetup: "👥",
  training: "💪",
  tournament: "🥇",
  other: "📅",
};

export default function EventCard({ event, currentUser, onUpdate }) {
  const [isRSVPd, setIsRSVPd] = useState(event.attendees?.includes(currentUser?.email));
  const [attendeeCount, setAttendeeCount] = useState(event.attendees?.length || 0);

  const handleRSVP = async () => {
    if (!currentUser) {
      toast.error("Please login to RSVP");
      return;
    }

    const newAttendees = isRSVPd
      ? (event.attendees || []).filter(e => e !== currentUser.email)
      : [...(event.attendees || []), currentUser.email];

    if (!isRSVPd && event.max_attendees && newAttendees.length > event.max_attendees) {
      toast.error("Event is full");
      return;
    }

    await base44.entities.Event.update(event.id, { attendees: newAttendees });
    setIsRSVPd(!isRSVPd);
    setAttendeeCount(newAttendees.length);
    toast.success(isRSVPd ? "RSVP cancelled" : "RSVP confirmed!");
    onUpdate?.();
  };

  const downloadICS = () => {
    const startDate = moment(event.date).format('YYYYMMDDTHHmmss');
    const endDate = event.end_date 
      ? moment(event.end_date).format('YYYYMMDDTHHmmss')
      : moment(event.date).add(2, 'hours').format('YYYYMMDDTHHmmss');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SportHub//Event//EN
BEGIN:VEVENT
UID:${event.id}@sporthub.com
DTSTAMP:${moment().format('YYYYMMDDTHHmmss')}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.is_virtual ? event.meeting_link || 'Online' : event.location || ''}
ORGANIZER:CN=${event.creator_name}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Event added to calendar!");
  };

  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;
  const isPast = moment(event.date).isBefore(moment());

  return (
    <article className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {event.image_url && (
        <div className="h-40 bg-slate-100 relative overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          {isPast && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold">Event Ended</span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${eventTypeColors[event.event_type]} border rounded-lg text-xs font-medium`}>
                {eventTypeIcons[event.event_type]} {event.event_type}
              </Badge>
              {event.sport && (
                <Badge variant="secondary" className="rounded-lg text-xs">
                  {event.sport}
                </Badge>
              )}
              {event.is_virtual && (
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 rounded-lg text-xs">
                  <Video className="w-3 h-3 mr-1" /> Virtual
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{moment(event.date).format('MMM D, YYYY')}</span>
            <Clock className="w-4 h-4 text-slate-400 ml-2" />
            <span>{moment(event.date).format('h:mm A')}</span>
          </div>
          
          {event.is_virtual ? (
            event.meeting_link && (
              <div className="flex items-center gap-2 text-slate-600">
                <Video className="w-4 h-4 text-slate-400" />
                <a 
                  href={event.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Join Online <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate">{event.location || 'Location TBA'}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span>
                {attendeeCount} {event.max_attendees ? `/ ${event.max_attendees}` : ''} attending
              </span>
            </div>
            {event.price > 0 && (
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span>${event.price}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Avatar className="w-8 h-8">
            <AvatarImage src={event.creator_avatar} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-xs font-semibold">
              {event.creator_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">Organized by</p>
            <p className="text-sm font-medium text-slate-900 truncate">{event.creator_name}</p>
          </div>
        </div>

        {currentUser && !isPast && (
          <div className="flex gap-2">
            <Button
              onClick={handleRSVP}
              disabled={!isRSVPd && isFull}
              className={`flex-1 rounded-xl ${
                isRSVPd
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  : "bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white"
              }`}
            >
              {isRSVPd ? "Cancel RSVP" : isFull ? "Event Full" : "RSVP"}
            </Button>
            <Button
              onClick={downloadICS}
              variant="outline"
              className="rounded-xl px-3"
              title="Add to Calendar"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}