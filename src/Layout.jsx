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

  const navItems = [
    { name: t("feed"), page: "Feed", icon: Home },
    { name: "Reels", page: "Reels", icon: Flame },
    { name: t("explore"), page: "Explore", icon: Search },
    { name: "Groups", page: "Groups", icon: Globe },
    { name: "AI Coach", page: "Coach", icon: Sparkles },
    { name: t("messages"), page: "Messages", icon: MessageCircle, badge: unreadCount },
    { name: t("advice"), page: "Advice", icon: Trophy },
    { name: t("profile"), page: "Profile", icon: User },
  ];

  if (currentPageName === "Login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --brand: #0f172a;
          --brand-accent: #f97316;
          --brand-light: #fff7ed;
        }
      `}</style>

      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">{t("appName")}</span>
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
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
                <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex border-red-200 text-red-600 hover:bg-red-50">
                  <Radio className="w-4 h-4" />
                  Live
                </Button>
              </Link>
              <Link to={createPageUrl("CreatePost")}>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-orange-500/25 gap-2 hidden sm:flex">
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
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <div className="flex items-center justify-around py-2">
          {navItems.filter(item => ["Feed", "Reels", "Explore", "Groups", "Coach"].includes(item.page)).map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? "text-orange-500" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
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