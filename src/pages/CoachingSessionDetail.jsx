import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Clock, Users, DollarSign, Video, Loader2, Send, MessageCircle, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";
import { toast } from "sonner";

export default function CoachingSessionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: session, isLoading } = useQuery({
    queryKey: ["coaching-session", sessionId],
    queryFn: () => base44.entities.CoachingSession.filter({ id: sessionId }).then(res => res[0]),
    enabled: !!sessionId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["session-messages", sessionId],
    queryFn: () => base44.entities.SessionMessage.filter({ session_id: sessionId }, "-created_date"),
    enabled: !!sessionId,
    refetchInterval: session?.status === "live" ? 3000 : false,
  });

  const isRegistered = session?.participants?.includes(user?.email);
  const hasAccess = !session?.is_paid || isRegistered || session?.host_email === user?.email;
  const isFull = session?.max_participants && session?.participants?.length >= session?.max_participants;

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      return;
    }

    if (session.is_paid) {
      // Create transaction
      await base44.entities.Transaction.create({
        from_email: user.email,
        to_email: session.host_email,
        type: "coaching_session",
        amount: session.price,
        status: "completed",
      });
    }

    await base44.entities.CoachingSession.update(sessionId, {
      participants: [...(session.participants || []), user.email],
    });

    // Notify host
    await base44.entities.Notification.create({
      recipient_email: session.host_email,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_avatar: user.avatar_url,
      type: "subscription",
      message: `registered for your coaching session: ${session.title}`,
    });

    queryClient.invalidateQueries({ queryKey: ["coaching-session"] });
    toast.success("Successfully registered!");
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    await base44.entities.SessionMessage.create({
      session_id: sessionId,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url,
      message: message.trim(),
      is_question: isQuestion,
    });

    setMessage("");
    setIsQuestion(false);
    queryClient.invalidateQueries({ queryKey: ["session-messages"] });
  };

  if (isLoading || !session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("LiveCoaching")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Sessions
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white border-gray-200">
            {session.image_url && (
              <div className="h-64 overflow-hidden rounded-t-lg">
                <img src={session.image_url} alt={session.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-gray-900 mb-3">{session.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={session.status === "live" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>
                      {session.status}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 capitalize">{session.session_type}</Badge>
                    {session.sport && <Badge className="bg-red-100 text-red-900">{session.sport}</Badge>}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">{session.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-red-900" />
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {moment(session.scheduled_date).format("MMM D, h:mm A")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-red-900" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-900 text-sm">{session.duration_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-red-900" />
                  <div>
                    <p className="text-xs text-gray-500">Participants</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {session.participants?.length || 0}
                      {session.max_participants && ` / ${session.max_participants}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-red-900" />
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {session.is_paid ? `$${session.price}` : "Free"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <Avatar className="w-16 h-16 border-2 border-red-900">
                  <AvatarImage src={session.host_avatar} />
                  <AvatarFallback className="bg-red-900 text-white text-lg">
                    {session.host_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-gray-500">Hosted by</p>
                  <p className="font-bold text-gray-900 text-lg">{session.host_name}</p>
                </div>
              </div>

              {/* Actions */}
              {user && !isRegistered && session.status === "scheduled" && (
                <Button
                  onClick={handleRegister}
                  disabled={isFull}
                  className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 h-12"
                >
                  {isFull ? "Session Full" : session.is_paid ? `Register for $${session.price}` : "Register for Free"}
                </Button>
              )}

              {session.status === "live" && hasAccess && session.meeting_link && (
                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 h-12">
                    <Video className="w-5 h-5 mr-2" />
                    Join Live Session
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-red-900" />
                Live Chat
              </h3>

              {!hasAccess ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Register to access chat</p>
                </div>
              ) : (
                <>
                  <div className="h-96 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-lg">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.is_question ? 'bg-amber-50 p-2 rounded-lg border border-amber-200' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={msg.sender_avatar} />
                          <AvatarFallback className="text-xs">{msg.sender_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{msg.sender_name}</p>
                            {msg.is_question && <HelpCircle className="w-3 h-3 text-amber-600" />}
                          </div>
                          <p className="text-sm text-gray-600 break-words">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} size="icon" className="bg-red-900 hover:bg-red-800">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isQuestion}
                        onChange={(e) => setIsQuestion(e.target.checked)}
                        className="rounded"
                      />
                      Mark as Q&A question
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}