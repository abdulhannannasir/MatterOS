import React, { useState } from "react";
import {
  GitFork,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  X,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { MatterRelationship, DocumentItem, RelationshipType } from "../../../types/matteros.ts";

interface RelationshipsTabProps {
  relationships: MatterRelationship[];
  documents: DocumentItem[];
  matterId: string;
  onAddRelationship: (rel: Omit<MatterRelationship, "id">) => Promise<void>;
  onUpdateRelationship: (id: string, updates: Partial<MatterRelationship>) => Promise<void>;
  onDeleteRelationship: (id: string) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const RelationshipsTab: React.FC<RelationshipsTabProps> = ({
  relationships,
  documents,
  matterId,
  onAddRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRel, setEditingRel] = useState<MatterRelationship | null>(null);

  // New Form State
  const [sourceDoc, setSourceDoc] = useState(documents[0]?.filename || "");
  const [targetDoc, setTargetDoc] = useState(documents[1]?.filename || documents[0]?.filename || "");
  const [relType, setRelType] = useState<RelationshipType>("references");
  const [description, setDescription] = useState("");
  const [clause, setClause] = useState("");

  const filtered = relationships.filter((r) => {
    const matchSearch =
      r.sourceDocName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.targetDocName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.clauseOrSection && r.clauseOrSection.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter === "All" || r.relationshipType === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceDoc || !targetDoc || !description.trim()) return;

    await onAddRelationship({
      matterId,
      ownerId: "current-user",
      sourceDocName: sourceDoc,
      targetDocName: targetDoc,
      relationshipType: relType,
      description: description.trim(),
      clauseOrSection: clause.trim() || undefined,
      isAiDetected: false,
      isLawyerConfirmed: true,
      createdBy: "lawyer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setDescription("");
    setClause("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRel) return;
    await onUpdateRelationship(editingRel.id, {
      relationshipType: editingRel.relationshipType,
      description: editingRel.description,
      clauseOrSection: editingRel.clauseOrSection,
      isLawyerConfirmed: true,
    });
    setEditingRel(null);
  };

  const getRelColor = (type: RelationshipType) => {
    switch (type) {
      case "amends":
        return "bg-amber-950/70 text-amber-300 border-amber-800/60";
      case "responds_to":
        return "bg-sky-950/70 text-sky-300 border-sky-800/60";
      case "relies_upon":
        return "bg-indigo-950/70 text-indigo-300 border-indigo-800/60";
      case "supports":
        return "bg-emerald-950/70 text-emerald-300 border-emerald-800/60";
      case "contradicts":
        return "bg-rose-950/70 text-rose-300 border-rose-800/60";
      case "follows":
        return "bg-purple-950/70 text-purple-300 border-purple-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Cross-Document Relationships & Reference Graph
            </h3>
            <span className="text-xs text-slate-400 font-mono">({relationships.length} mapped)</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Map Document Relationship</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search relationships, document names, clauses, descriptions..."
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
              <option value="All">All Types ({relationships.length})</option>
              <option value="references">references</option>
              <option value="amends">amends</option>
              <option value="responds_to">responds_to</option>
              <option value="relies_upon">relies_upon</option>
              <option value="supports">supports</option>
              <option value="contradicts">contradicts</option>
              <option value="follows">follows</option>
              <option value="precedes">precedes</option>
              <option value="related_to">related_to</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Relationship Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((rel) => (
          <div
            key={rel.id}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
          >
            {/* Top Node Flow */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => onPreviewDoc?.(rel.sourceDocName)}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 hover:text-indigo-300 font-semibold truncate max-w-[160px]"
                  title={rel.sourceDocName}
                >
                  {rel.sourceDocName}
                </button>

                <div className="flex items-center space-x-1 text-slate-500">
                  <ArrowRight className="w-3 h-3" />
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRelColor(rel.relationshipType)}`}>
                    {rel.relationshipType.replace("_", " ")}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </div>

                <button
                  onClick={() => onPreviewDoc?.(rel.targetDocName)}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 hover:text-indigo-300 font-semibold truncate max-w-[160px]"
                  title={rel.targetDocName}
                >
                  {rel.targetDocName}
                </button>
              </div>

              {/* Status Badge */}
              <div>
                {rel.isLawyerConfirmed ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-[9px] font-mono uppercase border border-emerald-800/60 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Confirmed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onUpdateRelationship(rel.id, { isLawyerConfirmed: true })}
                    className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 text-[9px] font-mono uppercase border border-amber-800/60 flex items-center space-x-1 transition-colors"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Confirm Link</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description & Clause */}
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {rel.description}
            </p>

            {rel.clauseOrSection && (
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40">
                <span className="text-slate-500">Clause / Section:</span> {rel.clauseOrSection}
              </div>
            )}

            {/* Shared Entities Tags */}
            {rel.sharedEntities && (
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-slate-400">
                {rel.sharedEntities.issues?.map((iss, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-300">
                    Issue: {iss}
                  </span>
                ))}
                {rel.sharedEntities.dates?.map((dt, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    Date: {dt}
                  </span>
                ))}
              </div>
            )}

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500 border-t border-slate-800/40">
              <span className="text-[10px] font-mono">
                Source: {rel.isAiDetected ? "AI Extraction" : "Lawyer Entered"}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingRel(rel)}
                  className="p-1 hover:text-slate-200 transition-colors"
                  title="Edit Relationship"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteRelationship(rel.id)}
                  className="p-1 hover:text-rose-400 transition-colors"
                  title="Remove Relationship"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
          <GitFork className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No cross-document relationships matched your filters.</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">Map Document Relationship</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Source Document:</label>
                  <select
                    value={sourceDoc}
                    onChange={(e) => setSourceDoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Relationship Type:</label>
                  <select
                    value={relType}
                    onChange={(e) => setRelType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="references">references</option>
                    <option value="amends">amends</option>
                    <option value="responds_to">responds_to</option>
                    <option value="relies_upon">relies_upon</option>
                    <option value="supports">supports</option>
                    <option value="contradicts">contradicts</option>
                    <option value="follows">follows</option>
                    <option value="precedes">precedes</option>
                    <option value="related_to">related_to</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Target Document:</label>
                <select
                  value={targetDoc}
                  onChange={(e) => setTargetDoc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
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
                  placeholder="e.g. Section 8.2 & Schedule B"
                  value={clause}
                  onChange={(e) => setClause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Description of Relationship:</label>
                <textarea
                  rows={3}
                  placeholder="Explain how these two documents connect, rely upon, or contradict each other..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  required
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
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Edit Relationship</h3>
              <button onClick={() => setEditingRel(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="p-2 rounded bg-slate-950 text-[11px] font-mono text-slate-300">
                {editingRel.sourceDocName} → {editingRel.targetDocName}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Relationship Type:</label>
                <select
                  value={editingRel.relationshipType}
                  onChange={(e) => setEditingRel({ ...editingRel, relationshipType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                >
                  <option value="references">references</option>
                  <option value="amends">amends</option>
                  <option value="responds_to">responds_to</option>
                  <option value="relies_upon">relies_upon</option>
                  <option value="supports">supports</option>
                  <option value="contradicts">contradicts</option>
                  <option value="follows">follows</option>
                  <option value="precedes">precedes</option>
                  <option value="related_to">related_to</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Clause / Section:</label>
                <input
                  type="text"
                  value={editingRel.clauseOrSection || ""}
                  onChange={(e) => setEditingRel({ ...editingRel, clauseOrSection: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Description:</label>
                <textarea
                  rows={3}
                  value={editingRel.description}
                  onChange={(e) => setEditingRel({ ...editingRel, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRel(null)}
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
