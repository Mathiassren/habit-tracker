"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export default function SortableStatCard({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dragging,
  } = useSortable({ id });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: dragging ? 0.6 : 1,
      zIndex: dragging ? 50 : 1,
    }),
    [transform, transition, dragging]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      {/* Drag handle indicator - visible on hover */}
      <div className="absolute -left-1 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      {children}
    </div>
  );
}

