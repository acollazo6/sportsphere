import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

export default function BadgeDisplay({ badges }) {
  if (!badges || badges.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 text-sm">No badges earned yet. Keep training!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((badge) => (
        <Card key={badge.id} className="border-gray-200 hover:border-red-300 hover:shadow-lg transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-4xl mb-2">{badge.badge_icon}</div>
            <p className="font-bold text-gray-900 text-sm mb-1">{badge.badge_name}</p>
            <p className="text-xs text-gray-500 mb-2">{badge.badge_description}</p>
            <Badge variant="outline" className="text-xs">
              {moment(badge.earned_date).format("MMM D, YYYY")}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}