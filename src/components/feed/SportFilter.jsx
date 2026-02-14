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
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/50 scale-110"
              : "bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:shadow-lg hover:scale-105 border-2 border-purple-100"
          }`}
        >
          <span>{sport.emoji}</span>
          <span>{sport.name}</span>
        </button>
      ))}
    </div>
  );
}