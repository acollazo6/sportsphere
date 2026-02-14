import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ icon: Icon, label, value, change, iconColor = "text-cyan-400" }) {
  const hasChange = change !== undefined;
  const isPositive = change > 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/20 shadow-xl shadow-cyan-500/10 p-6 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/20 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-xs font-bold ${
            isPositive ? "text-emerald-400" : "text-slate-500"
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? `+${change}` : change || "0"}
          </div>
        )}
      </div>
      <p className="text-3xl font-black text-slate-200 mb-1 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}