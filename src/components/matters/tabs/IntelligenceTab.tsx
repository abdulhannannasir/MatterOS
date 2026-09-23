import React, { useState } from "react";
import {
  Brain,
  AlertTriangle,
  GitFork,
  CheckCircle2,
  Calendar,
  Sparkles,
  FileText,
  Clock,
  ArrowUpRight,
  RefreshCw,
  FileQuestion,
  Search,
  BookOpen,
  ChevronRight,
  Scale,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  Matter,
  DocumentItem,
  TimelineEvent,
  Issue,
  EvidenceItem,
  MatterRelationship,
  MatterFact,
  MatterContradiction,
  MatterMissingInfo,
} from "../../../types/matteros.ts";

interface IntelligenceTabProps {
  matter: Matter;
  documents: DocumentItem[];
  timeline: TimelineEvent[];
  issues: Issue[];
  evidence: EvidenceItem[];
  relationships: MatterRelationship[];
  facts: MatterFact[];
  contradictions: MatterContradiction[];
  missingInfo: MatterMissingInfo[];
  onSelectTab: (tab: string) => void;
  onPreviewDoc?: (docName: string) => void;
  onRunMultiDocAnalysis: (mode: "pro" | "flash" | "lite") => Promise<any>;
  isAnalyzingMultiDoc: boolean;
  onResolveDateConflict?: (eventId: string, resolvedDate: string, notes: string) => Promise<void>;
  onUpdateContradictionStatus?: (id: string, status: any) => Promise<void>;
}

