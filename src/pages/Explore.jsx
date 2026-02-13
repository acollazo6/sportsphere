import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Search, Loader2, MapPin, Trophy, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SportFilter from "../components/feed/SportFilter";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["explore-profiles", sportFilter],
    queryFn: () => {
      if (sportFilter) {
        return base44.entities.SportProfile.filter({ sport: sportFilter }, "-created_date", 50);
      }
      return base44.entities.SportProfile.list("-created_date", 50);
    },
  });

  const filteredProfiles = profiles?.filter(p =>
    !search || 
    p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sport?.toLowerCase().includes(search.toLowerCase()) ||
    p.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Explore Athletes</h1>
        <p className="text-slate-500 text-sm mt-1">Discover coaches, athletes, and trainers across all sports</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, sport, or team..."
          className="pl-12 h-12 rounded-xl bg-white border-slate-100 text-sm focus:ring-2 focus:ring-orange-200"
        />
      </div>

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
    </div>
  );
}