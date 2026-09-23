import React, { useState } from "react";
import {
  AlertCircle,
  Plus,
  Search,
  Sparkles,
  FileText,
  CheckCircle,
  Clock,
  Check,
  X,
  Edit3,
  Trash2,
} from "lucide-react";
import { Issue, IssueStatus } from "../../../types/matteros.ts";

interface IssuesTabProps {
  issues: Issue[];
  matterId: string;
  onAddIssue: (issue: Omit<Issue, "id">) => Promise<void>;
  onUpdateIssue: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const IssuesTab: React.FC<IssuesTabProps> = ({
  issues,
  matterId,
  onAddIssue,
  onUpdateIssue,
  onDeleteIssue,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  // New Issue State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSourceDoc, setNewSourceDoc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newStatus, setNewStatus] = useState<IssueStatus>("Open");

  const filteredIssues = issues.filter((iss) => {
    const matchSearch =
      iss.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iss.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (iss.lawyerNotes && iss.lawyerNotes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "All" || iss.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onAddIssue({
      matterId,
      ownerId: "current-user",
      title: newTitle.trim(),
      description: newDesc.trim(),
      sourceDocument: newSourceDoc.trim() || undefined,
      relatedFacts: [],
      relatedDocuments: newSourceDoc.trim() ? [newSourceDoc.trim()] : [],
      status: newStatus,
      lawyerNotes: newNotes.trim() || undefined,
      isAiSuggested: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewSourceDoc("");
    setNewNotes("");
  };

  const startEditNotes = (issue: Issue) => {
    setEditingNotesId(issue.id);
    setTempNotes(issue.lawyerNotes || "");
  };

  const saveNotes = async (issueId: string) => {
    await onUpdateIssue(issueId, { lawyerNotes: tempNotes });
    setEditingNotesId(null);
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "Open":
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
      case "Reviewing":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "Resolved":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Legal & Factual Issues Matrix
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredIssues.length} issues)
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Identify Legal Issue</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search legal issues, defense arguments, lawyer notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open Issues</option>
              <option value="Reviewing">Under Attorney Review</option>
              <option value="Resolved">Resolved / Conceded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No issues recorded</p>
          <p className="mt-1">Add legal issues manually or analyze documents to extract key controversies.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono font-semibold ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>

                    {issue.isAiSuggested ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>AI Suggested</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Counsel Formulated
                      </span>
                    )}

                    <select
                      value={issue.status}
                      onChange={(e) => onUpdateIssue(issue.id, { status: e.target.value as IssueStatus })}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer"
                    >
                      <option value="Open">Set Open</option>
                      <option value="Reviewing">Set Reviewing</option>
                      <option value="Resolved">Set Resolved</option>
                    </select>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mt-2">
                    {issue.title}
                  </h4>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => onDeleteIssue(issue.id)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete issue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Related Facts & Evidence */}
              {issue.relatedFacts && issue.relatedFacts.length > 0 && (
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/70 text-xs text-slate-400 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                    Grounding Facts:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {issue.relatedFacts.map((fact, idx) => (
                      <li key={idx} className="line-clamp-2">
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source Document Citation */}
              {issue.sourceDocument && (
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-slate-500">Source:</span>
                  <span
                    onClick={() => onPreviewDoc?.(issue.sourceDocument!)}
                    className="text-amber-400/90 hover:underline cursor-pointer font-mono truncate"
                  >
                    {issue.sourceDocument}
                  </span>
                </div>
              )}

              {/* Attorney Work Product & Notes */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Attorney Strategy & Work Product Notes
                  </span>
                  {editingNotesId !== issue.id && (
                    <button
                      onClick={() => startEditNotes(issue)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{issue.lawyerNotes ? "Edit Notes" : "Add Notes"}</span>
                    </button>
                  )}
                </div>

                {editingNotesId === issue.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Add strategic litigation notes, precedents, or trial questions..."
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNotes(issue.id)}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 italic leading-relaxed">
                    {issue.lawyerNotes || "No attorney notes entered. Click 'Add Notes' to record case strategy."}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Issue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Identify New Legal Issue</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateIssue} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enforceability of Liquidated Damages Clause"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Description / Legal Standard</label>
                <textarea
                  rows={3}
                  placeholder="Legal controversy, elements of the claim, or disputed facts..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200"
                  >
                    <option value="Open">Open</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Key Source Document</label>
                  <input
                    type="text"
                    placeholder="e.g. Master_Agreement.pdf"
                    value={newSourceDoc}
                    onChange={(e) => setNewSourceDoc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Attorney Strategy Notes</label>
                <textarea
                  rows={2}
                  placeholder="Initial impressions, relevant case citations, or action items..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  Save Legal Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