export const IntelligenceTab: React.FC<IntelligenceTabProps> = ({
  matter,
  documents,
  timeline,
  issues,
  evidence,
  relationships,
  facts,
  contradictions,
  missingInfo,
  onSelectTab,
  onPreviewDoc,
  onRunMultiDocAnalysis,
  isAnalyzingMultiDoc,
  onResolveDateConflict,
  onUpdateContradictionStatus,
}) => {
  const [modelMode, setModelMode] = useState<"pro" | "flash" | "lite">("flash");
  const [lastAnalysisResult, setLastAnalysisResult] = useState<any | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Quick Conflict Modal State
  const [conflictModalEvent, setConflictModalEvent] = useState<TimelineEvent | null>(null);
  const [chosenResolvedDate, setChosenResolvedDate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const analyzedDocs = documents.filter((d) => d.aiAnalysisStatus === "Completed" || d.processingStatus === "Analyzed");
  const pendingDocs = documents.filter((d) => d.aiAnalysisStatus === "Pending" || d.processingStatus === "Processing");
  const failedDocs = documents.filter((d) => d.aiAnalysisStatus === "Failed" || d.processingStatus === "Failed");

  const unreviewedContradictions = contradictions.filter((c) => c.status === "unreviewed");
  const dateConflicts = timeline.filter((t) => t.hasDateConflict && t.conflictStatus !== "resolved");

  // Categorize facts
  const admissions = facts.filter((f) => f.extractionType === "admission");
  const denials = facts.filter((f) => f.extractionType === "denial");
  const allegations = facts.filter((f) => f.extractionType === "allegation");
  const agreements = facts.filter((f) => f.extractionType === "agreement");
  const payments = facts.filter((f) => f.extractionType === "payment");
  const orders = facts.filter((f) => f.extractionType === "order");

  const handleRunAnalysis = async () => {
    setAnalysisError(null);
    try {
      const res = await onRunMultiDocAnalysis(modelMode);
      setLastAnalysisResult(res);
    } catch (err: any) {
      setAnalysisError(err.message || "Multi-document intelligence extraction failed");
    }
  };

  const openResolveModal = (ev: TimelineEvent) => {
    setConflictModalEvent(ev);
    setChosenResolvedDate(ev.date);
    setResolutionNotes(`Resolved conflict with ${ev.dateConflictWithDoc || "conflicting record"}.`);
  };

  const submitResolveConflict = async () => {
    if (!conflictModalEvent || !onResolveDateConflict) return;
    await onResolveDateConflict(conflictModalEvent.id, chosenResolvedDate, resolutionNotes);
    setConflictModalEvent(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Matter Header & Case Profile */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
                Matter Intelligence Docket
              </span>
              <span className="text-xs text-slate-500 font-mono">#{matter.matterNumber}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                {matter.status}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-sans tracking-tight">
              {matter.matterName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Client: <strong className="text-slate-200">{matter.client}</strong></span>
              {matter.opposingParty && (
                <span>Opposing: <strong className="text-slate-200">{matter.opposingParty}</strong></span>
              )}
              {matter.jurisdiction && (
                <span>Jurisdiction: <span className="text-slate-300">{matter.jurisdiction}</span></span>
              )}
              {matter.caseNumber && (
                <span>Docket: <span className="font-mono text-slate-300">{matter.caseNumber}</span></span>
              )}
            </div>
          </div>

          {/* Action: Run Collective Multi-Document Analysis */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 px-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Model:</span>
              <select
                value={modelMode}
                onChange={(e) => setModelMode(e.target.value as any)}
                className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value="flash">Gemini 3.5 Flash (Balanced)</option>
                <option value="pro">Gemini 3.1 Pro (High Thinking)</option>
                <option value="lite">Gemini 3.1 Flash Lite (Fast)</option>
              </select>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzingMultiDoc || documents.length === 0}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md ${
                isAnalyzingMultiDoc
                  ? "bg-amber-600/50 text-amber-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingMultiDoc ? "animate-spin" : ""}`} />
              <span>{isAnalyzingMultiDoc ? "Synthesizing Matter..." : "Run Multi-Doc Intelligence"}</span>
            </button>
          </div>
        </div>

        {/* AI Analysis Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Documents Ingested</span>
            <span className="text-sm font-bold text-slate-100 font-mono">{documents.length}</span>
            <span className="text-[10px] text-emerald-400 block">({analyzedDocs.length} analyzed)</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Cross-Doc Links</span>
            <span className="text-sm font-bold text-indigo-300 font-mono">{relationships.length}</span>
            <span className="text-[10px] text-slate-500 block">relationships</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Extracted Facts</span>
            <span className="text-sm font-bold text-slate-100 font-mono">{facts.length}</span>
            <span className="text-[10px] text-purple-400 block">({admissions.length} admissions)</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Date Conflicts</span>
            <span className={`text-sm font-bold font-mono ${dateConflicts.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {dateConflicts.length}
            </span>
            <span className="text-[10px] text-slate-500 block">chronology clashes</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Contradictions</span>
            <span className={`text-sm font-bold font-mono ${unreviewedContradictions.length > 0 ? "text-amber-400" : "text-slate-300"}`}>
              {unreviewedContradictions.length}
            </span>
            <span className="text-[10px] text-slate-500 block">flagged for review</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Missing Records</span>
            <span className={`text-sm font-bold font-mono ${missingInfo.length > 0 ? "text-sky-400" : "text-slate-300"}`}>
              {missingInfo.length}
            </span>
            <span className="text-[10px] text-slate-500 block">referenced missing</span>
          </div>
        </div>

        {/* Live Synthesis Feedback Banner */}
        {lastAnalysisResult && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Multi-Document Intelligence Extraction Complete</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                +{lastAnalysisResult.newRelationshipsCount} links, +{lastAnalysisResult.newFactsCount} facts, +{lastAnalysisResult.newContradictionsCount} inconsistencies
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans italic">
              "{lastAnalysisResult.executiveSynthesis}"
            </p>
          </div>
        )}

        {analysisError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Critical Alerts Row: Date Conflicts & Unreviewed Contradictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Date Conflicts Alert Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-sans">
                Potential Date Conflicts ({dateConflicts.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab("timeline")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View Chronology</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {dateConflicts.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 text-xs text-slate-400 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>No unresolved chronological date inconsistencies across case documents.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dateConflicts.slice(0, 3).map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-rose-200">{conflict.event}</span>
                    <button
                      onClick={() => openResolveModal(conflict)}
                      className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] font-medium transition-colors"
                    >
                      Resolve Conflict
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase">Source A ({conflict.date}):</span>
                      <button
                        onClick={() => conflict.sourceDocument && onPreviewDoc?.(conflict.sourceDocument)}
                        className="text-slate-200 hover:text-indigo-300 truncate block text-left"
                      >
                        {conflict.sourceDocument || "Document A"}
                      </button>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase">Source B ({conflict.dateConflictDate || "Divergent"}):</span>
                      <button
                        onClick={() => conflict.dateConflictWithDoc && onPreviewDoc?.(conflict.dateConflictWithDoc)}
                        className="text-slate-200 hover:text-indigo-300 truncate block text-left"
                      >
                        {conflict.dateConflictWithDoc || "Document B"}
                      </button>
                    </div>
                  </div>
                  {conflict.dateConflictReason && (
                    <p className="text-[11px] text-slate-300 italic">
                      "{conflict.dateConflictReason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Potential Contradictions Alert Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-sans">
                Potential Contradictions ({unreviewedContradictions.length} unreviewed)
              </h3>
            </div>
            <button
              onClick={() => onSelectTab("contradictions")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View All ({contradictions.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {unreviewedContradictions.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 text-xs text-slate-400 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>All detected cross-document contradictions have been reviewed by counsel.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {unreviewedContradictions.slice(0, 2).map((contra) => (
                <div
                  key={contra.id}
                  className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-200 font-sans">{contra.title}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                      {contra.contradictionCategory.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {contra.whyFlagged}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="text-slate-400 flex items-center space-x-1">
                      <span>Doc:</span>
                      <button
                        onClick={() => onPreviewDoc?.(contra.statementA.sourceDocument)}
                        className="text-slate-200 hover:text-indigo-300 truncate max-w-[120px]"
                      >
                        {contra.statementA.sourceDocument}
                      </button>
                      <span>vs</span>
                      <button
                        onClick={() => onPreviewDoc?.(contra.statementB.sourceDocument)}
                        className="text-slate-200 hover:text-indigo-300 truncate max-w-[120px]"
                      >
                        {contra.statementB.sourceDocument}
                      </button>
                    </div>

                    {onUpdateContradictionStatus && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onUpdateContradictionStatus(contra.id, "confirmed")}
                          className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[10px] font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => onUpdateContradictionStatus(contra.id, "dismissed")}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Intelligence Grid: Facts Matrix, Document Relationship Graph, Missing Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Key Matter Facts Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Matter Facts Matrix ({facts.length})
                </h3>
              </div>
              <button
                onClick={() => onSelectTab("facts")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>View Full Facts Matrix</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fact Category Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-mono text-[11px]">
                Admissions: {admissions.length}
              </span>
              <span className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-mono text-[11px]">
                Denials: {denials.length}
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-mono text-[11px]">
                Allegations: {allegations.length}
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-mono text-[11px]">
                Agreements: {agreements.length}
              </span>
              <span className="px-2.5 py-1 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono text-[11px]">
                Financials: {payments.length}
              </span>
              <span className="px-2.5 py-1 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 font-mono text-[11px]">
                Court Orders: {orders.length}
              </span>
            </div>

            {/* Top Facts List */}
            <div className="space-y-2.5 pt-1">
              {facts.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        f.extractionType === "admission"
                          ? "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                          : f.extractionType === "denial"
                          ? "bg-rose-950/80 text-rose-300 border border-rose-800/60"
                          : f.extractionType === "agreement"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                          : f.extractionType === "payment"
                          ? "bg-sky-950/80 text-sky-300 border border-sky-800/60"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        {f.extractionType}
                      </span>
                      {f.isLawyerConfirmed && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[9px] font-mono uppercase border border-emerald-800/60 flex items-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Counsel Verified</span>
                        </span>
                      )}
                    </div>
                    {f.date && (
                      <span className="text-[11px] font-mono text-slate-400">{f.date}</span>
                    )}
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans">{f.fact}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <button
                      onClick={() => onPreviewDoc?.(f.sourceDocument)}
                      className="text-indigo-400 hover:text-indigo-300 truncate max-w-xs flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span>{f.sourceDocument}</span>
                      {f.page && <span className="text-slate-500 font-mono">({f.page})</span>}
                    </button>
                    {f.amount && (
                      <span className="font-mono text-amber-300">{f.amount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Document Relationship Highlights */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Document Relationship Network ({relationships.length} links)
                </h3>
              </div>
              <button
                onClick={() => onSelectTab("relationships")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Explore Relationship Graph</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {relationships.slice(0, 4).map((rel) => (
                <div
                  key={rel.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <button
                      onClick={() => onPreviewDoc?.(rel.sourceDocName)}
                      className="text-slate-200 hover:text-indigo-300 font-semibold truncate max-w-[200px]"
                    >
                      {rel.sourceDocName}
                    </button>
                    <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase font-bold text-[10px]">
                      {rel.relationshipType.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => onPreviewDoc?.(rel.targetDocName)}
                      className="text-slate-200 hover:text-indigo-300 font-semibold truncate max-w-[200px]"
                    >
                      {rel.targetDocName}
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{rel.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Missing Information & Evidence Summary */}
        <div className="space-y-4">
          {/* Missing Information Tracker */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileQuestion className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Missing Information ({missingInfo.length})
                </h3>
              </div>
              <button
                onClick={() => onSelectTab("missing-info")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>View Tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Referenced exhibits, schedules, or notices not found in current matter files:
            </p>

            <div className="space-y-2">
              {missingInfo.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-sky-900/30 space-y-1 text-xs"
                >
                  <span className="font-semibold text-sky-200 block font-sans">{item.item}</span>
                  <p className="text-[11px] text-slate-300 font-sans">{item.explanation}</p>
                  <span className="text-[10px] text-slate-500 font-mono block pt-0.5">
                    Ref: {item.referencedByDocument} ({item.clauseOrContext || "General"})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Assistant Launch Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/50 space-y-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-sans">
                Matter-Wide AI Assistant
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Query cross-document intelligence with selective context retrieval and strict source citations.
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => onSelectTab("ai")}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center justify-between transition-colors"
              >
                <span>"Give me the complete chronology"</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectTab("ai")}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center justify-between transition-colors"
              >
                <span>"What are the main factual disputes?"</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectTab("ai")}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center justify-between transition-colors"
              >
                <span>"What contradictions have been detected?"</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Conflict Resolution Modal */}
      {conflictModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <Calendar className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100 font-sans">
                Resolve Date Inconsistency
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Two documents in this matter state conflicting dates for this milestone. Select the governing date or enter a resolved date with attorney rationale:
            </p>

            <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">{conflictModalEvent.event}</div>
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setChosenResolvedDate(conflictModalEvent.date)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    chosenResolvedDate === conflictModalEvent.date
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="text-[10px] block uppercase text-slate-500">Source A Date</span>
                  <span className="text-xs font-bold text-slate-100">{conflictModalEvent.date}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{conflictModalEvent.sourceDocument}</span>
                </button>

                <button
                  type="button"
                  onClick={() => conflictModalEvent.dateConflictDate && setChosenResolvedDate(conflictModalEvent.dateConflictDate)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    chosenResolvedDate === conflictModalEvent.dateConflictDate
                      ? "bg-indigo-950/80 border-indigo-500 text-indigo-200"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="text-[10px] block uppercase text-slate-500">Source B Date</span>
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
                value={chosenResolvedDate}
                onChange={(e) => setChosenResolvedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block font-medium">
                Lawyer Determination & Rationale:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
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
                onClick={submitResolveConflict}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
