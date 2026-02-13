import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, TrendingUp, Star } from "lucide-react";

export default function ProgramCard({ program, currentUser, onFollow, onView }) {
  const isFollowing = program.followers?.includes(currentUser?.email);
  const isOwner = program.creator_email === currentUser?.email;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{program.title}</CardTitle>
            <p className="text-xs text-slate-500 mt-1">by {program.creator_name}</p>
          </div>
          <Badge className="bg-orange-50 text-orange-700 rounded-lg">{program.sport}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 line-clamp-2">{program.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {program.duration_weeks}w
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {program.followers?.length || 0}
          </span>
          <Badge variant="outline" className="capitalize text-xs">
            {program.difficulty}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onView(program)} size="sm" variant="outline" className="flex-1 rounded-xl text-xs">
            View Details
          </Button>
          {!isOwner && (
            <Button
              onClick={() => onFollow(program)}
              size="sm"
              className={`rounded-xl text-xs ${isFollowing ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}