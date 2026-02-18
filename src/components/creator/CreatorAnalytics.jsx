import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Radio, Eye, Heart, UserPlus, Loader2 } from "lucide-react";
import moment from "moment";

function StatCard({ icon: Icon, label, value, sub, color = "text-red-800" }) {
  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function CreatorAnalytics({ user, timeRange = 30 }) {
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - timeRange);
    return d;
  }, [timeRange]);

  const { data: streams = [], isLoading: loadStreams } = useQuery({
    queryKey: ["creator-streams-analytics", user?.email],
    queryFn: () => base44.entities.LiveStream.filter({ host_email: user.email }, "-started_at", 60),
    enabled: !!user,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["creator-followers-analytics", user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user.email }),
    enabled: !!user,
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["creator-subs-analytics", user?.email],
    queryFn: () => base44.entities.CreatorSubscription.filter({ creator_email: user.email }),
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["creator-tx-analytics", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ to_email: user.email, status: "completed" }),
    enabled: !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["creator-posts-analytics", user?.email],
    queryFn: () => base44.entities.Post.filter({ author_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const recentStreams = streams.filter(s => new Date(s.started_at) >= cutoff);
  const recentFollowers = followers.filter(f => new Date(f.created_date) >= cutoff);
  const recentTx = transactions.filter(t => new Date(t.created_date) >= cutoff);
  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const recentRevenue = recentTx.reduce((s, t) => s + (t.amount || 0), 0);
  const totalViewers = streams.reduce((s, st) => s + (st.viewers?.length || 0), 0);
  const avgViewers = streams.length ? Math.round(totalViewers / streams.length) : 0;

  // Build follower growth chart (last 30 days)
  const followerGrowthData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, "days");
      const count = followers.filter(f => moment(f.created_date).isSameOrBefore(date, "day")).length;
      days.push({ date: date.format("MMM D"), followers: count });
    }
    return days;
  }, [followers]);

  // Stream performance chart
  const streamData = useMemo(() =>
    recentStreams.slice(0, 10).reverse().map(s => ({
      name: s.title?.slice(0, 15) + (s.title?.length > 15 ? "…" : ""),
      viewers: s.viewers?.length || 0,
      date: moment(s.started_at).format("MMM D"),
    })),
    [recentStreams]
  );

  // Revenue breakdown
  const revenueByDay = useMemo(() => {
    const map = {};
    recentTx.forEach(t => {
      const d = moment(t.created_date).format("MMM D");
      map[d] = (map[d] || 0) + (t.amount || 0);
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount })).slice(-14);
  }, [recentTx]);

  // Subscriber tiers
  const tierData = useMemo(() => {
    const map = {};
    subscribers.forEach(s => { map[s.tier || "basic"] = (map[s.tier || "basic"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [subscribers]);

  const PIE_COLORS = ["#7f1d1d", "#b91c1c", "#ef4444", "#f97316"];

  if (loadStreams) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Revenue" value={`$${recentRevenue.toFixed(0)}`} sub={`$${totalRevenue.toFixed(0)} all-time`} color="text-green-700" />
        <StatCard icon={Users} label="Followers" value={followers.length} sub={`+${recentFollowers.length} this period`} color="text-blue-700" />
        <StatCard icon={Radio} label="Streams" value={recentStreams.length} sub={`Avg ${avgViewers} viewers`} color="text-red-700" />
        <StatCard icon={UserPlus} label="Subscribers" value={subscribers.filter(s => s.status === "active").length} sub={`${subscribers.filter(s => s.status === "cancelled").length} churned`} color="text-purple-700" />
      </div>

      {/* Follower Growth */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Follower Growth (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followerGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={followerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip />
                <Line type="monotone" dataKey="followers" stroke="#1d4ed8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">No follower data yet</div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Stream Performance */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-700" /> Stream Viewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {streamData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={streamData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={25} />
                  <Tooltip />
                  <Bar dataKey="viewers" fill="#7f1d1d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No recent streams</div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-700" /> Daily Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={revenueByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, "Revenue"]} />
                  <Bar dataKey="amount" fill="#15803d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No revenue data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscriber tiers + top streams */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" /> Subscriber Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tierData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={tierData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                      {tierData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {tierData.map((t, i) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="capitalize text-gray-700">{t.name}</span>
                      </div>
                      <Badge variant="secondary">{t.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No subscribers yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-600" /> Top Streams by Viewers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {streams.sort((a, b) => (b.viewers?.length || 0) - (a.viewers?.length || 0)).slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{s.title}</p>
                  <p className="text-[10px] text-gray-400">{moment(s.started_at).format("MMM D")}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-700 flex-shrink-0">
                  <Eye className="w-3 h-3" /> {s.viewers?.length || 0}
                </div>
              </div>
            ))}
            {streams.length === 0 && <div className="text-center py-4 text-gray-400 text-sm">No streams yet</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}