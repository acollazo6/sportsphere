import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Home, User, MessageCircle, Search, Bell, Plus, Menu, X, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
    { name: "Feed", page: "Feed", icon: Home },
    { name: "Explore", page: "Explore", icon: Search },
    { name: "Messages", page: "Messages", icon: MessageCircle, badge: unreadCount },
    { name: "Advice", page: "Advice", icon: Trophy },
    { name: "Profile", page: "Profile", icon: User },
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
            <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">SportHub</span>
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
            <Link to={createPageUrl("CreatePost")}>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-orange-500/25 gap-2 hidden sm:flex">
                <Plus className="w-4 h-4" />
                Post
              </Button>
            </Link>
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
          {navItems.map(item => {
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
          <Link
            to={createPageUrl("CreatePost")}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}