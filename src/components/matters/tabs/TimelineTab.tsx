import React, { useState } from "react";
import {
  Clock,
  Search,
  Plus,
  CheckCircle,
  FileText,
  Trash2,
  Edit2,
  ShieldCheck,
  Filter,
  X,
  AlertTriangle,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { TimelineEvent, ConfidenceLevel } from "../../../types/matteros.ts";

interface TimelineTabProps {
  timelineEvents: TimelineEvent[];
  matterId: string;
  onAddEvent: (event: Omit<TimelineEvent, "id">) => Promise<void>;
  onUpdateEvent: (eventId: string, updates: Partial<TimelineEvent>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onPreviewSourceDoc?: (docName: string) => void;
  onResolveDateConflict?: (eventId: string, resolvedDate: string, notes: string) => Promise<void>;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timelineEvents,
  matterId,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onPreviewSourceDoc,
  onResolveDateConflict,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [docFilter, setDocFilter] = useState<string>("All");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("All");
  const [conflictFilter, setConflictFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Date Conflict Resolution Modal State
  const [conflictModalEvent, setConflictModalEvent] = useState<TimelineEvent | null>(null);
  const [chosenDate, setChosenDate] = useState("");
  const [resolutionRationale, setResolutionRationale] = useState("");

  // New Event Form State
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventSource, setNewEventSource] = useState("");
  const [newEventPage, setNewEventPage] = useState("");
  const [newEventSection, setNewEventSection] = useState("");
  const [newEventConfidence, setNewEventConfidence] = useState<ConfidenceLevel>("high");

  const sourceDocs = Array.from(
    new Set(timelineEvents.map((e) => e.sourceDocument).filter(Boolean))
  );

  const dateConflicts = timelineEvents.filter((t) => t.hasDateConflict && t.conflictStatus !== "resolved");

  const filteredEvents = timelineEvents.filter((ev) => {
    const matchSearch =
      ev.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.sourceDocument && ev.sourceDocument.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.relatedIssue && ev.relatedIssue.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchDoc = docFilter === "All" || ev.sourceDocument === docFilter;
    const matchVerified =
      verifiedFilter === "All"
        ? true
        : verifiedFilter === "Verified"
        ? ev.lawyerVerified
        : !ev.lawyerVerified;

    const matchConflict =
      conflictFilter === "All"
        ? true
        : conflictFilter === "ConflictsOnly"
        ? ev.hasDateConflict && ev.conflictStatus !== "resolved"
        : conflictFilter === "ResolvedOnly"
        ? ev.conflictStatus === "resolved"
        : true;

    return matchSearch && matchDoc && matchVerified && matchConflict;
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    await onAddEvent({
      matterId,
      ownerId: "current-user",
      date: newEventDate,
      event: newEventTitle.trim(),
      description: newEventDesc.trim(),
      sourceDocument: newEventSource.trim() || "Manual Lawyer Entry",
      sourcePage: newEventPage.trim() || undefined,
      sourceSection: newEventSection.trim() || undefined,
      confidence: newEventConfidence,
      sourceType: "lawyer-entered",
      isAiGenerated: false,
      lawyerVerified: true,
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventSource("");
    setNewEventPage("");
    setNewEventSection("");
  };

  const openResolveModal = (ev: TimelineEvent) => {
    setConflictModalEvent(ev);
    setChosenDate(ev.date);
    setResolutionRationale(
      `Resolved divergent date between ${ev.sourceDocument || "Source A"} and ${ev.dateConflictWithDoc || "Source B"}.`
    );
  };

  const handleSaveResolution = async () => {
    if (!conflictModalEvent) return;
    if (onResolveDateConflict) {
      await onResolveDateConflict(conflictModalEvent.id, chosenDate, resolutionRationale);
    } else {
      await onUpdateEvent(conflictModalEvent.id, {
        date: chosenDate,
        resolvedDate: chosenDate,
        conflictStatus: "resolved",
        sourceType: "lawyer-modified",
        lawyerVerified: true,
      });
    }
    setConflictModalEvent(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    await onUpdateEvent(editingEvent.id, {
      event: editingEvent.event,
      date: editingEvent.date,
      description: editingEvent.description,
      sourceDocument: editingEvent.sourceDocument,
      sourcePage: editingEvent.sourcePage,
      sourceSection: editingEvent.sourceSection,
      confidence: editingEvent.confidence,
      lawyerVerified: editingEvent.lawyerVerified,
    });
    setEditingEvent(null);
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case "high":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "medium":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      default:
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Conflicts Alert Banner if unresolved conflicts exist */}
      {dateConflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-900/50 text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-sans">
                {dateConflicts.length} Unresolved Date Inconsistencies Detected in Case Chronology
              </span>
            </div>
            <button
              onClick={() => setConflictFilter(conflictFilter === "ConflictsOnly" ? "All" : "ConflictsOnly")}
              className="text-[11px] font-mono text-rose-300 hover:text-rose-200 underline"
            >
              {conflictFilter === "ConflictsOnly" ? "Show All Events" : "Filter Conflicts Only"}
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            Multiple documents in this matter record conflicting dates for the same milestones. In accordance with MATTEROS legal safety protocols, conflicting dates are highlighted side-by-side and never overwritten automatically.
          </p>
        </div>
      )}

      {/* Top Controls & Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Unified Matter Chronology & Milestone Audit
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredEvents.length} events)
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Chronology Event</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search events, dates, descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Source Document Filter */}
          <div>
            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Source Documents</option>
              {sourceDocs.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Verification Statuses</option>
              <option value="Verified">Attorney Verified Only</option>
              <option value="Unverified">Pending Review</option>
            </select>
          </div>

          {/* Conflict Filter */}
          <div>
            <select
              value={conflictFilter}
              onChange={(e) => setConflictFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="All">All Events ({timelineEvents.length})</option>
              <option value="ConflictsOnly">Date Conflicts Only ({dateConflicts.length})</option>
              <option value="ResolvedOnly">Resolved Conflicts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chronological Event Stream */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No chronological milestones match criteria</p>
          <p className="mt-1">Clear filters or run multi-document intelligence extraction.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {filteredEvents.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 transition-all ${
                  item.hasDateConflict && item.conflictStatus !== "resolved"
                    ? "bg-rose-500 ring-2 ring-rose-500/40"
                    : item.lawyerVerified
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />

              <div className={`p-4 rounded-xl border transition-all shadow-sm ${
                item.hasDateConflict && item.conflictStatus !== "resolved"
                  ? "bg-rose-950/15 border-rose-900/50"
                  : "bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {item.date}
                      </span>

                      {/* Conflict Status Badge & Action */}
                      {item.hasDateConflict && item.conflictStatus !== "resolved" && (
                        <button
                          onClick={() => openResolveModal(item)}
                          className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center space-x-1 hover:bg-rose-900 transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Resolve Date Conflict</span>
                        </button>
                      )}

                      {item.conflictStatus === "resolved" && (
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Conflict Resolved ({item.resolvedDate || item.date})</span>
                        </span>
                      )}

                      <button
                        onClick={() => onUpdateEvent(item.id, { lawyerVerified: !item.lawyerVerified })}
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center space-x-1 cursor-pointer transition-colors ${
                          item.lawyerVerified
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500/50"
                        }`}
                        title="Click to toggle lawyer verification"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>{item.lawyerVerified ? "Lawyer Verified" : "Verify Milestone"}</span>
                      </button>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getConfidenceBadge(item.confidence)}`}>
                        {item.confidence} confidence
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                        {item.sourceType || (item.isAiGenerated ? "document-extracted" : "lawyer-entered")}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 mt-2">
                      {item.event}
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                      {item.description}
                    </p>

                    {/* Date Conflict Detail Box */}
                    {item.hasDateConflict && item.conflictStatus !== "resolved" && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-rose-900/40 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-rose-300 font-mono text-[11px] font-bold uppercase">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Conflicting Source Records:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <span className="text-slate-500 block text-[9px] uppercase">Record A:</span>
                            <span className="text-slate-200 block font-bold">{item.date}</span>
                            <span className="text-slate-400 truncate block">{item.sourceDocument}</span>
                          </div>
                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <span className="text-slate-500 block text-[9px] uppercase">Record B:</span>
                            <span className="text-rose-300 block font-bold">{item.dateConflictDate || "Conflicting Date"}</span>
                            <span className="text-slate-400 truncate block">{item.dateConflictWithDoc || "Conflicting Document"}</span>
                          </div>
                        </div>
                        {item.dateConflictReason && (
                          <p className="text-[11px] text-slate-300 italic font-sans">
                            "{item.dateConflictReason}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Source Citation */}
                    {item.sourceDocument && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-slate-500">Source:</span>
                        <span
                          onClick={() => onPreviewSourceDoc?.(item.sourceDocument!)}
                          className="text-amber-400/90 hover:underline cursor-pointer font-mono truncate"
                        >
                          {item.sourceDocument}
                        </span>
                        {(item.sourcePage || item.sourceSection) && (
                          <span className="text-slate-500 font-mono">
                            [{item.sourcePage ? item.sourcePage : ""}{item.sourcePage && item.sourceSection ? " · " : ""}{item.sourceSection ? item.sourceSection : ""}]
                          </span>
                        )}
                        {item.relatedIssue && (
                          <span className="text-purple-300 ml-2">Issue: {item.relatedIssue}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0 pt-1">
                    <button
                      onClick={() => setEditingEvent(item)}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                      title="Edit event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Conflict Resolution Modal */}
      {conflictModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 pb-2 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                Resolve Chronological Date Conflict
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Select which source date governs this case milestone, or enter a resolved date with lawyer explanation:
            </p>

            <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">{conflictModalEvent.event}</div>
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setChosenDate(conflictModalEvent.date)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    chosenDate === conflictModalEvent.date
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="text-[10px] block uppercase text-slate-500">Record A Date</span>
                  <span className="text-xs font-bold text-slate-100">{conflictModalEvent.date}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{conflictModalEvent.sourceDocument}</span>
                </button>

                <button
                  type="button"
                  onClick={() => conflictModalEvent.dateConflictDate && setChosenDate(conflictModalEvent.dateConflictDate)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    chosenDate === conflictModalEvent.dateConflictDate
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="text-[10px] block uppercase text-slate-500">Record B Date</span>
                  <span className="text-xs font-bold text-slate-100">{conflictModalEvent.dateConflictDate || "N/A"}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{conflictModalEvent.dateConflictWithDoc || "Document B"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block font-medium">
                Resolved Governing Date (YYYY-MM-DD):
              </label>
              <input
                type="text"
                value={chosenDate}
                onChange={(e) => setChosenDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block font-medium">
                Counsel Resolution Notes & Legal Rationale:
              </label>
              <textarea
                value={resolutionRationale}
                onChange={(e) => setResolutionRationale(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConflictModalEvent(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResolution}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Add Chronology Milestone</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Date (YYYY-MM-DD):</label>
                  <input
                    type="text"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 block font-medium">Milestone Title:</label>
                  <input
                    type="text"
                    placeholder="e.g. Inverter Failure SCADA Incident"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Description:</label>
                <textarea
                  rows={3}
                  placeholder="Details of the factual event..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 block font-medium">Source Document:</label>
                  <input
                    type="text"
                    placeholder="e.g. Audit_Report.pdf"
                    value={newEventSource}
                    onChange={(e) => setNewEventSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Page / Section:</label>
                  <input
                    type="text"
                    placeholder="Page 12"
                    value={newEventPage}
                    onChange={(e) => setNewEventPage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
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
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Edit Chronology Milestone</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Date:</label>
                  <input
                    type="text"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 block font-medium">Title:</label>
                  <input
                    type="text"
                    value={editingEvent.event}
                    onChange={(e) => setEditingEvent({ ...editingEvent, event: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Description:</label>
                <textarea
                  rows={3}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Source Document:</label>
                  <input
                    type="text"
                    value={editingEvent.sourceDocument || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, sourceDocument: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Page / Section:</label>
                  <input
                    type="text"
                    value={editingEvent.sourcePage || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, sourcePage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
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
