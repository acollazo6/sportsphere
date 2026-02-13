import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, MessageSquare, Settings, ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import GroupPostCard from "../components/groups/GroupPostCard";
import CreatePostDialog from "../components/groups/CreatePostDialog";
import EventCard from "../components/groups/EventCard";
import CreateEventDialog from "../components/groups/CreateEventDialog";

export default function GroupDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => base44.entities.Group.filter({ id: groupId }).then(g => g[0]),
    enabled: !!groupId,
  });

  const { data: posts, refetch: refetchPosts } = useQuery({
    queryKey: ["group-posts", groupId],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, "-created_date", 50),
    enabled: !!groupId,
  });

  const { data: events, refetch: refetchEvents } = useQuery({
    queryKey: ["group-events", groupId],
    queryFn: () => base44.entities.Event.filter({ group_id: groupId }, "date", 50),
    enabled: !!groupId,
  });

  const isMember = group?.members?.includes(user?.email);
  const isAdmin = group?.admins?.includes(user?.email);

  const joinGroup = async () => {
    await base44.entities.Group.update(groupId, {
      members: [...(group.members || []), user.email],
    });
    queryClient.invalidateQueries({ queryKey: ["group", groupId] });
  };

  const leaveGroup = async () => {
    await base44.entities.Group.update(groupId, {
      members: group.members.filter(m => m !== user.email),
    });
    queryClient.invalidateQueries({ queryKey: ["group", groupId] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-br from-orange-500 to-amber-400" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link to={createPageUrl("Groups")} className="text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
                </div>
                <p className="text-slate-600 mb-3">{group.description}</p>
                <div className="flex flex-wrap gap-2">
                  {group.sport && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                      {group.sport}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    {group.category?.replace(/_/g, " ")}
                  </Badge>
                  {group.location && (
                    <Badge variant="outline" className="gap-1">
                      <span>📍</span> {group.location}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    {group.members?.length || 0} members
                  </Badge>
                </div>
              </div>
              {user && (
                <div className="flex gap-2">
                  {isMember ? (
                    <Button onClick={leaveGroup} variant="outline" className="rounded-xl">
                      Leave Group
                    </Button>
                  ) : (
                    <Button onClick={joinGroup} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white gap-2">
                      <UserPlus className="w-4 h-4" />
                      Join Group
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        {isMember && (
          <Tabs defaultValue="discussions" className="space-y-4">
            <TabsList className="bg-white border border-slate-100 p-1 rounded-xl">
              <TabsTrigger value="discussions" className="rounded-lg gap-2">
                <MessageSquare className="w-4 h-4" />
                Discussions
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-lg gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="members" className="rounded-lg gap-2">
                <Users className="w-4 h-4" />
                Members
              </TabsTrigger>
            </TabsList>

            {/* Discussions */}
            <TabsContent value="discussions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Discussions</h2>
                <Button onClick={() => setShowCreatePost(true)} className="rounded-xl bg-slate-900 gap-2">
                  <MessageSquare className="w-4 h-4" />
                  New Discussion
                </Button>
              </div>
              <div className="space-y-3">
                {posts?.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">No discussions yet. Start one!</p>
                  </div>
                ) : (
                  posts?.map(post => (
                    <GroupPostCard key={post.id} post={post} currentUser={user} onUpdate={refetchPosts} />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Events */}
            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Upcoming Events</h2>
                <Button onClick={() => setShowCreateEvent(true)} className="rounded-xl bg-slate-900 gap-2">
                  <Calendar className="w-4 h-4" />
                  Create Event
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {events?.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">No events scheduled</p>
                  </div>
                ) : (
                  events?.map(event => (
                    <EventCard key={event.id} event={event} currentUser={user} onUpdate={refetchEvents} />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Members */}
            <TabsContent value="members" className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Members ({group.members?.length || 0})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.members?.map(email => (
                  <Link
                    key={email}
                    to={createPageUrl("UserProfile") + `?email=${email}`}
                    className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-slate-200 text-slate-600">
                          {email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
                        {group.admins?.includes(email) && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!isMember && user && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Join this group</h3>
            <p className="text-slate-500 mb-4">Become a member to view discussions and events</p>
            <Button onClick={joinGroup} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white gap-2">
              <UserPlus className="w-4 h-4" />
              Join Group
            </Button>
          </div>
        )}
      </div>

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        groupId={groupId}
        user={user}
        onSuccess={refetchPosts}
      />

      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        groupId={groupId}
        user={user}
        onSuccess={refetchEvents}
      />
    </div>
  );
}