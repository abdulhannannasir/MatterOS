import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  ShieldAlert,
  Users,
  CheckCircle,
  HelpCircle,
  Scale,
  FileText,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Matter, DocumentItem, TimelineEvent, Issue } from "../../../types/matteros.ts";

interface OverviewTabProps {
  matter: Matter;
  documents: DocumentItem[];
  timelineEvents: TimelineEvent[];
  issues: Issue[];
  onTriggerMatterSynthesis: (modelMode: "pro" | "flash" | "lite") => Promise<void>;
  isSynthesizing: boolean;
  synthesizedOverview: string | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  matter,
  documents,
  timelineEvents,
  issues,
  onTriggerMatterSynthesis,
  isSynthesizing,
  synthesizedOverview,
}) => {
  const [modelMode, setModelMode] = useState<"pro" | "flash" | "lite">("flash");

  const analyzedDocs = documents.filter((d) => d.aiAnalysisStatus === "Completed");

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Disclaimer & Regenerate Button */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-100 font-sans">
                Matter Intelligence Synthesis
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                AI Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Grounded across {analyzedDocs.length} analyzed case files. Verified facts are distinguished from subjective allegations.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <select
            value={modelMode}
            onChange={(e) => setModelMode(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="flash">Gemini 3.5 Flash</option>
            <option value="pro">Gemini 3.1 Pro (High Thinking)</option>
            <option value="lite">Gemini 3.1 Flash Lite</option>
          </select>

          <button
            onClick={() => onTriggerMatterSynthesis(modelMode)}
            disabled={isSynthesizing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? "animate-spin" : ""}`} />
            <span>{isSynthesizing ? "Synthesizing..." : "Regenerate Synthesis"}</span>
          </button>
        </div>
      </div>

      {/* Synthesis Output if Available */}
      {synthesizedOverview && (
        <div className="p-5 rounded-xl bg-slate-900 border border-amber-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-100 font-sans">
                Executive Case Synthesis Brief
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Generated via {modelMode === "pro" ? "Gemini 3.1 Pro High Thinking" : modelMode === "lite" ? "Gemini 3.1 Flash Lite" : "Gemini 3.5 Flash"}
            </span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {synthesizedOverview}
          </div>
        </div>
      )}

      {/* Structured Overview Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parties and Roles */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Users className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Parties & Representation
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold block">
                Client (Represented Party)
              </span>
              <p className="font-semibold text-slate-100 mt-0.5">{matter.client}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lead Attorney: {matter.leadAttorney || "Counsel of Record"}
              </p>
            </div>

            {matter.opposingParty && (
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-rose-400 font-semibold block">
                  Opposing Party
                </span>
                <p className="font-semibold text-slate-100 mt-0.5">{matter.opposingParty}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Representation: Specified in pleadings
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-blue-400 font-semibold block">
                Forum / Adjudicator
              </span>
              <p className="font-semibold text-slate-100 mt-0.5">
                {matter.court || matter.jurisdiction || "Jurisdiction Not Formally Assigned"}
              </p>
              {matter.caseNumber && (
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Docket: {matter.caseNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Procedural & Litigation Posture */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Procedural Status & Case Posture
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Current Matter Status:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                {matter.status}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Matter Priority:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
                {matter.priority}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Total Analyzed Documents:</span>
              <span className="font-mono text-slate-100 font-semibold">
                {analyzedDocs.length} / {documents.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Active Legal Issues:</span>
              <span className="font-mono text-slate-100 font-semibold">
                {issues.filter((i) => i.status !== "Resolved").length} open
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Case Narrative and Open Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Facts & Case Narrative */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Key Facts & Grounding
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {timelineEvents.length} events logged
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {timelineEvents.slice(0, 5).map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-amber-400 font-medium">{ev.date}</span>
                  <span className="text-slate-500 text-[10px] truncate max-w-[150px]">
                    Source: {ev.sourceDocument || "Record"}
                  </span>
                </div>
                <p className="font-semibold text-slate-200">{ev.event}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Information / Red Flags */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Missing Information & Vulnerabilities
              </h4>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-mono">
              Attorney Action Required
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-200">Missing Expert Witness Quantum Rebuttal</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Damages calculation needs independent financial accounting review before expert disclosure cutoff.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-200">Subcontractor Change Order Logs</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Verify whether written notice was properly tendered under Section 18 within the 5-day contractual condition precedent.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-200">Privilege Review on In-House Communications</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Redaction protocol recommended for internal commercial risk assessments shared with lenders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
