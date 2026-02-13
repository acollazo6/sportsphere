import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Dumbbell } from "lucide-react";

export default function ProgramDetailDialog({ open, onClose, program }) {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program.title}</DialogTitle>
          <p className="text-sm text-slate-500">by {program.creator_name}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-50 text-orange-700">{program.sport}</Badge>
            <Badge variant="outline" className="capitalize">{program.difficulty}</Badge>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              {program.duration_weeks} weeks
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              {program.followers?.length || 0} followers
            </span>
          </div>

          {program.description && (
            <p className="text-sm text-slate-600">{program.description}</p>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-orange-500" />
              Exercises ({program.exercises?.length || 0})
            </h3>
            <div className="space-y-2">
              {program.exercises?.map((ex, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                    <span><strong>{ex.sets}</strong> sets</span>
                    <span><strong>{ex.reps}</strong> reps</span>
                    <span><strong>{ex.rest_seconds}s</strong> rest</span>
                  </div>
                  {ex.notes && <p className="text-xs text-slate-500 mt-1 italic">{ex.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}