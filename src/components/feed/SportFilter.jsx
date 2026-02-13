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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            (selected === null && sport.name === "All") || selected === sport.name
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
              : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
          }`}
        >
          <span>{sport.emoji}</span>
          <span>{sport.name}</span>
        </button>
      ))}
    </div>
  );
}