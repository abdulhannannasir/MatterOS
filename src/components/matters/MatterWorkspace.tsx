import React, { useState } from "react";
import {
  Scale,
  FileText,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowLeft,
  Upload,
  Download,
  Share2,
  Archive,
  CheckCircle2,
  X,
  Copy,
  GitFork,
  BookOpen,
  AlertTriangle,
  FileQuestion,
  Bot,
  Layers,
  CheckSquare,
  FileEdit,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import {
  Matter,
  DocumentItem,
  TimelineEvent,
  Issue,
  EvidenceItem,
  Deadline,
  ChatMessage,
  DocumentCategory,
  MatterRelationship,
  MatterFact,
  MatterContradiction,
  MatterMissingInfo,
  Task,
  MatterNote,
  MatterTeamMember,
  ActivityItem,
} from "../../types/matteros.ts";
import { OverviewTab } from "./tabs/OverviewTab.tsx";
import { DocumentsTab } from "./tabs/DocumentsTab.tsx";
import { TimelineTab } from "./tabs/TimelineTab.tsx";
import { IssuesTab } from "./tabs/IssuesTab.tsx";
import { EvidenceTab } from "./tabs/EvidenceTab.tsx";
import { DeadlinesTab } from "./tabs/DeadlinesTab.tsx";
import { TasksTab } from "./tabs/TasksTab.tsx";
import { NotesTab } from "./tabs/NotesTab.tsx";
import { AiWorkspaceTab } from "./tabs/AiWorkspaceTab.tsx";
import { IntelligenceTab } from "./tabs/IntelligenceTab.tsx";
import { RelationshipsTab } from "./tabs/RelationshipsTab.tsx";
import { FactsTab } from "./tabs/FactsTab.tsx";
import { ContradictionsTab } from "./tabs/ContradictionsTab.tsx";
import { MissingInfoTab } from "./tabs/MissingInfoTab.tsx";
import { MatterTeamTab } from "./tabs/MatterTeamTab.tsx";
import { DocumentPreviewModal } from "./DocumentPreviewModal.tsx";

export type WorkspaceTab =
  | "intelligence"
  | "overview"
  | "tasks"
  | "notes"
  | "deadlines"
  | "documents"
  | "relationships"
  | "facts"
  | "contradictions"
  | "timeline"
  | "issues"
  | "evidence"
  | "missing-info"
  | "team"
  | "ai";

interface MatterWorkspaceProps {
  matter: Matter;
  documents: DocumentItem[];
  timelineEvents: TimelineEvent[];
  issues: Issue[];
  evidence: EvidenceItem[];
  deadlines: Deadline[];
  tasks?: Task[];
  notes?: MatterNote[];
  chatMessages: ChatMessage[];
  relationships?: MatterRelationship[];
  facts?: MatterFact[];
  contradictions?: MatterContradiction[];
  missingInfo?: MatterMissingInfo[];
  onBackToMatters: () => void;
  onUploadDocument: (file: File, category: DocumentCategory) => Promise<void>;
  onTriggerDocumentAnalysis: (doc: DocumentItem, modelMode: "pro" | "flash" | "lite") => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onAddTimelineEvent: (ev: Omit<TimelineEvent, "id">) => Promise<void>;
  onUpdateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  onDeleteTimelineEvent: (id: string) => Promise<void>;
  onAddIssue: (iss: Omit<Issue, "id">) => Promise<void>;
  onUpdateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  onDeleteIssue: (id: string) => Promise<void>;
  onAddEvidence: (ev: Omit<EvidenceItem, "id">) => Promise<void>;
  onAddDeadline: (dl: Omit<Deadline, "id">) => Promise<void>;
  onUpdateDeadline: (id: string, updates: Partial<Deadline>) => Promise<void>;
  onDeleteDeadline?: (id: string) => Promise<void>;
  onConfirmDeadline?: (id: string, customDate?: string) => Promise<void>;
  onDismissDeadline?: (id: string) => Promise<void>;
  onAddTask?: (task: Omit<Task, "id">) => Promise<void>;
  onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
  onConfirmAiTask?: (id: string) => Promise<void>;
  onAddNote?: (note: Omit<MatterNote, "id">) => Promise<void>;
  onUpdateNote?: (id: string, updates: Partial<MatterNote>) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
  onCloseMatter?: (matterId: string, reason?: string) => Promise<void>;
  onReopenMatter?: (matterId: string) => Promise<void>;
  onSendChatMessage: (query: string, modelMode: "pro" | "flash" | "lite") => Promise<void>;
  onStopStreaming?: () => void;
  isAiStreaming?: boolean;
  isAiThinking: boolean;
  onClearChat: () => void;
  onTriggerMatterSynthesis: (modelMode: "pro" | "flash" | "lite") => Promise<void>;
  isSynthesizing: boolean;
  synthesizedOverview: string | null;
  onArchiveMatter: (matterId: string) => void;
  onAddSampleDoc?: (title: string, category: DocumentCategory, content: string) => Promise<void>;

  // Phase 2 Props
  onRunMultiDocAnalysis?: (modelMode: "pro" | "flash" | "lite") => Promise<any>;
  isAnalyzingMultiDoc?: boolean;
  onResolveDateConflict?: (eventId: string, resolvedDate: string, notes: string) => Promise<void>;
  onAddRelationship?: (rel: Omit<MatterRelationship, "id">) => Promise<void>;
  onUpdateRelationship?: (id: string, updates: Partial<MatterRelationship>) => Promise<void>;
  onDeleteRelationship?: (id: string) => Promise<void>;
  onAddFact?: (fact: Omit<MatterFact, "id">) => Promise<void>;
  onUpdateFact?: (id: string, updates: Partial<MatterFact>) => Promise<void>;
  onDeleteFact?: (id: string) => Promise<void>;
  onAddContradiction?: (contra: Omit<MatterContradiction, "id">) => Promise<void>;
  onUpdateContradiction?: (id: string, updates: Partial<MatterContradiction>) => Promise<void>;
  onAddMissingInfo?: (info: Omit<MatterMissingInfo, "id">) => Promise<void>;
  onUpdateMissingInfo?: (id: string, updates: Partial<MatterMissingInfo>) => Promise<void>;

  // Phase 5 Team & Delegation Props
  activities?: ActivityItem[];
  onAssignTeamMember?: (member: MatterTeamMember) => Promise<void>;
  onRemoveTeamMember?: (userId: string) => Promise<void>;
  onSetLeadAttorney?: (leadId: string, leadName: string) => Promise<void>;
}

export const MatterWorkspace: React.FC<MatterWorkspaceProps> = ({
  matter,
  documents,
  timelineEvents,
  issues,
  evidence,
  deadlines,
  tasks = [],
  notes = [],
  chatMessages,
  relationships = [],
  facts = [],
  contradictions = [],
  missingInfo = [],
  activities = [],
  onBackToMatters,
  onUploadDocument,
  onTriggerDocumentAnalysis,
  onDeleteDocument,
  onAddTimelineEvent,
  onUpdateTimelineEvent,
  onDeleteTimelineEvent,
  onAddIssue,
  onUpdateIssue,
  onDeleteIssue,
  onAddEvidence,
  onAddDeadline,
  onUpdateDeadline,
  onDeleteDeadline,
  onConfirmDeadline,
  onDismissDeadline,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onConfirmAiTask,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onCloseMatter,
  onReopenMatter,
  onSendChatMessage,
  onStopStreaming,
  isAiStreaming = false,
  isAiThinking,
  onClearChat,
  onTriggerMatterSynthesis,
  isSynthesizing,
  synthesizedOverview,
  onArchiveMatter,
  onAddSampleDoc,
  onRunMultiDocAnalysis,
  isAnalyzingMultiDoc = false,
  onResolveDateConflict,
  onAddRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
  onAddContradiction,
  onUpdateContradiction,
  onAddMissingInfo,
  onUpdateMissingInfo,
  onAssignTeamMember,
  onRemoveTeamMember,
  onSetLeadAttorney,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("intelligence");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [copiedBrief, setCopiedBrief] = useState(false);

  const unreviewedContradictions = contradictions.filter((c) => c.status === "unreviewed").length;
  const openGaps = missingInfo.filter((m) => m.status === "open").length;
  const pendingAiTasksCount = tasks.filter((t) => t.isAiSuggested && !t.confirmedByLawyer).length;
  const activeTasksCount = tasks.filter((t) => t.status !== "completed" && t.status !== "Completed" && t.status !== "cancelled").length;
  const pendingAiDeadlinesCount = deadlines.filter((d) => d.isAiSuggested && !d.isLawyerConfirmed && d.status !== "Dismissed").length;
  const activeDeadlinesCount = deadlines.filter((d) => d.status !== "Completed" && d.status !== "Dismissed").length;

  const tabs: Array<{ id: WorkspaceTab; label: string; icon: any; count?: number; highlight?: boolean }> = [
    { id: "intelligence", label: "Intelligence", icon: Sparkles, highlight: true },
    { id: "overview", label: "Overview", icon: Scale },
    { id: "tasks", label: "Tasks", icon: CheckSquare, count: activeTasksCount, highlight: pendingAiTasksCount > 0 },
    { id: "notes", label: "Notes", icon: FileEdit, count: notes.length },
    { id: "deadlines", label: "Deadlines", icon: Calendar, count: activeDeadlinesCount, highlight: pendingAiDeadlinesCount > 0 },
    { id: "documents", label: "Documents", icon: FileText, count: documents.length },
    { id: "relationships", label: "Relationships", icon: GitFork, count: relationships.length },
    { id: "facts", label: "Facts Matrix", icon: BookOpen, count: facts.length },
    {
      id: "contradictions",
      label: "Inconsistencies",
      icon: AlertTriangle,
      count: contradictions.length,
      highlight: unreviewedContradictions > 0,
    },
    { id: "timeline", label: "Timeline", icon: Clock, count: timelineEvents.length },
    { id: "issues", label: "Issues", icon: AlertCircle, count: issues.filter((i) => i.status !== "Resolved").length },
    { id: "evidence", label: "Evidence", icon: ShieldCheck, count: evidence.length },
    { id: "missing-info", label: "Missing Records", icon: FileQuestion, count: openGaps },
    { id: "team", label: "Team & Access", icon: Users, count: matter.teamMembers?.length || 0 },
    { id: "ai", label: "AI Counsel", icon: Bot },
  ];

  const handleOpenDocByName = (name: string) => {
    const found = documents.find(
      (d) => d.filename.toLowerCase() === name.toLowerCase() || d.filename.includes(name)
    );
    if (found) {
      setPreviewDoc(found);
    } else {
      // Create virtual viewer for citation
      setPreviewDoc({
        id: "preview-stub",
        matterId: matter.id,
        ownerId: matter.ownerId,
        filename: name,
        fileType: "PDF",
        category: "Evidence",
        fileSize: 1048576,
        uploadDate: new Date().toISOString(),
        uploadedBy: "Matter Record",
        processingStatus: "Analyzed",
        aiAnalysisStatus: "Completed",
        extractedText: `[DOCUMENT PREVIEW: ${name}]\nThis document is indexed in the matter repository. Referenced in matter timeline and legal analysis.`,
      });
    }
  };

  const generateLitigationBriefText = () => {
    return `# MATTER BRIEF & CASE STATUS REPORT
CONFIDENTIAL & PRIVILEGED ATTORNEY WORK PRODUCT

MATTER: ${matter.matterName}
MATTER NUMBER: ${matter.matterNumber}
CLIENT: ${matter.client}
OPPOSING PARTY: ${matter.opposingParty || "Not stated"}
JURISDICTION / FORUM: ${matter.court || matter.jurisdiction || "Delaware Court of Chancery"}
DOCKET: ${matter.caseNumber || "N/A"}
STATUS: ${matter.status} | PRIORITY: ${matter.priority}
DATE: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

---

## 1. CASE NARRATIVE & STRATEGIC OBJECTIVES
${matter.description || "No narrative recorded."}

## 2. MATTER SYNTHESIS & EXECUTIVE EVALUATION
${synthesizedOverview || "Multi-document intelligence synthesis not yet executed."}

## 3. CROSS-DOCUMENT INCONSISTENCIES & CONTRADICTIONS (${contradictions.length})
${contradictions.map((c, i) => `### Inconsistency ${i + 1}: ${c.title} [${c.status.toUpperCase()}]
Category: ${c.contradictionCategory}
Why Flagged: ${c.whyFlagged}
- Statement A: "${c.statementA.text}" (${c.statementA.sourceDocument}${c.statementA.page ? ` [${c.statementA.page}]` : ""})
- Statement B: "${c.statementB.text}" (${c.statementB.sourceDocument}${c.statementB.page ? ` [${c.statementB.page}]` : ""})
Counsel Assessment: ${c.lawyerNotes || "Pending Counsel Review"}
`).join("\n") || "No cross-document contradictions flagged."}

## 4. MATTER FACTS MATRIX (${facts.length})
${facts.map((f, i) => `${i + 1}. [${f.extractionType.toUpperCase()}] ${f.fact}
   Source: ${f.sourceDocument} (${f.page || "N/A"}) | Confidence: ${f.confidence} | Status: ${f.isLawyerConfirmed ? "CONFIRMED" : "UNREVIEWED"}
   ${f.lawyerNotes ? `Counsel Note: ${f.lawyerNotes}` : ""}`).join("\n") || "No facts recorded."}

## 5. CROSS-DOCUMENT RELATIONSHIPS (${relationships.length})
${relationships.map((r) => `- [${r.relationshipType.toUpperCase()}] ${r.sourceDocName} -> ${r.targetDocName}
   Details: ${r.description}${r.clauseOrSection ? ` (Clause: ${r.clauseOrSection})` : ""}`).join("\n") || "No relationships mapped."}

## 6. CHRONOLOGICAL MILESTONES (${timelineEvents.length})
${timelineEvents.map((t) => `- ${t.date}: ${t.event} (${t.description}) [Source: ${t.sourceDocument || "General"}]${t.hasDateConflict ? ` **CONFLICT DETECTED** (Alt: ${t.dateConflictDate} in ${t.dateConflictWithDoc})` : ""}`).join("\n") || "No timeline events."}

## 7. IDENTIFIED LEGAL & FACTUAL ISSUES (${issues.length})
${issues.map((iss, idx) => `### Issue ${idx + 1}: ${iss.title} [${iss.status}]
${iss.description}
Source: ${iss.sourceDocument || "General Record"}
Attorney Notes: ${iss.lawyerNotes || "None"}
`).join("\n") || "No issues recorded."}

## 8. MISSING EVIDENCE & DISCOVERY GAPS (${missingInfo.length})
${missingInfo.map((m) => `- [${m.status.toUpperCase()}] ${m.item}: ${m.explanation} (Referenced in ${m.referencedByDocument})`).join("\n") || "No missing items recorded."}

## 9. UPCOMING STATUTORY & COURT DEADLINES (${deadlines.length})
${deadlines.map((d) => `- ${d.date}: ${d.title} [Status: ${d.status}, Priority: ${d.priority}]`).join("\n") || "No deadlines."}

## 10. MATTER TASKS & OPERATIONAL ACTION ITEMS (${tasks.length})
${tasks.map((t) => `- [${t.status.toUpperCase()}] ${t.title} (Priority: ${t.priority}, Assignee: ${t.assignedTo || "Unassigned"}, Due: ${t.dueDate || "N/A"})${t.isAiSuggested ? " [AI SUGGESTED]" : ""}`).join("\n") || "No tasks recorded."}

## 11. ATTORNEY CASE NOTES & WORK PRODUCT (${notes.length})
${notes.map((n) => `### Note: ${n.title} (${n.author} - ${n.createdAt.split("T")[0]})
${n.content}
`).join("\n") || "No notes recorded."}
`;
  };

  const handleConfirmCloseMatter = async () => {
    if (onCloseMatter) {
      await onCloseMatter(matter.id, closureReason);
    }
    setShowCloseModal(false);
    setClosureReason("");
  };

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(generateLitigationBriefText());
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const handleDownloadBrief = () => {
    const text = generateLitigationBriefText();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${matter.matterNumber}_Litigation_Brief.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Workspace Header */}
      <div className="p-6 border-b border-slate-800/90 bg-slate-950 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBackToMatters}
                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Return to Matters"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
                {matter.matterName}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                {matter.matterNumber}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono font-medium ${
                  matter.status === "Active"
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                    : matter.status === "Closed"
                    ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {matter.status}
              </span>

              {/* Lifecycle Actions */}
              {matter.status === "Active" && onCloseMatter && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                  title="Close this matter"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Close Matter</span>
                </button>
              )}

              {matter.status === "Closed" && onReopenMatter && (
                <button
                  onClick={() => onReopenMatter(matter.id)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  title="Reopen this matter"
                >
                  <Unlock className="w-3 h-3 text-amber-400" />
                  <span>Reopen Matter</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-sans pl-7">
              <span>Client: <strong className="text-slate-200">{matter.client}</strong></span>
              {matter.opposingParty && (
                <>
                  <span>•</span>
                  <span>Adverse: <strong className="text-slate-300">{matter.opposingParty}</strong></span>
                </>
              )}
              {matter.court && (
                <>
                  <span>•</span>
                  <span>Forum: {matter.court}</span>
                </>
              )}
              {matter.closedAt && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 font-mono text-[11px]">
                    Closed: {matter.closedAt.split("T")[0]} {matter.closureReason ? `(${matter.closureReason})` : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("documents")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Doc</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Export Case Brief"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Brief</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center space-x-1 mt-5 border-b border-slate-800/80 -mb-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-amber-400 text-amber-300 bg-slate-900/70"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : tab.highlight ? "text-amber-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-amber-500/20 text-amber-300"
                        : tab.highlight
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {activeTab === "intelligence" && (
          <IntelligenceTab
            matter={matter}
            documents={documents}
            timeline={timelineEvents}
            issues={issues}
            evidence={evidence}
            relationships={relationships}
            facts={facts}
            contradictions={contradictions}
            missingInfo={missingInfo}
            onSelectTab={(tab) => setActiveTab(tab as WorkspaceTab)}
            onRunMultiDocAnalysis={onRunMultiDocAnalysis || (async () => {})}
            isAnalyzingMultiDoc={isAnalyzingMultiDoc}
            onPreviewDoc={handleOpenDocByName}
            onResolveDateConflict={onResolveDateConflict}
            onUpdateContradictionStatus={onUpdateContradiction ? (id, status) => onUpdateContradiction(id, { status }) : undefined}
          />
        )}

        {activeTab === "overview" && (
          <OverviewTab
            matter={matter}
            documents={documents}
            timelineEvents={timelineEvents}
            issues={issues}
            onTriggerMatterSynthesis={onTriggerMatterSynthesis}
            isSynthesizing={isSynthesizing}
            synthesizedOverview={synthesizedOverview}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab
            matter={matter}
            documents={documents}
            onUploadDocument={onUploadDocument}
            onTriggerAnalysis={onTriggerDocumentAnalysis}
            onDeleteDocument={onDeleteDocument}
            onPreviewDocument={(doc) => setPreviewDoc(doc)}
            onAddSampleDoc={onAddSampleDoc}
          />
        )}

        {activeTab === "relationships" && onAddRelationship && onUpdateRelationship && onDeleteRelationship && (
          <RelationshipsTab
            relationships={relationships}
            documents={documents}
            matterId={matter.id}
            onAddRelationship={onAddRelationship}
            onUpdateRelationship={onUpdateRelationship}
            onDeleteRelationship={onDeleteRelationship}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "facts" && onAddFact && onUpdateFact && onDeleteFact && (
          <FactsTab
            facts={facts}
            documents={documents}
            matterId={matter.id}
            onAddFact={onAddFact}
            onUpdateFact={onUpdateFact}
            onDeleteFact={onDeleteFact}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "contradictions" && onAddContradiction && onUpdateContradiction && (
          <ContradictionsTab
            contradictions={contradictions}
            documents={documents}
            matterId={matter.id}
            onAddContradiction={onAddContradiction}
            onUpdateContradiction={onUpdateContradiction}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab
            timelineEvents={timelineEvents}
            matterId={matter.id}
            onAddEvent={onAddTimelineEvent}
            onUpdateEvent={onUpdateTimelineEvent}
            onDeleteEvent={onDeleteTimelineEvent}
            onPreviewSourceDoc={handleOpenDocByName}
            onResolveDateConflict={onResolveDateConflict}
          />
        )}

        {activeTab === "issues" && (
          <IssuesTab
            issues={issues}
            matterId={matter.id}
            onAddIssue={onAddIssue}
            onUpdateIssue={onUpdateIssue}
            onDeleteIssue={onDeleteIssue}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "evidence" && (
          <EvidenceTab
            evidence={evidence}
            matterId={matter.id}
            onAddEvidence={onAddEvidence}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "missing-info" && onAddMissingInfo && onUpdateMissingInfo && (
          <MissingInfoTab
            missingInfo={missingInfo}
            documents={documents}
            matterId={matter.id}
            onAddMissingInfo={onAddMissingInfo}
            onUpdateMissingInfo={onUpdateMissingInfo}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "tasks" && onAddTask && onUpdateTask && (
          <TasksTab
            tasks={tasks}
            matterId={matter.id}
            issues={issues}
            documents={documents}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask || (async () => {})}
            onConfirmAiTask={onConfirmAiTask || (async () => {})}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "notes" && onAddNote && onUpdateNote && (
          <NotesTab
            notes={notes}
            matterId={matter.id}
            issues={issues}
            documents={documents}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote || (async () => {})}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "deadlines" && (
          <DeadlinesTab
            deadlines={deadlines}
            matterId={matter.id}
            onAddDeadline={onAddDeadline}
            onUpdateDeadline={onUpdateDeadline}
            onDeleteDeadline={onDeleteDeadline}
            onConfirmDeadline={onConfirmDeadline}
            onDismissDeadline={onDismissDeadline}
            onPreviewDoc={handleOpenDocByName}
          />
        )}

        {activeTab === "team" && (
          <MatterTeamTab
            matter={matter}
            activities={activities}
            onAssignMember={onAssignTeamMember || (async () => {})}
            onRemoveMember={onRemoveTeamMember || (async () => {})}
            onSetLeadAttorney={onSetLeadAttorney || (async () => {})}
          />
        )}

        {activeTab === "ai" && (
          <AiWorkspaceTab
            matter={matter}
            documents={documents}
            facts={facts}
            contradictions={contradictions}
            timeline={timelineEvents}
            issues={issues}
            deadlines={deadlines}
            chatMessages={chatMessages}
            onSendMessage={onSendChatMessage}
            onStopStreaming={onStopStreaming}
            isStreaming={isAiStreaming}
            isThinking={isAiThinking}
            onClearChat={onClearChat}
            onPreviewSourceDoc={handleOpenDocByName}
          />
        )}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {/* Close Matter Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Close Legal Matter
                </h3>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Closing <strong>{matter.matterName}</strong> marks the matter complete and preserves all work-product, documents, and audit logs. You can reopen it at any time.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Closure / Final Disposition
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Settlement agreement executed, final order entered, voluntary dismissal filed..."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCloseMatter}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                Confirm Close Matter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Case Brief Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  Export Case Brief & Litigation Report
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive attorney work-product report for trial counsel and client briefing
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text scrollbar-thin">
              {generateLitigationBriefText()}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Markdown-formatted brief ready for export or printing
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyBrief}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  {copiedBrief ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Brief</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadBrief}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
