import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Eye, ThumbsUp, Plus, Search, TrendingUp, Pin, Flame } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "training_tips", label: "Training Tips", icon: "💪" },
  { value: "workout_plans", label: "Workout Plans", icon: "📋" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "injury_prevention", label: "Injury Prevention", icon: "🩹" },
  { value: "gear_reviews", label: "Gear Reviews", icon: "⚙️" },
  { value: "motivation", label: "Motivation", icon: "🔥" },
  { value: "general_discussion", label: "General Discussion", icon: "💬" },
];

const SPORTS = ["All Sports", "Basketball", "Soccer", "Football", "Tennis", "Running", "Cycling", "Gym/Fitness", "Yoga", "Swimming", "Boxing", "Other"];

export default function Forums() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general_discussion",
    sport: "",
    tags: [],
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["forums"],
    queryFn: () => base44.entities.Forum.list("-last_activity", 100),
  });

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = !searchQuery || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || topic.category === selectedCategory;
    const matchesSport = selectedSport === "All Sports" || topic.sport === selectedSport;
    return matchesSearch && matchesCategory && matchesSport;
  });

  const handleCreateTopic = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const topic = await base44.entities.Forum.create({
        ...formData,
        author_email: user.email,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        replies_count: 0,
        views: 0,
        likes: [],
        last_activity: new Date().toISOString(),
      });

      toast.success("Topic created!");
      setShowCreateDialog(false);
      navigate(createPageUrl(`ForumTopic?id=${topic.id}`));
    } catch (error) {
      toast.error("Failed to create topic");
    }
  };

  const getCategoryData = (value) => CATEGORIES.find(c => c.value === value) || CATEGORIES[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">Community Forums</h1>
            <p className="text-white/90 text-lg">Share knowledge, connect with athletes, and grow together</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-white text-red-900 hover:bg-gray-100 font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Topic
            </Button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`p-4 rounded-xl border-2 transition-all text-center ${
            selectedCategory === "all"
              ? "border-red-900 bg-red-50"
              : "border-gray-200 hover:border-red-300"
          }`}
        >
          <div className="text-2xl mb-1">🌟</div>
          <p className="text-xs font-semibold text-gray-900">All Topics</p>
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedCategory === cat.value
                ? "border-red-900 bg-red-50"
                : "border-gray-200 hover:border-red-300"
            }`}
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <p className="text-xs font-semibold text-gray-900">{cat.label}</p>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="pl-10 border-gray-300"
          />
        </div>
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger className="w-48 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading topics...</div>
        ) : filteredTopics.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No topics found. Be the first to start a discussion!</p>
            </CardContent>
          </Card>
        ) : (
          filteredTopics.map(topic => {
            const category = getCategoryData(topic.category);
            return (
              <Link
                key={topic.id}
                to={createPageUrl(`ForumTopic?id=${topic.id}`)}
              >
                <Card className="border-gray-200 hover:shadow-lg transition-all hover:border-red-300">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <Avatar className="w-12 h-12 border-2 border-gray-200">
                        <AvatarImage src={topic.author_avatar} />
                        <AvatarFallback className="bg-gray-200 text-gray-700">
                          {topic.author_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {topic.is_pinned && <Pin className="w-4 h-4 text-red-900" />}
                              <h3 className="text-lg font-bold text-gray-900 truncate">{topic.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{topic.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className="bg-red-100 text-red-900 text-xs">
                            {category.icon} {category.label}
                          </Badge>
                          {topic.sport && (
                            <Badge variant="outline" className="text-xs">{topic.sport}</Badge>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 ml-auto">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {topic.replies_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {topic.views}
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {topic.likes?.length || 0}
                            </div>
                            <span className="text-gray-400">
                              {moment(topic.last_activity || topic.created_date).fromNow()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Create Topic Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create New Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-700">Title*</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What's your topic about?"
                className="border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-700">Content*</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your thoughts, tips, or questions..."
                className="border-gray-300 resize-none"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Category*</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700">Sport (Optional)</Label>
                <Select value={formData.sport} onValueChange={(v) => setFormData({ ...formData, sport: v })}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.filter(s => s !== "All Sports").map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTopic}
                className="flex-1 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700"
              >
                Create Topic
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}