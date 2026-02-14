import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Video, Calendar, Users, DollarSign, Plus, Loader2, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateSessionDialog from "../components/coaching/CreateSessionDialog";
import moment from "moment";

export default function LiveCoaching() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["coaching-sessions", filter],
    queryFn: async () => {
      const all = await base44.entities.CoachingSession.list("-scheduled_date", 50);
      const now = new Date();
      
      if (filter === "live") {
        return all.filter(s => s.status === "live");
      } else if (filter === "upcoming") {
        return all.filter(s => new Date(s.scheduled_date) > now && s.status === "scheduled");
      } else if (filter === "my-sessions") {
        return all.filter(s => s.participants?.includes(user?.email));
      }
      return all;
    },
    enabled: (filter !== "my-sessions") || !!user,
  });

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-700",
      live: "bg-red-100 text-red-700",
      ended: "bg-gray-100 text-gray-700",
      cancelled: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-3 mb-3">
              <Video className="w-10 h-10" />
              Live Coaching
            </h1>
            <p className="text-white/90 text-lg">Join live sessions, workshops, and Q&A with top coaches</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "upcoming", label: "Upcoming", icon: Calendar },
          { value: "live", label: "Live Now", icon: Video },
          { value: "my-sessions", label: "My Sessions", icon: Users },
        ].map(f => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 ${
                filter === f.value
                  ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : sessions?.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-20 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sessions?.map(session => (
            <Link
              key={session.id}
              to={createPageUrl("CoachingSessionDetail") + `?id=${session.id}`}
              className="group"
            >
              <Card className="bg-white border-gray-200 hover:border-red-900 hover:shadow-xl transition-all">
                {session.image_url && (
                  <div className="h-40 overflow-hidden rounded-t-lg">
                    <img
                      src={session.image_url}
                      alt={session.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-900 transition-colors mb-2">
                        {session.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        {session.session_type && (
                          <Badge className="bg-gray-100 text-gray-700 capitalize">
                            {session.session_type}
                          </Badge>
                        )}
                        {session.sport && (
                          <Badge className="bg-red-100 text-red-900">{session.sport}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{session.description}</p>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {moment(session.scheduled_date).format("MMM D, YYYY [at] h:mm A")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {session.duration_minutes} minutes
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {session.participants?.length || 0}
                      {session.max_participants && ` / ${session.max_participants}`} participants
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-gray-200">
                        <AvatarImage src={session.host_avatar} />
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                          {session.host_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-gray-500">Hosted by</p>
                        <p className="font-semibold text-gray-900 text-sm">{session.host_name}</p>
                      </div>
                    </div>
                    {session.is_paid ? (
                      <div className="flex items-center gap-1 text-red-900 font-bold">
                        <DollarSign className="w-4 h-4" />
                        {session.price}
                      </div>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Free</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Session Dialog */}
      {showCreateDialog && user && (
        <CreateSessionDialog
          user={user}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}