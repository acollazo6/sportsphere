import React from "react";
import { Users, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function GroupCard({ group, currentUser, onUpdate }) {
  const isMember = group.members?.includes(currentUser?.email);

  return (
    <Link to={createPageUrl("GroupDetail") + `?id=${group.id}`}>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="h-32 bg-gradient-to-br from-orange-500 to-amber-400" />
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{group.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2">{group.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {group.sport && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                {group.sport}
              </Badge>
            )}
            {group.location && (
              <Badge variant="outline" className="text-xs gap-1">
                <MapPin className="w-3 h-3" />
                {group.location}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{group.members?.length || 0}</span>
            </div>
            {isMember && (
              <Badge className="bg-green-100 text-green-700 text-xs">Member</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}