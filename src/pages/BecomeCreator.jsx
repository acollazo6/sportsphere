import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown, Video, DollarSign, Users, Radio, ShoppingBag,
  Trophy, Check, ArrowRight, Sparkles, BarChart2, Loader2,
  Zap, Star, Play, TrendingUp
} from "lucide-react";

const BENEFITS = [
  { icon: Video, title: "Go Live & Stream", desc: "Broadcast training sessions, game day reactions, and coaching tips in real-time.", color: "bg-red-50 text-red-600" },
  { icon: DollarSign, title: "Monetize Your Content", desc: "Earn through subscriptions, tips, and selling digital products like training plans.", color: "bg-green-50 text-green-600" },
  { icon: Users, title: "Grow Your Community", desc: "Build a loyal fanbase and engage with followers through exclusive content.", color: "bg-blue-50 text-blue-600" },
  { icon: BarChart2, title: "Creator Analytics", desc: "Track your growth, engagement, and revenue with detailed analytics.", color: "bg-purple-50 text-purple-600" },
  { icon: ShoppingBag, title: "Sell Products & Courses", desc: "Create and sell training programs, courses, and merchandise.", color: "bg-amber-50 text-amber-600" },
  { icon: Trophy, title: "Host Premium Challenges", desc: "Run exclusive paid challenges and competitions for your audience.", color: "bg-orange-50 text-orange-600" },
];

const STEPS = [
  { num: 1, title: "Set up your profile", desc: "Add a bio, profile photo, and sport profiles to establish your identity." },
  { num: 2, title: "Go Live or Post Content", desc: "Start streaming training sessions or posting videos and tips." },
  { num: 3, title: "Set up Monetization", desc: "Connect your payment method and create subscription tiers." },
  { num: 4, title: "Grow & Earn", desc: "Engage your audience and start earning from your passion." },
];

export default function BecomeCreator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setEnabled(!!u.is_creator);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  const handleBecomeCreator = async () => {
    setEnabling(true);
    await base44.auth.updateMe({ is_creator: true });
    setEnabled(true);
    setEnabling(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-10 text-white text-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #f97316 0%, transparent 60%), radial-gradient(circle at 70% 50%, #3b82f6 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-black mb-3">Become a Creator</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Share your passion for sports, grow your audience, and turn your expertise into income.
          </p>
          {enabled ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-semibold">You're a Creator!</span>
              </div>
              <Link to={createPageUrl("CreatorHub")}>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white font-bold px-8 rounded-2xl h-12 gap-2">
                  Go to Creator Hub <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              onClick={handleBecomeCreator}
              disabled={enabling || !user}
              className="mt-6 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white font-bold px-10 rounded-2xl h-12 gap-2 shadow-xl"
            >
              {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {enabling ? "Setting up…" : "Get Started — It's Free"}
            </Button>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 text-center mb-6">Everything you need to succeed</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${b.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{b.title}</h3>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 text-center mb-6">How it works</h2>
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg">
                {step.num}
              </div>
              <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="absolute left-9 mt-10 h-4 w-px bg-slate-200" style={{ marginLeft: "1.2rem" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats / Social Proof */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-slate-900">Join thousands of sport creators</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: "Creators", value: "10K+" },
            { label: "Videos Posted", value: "500K+" },
            { label: "Avg Monthly Earnings", value: "$850" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-black text-orange-600">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      {!enabled && (
        <div className="text-center">
          <Button
            onClick={handleBecomeCreator}
            disabled={enabling || !user}
            className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold px-12 rounded-2xl h-12 gap-2"
          >
            {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4 text-amber-400" />}
            {enabling ? "Setting up…" : "Become a Creator Now"}
          </Button>
          <p className="text-xs text-slate-400 mt-3">Free to start · No credit card required</p>
        </div>
      )}
    </div>
  );
}