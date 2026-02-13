import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 100),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = async () => {
    const unreadNotifs = notifications?.filter(n => !n.is_read) || [];
    await Promise.all(unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const getIcon = (type) => {
    switch (type) {
      case "like": return <Heart className="w-5 h-5 text-red-500" />;
      case "comment": return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "mention": return <AtSign className="w-5 h-5 text-orange-500" />;
      case "follow": return <UserPlus className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {notifications?.filter(n => !n.is_read).length || 0} unread
          </p>
        </div>
        {notifications?.some(n => !n.is_read) && (
          <Button onClick={markAllAsRead} variant="outline" className="rounded-xl">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map(notif => (
            <Link
              key={notif.id}
              to={notif.post_id ? createPageUrl("Feed") : createPageUrl("Profile")}
              onClick={() => !notif.is_read && markAsReadMutation.mutate(notif.id)}
              className={`block bg-white rounded-2xl border p-4 hover:shadow-md transition-all ${
                !notif.is_read ? "border-orange-200 bg-orange-50/30" : "border-slate-100"
              }`}
            >
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={notif.actor_avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white font-semibold">
                    {notif.actor_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">{notif.actor_name}</span> {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{moment(notif.created_date).fromNow()}</p>
                    </div>
                    <div className="flex-shrink-0">{getIcon(notif.type)}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}