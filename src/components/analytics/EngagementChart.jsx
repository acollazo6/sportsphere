import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Activity } from "lucide-react";

export default function EngagementChart({ posts, timeRange }) {
  const chartData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    
    const filteredPosts = posts.filter(p => new Date(p.created_date) >= cutoffDate);
    
    // Group by date
    const dateMap = {};
    filteredPosts.forEach(post => {
      const date = new Date(post.created_date).toLocaleDateString();
      if (!dateMap[date]) {
        dateMap[date] = { date, views: 0, likes: 0, comments: 0 };
      }
      dateMap[date].views += post.views || 0;
      dateMap[date].likes += post.likes?.length || 0;
      dateMap[date].comments += post.comments_count || 0;
    });

    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [posts, timeRange]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-6">
      <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-cyan-400" />
        Engagement Over Time
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            style={{ fontSize: 12 }}
          />
          <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#1e293b", 
              border: "1px solid #06b6d4",
              borderRadius: "12px",
              color: "#e2e8f0"
            }}
          />
          <Area 
            type="monotone" 
            dataKey="views" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorViews)" 
          />
          <Area 
            type="monotone" 
            dataKey="likes" 
            stroke="#ec4899" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorLikes)" 
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
          <span className="text-sm text-slate-400 font-medium">Views</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-400"></div>
          <span className="text-sm text-slate-400 font-medium">Likes</span>
        </div>
      </div>
    </div>
  );
}