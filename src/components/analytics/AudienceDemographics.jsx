import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Crown, Globe } from "lucide-react";

export default function AudienceDemographics({ followers, subscribers, posts }) {
  const sportData = useMemo(() => {
    const sportCounts = {};
    posts.forEach(post => {
      if (post.sport) {
        sportCounts[post.sport] = (sportCounts[post.sport] || 0) + 1;
      }
    });
    
    return Object.entries(sportCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [posts]);

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-6">
      <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-400" />
        Audience Insights
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-cyan-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-slate-200">Total Followers</h3>
              </div>
              <p className="text-2xl font-black text-blue-400">{followers.length}</p>
            </div>
            <p className="text-sm text-slate-500">
              People following your content
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-5 border border-amber-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-200">Subscribers</h3>
              </div>
              <p className="text-2xl font-black text-amber-400">{subscribers.length}</p>
            </div>
            <p className="text-sm text-slate-500">
              Premium content subscribers
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-5 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-200">Reach</h3>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {posts.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Total content impressions
            </p>
          </div>
        </div>

        {/* Sport Distribution */}
        <div>
          <h3 className="font-bold text-slate-300 mb-3">Content by Sport</h3>
          {sportData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #06b6d4",
                      borderRadius: "12px",
                      color: "#e2e8f0"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {sportData.map((sport, index) => (
                  <div key={sport.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-400">{sport.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-300">{sport.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">
              <p className="text-sm">No sport data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}