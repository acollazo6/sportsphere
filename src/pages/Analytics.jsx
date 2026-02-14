import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Eye, Heart, MessageCircle, Users, DollarSign, Radio, Activity, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import MetricCard from "../components/analytics/MetricCard";
import EngagementChart from "../components/analytics/EngagementChart";
import StreamMetrics from "../components/analytics/StreamMetrics";
import AudienceDemographics from "../components/analytics/AudienceDemographics";

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState("30"); // days

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      window.location.href = createPageUrl("Login");
    });
  }, []);

  // Fetch user's posts
  const { data: posts = [] } = useQuery({
    queryKey: ["analytics-posts", user?.email],
    queryFn: () => base44.entities.Post.filter({ author_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  // Fetch user's streams
  const { data: streams = [] } = useQuery({
    queryKey: ["analytics-streams", user?.email],
    queryFn: () => base44.entities.LiveStream.filter({ host_email: user.email }, "-started_at"),
    enabled: !!user,
  });

  // Fetch followers
  const { data: followers = [] } = useQuery({
    queryKey: ["analytics-followers", user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user.email }),
    enabled: !!user,
  });

  // Fetch subscriptions (people subscribed to this user)
  const { data: subscribers = [] } = useQuery({
    queryKey: ["analytics-subscribers", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ creator_email: user.email, status: "active" }),
    enabled: !!user,
  });

  // Fetch revenue
  const { data: transactions = [] } = useQuery({
    queryKey: ["analytics-transactions", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ to_email: user.email, status: "completed" }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate metrics
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalStreamViewers = streams.reduce((sum, s) => sum + (s.viewers?.length || 0), 0);
  const avgEngagementRate = posts.length > 0 
    ? (((totalLikes + totalComments) / posts.length) / Math.max(followers.length, 1) * 100).toFixed(1)
    : 0;

  // Filter data by time range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
  
  const recentPosts = posts.filter(p => new Date(p.created_date) >= cutoffDate);
  const recentStreams = streams.filter(s => new Date(s.started_at) >= cutoffDate);
  const recentFollowers = followers.filter(f => new Date(f.created_date) >= cutoffDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl shadow-cyan-500/20 border border-cyan-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Creator Analytics</h1>
            </div>
            <p className="text-slate-400 text-lg">Track your performance and grow your audience 📊</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { label: "7 Days", value: "7" },
            { label: "30 Days", value: "30" },
            { label: "90 Days", value: "90" },
            { label: "All Time", value: "999999" },
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                timeRange === range.value
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/50"
                  : "bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Eye}
            label="Total Views"
            value={totalViews.toLocaleString()}
            change={recentPosts.reduce((sum, p) => sum + (p.views || 0), 0)}
            iconColor="text-cyan-400"
          />
          <MetricCard
            icon={Heart}
            label="Total Likes"
            value={totalLikes.toLocaleString()}
            change={recentPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0)}
            iconColor="text-pink-400"
          />
          <MetricCard
            icon={Users}
            label="Followers"
            value={followers.length.toLocaleString()}
            change={recentFollowers.length}
            iconColor="text-blue-400"
          />
          <MetricCard
            icon={DollarSign}
            label="Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            change={transactions.filter(t => new Date(t.created_date) >= cutoffDate).reduce((sum, t) => sum + t.amount, 0)}
            iconColor="text-emerald-400"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <MetricCard
            icon={MessageCircle}
            label="Comments"
            value={totalComments.toLocaleString()}
            iconColor="text-purple-400"
          />
          <MetricCard
            icon={Radio}
            label="Stream Viewers"
            value={totalStreamViewers.toLocaleString()}
            iconColor="text-red-400"
          />
          <MetricCard
            icon={TrendingUp}
            label="Engagement Rate"
            value={`${avgEngagementRate}%`}
            iconColor="text-amber-400"
          />
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <EngagementChart posts={posts} timeRange={parseInt(timeRange)} />
          <StreamMetrics streams={streams} timeRange={parseInt(timeRange)} />
        </div>

        {/* Audience Demographics */}
        <AudienceDemographics 
          followers={followers}
          subscribers={subscribers}
          posts={posts}
        />

        {/* Recent Posts Performance */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Top Performing Posts
          </h2>
          <div className="space-y-3">
            {posts
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 5)
              .map(post => (
                <Link
                  key={post.id}
                  to={createPageUrl("Feed")}
                  className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-cyan-500/10 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {post.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(post.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span>{post.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            {posts.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No posts yet. Start creating content!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}