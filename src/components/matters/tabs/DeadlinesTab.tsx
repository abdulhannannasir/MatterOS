import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  X,
  Trash2,
  FileText,
  Edit3,
  Check,
  Filter,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Deadline, DeadlineStatus } from "../../../types/matteros.ts";

interface DeadlinesTabProps {
  deadlines: Deadline[];
  matterId: string;
  onAddDeadline: (dl: Omit<Deadline, "id">) => Promise<void>;
  onUpdateDeadline: (id: string, updates: Partial<Deadline>) => Promise<void>;
  onDeleteDeadline?: (id: string) => Promise<void>;
  onConfirmDeadline?: (id: string, customDate?: string) => Promise<void>;
  onDismissDeadline?: (id: string) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const DeadlinesTab: React.FC<DeadlinesTabProps> = ({
  deadlines,
  matterId,
  onAddDeadline,
  onUpdateDeadline,
  onDeleteDeadline,
  onConfirmDeadline,
  onDismissDeadline,
  onPreviewDoc,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [modifyingDeadline, setModifyingDeadline] = useState<Deadline | null>(null);
  const [modifiedDate, setModifiedDate] = useState("");

  // New Deadline State
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDesc, setNewDesc] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("high");

  const getDaysRemaining = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr).getTime();
      const now = new Date().getTime();
      const diffMs = target - now;
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const filteredDeadlines = deadlines.filter((dl) => {
    if (statusFilter === "All") return dl.status !== "Dismissed" && dl.status !== "dismissed";
    if (statusFilter === "Suggested") return dl.isAiSuggested && !dl.isLawyerConfirmed && dl.status !== "Dismissed";
    if (statusFilter === "Confirmed") return dl.isLawyerConfirmed && dl.status !== "Completed";
    if (statusFilter === "Overdue") return getDaysRemaining(dl.date) < 0 && dl.status !== "Completed";
    if (statusFilter === "Upcoming") return getDaysRemaining(dl.date) >= 0 && getDaysRemaining(dl.date) <= 14 && dl.status !== "Completed";
    if (statusFilter === "Completed") return dl.status === "Completed";
    if (statusFilter === "Dismissed") return dl.status === "Dismissed" || dl.status === "dismissed";
    return dl.status === statusFilter;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onAddDeadline({
      matterId,
      ownerId: "current-user",
      title: newTitle.trim(),
      date: newDate,
      description: newDesc.trim(),
      source: newSource.trim() || undefined,
      status: "Confirmed",
      priority: newPriority,
      isAiSuggested: false,
      isLawyerConfirmed: true,
      confirmedBy: "Counsel",
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewSource("");
  };

  const handleOpenModifyModal = (dl: Deadline) => {
    setModifyingDeadline(dl);
    setModifiedDate(dl.date);
  };

  const handleSaveModification = async () => {
    if (!modifyingDeadline || !modifiedDate) return;

    const originalDate = modifyingDeadline.date;
    const isModified = modifiedDate !== originalDate;

    const originalAiSuggestion = modifyingDeadline.originalAiSuggestion || {
      date: originalDate,
      sourceDocument: modifyingDeadline.sourceDocument || modifyingDeadline.source,
      sourcePage: modifyingDeadline.sourcePage,
      relevantText: modifyingDeadline.relevantText,
      confidence: modifyingDeadline.confidence,
    };

    await onUpdateDeadline(modifyingDeadline.id, {
      date: modifiedDate,
      isLawyerConfirmed: true,
      status: "Confirmed",
      confirmedBy: "Counsel",
      confirmedAt: new Date().toISOString(),
      originalAiSuggestion,
      ...(isModified ? { lawyerModifiedValue: { originalDate, newDate: modifiedDate } } : {}),
      updatedAt: new Date().toISOString(),
    });

    setModifyingDeadline(null);
  };

  const handleConfirmDirect = async (dl: Deadline) => {
    if (onConfirmDeadline) {
      await onConfirmDeadline(dl.id);
    } else {
      await onUpdateDeadline(dl.id, {
        isLawyerConfirmed: true,
        status: "Confirmed",
        confirmedBy: "Counsel",
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleDismiss = async (dl: Deadline) => {
    if (onDismissDeadline) {
      await onDismissDeadline(dl.id);
    } else {
      await onUpdateDeadline(dl.id, {
        status: "Dismissed",
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
      case "medium":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  // Metrics
  const activeDeadlines = deadlines.filter((d) => d.status !== "Dismissed" && d.status !== "dismissed");
  const suggestedUnconfirmed = activeDeadlines.filter((d) => d.isAiSuggested && !d.isLawyerConfirmed);
  const overdueCount = activeDeadlines.filter((d) => getDaysRemaining(d.date) < 0 && d.status !== "Completed").length;
  const upcomingCount = activeDeadlines.filter((d) => getDaysRemaining(d.date) >= 0 && getDaysRemaining(d.date) <= 14 && d.status !== "Completed").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-sans flex items-center gap-2">
                <span>Matter Deadlines & Statutory Cutoffs</span>
                <span className="text-xs text-slate-400 font-mono font-normal">
                  ({filteredDeadlines.length} shown)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Statutory and court deadlines extracted from documents or scheduled by counsel. Lawyer authorization required.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Deadline</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-mono">Overdue</span>
            <div className="text-base font-bold text-rose-300">{overdueCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">Next 14 Days</span>
            <div className="text-base font-bold text-amber-300">{upcomingCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-purple-400 uppercase tracking-wider font-mono">AI Suggested</span>
            <div className="text-base font-bold text-purple-300">{suggestedUnconfirmed.length}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Total Active</span>
            <div className="text-base font-bold text-emerald-300">{activeDeadlines.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          {[
            { id: "All", label: "All Active" },
            { id: "Suggested", label: `Awaiting Confirmation (${suggestedUnconfirmed.length})` },
            { id: "Confirmed", label: "Confirmed" },
            { id: "Upcoming", label: "Upcoming (14d)" },
            { id: "Overdue", label: "Overdue" },
            { id: "Completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deadlines List */}
      {filteredDeadlines.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No deadlines in this view</p>
          <p className="mt-1">Add manual court scheduling dates or extract them from uploaded scheduling orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeadlines.map((dl) => {
            const daysLeft = getDaysRemaining(dl.date);
            const isCompleted = dl.status === "Completed";
            const isPendingAi = dl.isAiSuggested && !dl.isLawyerConfirmed;

            return (
              <div
                key={dl.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPendingAi
                    ? "bg-amber-950/10 border-amber-500/40 hover:border-amber-500/60 shadow-sm"
                    : isCompleted
                    ? "bg-slate-950/40 border-slate-800/60 opacity-75"
                    : "bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700 shadow-sm"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {dl.date}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isCompleted
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                            : daysLeft <= 7
                            ? "bg-rose-950/60 text-rose-300 border-rose-800/60 font-bold"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {isCompleted
                          ? "Completed"
                          : daysLeft < 0
                          ? `Overdue (${Math.abs(daysLeft)}d ago)`
                          : `${daysLeft} days remaining`}
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getPriorityBadge(dl.priority)}`}>
                        {dl.priority} priority
                      </span>

                      {/* AI Suggested vs Confirmed Badge */}
                      {isPendingAi ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 flex items-center space-x-1 font-mono">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>AI Suggested (Awaiting Lawyer Confirmation)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 flex items-center space-x-1 font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Lawyer Confirmed</span>
                        </span>
                      )}

                      {/* Modification indicator if changed by lawyer */}
                      {dl.lawyerModifiedValue && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 font-mono">
                          Modified by Counsel (Was {dl.lawyerModifiedValue.originalDate})
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold font-serif ${
                        isCompleted ? "line-through text-slate-400" : "text-slate-100"
                      }`}
                    >
                      {dl.title}
                    </h4>

                    {dl.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {dl.description}
                      </p>
                    )}

                    {/* AI Source Grounding Box */}
                    {(dl.sourceDocument || dl.source || dl.relevantText) && (
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-slate-300">
                            Source: {dl.sourceDocument || dl.source || "Matter Record"}
                          </span>
                          {dl.sourcePage && (
                            <span className="text-slate-400">({dl.sourcePage})</span>
                          )}
                          {dl.confidence !== undefined && (
                            <span className="ml-auto text-[10px] text-amber-400">
                              Confidence: {Math.round(dl.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        {dl.relevantText && (
                          <p className="text-[11px] text-slate-300 italic border-l-2 border-amber-500/60 pl-2 mt-1">
                            "{dl.relevantText}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                    {isPendingAi && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleConfirmDirect(dl)}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                          title="Confirm Deadline"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>

                        <button
                          onClick={() => handleOpenModifyModal(dl)}
                          className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center space-x-1 border border-slate-700 cursor-pointer"
                          title="Modify Date before confirming"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modify</span>
                        </button>

                        <button
                          onClick={() => handleDismiss(dl)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900 cursor-pointer"
                          title="Dismiss Suggestion"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {!isPendingAi && (
                      <button
                        onClick={() =>
                          onUpdateDeadline(dl.id, {
                            status: isCompleted ? "Confirmed" : "Completed",
                          })
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                          isCompleted
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-500 text-slate-950"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isCompleted ? "Mark Pending" : "Mark Completed"}</span>
                      </button>
                    )}

                    {onDeleteDeadline && (
                      <button
                        onClick={() => onDeleteDeadline(dl.id)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Deadline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modify Deadline Date Modal */}
      {modifyingDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Modify & Confirm Deadline
                </h3>
              </div>
              <button
                onClick={() => setModifyingDeadline(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Deadline Title</span>
                <span className="text-sm text-slate-200 font-semibold">{modifyingDeadline.title}</span>
              </div>

              {modifyingDeadline.originalAiSuggestion && (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <span className="text-amber-400 font-semibold block">Original AI Suggestion:</span>
                  <div>Date: {modifyingDeadline.originalAiSuggestion.date}</div>
                  <div>Source: {modifyingDeadline.originalAiSuggestion.sourceDocument}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmed Deadline Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={modifiedDate}
                  onChange={(e) => setModifiedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  The original AI suggestion will be permanently preserved in the matter audit trail alongside your lawyer adjustment.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setModifyingDeadline(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModification}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                Confirm Adjusted Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Schedule New Court or Statutory Deadline
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deadline Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Serve Opening Expert Witness Disclosures"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source / Procedural Rule / Order Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduling Order No. 1, Rule 26(a)(2)"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Procedural Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context, requirements, or procedural caveats..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
