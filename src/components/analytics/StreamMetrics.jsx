import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Radio } from "lucide-react";

export default function StreamMetrics({ streams, timeRange }) {
  const chartData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    
    const filteredStreams = streams.filter(s => new Date(s.started_at) >= cutoffDate);
    
    return filteredStreams
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, 10)
      .map(stream => ({
        title: stream.title.length > 20 ? stream.title.substring(0, 20) + "..." : stream.title,
        viewers: stream.viewers?.length || 0,
        duration: stream.ended_at 
          ? Math.round((new Date(stream.ended_at) - new Date(stream.started_at)) / 60000) 
          : 0,
      }))
      .reverse();
  }, [streams, timeRange]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-6">
      <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Radio className="w-5 h-5 text-red-400" />
        Stream Performance
      </h2>
      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="title" 
                stroke="#64748b" 
                style={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Bar 
                dataKey="viewers" 
                fill="url(#barGradient)" 
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-cyan-500/10">
              <p className="text-2xl font-bold text-slate-200">
                {streams.filter(s => s.status === "live").length}
              </p>
              <p className="text-sm text-slate-500">Active Streams</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-cyan-500/10">
              <p className="text-2xl font-bold text-slate-200">
                {Math.round(chartData.reduce((sum, s) => sum + s.duration, 0) / Math.max(chartData.length, 1))}m
              </p>
              <p className="text-sm text-slate-500">Avg Duration</p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-slate-500">
          <div className="text-center">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No streams in this period</p>
          </div>
        </div>
      )}
    </div>
  );
}