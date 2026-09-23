import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";
import {
  MatterContradiction,
  DocumentItem,
  ContradictionCategory,
  ContradictionStatus,
} from "../../../types/matteros.ts";

interface ContradictionsTabProps {
  contradictions: MatterContradiction[];
  documents: DocumentItem[];
  matterId: string;
  onAddContradiction: (contra: Omit<MatterContradiction, "id">) => Promise<void>;
  onUpdateContradiction: (id: string, updates: Partial<MatterContradiction>) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const ContradictionsTab: React.FC<ContradictionsTabProps> = ({
  contradictions,
  documents,
  matterId,
  onAddContradiction,
  onUpdateContradiction,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Quick notes editor state
  const [activeNotesId, setActiveNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // New Contradiction Form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ContradictionCategory>("event_description");
  const [newWhyFlagged, setNewWhyFlagged] = useState("");
  const [stmtAText, setStmtAText] = useState("");
  const [stmtADoc, setStmtADoc] = useState(documents[0]?.filename || "");
  const [stmtAPage, setStmtAPage] = useState("");
  const [stmtADate, setStmtADate] = useState("");
  const [stmtBText, setStmtBText] = useState("");
  const [stmtBDoc, setStmtBDoc] = useState(documents[1]?.filename || documents[0]?.filename || "");
  const [stmtBPage, setStmtBPage] = useState("");
  const [stmtBDate, setStmtBDate] = useState("");

  const filtered = contradictions.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.whyFlagged.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.statementA.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.statementB.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.statementA.sourceDocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.statementB.sourceDocument.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchCat = categoryFilter === "All" || c.contradictionCategory === categoryFilter;

    return matchSearch && matchStatus && matchCat;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !stmtAText.trim() || !stmtBText.trim()) return;

    await onAddContradiction({
      matterId,
      ownerId: "current-user",
      title: newTitle.trim(),
      statementA: {
        text: stmtAText.trim(),
        sourceDocument: stmtADoc,
        page: stmtAPage.trim() || undefined,
        date: stmtADate.trim() || undefined,
      },
      statementB: {
        text: stmtBText.trim(),
        sourceDocument: stmtBDoc,
        page: stmtBPage.trim() || undefined,
        date: stmtBDate.trim() || undefined,
      },
      contradictionCategory: newCategory,
      whyFlagged: newWhyFlagged.trim() || "Flagged manually by counsel for inconsistency review.",
      status: "unreviewed",
      isAiDetected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewTitle("");
    setNewWhyFlagged("");
    setStmtAText("");
    setStmtBText("");
  };

  const handleUpdateStatus = async (id: string, status: ContradictionStatus) => {
    await onUpdateContradiction(id, { status });
  };

  const openNotesEditor = (c: MatterContradiction) => {
    setActiveNotesId(c.id);
    setNoteText(c.lawyerNotes || "");
  };

  const saveNotes = async (id: string) => {
    await onUpdateContradiction(id, { lawyerNotes: noteText });
    setActiveNotesId(null);
  };

  return (
    <div className="space-y-6">
      {/* Lawyer-in-the-Loop Explanatory Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-amber-300 font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-sans">Cross-Document Inconsistency & Contradiction Detection</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans">
          MATTEROS flags discrepancies in dates, factual assertions, and contractual representations across case documents. Inconsistencies are never silently or automatically resolved — the lawyer retains sole adjudicative discretion to assess and reconcile records.
        </p>
      </div>

      {/* Controls & Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Matter Inconsistencies & Contradictions ({contradictions.length})
            </h3>
            <span className="text-xs text-amber-400 font-mono">
              ({contradictions.filter((c) => c.status === "unreviewed").length} unreviewed)
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Flag Inconsistency</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search contradictions, statements, or documents..."
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
              <option value="All">All Status</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="confirmed">Confirmed Inconsistency</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="All">All Categories</option>
              <option value="date_conflict">Date Conflict</option>
              <option value="payment_discrepancy">Payment Discrepancy</option>
              <option value="event_description">Event Description</option>
              <option value="agreement_terms">Agreement Terms</option>
              <option value="position_shift">Position Shift</option>
              <option value="admission_denial">Admission vs Denial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contradictions List */}
      <div className="space-y-4">
        {filtered.map((contra) => (
          <div
            key={contra.id}
            className={`p-5 rounded-2xl border transition-all space-y-4 ${
              contra.status === "confirmed"
                ? "bg-amber-950/15 border-amber-900/60"
                : contra.status === "dismissed"
                ? "bg-slate-950/40 border-slate-800/40 opacity-70"
                : "bg-slate-900/70 border-slate-800"
            }`}
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  {contra.contradictionCategory.replace("_", " ")}
                </span>
                <h4 className="text-sm font-bold text-slate-100 font-sans">{contra.title}</h4>
              </div>

              {/* Status Selector */}
              <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Status:</span>
                <select
                  value={contra.status}
                  onChange={(e) => handleUpdateStatus(contra.id, e.target.value as any)}
                  className={`text-[11px] font-mono rounded px-2 py-1 font-semibold border focus:outline-none ${
                    contra.status === "confirmed"
                      ? "bg-amber-950 text-amber-300 border-amber-800"
                      : contra.status === "dismissed"
                      ? "bg-slate-800 text-slate-400 border-slate-700"
                      : contra.status === "reviewed"
                      ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                      : "bg-rose-950/70 text-rose-300 border-rose-800/60"
                  }`}
                >
                  <option value="unreviewed">Unreviewed</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="confirmed">Confirmed Inconsistency</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>

            {/* Why Flagged Explanation */}
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              <strong className="text-slate-400 font-medium">Why Flagged:</strong> {contra.whyFlagged}
            </p>

            {/* Side-by-Side Statements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Statement A */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-indigo-400 font-bold uppercase">Statement A</span>
                  {contra.statementA.date && (
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{contra.statementA.date}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                  "{contra.statementA.text}"
                </p>

                <div className="pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-900 flex items-center justify-between">
                  <button
                    onClick={() => onPreviewDoc?.(contra.statementA.sourceDocument)}
                    className="text-indigo-400 hover:text-indigo-300 truncate max-w-[200px] flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>{contra.statementA.sourceDocument}</span>
                  </button>
                  {contra.statementA.page && (
                    <span className="text-slate-500 font-mono">[{contra.statementA.page}]</span>
                  )}
                </div>
              </div>

              {/* Statement B */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-rose-400 font-bold uppercase">Statement B</span>
                  {contra.statementB.date && (
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{contra.statementB.date}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                  "{contra.statementB.text}"
                </p>

                <div className="pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-900 flex items-center justify-between">
                  <button
                    onClick={() => onPreviewDoc?.(contra.statementB.sourceDocument)}
                    className="text-rose-400 hover:text-rose-300 truncate max-w-[200px] flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>{contra.statementB.sourceDocument}</span>
                  </button>
                  {contra.statementB.page && (
                    <span className="text-slate-500 font-mono">[{contra.statementB.page}]</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lawyer Notes / Assessment Area */}
            {activeNotesId === contra.id ? (
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs text-slate-400 block font-medium">Counsel Assessment / Resolution Rationale:</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setActiveNotesId(null)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveNotes(contra.id)}
                    className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-xs">
                {contra.lawyerNotes ? (
                  <div className="text-xs text-slate-300 font-sans">
                    <strong className="text-indigo-400 font-mono text-[11px] uppercase mr-1.5">Attorney Assessment:</strong>
                    {contra.lawyerNotes}
                  </div>
                ) : (
                  <span className="text-slate-500 italic text-[11px]">No attorney resolution notes entered.</span>
                )}
                <button
                  onClick={() => openNotesEditor(contra)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-mono ml-4 shrink-0"
                >
                  {contra.lawyerNotes ? "Edit Notes" : "+ Add Assessment"}
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-400">No cross-document inconsistencies matched your filter.</p>
          </div>
        )}
      </div>

      {/* Flag Inconsistency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">Flag Case Inconsistency</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Inconsistency Title:</label>
                  <input
                    type="text"
                    placeholder="e.g. EPC Agreement Execution Date Inconsistency"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                  >
                    <option value="date_conflict">Date Conflict</option>
                    <option value="payment_discrepancy">Payment Discrepancy</option>
                    <option value="event_description">Event Description</option>
                    <option value="agreement_terms">Agreement Terms</option>
                    <option value="position_shift">Position Shift</option>
                    <option value="admission_denial">Admission vs Denial</option>
                  </select>
                </div>
              </div>

              {/* Statement A Input */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="font-mono uppercase font-bold text-indigo-400 text-[10px]">Statement A</span>
                <textarea
                  rows={2}
                  placeholder="Exact quote or assertion in first source..."
                  value={stmtAText}
                  onChange={(e) => setStmtAText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                  required
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={stmtADoc}
                    onChange={(e) => setStmtADoc(e.target.value)}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px]"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Page / Section"
                    value={stmtAPage}
                    onChange={(e) => setStmtAPage(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* Statement B Input */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="font-mono uppercase font-bold text-rose-400 text-[10px]">Statement B</span>
                <textarea
                  rows={2}
                  placeholder="Conflicting quote or assertion in second source..."
                  value={stmtBText}
                  onChange={(e) => setStmtBText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                  required
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={stmtBDoc}
                    onChange={(e) => setStmtBDoc(e.target.value)}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px]"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Page / Section"
                    value={stmtBPage}
                    onChange={(e) => setStmtBPage(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Why Flagged / Legal Vulnerability:</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this inconsistency is material to liability, damages, or credibility..."
                  value={newWhyFlagged}
                  onChange={(e) => setNewWhyFlagged(e.target.value)}
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
                  Save Inconsistency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
