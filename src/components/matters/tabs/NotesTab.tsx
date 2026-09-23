import React, { useState } from "react";
import {
  FileEdit,
  Plus,
  Search,
  Tag,
  User,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  X,
  FileText,
  AlertCircle,
  Shield,
} from "lucide-react";
import { MatterNote, Issue, DocumentItem } from "../../../types/matteros.ts";

interface NotesTabProps {
  notes: MatterNote[];
  matterId: string;
  issues?: Issue[];
  documents?: DocumentItem[];
  currentUserEmail?: string;
  onAddNote: (note: Omit<MatterNote, "id">) => Promise<void>;
  onUpdateNote: (noteId: string, updates: Partial<MatterNote>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  matterId,
  issues = [],
  documents = [],
  currentUserEmail = "counsel@matteros.law",
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState(currentUserEmail);
  const [formTags, setFormTags] = useState("");
  const [formRelatedIssue, setFormRelatedIssue] = useState("");
  const [formRelatedDoc, setFormRelatedDoc] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormAuthor(currentUserEmail);
    setFormTags("");
    setFormRelatedIssue("");
    setFormRelatedDoc("");
    setEditingNoteId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (note: MatterNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormAuthor(note.author);
    setFormTags((note.tags || []).join(", "));
    setFormRelatedIssue(note.relatedIssue || "");
    setFormRelatedDoc(note.relatedDocument || "");
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingNoteId) {
      await onUpdateNote(editingNoteId, {
        title: formTitle.trim(),
        content: formContent.trim(),
        author: formAuthor.trim() || currentUserEmail,
        tags: tagsArray,
        relatedIssue: formRelatedIssue.trim() || undefined,
        relatedDocument: formRelatedDoc.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await onAddNote({
        matterId,
        ownerId: "current-user",
        title: formTitle.trim(),
        content: formContent.trim(),
        author: formAuthor.trim() || currentUserEmail,
        tags: tagsArray,
        relatedIssue: formRelatedIssue.trim() || undefined,
        relatedDocument: formRelatedDoc.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setShowAddModal(false);
    resetForm();
  };

  // Collect all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags || []))
  );

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = tagFilter === "All" || (n.tags || []).includes(tagFilter);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileEdit className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-sans flex items-center gap-2">
                <span>Attorney Work-Product Notes</span>
                <span className="text-xs text-slate-400 font-mono font-normal">
                  ({filteredNotes.length} notes)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Confidential case notes, interview summaries, and litigation strategies. Kept separate from objective AI extracted facts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Privileged Work-Product</span>
            </span>

            <button
              onClick={openCreateModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search note text, titles, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center space-x-1 overflow-x-auto py-1">
              <button
                onClick={() => setTagFilter("All")}
                className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                  tagFilter === "All"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer flex items-center space-x-1 ${
                    tagFilter === tag
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <FileEdit className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No attorney notes logged</p>
          <p className="mt-1">Add legal memos, deposition impressions, or client meeting records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 shadow-sm flex flex-col justify-between space-y-3 transition-all"
            >
              <div className="space-y-2">
                {/* Note Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold font-serif text-slate-100 line-clamp-2">
                    {note.title}
                  </h4>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => openEditModal(note)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-6 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 font-sans">
                  {note.content}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/30 text-amber-300 border border-amber-800/40 flex items-center space-x-1"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Note Footer: Metadata & Linkages */}
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {note.relatedDocument && (
                    <button
                      onClick={() => onPreviewDoc && onPreviewDoc(note.relatedDocument!)}
                      className="inline-flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-900/40 px-2 py-0.5 rounded cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{note.relatedDocument}</span>
                    </button>
                  )}

                  {note.relatedIssue && (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-purple-400 bg-purple-950/30 border border-purple-900/40 px-2 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>{issues.find((i) => i.id === note.relatedIssue)?.title || note.relatedIssue}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>{note.author}</span>
                  </span>
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileEdit className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  {editingNoteId ? "Edit Attorney Note" : "Log Attorney Work-Product Note"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chancery Hearing Strategy on Liquidated Damages"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Attorney Note Content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Detailed notes, legal impressions, witness conference takeaways, or strategy memos..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Author / Counsel
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Strategy, Expert, Damages, Delaware"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Context Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Related Issue</label>
                  <select
                    value={formRelatedIssue}
                    onChange={(e) => setFormRelatedIssue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">None</option>
                    {issues.map((iss) => (
                      <option key={iss.id} value={iss.id}>
                        {iss.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Related Document</label>
                  <select
                    value={formRelatedDoc}
                    onChange={(e) => setFormRelatedDoc(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">None</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  {editingNoteId ? "Save Changes" : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
