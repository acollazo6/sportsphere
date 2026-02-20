import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Home, User, MessageCircle, Search, Bell, Plus, Menu, X, Trophy, Flame, Globe, Sparkles, Radio, Activity, Bookmark, Crown, Video, Shield, ShieldAlert, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translations } from "./components/translations";
import RecommendationNotification from "./components/notifications/RecommendationNotification";
import SupportChatWidget from "./components/messages/SupportChatWidget";
import PushNotificationBanner from "./components/notifications/PushNotificationBanner";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("sporthub_language");
    return saved || navigator.language.split("-")[0] || "en";
  });

  const t = (key) => translations[language]?.[key] || translations["en"]?.[key] || key;

  useEffect(() => {
    localStorage.setItem("sporthub_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    base44.entities.Conversation.filter({ unread_by: user.email }).then(convos => {
      setUnreadCount(convos.length);
    });
  }, [user]);

  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }).then(notifs => {
      setNotifCount(notifs.length);
    });
  }, [user]);

  const navItems = [
    { name: "GitHub Export", page: "GitHubExport", icon: Shield },
    { name: "Moderation", page: "ModerationQueue", icon: ShieldAlert },
    { name: t("feed"), page: "Feed", icon: Home },
    { name: "For You", page: "ForYou", icon: Sparkles },
    { name: "Reels", page: "Reels", icon: Flame },
    { name: "Discover", page: "Discover", icon: Search },
    { name: t("explore"), page: "Explore", icon: Globe },
    { name: "Events", page: "Events", icon: Trophy },
    { name: "Forums", page: "Forums", icon: MessageCircle },
    { name: "Groups", page: "Groups", icon: Globe },
    { name: "Challenges", page: "Challenges", icon: Trophy },
    { name: "Live Coaching", page: "LiveCoaching", icon: Video },
    { name: "AI Coach", page: "Coach", icon: Sparkles },
    { name: "Team Health", page: "AdminHealth", icon: Shield },
    { name: "Creator AI", page: "CreatorAI", icon: Sparkles },
    { name: "Analytics", page: "Analytics", icon: Activity },
    { name: "Saved", page: "SavedContent", icon: Bookmark },
    { name: "Creator Hub", page: "CreatorHub", icon: Crown },
    { name: "Premium", page: "Premium", icon: Crown },
    { name: "Leaderboard", page: "Leaderboard", icon: Trophy },
    { name: t("messages"), page: "Messages", icon: MessageCircle, badge: unreadCount },
    { name: "Notifications", page: "Notifications", icon: Bell, badge: notifCount },
    { name: t("advice"), page: "Advice", icon: Trophy },
    { name: t("profile"), page: "Profile", icon: User },
    { name: "Profile Settings", page: "ProfileSettings", icon: Settings },
  ];

  if (currentPageName === "Login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <RecommendationNotification user={user} />
      <SupportChatWidget user={user} />
      <PushNotificationBanner user={user} />
      <style>{`
          :root {
            --brand: #1a3a6b;
            --brand-accent: #f97316;
            --brand-light: #38bdf8;
            --brand-green: #22c55e;
          }
          body {
            background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f0fdf4 100%);
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(26, 58, 107, 0.4); }
            50% { box-shadow: 0 0 40px rgba(26, 58, 107, 0.7); }
          }
          @keyframes neon-pulse {
            0%, 100% { box-shadow: 0 0 15px rgba(249, 115, 22, 0.5), 0 0 30px rgba(249, 115, 22, 0.3); }
            50% { box-shadow: 0 0 25px rgba(249, 115, 22, 0.7), 0 0 50px rgba(249, 115, 22, 0.5); }
          }
        `}</style>

      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2.5 group">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f6f4f4e61dd2806b88ed2/15137601c_392DC896-FFC0-4491-BCB6-20C0C160BF03.png"
              alt="SportSphere"
              className="w-10 h-10 object-contain group-hover:scale-110 transition-all duration-300"
            />
            <span className="text-xl font-black tracking-tight text-red-900 hidden sm:block">{t("appName")}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-xl shadow-red-900/50 scale-105"
                      : "text-gray-600 hover:text-red-900 hover:bg-gray-100 hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-900 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl border-gray-300 gap-2 hidden sm:flex">
                <Globe className="w-4 h-4 text-gray-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en"><span className="flex items-center gap-2"><span>🇬🇧</span> English</span></SelectItem>
                <SelectItem value="es"><span className="flex items-center gap-2"><span>🇪🇸</span> Español</span></SelectItem>
                <SelectItem value="fr"><span className="flex items-center gap-2"><span>🇫🇷</span> Français</span></SelectItem>
                <SelectItem value="de"><span className="flex items-center gap-2"><span>🇩🇪</span> Deutsch</span></SelectItem>
                <SelectItem value="pt"><span className="flex items-center gap-2"><span>🇧🇷</span> Português</span></SelectItem>
                <SelectItem value="zh"><span className="flex items-center gap-2"><span>🇨🇳</span> 中文</span></SelectItem>
                <SelectItem value="ja"><span className="flex items-center gap-2"><span>🇯🇵</span> 日本語</span></SelectItem>
                <SelectItem value="ar"><span className="flex items-center gap-2"><span>🇸🇦</span> العربية</span></SelectItem>
                <SelectItem value="hi"><span className="flex items-center gap-2"><span>🇮🇳</span> हिन्दी</span></SelectItem>
                <SelectItem value="ru"><span className="flex items-center gap-2"><span>🇷🇺</span> Русский</span></SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Link to={createPageUrl("Live")}>
                  <Button variant="outline" className="rounded-2xl gap-2 hidden sm:flex border-red-300 text-red-900 hover:bg-red-50 hover:border-red-900 font-bold shadow transition-all">
                    <Radio className="w-4 h-4" />
                    Live
                  </Button>
                </Link>
                <Link to={createPageUrl("CreatePost")}>
                  <Button className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white rounded-2xl shadow-xl hover:shadow-2xl gap-2 hidden sm:flex font-bold transition-all duration-300 hover:scale-105">
                    <Plus className="w-4 h-4" />
                    {t("post")}
                  </Button>
                </Link>
            </div>
            {user && (
              <Link to={createPageUrl("Profile")}>
                <Avatar className="w-9 h-9 ring-2 ring-gray-300">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-semibold">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100 hover:text-red-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {item.badge > 0 && (
                    <span className="ml-auto w-5 h-5 bg-red-900 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="pt-16 pb-20 md:pb-8">
        {children}
      </main>

      {/* Footer Links */}
      <footer className="hidden md:block max-w-6xl mx-auto px-4 py-6 text-center space-y-2 border-t border-gray-200 mt-8">
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <Link to={createPageUrl("Terms")} className="hover:text-red-900 transition-colors">
            Terms of Service
          </Link>
          <Link to={createPageUrl("Guidelines")} className="hover:text-red-900 transition-colors">
            Community Guidelines
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          SportHub is for sports-related content only. No politics, religion, sexual content, or discrimination.
        </p>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-2xl border-t border-gray-200 shadow-2xl">
        <div className="flex items-center justify-around py-2">
          {navItems.filter(item => ["Feed", "Discover", "Reels", "Explore", "Messages"].includes(item.page)).map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? "text-red-900 scale-110" : "text-gray-500 hover:text-red-900"
              }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-lg" : ""}`} />
                <span className={`text-[10px] font-bold ${isActive ? "text-red-900" : ""}`}>{item.name}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-lg">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}