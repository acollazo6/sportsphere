import React, { useState, useEffect } from "react";

const REACTIONS = ["🔥", "👏", "💪", "⚡", "🎯", "🏆", "❤️", "😮"];

export default function LiveReactions({ streamId, user }) {
  const [floating, setFloating] = useState([]);
  const [counts, setCounts] = useState({});

  const sendReaction = async (emoji) => {
    const id = Date.now();
    setFloating(prev => [...prev, { id, emoji, x: Math.random() * 60 + 20 }]);
    setTimeout(() => setFloating(prev => prev.filter(r => r.id !== id)), 2500);
    setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  };

  return (
    <div className="relative">
      {/* Floating reactions */}
      <div className="pointer-events-none absolute bottom-12 left-0 right-0 h-40 overflow-hidden">
        {floating.map(r => (
          <div
            key={r.id}
            className="absolute text-2xl animate-bounce"
            style={{
              left: `${r.x}%`,
              bottom: 0,
              animation: "floatUp 2.5s ease-out forwards"
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Reaction buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="text-lg hover:scale-125 transition-transform active:scale-95 relative"
            title={`React with ${emoji}`}
          >
            {emoji}
            {counts[emoji] > 0 && (
              <span className="absolute -top-2 -right-2 text-[9px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {counts[emoji] > 99 ? "99" : counts[emoji]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}