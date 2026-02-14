import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Clock, Users, DollarSign, Video, Loader2, Send, MessageCircle, HelpCircle, Download, FileText } from "lucide-react";
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
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

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

  const { data: bookings = [] } = useQuery({
    queryKey: ["session-bookings", sessionId],
    queryFn: () => base44.entities.SessionBooking.filter({ session_id: sessionId }),
    enabled: !!sessionId && session?.is_one_on_one,
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

  const handleBookSlot = async () => {
    if (!selectedSlot || !user) return;
    setIsBooking(true);
    try {
      await base44.entities.SessionBooking.create({
        session_id: sessionId,
        coach_email: session.host_email,
        client_email: user.email,
        client_name: user.full_name,
        booking_date: selectedSlot,
        duration_minutes: session.duration_minutes,
        amount_paid: session.price || 0,
        status: "confirmed",
        notes: bookingNotes,
      });

      if (session.is_paid && session.price > 0) {
        await base44.entities.Transaction.create({
          from_email: user.email,
          to_email: session.host_email,
          type: "coaching_session",
          amount: session.price,
          status: "completed",
        });
      }

      await base44.entities.Notification.create({
        recipient_email: session.host_email,
        actor_email: user.email,
        actor_name: user.full_name,
        actor_avatar: user.avatar_url,
        type: "subscription",
        message: `booked a 1-on-1 coaching slot with you`,
      });

      queryClient.invalidateQueries({ queryKey: ["session-bookings"] });
      setShowBookingDialog(false);
      toast.success("Booking confirmed!");
    } catch (error) {
      toast.error("Failed to book slot");
    }
    setIsBooking(false);
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

              {/* Resources */}
              {session.resources && session.resources.length > 0 && hasAccess && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-900" />
                    Downloadable Resources
                  </h3>
                  {session.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.file_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{resource.name}</p>
                        {resource.description && (
                          <p className="text-sm text-gray-600">{resource.description}</p>
                        )}
                      </div>
                      <Download className="w-5 h-5 text-red-900" />
                    </a>
                  ))}
                </div>
              )}

              {/* Actions */}
              {user && session.is_one_on_one && !bookings.some(b => b.client_email === user.email) && (
                <Button
                  onClick={() => setShowBookingDialog(true)}
                  className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 h-12"
                >
                  Book 1-on-1 Slot {session.is_paid ? `- $${session.price}` : "- Free"}
                </Button>
              )}

              {user && !isRegistered && session.status === "scheduled" && !session.is_one_on_one && (
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

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Book 1-on-1 Coaching Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Select Time Slot</Label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {session?.available_slots
                    ?.filter(slot => !bookings.some(b => b.booking_date === slot))
                    .map((slot, idx) => (
                      <SelectItem key={idx} value={slot}>
                        {moment(slot).format("MMM D, YYYY [at] h:mm A")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700">Notes / Goals (Optional)</Label>
              <Textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Share your goals or what you'd like to focus on..."
                className="border-gray-300 resize-none"
                rows={3}
              />
            </div>
            {session?.is_paid && session?.price > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-900">
                  <strong>Total: ${session.price}</strong> for {session.duration_minutes} minutes
                </p>
              </div>
            )}
            <Button
              onClick={handleBookSlot}
              disabled={!selectedSlot || isBooking}
              className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700"
            >
              {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}