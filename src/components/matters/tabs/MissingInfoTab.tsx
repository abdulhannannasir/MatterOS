import React, { useState } from "react";
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Trash2,
  Edit2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { MatterMissingInfo, DocumentItem } from "../../../types/matteros.ts";

interface MissingInfoTabProps {
  missingInfo: MatterMissingInfo[];
  documents: DocumentItem[];
  matterId: string;
  onAddMissingInfo: (info: Omit<MatterMissingInfo, "id">) => Promise<void>;
  onUpdateMissingInfo: (id: string, updates: Partial<MatterMissingInfo>) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const MissingInfoTab: React.FC<MissingInfoTabProps> = ({
  missingInfo,
  documents,
  matterId,
  onAddMissingInfo,
  onUpdateMissingInfo,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState("");
  const [newRefDoc, setNewRefDoc] = useState(documents[0]?.filename || "");
  const [newClause, setNewClause] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const filtered = missingInfo.filter((m) => {
    const matchSearch =
      m.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.referencedByDocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.lawyerNotes && m.lawyerNotes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !newExplanation.trim()) return;

    await onAddMissingInfo({
      matterId,
      ownerId: "current-user",
      item: newItem.trim(),
      referencedByDocument: newRefDoc,
      clauseOrContext: newClause.trim() || undefined,
      explanation: newExplanation.trim(),
      status: "open",
      lawyerNotes: newNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewItem("");
    setNewClause("");
    setNewExplanation("");
    setNewNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileQuestion className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Referenced Missing Information & Case Gaps
            </h3>
            <span className="text-xs text-sky-400 font-mono">
              ({missingInfo.filter((m) => m.status === "open").length} open items)
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track Missing Document</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search missing schedules, exhibits, or referenced agreements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="All">All Status ({missingInfo.length})</option>
              <option value="open">Open Gap</option>
              <option value="resolved">Resolved / Located</option>
              <option value="dismissed">Dismissed / Inapplicable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Missing Items List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition-all space-y-3 ${
              item.status === "open"
                ? "bg-slate-900/60 border-sky-900/40"
                : "bg-slate-950/40 border-slate-800/40 opacity-75"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                  item.status === "open"
                    ? "bg-sky-950 text-sky-300 border border-sky-800/60"
                    : item.status === "resolved"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {item.status}
                </span>
                <h4 className="text-sm font-bold text-slate-100 font-sans">{item.item}</h4>
              </div>

              <select
                value={item.status}
                onChange={(e) => onUpdateMissingInfo(item.id, { status: e.target.value as any })}
                className="text-[11px] font-mono bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none"
              >
                <option value="open">Open</option>
                <option value="resolved">Resolved / Ingested</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {item.explanation}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Referenced By:</span>
                <button
                  onClick={() => onPreviewDoc?.(item.referencedByDocument)}
                  className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center space-x-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>{item.referencedByDocument}</span>
                </button>
                {item.clauseOrContext && (
                  <span className="text-slate-500 font-mono">[{item.clauseOrContext}]</span>
                )}
              </div>

              {item.lawyerNotes && (
                <div className="text-indigo-300 font-sans">
                  <span className="font-mono text-[10px] uppercase text-indigo-400 mr-1">Discovery Target:</span>
                  {item.lawyerNotes}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-400">No missing items matched your search.</p>
          </div>
        )}
      </div>

      {/* Track Missing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileQuestion className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">Track Missing Case Item</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Missing Document or Schedule Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule C: Environmental Baseline Study"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Referenced In Document:</label>
                  <select
                    value={newRefDoc}
                    onChange={(e) => setNewRefDoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Clause / Section (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Section 14.3"
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Explanation of Materiality:</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this missing item is material to liability or obligations..."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Discovery Target / Counsel Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Request via formal First Set of Document Demands"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                >
                  Track Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
