import React, { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  FileText,
  Tag,
  Calendar,
  X,
  Trash2,
} from "lucide-react";
import { EvidenceItem } from "../../../types/matteros.ts";

interface EvidenceTabProps {
  evidence: EvidenceItem[];
  matterId: string;
  onAddEvidence: (ev: Omit<EvidenceItem, "id">) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({
  evidence,
  matterId,
  onAddEvidence,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Evidence State
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Documentary");
  const [newDesc, setNewDesc] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newStatus, setNewStatus] = useState("Admitted");
  const [newNotes, setNewNotes] = useState("");

  const filteredEvidence = evidence.filter((ev) => {
    const matchSearch =
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter === "All" || ev.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await onAddEvidence({
      matterId,
      ownerId: "current-user",
      name: newName.trim(),
      type: newType,
      description: newDesc.trim(),
      sourceDocument: newSource.trim() || undefined,
      date: newDate,
      status: newStatus,
      notes: newNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewName("");
    setNewDesc("");
    setNewSource("");
    setNewNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Admitted":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "Pending Discovery":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "Challenged":
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
      default:
        return "bg-purple-950/60 text-purple-300 border-purple-800/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Matter Evidence Repository & Chain of Custody
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredEvidence.length} items)
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Index Evidence Item</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search evidence items, chain of custody notes, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Evidence Types</option>
              <option value="Documentary">Documentary</option>
              <option value="Digital">Digital / Telemetry</option>
              <option value="Testimonial">Testimonial</option>
              <option value="Demonstrative">Demonstrative</option>
              <option value="Financial">Financial / Audit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Cards */}
      {filteredEvidence.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No evidence indexed</p>
          <p className="mt-1">Index exhibits, SCADA logs, contracts, or testimonial affidavits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvidence.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {ev.type}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusBadge(ev.status)}`}>
                    {ev.status}
                  </span>
                </div>
                {ev.date && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{ev.date}</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-100">
                  {ev.name}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {ev.description}
                </p>
              </div>

              {ev.notes && (
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-medium font-mono text-[10px] uppercase block">
                    Chain of Custody / Notes:
                  </span>
                  {ev.notes}
                </div>
              )}

              {ev.sourceDocument && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500">Source:</span>
                  <span
                    onClick={() => onPreviewDoc?.(ev.sourceDocument!)}
                    className="text-amber-400/90 hover:underline cursor-pointer font-mono truncate"
                  >
                    {ev.sourceDocument}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Index Evidence Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Evidence Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SCADA Inverter Telemetry Incident Log"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Evidence Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200"
                  >
                    <option value="Documentary">Documentary</option>
                    <option value="Digital">Digital / Telemetry</option>
                    <option value="Testimonial">Testimonial</option>
                    <option value="Demonstrative">Demonstrative</option>
                    <option value="Financial">Financial / Audit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Admission Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200"
                  >
                    <option value="Admitted">Admitted</option>
                    <option value="Pending Discovery">Pending Discovery</option>
                    <option value="Challenged">Challenged</option>
                    <option value="Internal Work Product">Internal Work Product</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Description / Substantive Relevance</label>
                <textarea
                  rows={2}
                  placeholder="What does this evidence prove or rebut?..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Date of Artifact</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Source Case File</label>
                  <input
                    type="text"
                    placeholder="e.g. Audit_Report.pdf"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Chain of Custody / Attorney Notes</label>
                <textarea
                  rows={2}
                  placeholder="Custodians, hash verification, Bates stamp numbers..."
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
                  Index Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
