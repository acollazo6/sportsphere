import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export { PAGE_SIZE };

export default function FeedPagination({ total, page, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="rounded-xl gap-1"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </Button>
      <span className="text-sm font-semibold text-gray-600">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-xl gap-1"
      >
        Next <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}