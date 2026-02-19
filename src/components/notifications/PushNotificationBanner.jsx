import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, UserPlus, AtSign, Bell, Radio, DollarSign, Trophy, X, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP = {
  like: { icon: Heart, color: "text-red-500", bg: "bg-red-50" },
  comment: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
  mention: { icon: AtSign, color: "text-orange-500", bg: "bg-orange-50" },
  follow: { icon: UserPlus, color: "text-green-500", bg: "bg-green-50" },
  follow_request: { icon: UserPlus, color: "text-amber-500", bg: "bg-amber-50" },
  message: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
  live_stream: { icon: Radio, color: "text-red-600", bg: "bg-red-50" },
  advice_request: { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50" },
  tip: { icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  subscription: { icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  challenge_update: { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
};

// Critical types that always show a push banner
const CRITICAL_TYPES = ["follow", "follow_request", "message", "mention", "advice_request", "tip"];

export default function PushNotificationBanner({ user }) {
  const [toasts, setToasts] = useState([]);
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!user) return;

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (
        event.type === "create" &&
        event.data?.recipient_email === user.email &&
        CRITICAL_TYPES.includes(event.data?.type) &&
        !seenIds.current.has(event.id)
      ) {
        seenIds.current.add(event.id);
        const notif = { ...event.data, id: event.id };
        setToasts(prev => [notif, ...prev].slice(0, 3));

        // Auto-dismiss after 5s
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== event.id));
        }, 5000);
      }
    });

    return unsub;
  }, [user]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const getLink = (notif) => {
    if (notif.conversation_id) return createPageUrl("Messages") + `?conv=${notif.conversation_id}`;
    if (notif.type === "follow" || notif.type === "follow_request") return createPageUrl("Notifications");
    if (notif.type === "advice_request") return createPageUrl("Advice");
    return createPageUrl("Notifications");
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map(notif => {
          const config = ICON_MAP[notif.type] || { icon: Bell, color: "text-slate-500", bg: "bg-slate-50" };
          const Icon = config.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <Link to={getLink(notif)} onClick={() => dismiss(notif.id)}>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-3 flex items-start gap-3 hover:shadow-2xl transition-shadow cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notif.actor_avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-400 text-white text-sm font-bold">
                        {notif.actor_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${config.bg} rounded-full flex items-center justify-center border border-white`}>
                      <Icon className={`w-2.5 h-2.5 ${config.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 leading-snug">
                      <span className="font-bold">{notif.actor_name}</span>{" "}
                      <span className="text-slate-600">{notif.message}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">{notif.type?.replace("_", " ")}</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); dismiss(notif.id); }}
                    className="flex-shrink-0 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}