"use client";
import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function TaskCard({
  task,
  onUpdate = () => {},
  onDelete = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const priorityColors = {
    low: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    medium: {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    high: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      border: "border-red-500/30",
    },
  };

  const colors = priorityColors[task.priority] || priorityColors.medium;

  return (
    <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {task.priority}
            </span>
            {task.due_iso && (
              <span className="text-xs px-2 py-1 bg-slate-700/30 text-slate-300 rounded-full border border-slate-600/30">
                {new Date(task.due_iso).toLocaleDateString()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            {task.title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">{task.summary}</p>
        </div>
      </div>

      {task.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 mb-3">
          {task.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
        <button
          className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide Details" : "Show Details"}
        </button>
        <button
          className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
          {/* Steps */}
          {task.steps && task.steps.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>📝</span>
                Steps
              </div>
              <ul className="space-y-2">
                {task.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <label className="relative flex items-center cursor-pointer mt-0.5">
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
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        s.done 
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500' 
                          : 'bg-slate-700/30 border-slate-600/50 hover:border-indigo-500/50'
                      }`}>
                        {s.done && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                    <span className={`flex-1 text-sm ${s.done ? "line-through text-slate-500" : "text-slate-300"}`}>
                      {s.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Acceptance Criteria */}
          {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>✅</span>
                Acceptance Criteria
              </div>
              <ul className="space-y-2 ml-2">
                {task.acceptance_criteria.map((a, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-red-600/10 via-rose-600/10 to-red-600/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Delete Task</h3>
                  <p className="text-gray-400 text-sm mt-1">This action cannot be undone</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-600/50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-slate-300 mb-2">
                Are you sure you want to delete <span className="font-semibold text-white">"{task.title}"</span>?
              </p>
              <p className="text-slate-400 text-sm">
                All associated data will be permanently removed.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white transition-colors border border-slate-600/50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(task.id);
                  setShowDeleteModal(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30 transition-all font-medium"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
