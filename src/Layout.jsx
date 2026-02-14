import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Home, User, MessageCircle, Search, Bell, Plus, Menu, X, Trophy, Flame, Globe, Sparkles, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translations } from "./components/translations";

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
    { name: t("feed"), page: "Feed", icon: Home },
    { name: "Reels", page: "Reels", icon: Flame },
    { name: t("explore"), page: "Explore", icon: Search },
    { name: "Groups", page: "Groups", icon: Globe },
    { name: "AI Coach", page: "Coach", icon: Sparkles },
    { name: t("messages"), page: "Messages", icon: MessageCircle, badge: unreadCount },
    { name: "Notifications", page: "Notifications", icon: Bell, badge: notifCount },
    { name: t("advice"), page: "Advice", icon: Trophy },
    { name: t("profile"), page: "Profile", icon: User },
  ];

  if (currentPageName === "Login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style>{`
        :root {
          --brand: #0f172a;
          --brand-accent: #06b6d4;
          --brand-light: #1e293b;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
          50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.7); }
        }
        @keyframes neon-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.5), 0 0 30px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.7), 0 0 50px rgba(6, 182, 212, 0.5); }
        }
      `}</style>

      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:shadow-xl group-hover:shadow-cyan-500/60 transition-all duration-300 group-hover:scale-110 animate-pulse">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hidden sm:block">{t("appName")}</span>
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
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/50 scale-105"
                      : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-500 to-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg shadow-pink-500/50 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl border-slate-200 gap-2 hidden sm:flex">
                <Globe className="w-4 h-4 text-slate-500" />
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
                  <Button variant="outline" className="rounded-2xl gap-2 hidden sm:flex border-red-500/50 bg-red-950/50 text-red-400 hover:bg-red-900/50 hover:border-red-400 font-bold shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all">
                    <Radio className="w-4 h-4 animate-pulse" />
                    Live
                  </Button>
                </Link>
                <Link to={createPageUrl("CreatePost")}>
                  <Button className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white rounded-2xl shadow-xl shadow-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/60 gap-2 hidden sm:flex font-bold transition-all duration-300 hover:scale-105">
                    <Plus className="w-4 h-4" />
                    {t("post")}
                  </Button>
                </Link>
            </div>
            {user && (
              <Link to={createPageUrl("Profile")}>
                <Avatar className="w-9 h-9 ring-2 ring-slate-100">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-slate-200 text-slate-600 text-sm font-semibold">
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
          <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/20 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-cyan-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {item.badge > 0 && (
                    <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-t border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-around py-2">
          {navItems.filter(item => ["Feed", "Reels", "Explore", "Groups", "Coach"].includes(item.page)).map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? "text-cyan-400 scale-110" : "text-slate-500 hover:text-cyan-400"
              }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-lg" : ""}`} />
                <span className={`text-[10px] font-bold ${isActive ? "text-cyan-400" : ""}`}>{item.name}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
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