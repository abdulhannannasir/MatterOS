import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  FileText,
  Trash2,
  Edit2,
  DollarSign,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Tag,
  Calendar,
} from "lucide-react";
import { MatterFact, DocumentItem, FactExtractionType, FactSourceType, ConfidenceLevel } from "../../../types/matteros.ts";

interface FactsTabProps {
  facts: MatterFact[];
  documents: DocumentItem[];
  matterId: string;
  onAddFact: (fact: Omit<MatterFact, "id">) => Promise<void>;
  onUpdateFact: (id: string, updates: Partial<MatterFact>) => Promise<void>;
  onDeleteFact: (id: string) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const FactsTab: React.FC<FactsTabProps> = ({
  facts,
  documents,
  matterId,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFact, setEditingFact] = useState<MatterFact | null>(null);

  // New Fact State
  const [newFactText, setNewFactText] = useState("");
  const [newSourceDoc, setNewSourceDoc] = useState(documents[0]?.filename || "General Record");
  const [newPage, setNewPage] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newType, setNewType] = useState<FactExtractionType>("factual_assertion");
  const [newParty, setNewParty] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newConfidence, setNewConfidence] = useState<ConfidenceLevel>("high");
  const [newLawyerNotes, setNewLawyerNotes] = useState("");

  const filtered = facts.filter((f) => {
    const matchSearch =
      f.fact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.sourceDocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.relatedParty && f.relatedParty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.lawyerNotes && f.lawyerNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = typeFilter === "All" || f.extractionType === typeFilter;
    const matchStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Confirmed"
        ? f.isLawyerConfirmed
        : !f.isLawyerConfirmed;

    return matchSearch && matchType && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;

    await onAddFact({
      matterId,
      ownerId: "current-user",
      fact: newFactText.trim(),
      sourceDocument: newSourceDoc,
      page: newPage.trim() || undefined,
      section: newSection.trim() || undefined,
      confidence: newConfidence,
      extractionType: newType,
      relatedParty: newParty.trim() || undefined,
      amount: newAmount.trim() || undefined,
      date: newDate.trim() || undefined,
      factSourceType: "lawyer-entered",
      isLawyerConfirmed: true,
      lawyerNotes: newLawyerNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewFactText("");
    setNewPage("");
    setNewSection("");
    setNewParty("");
    setNewAmount("");
    setNewDate("");
    setNewLawyerNotes("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFact) return;
    await onUpdateFact(editingFact.id, {
      fact: editingFact.fact,
      sourceDocument: editingFact.sourceDocument,
      page: editingFact.page,
      section: editingFact.section,
      extractionType: editingFact.extractionType,
      confidence: editingFact.confidence,
      relatedParty: editingFact.relatedParty,
      amount: editingFact.amount,
      date: editingFact.date,
      lawyerNotes: editingFact.lawyerNotes,
      isLawyerConfirmed: editingFact.isLawyerConfirmed,
    });
    setEditingFact(null);
  };

  const getTypeBadgeColor = (type: FactExtractionType) => {
    switch (type) {
      case "admission":
        return "bg-purple-950/70 text-purple-300 border-purple-800/60";
      case "denial":
        return "bg-rose-950/70 text-rose-300 border-rose-800/60";
      case "allegation":
        return "bg-amber-950/70 text-amber-300 border-amber-800/60";
      case "agreement":
        return "bg-emerald-950/70 text-emerald-300 border-emerald-800/60";
      case "payment":
        return "bg-sky-950/70 text-sky-300 border-sky-800/60";
      case "order":
        return "bg-blue-950/70 text-blue-300 border-blue-800/60";
      case "obligation":
        return "bg-indigo-950/70 text-indigo-300 border-indigo-800/60";
      case "notice":
        return "bg-orange-950/70 text-orange-300 border-orange-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Matter Facts Matrix & Evidence Repository
            </h3>
            <span className="text-xs text-slate-400 font-mono">({facts.length} facts recorded)</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Counsel Fact</span>
          </button>
        </div>

        {/* Search & Filtering */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search facts, parties, source documents, citations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="All">All Categories</option>
              <option value="admission">Admissions</option>
              <option value="denial">Denials</option>
              <option value="allegation">Claims & Allegations</option>
              <option value="agreement">Contractual Terms & Agreements</option>
              <option value="payment">Payments & Financials</option>
              <option value="obligation">Obligations</option>
              <option value="notice">Notices & Demands</option>
              <option value="order">Court Orders</option>
              <option value="procedural">Procedural Events</option>
              <option value="factual_assertion">Factual Assertions</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Counsel Confirmed</option>
              <option value="Unconfirmed">Pending Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Facts List */}
      <div className="space-y-3">
        {filtered.map((f) => (
          <div
            key={f.id}
            className={`p-4 rounded-xl border transition-all space-y-2.5 ${
              f.isLawyerConfirmed
                ? "bg-slate-900/60 border-slate-800"
                : "bg-slate-900/40 border-slate-800/60 border-dashed"
            }`}
          >
            {/* Fact Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getTypeBadgeColor(f.extractionType)}`}>
                  {f.extractionType.replace("_", " ")}
                </span>

                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  f.confidence === "high"
                    ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/40"
                    : f.confidence === "medium"
                    ? "bg-amber-950/50 text-amber-400 border border-amber-800/40"
                    : "bg-rose-950/50 text-rose-400 border border-rose-800/40"
                }`}>
                  {f.confidence} confidence
                </span>

                <span className="text-[10px] text-slate-500 font-mono">
                  {f.factSourceType === "document-extracted" ? "Doc Extracted" : "Counsel Entered"}
                </span>

                {f.date && (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{f.date}</span>
                  </span>
                )}
              </div>

              {/* Confirmation Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateFact(f.id, { isLawyerConfirmed: !f.isLawyerConfirmed })}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold flex items-center space-x-1 transition-colors ${
                    f.isLawyerConfirmed
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{f.isLawyerConfirmed ? "Confirmed" : "Confirm"}</span>
                </button>

                <button
                  onClick={() => setEditingFact(f)}
                  className="p-1 text-slate-500 hover:text-slate-200"
                  title="Edit Fact"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteFact(f.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Delete Fact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Fact Statement */}
            <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
              {f.fact}
            </p>

            {/* Source & Metadata Citation Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/50 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Source:</span>
                <button
                  onClick={() => onPreviewDoc?.(f.sourceDocument)}
                  className="text-indigo-400 hover:text-indigo-300 font-mono font-medium flex items-center space-x-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>{f.sourceDocument}</span>
                </button>
                {(f.page || f.section) && (
                  <span className="text-slate-500 font-mono">
                    [{f.page ? f.page : ""}{f.page && f.section ? " · " : ""}{f.section ? f.section : ""}]
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {f.relatedParty && (
                  <span>Party: <strong className="text-slate-300">{f.relatedParty}</strong></span>
                )}
                {f.amount && (
                  <span className="font-mono text-amber-300 font-semibold">{f.amount}</span>
                )}
              </div>
            </div>

            {f.lawyerNotes && (
              <div className="p-2 rounded bg-indigo-950/20 border border-indigo-900/30 text-[11px] text-indigo-300 font-sans">
                <span className="font-semibold font-mono text-[10px] uppercase text-indigo-400 mr-1.5">Attorney Note:</span>
                {f.lawyerNotes}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No facts matched your search and filter criteria.</p>
          </div>
        )}
      </div>

      {/* Add Fact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">Record Structured Matter Fact</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Fact Statement:</label>
                <textarea
                  rows={3}
                  placeholder="State the factual assertion, admission, agreement term, or claim..."
                  value={newFactText}
                  onChange={(e) => setNewFactText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Classification:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                  >
                    <option value="factual_assertion">Factual Assertion</option>
                    <option value="admission">Admission</option>
                    <option value="denial">Denial</option>
                    <option value="allegation">Allegation</option>
                    <option value="agreement">Agreement / Contract Term</option>
                    <option value="payment">Payment / Financial</option>
                    <option value="obligation">Obligation</option>
                    <option value="notice">Notice</option>
                    <option value="order">Court Order</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Confidence:</label>
                  <select
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                  >
                    <option value="high">High Confidence</option>
                    <option value="medium">Medium Confidence</option>
                    <option value="low">Low Confidence</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Source Document:</label>
                  <select
                    value={newSourceDoc}
                    onChange={(e) => setNewSourceDoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                    <option value="General Matter File">General Matter File</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Page / Paragraph:</label>
                  <input
                    type="text"
                    placeholder="e.g. Page 3, Para 4"
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Related Party:</label>
                  <input
                    type="text"
                    placeholder="e.g. Crestview"
                    value={newParty}
                    onChange={(e) => setNewParty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Amount ($):</label>
                  <input
                    type="text"
                    placeholder="e.g. $42,500,000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Date (YYYY-MM-DD):</label>
                  <input
                    type="text"
                    placeholder="2026-03-01"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Attorney Notes:</label>
                <input
                  type="text"
                  placeholder="Strategic relevance or verification notes..."
                  value={newLawyerNotes}
                  onChange={(e) => setNewLawyerNotes(e.target.value)}
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
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fact Modal */}
      {editingFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Edit Fact</h3>
              <button onClick={() => setEditingFact(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Fact Statement:</label>
                <textarea
                  rows={3}
                  value={editingFact.fact}
                  onChange={(e) => setEditingFact({ ...editingFact, fact: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Classification:</label>
                  <select
                    value={editingFact.extractionType}
                    onChange={(e) => setEditingFact({ ...editingFact, extractionType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                  >
                    <option value="factual_assertion">Factual Assertion</option>
                    <option value="admission">Admission</option>
                    <option value="denial">Denial</option>
                    <option value="allegation">Allegation</option>
                    <option value="agreement">Agreement / Contract Term</option>
                    <option value="payment">Payment / Financial</option>
                    <option value="obligation">Obligation</option>
                    <option value="notice">Notice</option>
                    <option value="order">Court Order</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Page / Paragraph:</label>
                  <input
                    type="text"
                    value={editingFact.page || ""}
                    onChange={(e) => setEditingFact({ ...editingFact, page: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Attorney Notes:</label>
                <input
                  type="text"
                  value={editingFact.lawyerNotes || ""}
                  onChange={(e) => setEditingFact({ ...editingFact, lawyerNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFact(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
