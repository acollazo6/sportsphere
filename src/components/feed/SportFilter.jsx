import React from "react";

const SPORTS = [
  { name: "All", emoji: "🌟" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Soccer", emoji: "⚽" },
  { name: "Football", emoji: "🏈" },
  { name: "Baseball", emoji: "⚾" },
  { name: "Tennis", emoji: "🎾" },
  { name: "Golf", emoji: "⛳" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Boxing", emoji: "🥊" },
  { name: "MMA", emoji: "🥋" },
  { name: "Track", emoji: "🏃" },
  { name: "Volleyball", emoji: "🏐" },
  { name: "Hockey", emoji: "🏒" },
  { name: "Cycling", emoji: "🚴" },
  { name: "Yoga", emoji: "🧘" },
  { name: "CrossFit", emoji: "💪" },
];

export default function SportFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1">
      {SPORTS.map(sport => (
        <button
          key={sport.name}
          onClick={() => onSelect(sport.name === "All" ? null : sport.name)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
            (selected === null && sport.name === "All") || selected === sport.name
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/50 scale-110 border border-cyan-400/50"
              : "bg-slate-900/80 backdrop-blur-sm text-slate-400 hover:bg-slate-800 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 border-2 border-slate-700"
          }`}
        >
          <span>{sport.emoji}</span>
          <span>{sport.name}</span>
        </button>
      ))}
    </div>
  );
}