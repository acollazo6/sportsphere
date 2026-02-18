import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";

const SPORTS = ["All", "Basketball", "Soccer", "Football", "Baseball", "Tennis", "Track & Field", "Swimming", "Cycling", "CrossFit", "Weightlifting", "Martial Arts", "Other"];
const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Viewers" },
  { value: "duration_asc", label: "Shortest First" },
  { value: "duration_desc", label: "Longest First" },
];

export default function StreamSearch({ filters, onChange }) {
  const hasFilters = filters.query || filters.sport !== "all" || filters.sort !== "recent";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-bold text-slate-700">Filter & Search</span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-slate-400 hover:text-slate-700 gap-1"
            onClick={() => onChange({ query: "", sport: "all", sort: "recent" })}
          >
            <X className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={filters.query}
            onChange={e => onChange({ ...filters, query: e.target.value })}
            placeholder="Search by title or creator..."
            className="pl-9 rounded-xl h-9 text-sm"
          />
        </div>
        <Select value={filters.sport} onValueChange={v => onChange({ ...filters, sport: v })}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl h-9 text-sm">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            {SPORTS.map(s => <SelectItem key={s} value={s === "All" ? "all" : s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={v => onChange({ ...filters, sort: v })}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl h-9 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}