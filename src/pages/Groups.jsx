import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, MapPin, TrendingUp, Loader2 } from "lucide-react";
import GroupCard from "../components/groups/GroupCard";
import CreateGroupDialog from "../components/groups/CreateGroupDialog";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "all", label: "All Groups" },
  { value: "sport_specific", label: "Sport-Specific" },
  { value: "training_goal", label: "Training Goals" },
  { value: "local_community", label: "Local Community" },
  { value: "competition", label: "Competition" },
  { value: "social", label: "Social" },
];

export default function Groups() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allGroups, isLoading, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list("-created_date", 100),
  });

  const groups = allGroups?.filter(group => {
    const matchesSearch = !searchQuery || 
      group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.sport?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || group.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const myGroups = groups?.filter(g => g.members?.includes(user?.email));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Groups & Clubs</h1>
                <p className="text-slate-300 text-sm md:text-base">Connect with athletes who share your passion</p>
              </div>
              {user && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Group</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search groups by name, sport, or interest..."
              className="pl-12 rounded-xl bg-white border-slate-200 h-12"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  categoryFilter === cat.value
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* My Groups */}
        {myGroups && myGroups.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              My Groups
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map(group => (
                <GroupCard key={group.id} group={group} currentUser={user} onUpdate={refetch} />
              ))}
            </div>
          </div>
        )}

        {/* All Groups */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            {categoryFilter === "all" ? "Discover Groups" : CATEGORIES.find(c => c.value === categoryFilter)?.label}
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : groups?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No groups found</p>
              <p className="text-slate-400 text-sm mt-1">Try a different search or create one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => (
                <GroupCard key={group.id} group={group} currentUser={user} onUpdate={refetch} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateGroupDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        onSuccess={refetch}
      />
    </div>
  );
}