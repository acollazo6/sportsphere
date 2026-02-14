import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles, Zap, TrendingUp, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Premium() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isPremium = user?.is_premium && user?.premium_expires && new Date(user.premium_expires) > new Date();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Set premium for 1 month (in production, integrate with Stripe)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      await base44.auth.updateMe({
        is_premium: true,
        premium_expires: expiryDate.toISOString()
      });
      
      toast.success("Welcome to Premium! 🎉");
      setUser({ ...user, is_premium: true, premium_expires: expiryDate.toISOString() });
    } catch (error) {
      toast.error("Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        is_premium: false,
        premium_expires: null
      });
      
      toast.success("Subscription cancelled");
      setUser({ ...user, is_premium: false, premium_expires: null });
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/50">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent mb-3">
            SportHub Premium
          </h1>
          <p className="text-slate-400 text-xl">
            Unlock AI-powered features to elevate your sports journey
          </p>
        </div>

        {/* Status Card */}
        {isPremium ? (
          <Card className="bg-gradient-to-r from-amber-900/40 via-orange-900/40 to-amber-900/40 border-amber-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-amber-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Premium Active</h2>
                    <p className="text-slate-400">
                      Renews on {new Date(user.premium_expires).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCancel}
                  disabled={loading}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/60 backdrop-blur-xl border-amber-500/30 mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">$9.99</div>
                <p className="text-slate-400 mb-6">per month</p>
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-white text-lg py-6 px-12 shadow-xl shadow-amber-500/50"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Subscribe Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Coach</h3>
              <p className="text-slate-400 mb-4">
                Get personalized training advice, workout plans, and nutrition guidance from your AI coach.
              </p>
              <ul className="space-y-2">
                {["Personalized training plans", "Real-time form feedback", "Nutrition recommendations"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-xl border-purple-500/20">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Creator AI</h3>
              <p className="text-slate-400 mb-4">
                Generate engaging content ideas, captions, hashtags, and video scripts with AI.
              </p>
              <ul className="space-y-2">
                {["Trending post ideas", "Viral captions", "Smart hashtags"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-purple-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-xl border-orange-500/20">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Expert Advice</h3>
              <p className="text-slate-400 mb-4">
                Request advice from pro athletes and get AI-enhanced responses and insights.
              </p>
              <ul className="space-y-2">
                {["Unlimited advice requests", "Priority responses", "AI insights"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-orange-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-xl border-green-500/20">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
              <p className="text-slate-400 mb-4">
                Get AI-powered insights into your performance and content engagement.
              </p>
              <ul className="space-y-2">
                {["Performance predictions", "Growth recommendations", "Trend analysis"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Free Features Notice */}
        <Card className="bg-slate-900/40 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-slate-400">
              <span className="font-bold text-white">Everything else is free!</span> Posts, reels, groups, events, live streaming, messaging, and more - all included at no cost.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}