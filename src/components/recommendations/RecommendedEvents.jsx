import React from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { CalendarDays, MapPin, Globe } from "lucide-react";
import { format } from "date-fns";

export default function RecommendedEvents({ events = [] }) {
  if (!events.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Upcoming Events Near You</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events.slice(0, 4).map(event => (
          <Link
            key={event.id}
            to={createPageUrl("Events")}
            className="block bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 rounded-2xl p-4 transition-all hover:scale-[1.01]"
          >
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-full h-24 object-cover rounded-xl mb-3" />
            )}
            <p className="font-bold text-white text-sm truncate">{event.title}</p>
            <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
              {event.is_virtual
                ? <><Globe className="w-3 h-3" /> Virtual</>
                : <><MapPin className="w-3 h-3" /> {event.city || event.location}</>
              }
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.sport && <Badge className="bg-amber-500/20 text-amber-300 text-xs">{event.sport}</Badge>}
              <span className="text-xs text-slate-500">
                {event.date ? format(new Date(event.date), "MMM d, yyyy") : ""}
              </span>
              {event.price === 0
                ? <span className="text-xs text-green-400 font-semibold">Free</span>
                : <span className="text-xs text-green-400 font-semibold">${event.price}</span>
              }
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}