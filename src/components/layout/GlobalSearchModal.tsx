import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Briefcase,
  FileText,
  Clock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  CheckSquare,
  FileEdit,
  Calendar,
} from "lucide-react";
import { Matter, DocumentItem, TimelineEvent, Issue, EvidenceItem, Task, MatterNote, Deadline } from "../../types/matteros.ts";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matters: Matter[];
  documents: DocumentItem[];
  timelineEvents: TimelineEvent[];
  issues: Issue[];
  evidence: EvidenceItem[];
  tasks?: Task[];
  notes?: MatterNote[];
  deadlines?: Deadline[];
  onSelectMatter: (matterId: string) => void;
}

export interface SearchResultItem {
  id: string;
  type: "Matter" | "Document" | "Timeline" | "Issue" | "Evidence" | "Task" | "Note" | "Deadline";
  title: string;
  snippet: string;
  matterId: string;
  matterName: string;
  date?: string;
  tag?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  matters,
  documents,
  timelineEvents,
  issues,
  evidence,
  tasks = [],
  notes = [],
  deadlines = [],
  onSelectMatter,
}) => {
  const [queryText, setQueryText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQueryText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = queryText.toLowerCase().trim();

  const results: SearchResultItem[] = [];

  if (q.length > 1) {
    // Search matters
    matters.forEach((m) => {
      if (
        m.matterName.toLowerCase().includes(q) ||
        m.matterNumber.toLowerCase().includes(q) ||
        m.client.toLowerCase().includes(q) ||
        m.opposingParty?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
      ) {
        results.push({
          id: m.id,
          type: "Matter",
          title: m.matterName,
          snippet: `${m.matterNumber} • Client: ${m.client} • ${m.matterType}`,
          matterId: m.id,
          matterName: m.matterName,
          date: m.createdAt.split("T")[0],
          tag: m.status,
        });
      }
    });

    // Search documents
    documents.forEach((d) => {
      const parentMatter = matters.find((m) => m.id === d.matterId);
      if (
        d.filename.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.contentSummary?.toLowerCase().includes(q) ||
        d.extractedText.toLowerCase().includes(q)
      ) {
        results.push({
          id: d.id,
          type: "Document",
          title: d.filename,
          snippet: d.contentSummary || d.extractedText.slice(0, 160) + "...",
          matterId: d.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: d.uploadDate.split("T")[0],
          tag: d.category,
        });
      }
    });

    // Search issues
    issues.forEach((iss) => {
      const parentMatter = matters.find((m) => m.id === iss.matterId);
      if (
        iss.title.toLowerCase().includes(q) ||
        iss.description.toLowerCase().includes(q) ||
        iss.lawyerNotes?.toLowerCase().includes(q)
      ) {
        results.push({
          id: iss.id,
          type: "Issue",
          title: iss.title,
          snippet: iss.description,
          matterId: iss.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: iss.createdAt.split("T")[0],
          tag: iss.status,
        });
      }
    });

    // Search timeline
    timelineEvents.forEach((ev) => {
      const parentMatter = matters.find((m) => m.id === ev.matterId);
      if (
        ev.event.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.sourceDocument?.toLowerCase().includes(q)
      ) {
        results.push({
          id: ev.id,
          type: "Timeline",
          title: ev.event,
          snippet: `${ev.description} [Source: ${ev.sourceDocument || "Record"}]`,
          matterId: ev.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: ev.date,
          tag: ev.confidence,
        });
      }
    });

    // Search evidence
    evidence.forEach((ev) => {
      const parentMatter = matters.find((m) => m.id === ev.matterId);
      if (
        ev.name.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.notes?.toLowerCase().includes(q)
      ) {
        results.push({
          id: ev.id,
          type: "Evidence",
          title: ev.name,
          snippet: `${ev.description} • Status: ${ev.status}`,
          matterId: ev.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: ev.date,
          tag: ev.type,
        });
      }
    });

    // Search tasks
    tasks.forEach((t) => {
      const parentMatter = matters.find((m) => m.id === t.matterId);
      if (
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assignedTo?.toLowerCase().includes(q)
      ) {
        results.push({
          id: t.id,
          type: "Task",
          title: t.title,
          snippet: `${t.description || "Task"} • Assignee: ${t.assignedTo || "Unassigned"} • Priority: ${t.priority}`,
          matterId: t.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: t.dueDate,
          tag: t.status,
        });
      }
    });

    // Search notes
    notes.forEach((n) => {
      const parentMatter = matters.find((m) => m.id === n.matterId);
      if (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q)
      ) {
        results.push({
          id: n.id,
          type: "Note",
          title: n.title,
          snippet: n.content.slice(0, 160) + "...",
          matterId: n.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: n.createdAt.split("T")[0],
          tag: n.author,
        });
      }
    });

    // Search deadlines
    deadlines.forEach((dl) => {
      const parentMatter = matters.find((m) => m.id === dl.matterId);
      if (
        dl.title.toLowerCase().includes(q) ||
        dl.description?.toLowerCase().includes(q) ||
        dl.source?.toLowerCase().includes(q)
      ) {
        results.push({
          id: dl.id,
          type: "Deadline",
          title: dl.title,
          snippet: `${dl.description || "Procedural Deadline"} • Status: ${dl.status} [Priority: ${dl.priority}]`,
          matterId: dl.matterId,
          matterName: parentMatter?.matterName || "Matter",
          date: dl.date,
          tag: dl.isLawyerConfirmed ? "Confirmed" : "AI Suggested",
        });
      }
    });
  }

  const getTypeIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "Matter":
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      case "Document":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "Timeline":
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case "Issue":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case "Evidence":
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case "Task":
        return <CheckSquare className="w-4 h-4 text-amber-400" />;
      case "Note":
        return <FileEdit className="w-4 h-4 text-cyan-400" />;
      case "Deadline":
        return <Calendar className="w-4 h-4 text-rose-400" />;
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    onSelectMatter(item.matterId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all matters, documents, pleadings, issues, evidence..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-sans"
          />
          {queryText && (
            <button onClick={() => setQueryText("")} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {queryText.trim().length <= 1 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p className="font-mono text-slate-400 mb-1">ENTER SEARCH KEYWORD</p>
              <p>Type at least 2 characters to search across all case files, dockets, and timeline items.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p className="font-medium text-slate-400 mb-1">No matching legal records found</p>
              <p>Check spelling or search for parties, docket numbers, dates, or legal issues.</p>
            </div>
          ) : (
            results.map((res) => (
              <div
                key={`${res.type}-${res.id}`}
                onClick={() => handleSelect(res)}
                className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-amber-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                      {getTypeIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {res.type}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                          {res.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {res.snippet}
                      </p>
                      <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-500">
                        <span className="truncate max-w-[200px]">Matter: {res.matterName}</span>
                        {res.date && <span>• Date: {res.date}</span>}
                        {res.tag && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {res.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0 mt-2" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>{results.length} result(s) found</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
