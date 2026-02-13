import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import moment from "moment";

export default function StatsChart({ stats, sport }) {
  if (!stats || stats.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No stats logged yet</p>
          <p className="text-slate-400 text-xs mt-1">Start tracking your performance!</p>
        </CardContent>
      </Card>
    );
  }

  // Extract unique metric names
  const metricNames = [...new Set(stats.flatMap(s => s.metrics?.map(m => m.name) || []))];

  // Prepare data for charts
  const getChartData = (metricName) => {
    return stats
      .filter(s => s.metrics?.some(m => m.name === metricName))
      .map(s => {
        const metric = s.metrics.find(m => m.name === metricName);
        return {
          date: moment(s.date).format("MMM D"),
          value: metric?.value || 0,
          fullDate: s.date,
        };
      })
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
      .slice(-10); // Last 10 entries
  };

  const calculateTrend = (metricName) => {
    const data = getChartData(metricName);
    if (data.length < 2) return null;
    
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    const change = ((latest - previous) / previous * 100).toFixed(1);
    
    return { change, isPositive: change > 0 };
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={metricNames[0]} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-slate-50 p-1">
            {metricNames.slice(0, 6).map(metric => (
              <TabsTrigger
                key={metric}
                value={metric}
                className="flex-1 min-w-[80px] text-xs rounded-lg data-[state=active]:bg-white"
              >
                {metric}
              </TabsTrigger>
            ))}
          </TabsList>

          {metricNames.map(metric => {
            const chartData = getChartData(metric);
            const trend = calculateTrend(metric);
            const unit = stats
              .flatMap(s => s.metrics)
              .find(m => m.name === metric)?.unit || "";

            return (
              <TabsContent key={metric} value={metric} className="mt-4 space-y-3">
                {/* Trend indicator */}
                {trend && (
                  <div className="flex items-center gap-2 text-sm">
                    {trend.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                      {trend.change > 0 ? "+" : ""}{trend.change}%
                    </span>
                    <span className="text-slate-400 text-xs">vs last session</span>
                  </div>
                )}

                {/* Line Chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                      formatter={(value) => [`${value} ${unit}`, metric]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: "#f97316", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Best</p>
                    <p className="text-lg font-bold text-slate-900">
                      {Math.max(...chartData.map(d => d.value))}
                      <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Average</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1)}
                      <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Latest</p>
                    <p className="text-lg font-bold text-slate-900">
                      {chartData[chartData.length - 1]?.value || 0}
                      <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
                    </p>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}