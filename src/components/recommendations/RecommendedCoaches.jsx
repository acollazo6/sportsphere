import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Video, Star, Users } from "lucide-react";

export default function RecommendedCoaches({ sessions = [], userSports = [] }) {
  if (!sessions.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold text-white">Coaches for You</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sessions.slice(0, 4).map(session => (
          <Link
            key={session.id}
            to={createPageUrl("LiveCoaching")}
            className="block bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 rounded-2xl p-4 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={session.host_avatar} />
                <AvatarFallback className="bg-blue-700 text-white font-bold">
                  {session.host_name?.[0]?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{session.title}</p>
                <p className="text-slate-400 text-xs">{session.host_name}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {session.sport && (
                    <Badge className="bg-blue-500/20 text-blue-300 text-xs">{session.sport}</Badge>
                  )}
                  {session.is_paid ? (
                    <span className="text-xs text-green-400 font-semibold">${session.price}</span>
                  ) : (
                    <span className="text-xs text-green-400 font-semibold">Free</span>
                  )}
                  {session.participants?.length > 0 && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />{session.participants.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}