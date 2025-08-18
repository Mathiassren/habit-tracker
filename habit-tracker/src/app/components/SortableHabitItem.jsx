"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  InformationCircleIcon,
  Bars2Icon,
  TrashIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export default function SortableHabitItem({
  habit,
  checked,
  onToggle,
  onDelete,
  onOpenNote,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.9 : 1,
      boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.35)" : "none",
      borderLeftColor: habit.color || "#9333EA",
    }),
    [transform, transition, isDragging, habit.color]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4"
    >
      {/* Drag handle: add touchAction to enable touch-drag on mobile */}
      <button
        className="cursor-grab active:cursor-grabbing pr-2"
        aria-label="Reorder"
        style={{ touchAction: "none", WebkitTapHighlightColor: "transparent" }}
        {...attributes}
        {...listeners}
      >
        <Bars2Icon className="h-5 w-5 text-gray-500" />
      </button>

      <button
        type="button"
        className="flex-1 text-center flex justify-center items-center cursor-pointer"
        onClick={() => onOpenNote?.(habit)}
      >
        <EnvelopeIcon className="mr-4 w-4 h-4" /> {habit.name}
      </button>

      <div className="flex items-center gap-4">
        <InformationCircleIcon className="h-5 w-5 text-gray-400" />
        <input
          type="checkbox"
          checked={!!checked}
          onChange={() => onToggle?.(habit.id)}
          className="w-5 h-5 accent-purple-600 cursor-pointer"
        />
        <TrashIcon
          className="h-5 w-5 text-red-500 cursor-pointer"
          onClick={() => onDelete?.(habit.id)}
        />
      </div>
    </div>
  );
}
