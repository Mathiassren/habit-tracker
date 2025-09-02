"use client";
import { useState } from "react";

export default function TaskCard({
  task,
  onUpdate = () => {},
  onDelete = () => {},
}) {
  const [open, setOpen] = useState(false);

  const priorityColors = {
    low: {
      bg: "bg-green-500/20",
      text: "text-green-400",
    },
    medium: {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      high: {
        bg: "bg-red-500/20",
        text: "text-red-400",
      },
    },
  };

  const colors = priorityColors[task.priority] || priorityColors.medium;

  return (
    <div className="rounded-2xl border border-gray-700 p-4 bg-black/30 shadow hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {task.priority}
          </div>
          <h3 className="text-lg font-semibold">{task.title}</h3>
          <p className="text-sm opacity-80 mt-1">{task.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {task.due_iso && (
            <span className="text-xs px-2 py-1 border rounded-full opacity-80">
              Due: {new Date(task.due_iso).toLocaleDateString()}
            </span>
          )}
          <button
            className="text-xs opacity-80 hover:opacity-100 underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "Details"}
          </button>
          <button
            className="text-xs text-red-400 hover:text-red-300 underline"
            onClick={() => onDelete(task.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {task.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 border rounded-full opacity-70"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <div className="font-medium mb-1">Steps</div>
            <ul className="space-y-1">
              {task.steps?.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!s.done}
                    onChange={() => {
                      const next = {
                        ...task,
                        steps: task.steps.map((x, idx) =>
                          idx === i ? { ...x, done: !x.done } : x
                        ),
                      };
                      onUpdate(next);
                    }}
                  />
                  <span className={s.done ? "line-through opacity-60" : ""}>
                    {s.title}
                  </span>
                </li>
              ))}
              {(!task.steps || task.steps.length === 0) && (
                <li className="opacity-70 text-sm">No steps.</li>
              )}
            </ul>
          </div>

          <div>
            <div className="font-medium mb-1">Acceptance criteria</div>
            <ul className="list-disc ml-5 space-y-1">
              {task.acceptance_criteria?.length ? (
                task.acceptance_criteria.map((a, i) => (
                  <li key={i} className="opacity-90">
                    {a}
                  </li>
                ))
              ) : (
                <li className="opacity-70 text-sm">None.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
