import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function MentionInput({ value, onChange, placeholder, className }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    const lastAtIndex = value.lastIndexOf("@", cursorPosition);
    if (lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1, cursorPosition);
      if (query.length > 0 && !query.includes(" ")) {
        setMentionQuery(query);
        searchUsers(query);
      } else if (query.length === 0) {
        setShowSuggestions(true);
        searchUsers("");
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorPosition]);

  const searchUsers = async (query) => {
    const users = await base44.entities.User.list();
    const filtered = users.filter(u => 
      u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const insertMention = (user) => {
    const lastAtIndex = value.lastIndexOf("@", cursorPosition);
    const before = value.substring(0, lastAtIndex);
    const after = value.substring(cursorPosition);
    const newValue = before + `@${user.full_name} ` + after;
    onChange(newValue);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
        onClick={(e) => setCursorPosition(e.target.selectionStart)}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
          {suggestions.map(user => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-white font-semibold text-sm">
                {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}