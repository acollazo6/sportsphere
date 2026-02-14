import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Loader2, Settings, Trophy, Radio, DollarSign, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";
import NotificationSettingsDialog from "../components/notifications/NotificationSettingsDialog";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data.recipient_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    });
    
    return unsubscribe;
  }, [user, queryClient]);

  const { data: allNotifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 100),
    enabled: !!user,
  });

  const notifications = allNotifications?.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.type === filter;
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = async () => {
    const unreadNotifs = allNotifications?.filter(n => !n.is_read) || [];
    await Promise.all(unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const deleteNotification = async (notifId) => {
    await base44.entities.Notification.delete(notifId);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const getIcon = (type) => {
    switch (type) {
      case "like": return <Heart className="w-5 h-5 text-red-500" />;
      case "comment": return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "mention": return <AtSign className="w-5 h-5 text-orange-500" />;
      case "follow": return <UserPlus className="w-5 h-5 text-green-500" />;
      case "challenge_update": return <Trophy className="w-5 h-5 text-amber-500" />;
      case "live_stream": return <Radio className="w-5 h-5 text-red-500" />;
      case "tip": return <DollarSign className="w-5 h-5 text-green-500" />;
      case "subscription": return <DollarSign className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationLink = (notif) => {
    if (notif.post_id) return createPageUrl("Feed");
    if (notif.challenge_id) return createPageUrl("ChallengeDetail") + `?id=${notif.challenge_id}`;
    if (notif.conversation_id) return createPageUrl("Messages") + `?conv=${notif.conversation_id}`;
    return createPageUrl("Profile");
  };

  const filterOptions = [
    { value: "all", label: "All", icon: Bell },
    { value: "unread", label: "Unread", icon: Bell },
    { value: "like", label: "Likes", icon: Heart },
    { value: "comment", label: "Comments", icon: MessageCircle },
    { value: "follow", label: "Follows", icon: UserPlus },
    { value: "mention", label: "Mentions", icon: AtSign },
    { value: "challenge_update", label: "Challenges", icon: Trophy },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Bell className="w-8 h-8" />
              Notifications
            </h1>
            <p className="text-slate-300 mt-2">
              {allNotifications?.filter(n => !n.is_read).length || 0} unread notifications
            </p>
          </div>
          <div className="flex gap-2">
            {allNotifications?.some(n => !n.is_read) && (
              <Button onClick={markAllAsRead} variant="outline" className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10">
                Mark all read
              </Button>
            )}
            <Button onClick={() => setShowSettings(true)} variant="outline" className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(option => {
          const Icon = option.icon;
          const count = option.value === "all" 
            ? allNotifications?.length 
            : option.value === "unread"
            ? allNotifications?.filter(n => !n.is_read).length
            : allNotifications?.filter(n => n.type === option.value).length;
          
          return (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 ${
                filter === option.value
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {option.label}
              <Badge className="bg-slate-700 text-slate-200">{count || 0}</Badge>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {notifications?.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/80 rounded-3xl border border-slate-700">
          <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No notifications</p>
          <p className="text-slate-500 text-sm mt-1">
            {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications?.map(notif => (
            <div
              key={notif.id}
              className={`bg-slate-900/90 rounded-2xl border-2 overflow-hidden transition-all hover:scale-[1.01] ${
                !notif.is_read ? "border-cyan-400/40 shadow-lg shadow-cyan-400/10" : "border-slate-700"
              }`}
            >
              <Link
                to={getNotificationLink(notif)}
                onClick={() => !notif.is_read && markAsReadMutation.mutate(notif.id)}
                className="block p-4"
              >
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={notif.actor_avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-semibold">
                      {notif.actor_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-slate-200">
                          <span className="font-bold text-cyan-400">{notif.actor_name}</span> {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-slate-500">{moment(notif.created_date).fromNow()}</p>
                          {!notif.is_read && (
                            <Badge className="bg-cyan-500 text-white text-xs">New</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getIcon(notif.type)}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <span className="text-slate-500 text-xs">✕</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Settings Dialog */}
      {showSettings && user && (
        <NotificationSettingsDialog
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}