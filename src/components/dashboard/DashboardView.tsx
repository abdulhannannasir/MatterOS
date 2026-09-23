import React from "react";
import {
  Briefcase,
  FileText,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  AlertTriangle,
  FolderOpen,
  Scale,
  Database,
} from "lucide-react";
import { Matter, DocumentItem, Deadline, ActivityItem } from "../../types/matteros.ts";

interface DashboardViewProps {
  matters: Matter[];
  documents: DocumentItem[];
  deadlines: Deadline[];
  activities: ActivityItem[];
  onOpenMatter: (matterId: string) => void;
  onNewMatter: () => void;
  onViewAllDeadlines: () => void;
  onSeedDemoData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  matters,
  documents,
  deadlines,
  activities,
  onOpenMatter,
  onNewMatter,
  onViewAllDeadlines,
  onSeedDemoData,
}) => {
  const activeMatters = matters.filter((m) => m.status === "Active");
  const pendingDeadlines = deadlines.filter((d) => d.status === "Pending");

  // Calculate days remaining helper
  const getDaysRemaining = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr).getTime();
      const now = new Date().getTime();
      const diffMs = target - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
      case "high":
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
      case "normal":
      case "medium":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "Pending":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "Closed":
        return "bg-slate-800 text-slate-400 border-slate-700";
      case "Archived":
        return "bg-purple-950/60 text-purple-300 border-purple-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Top Banner & Overview Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Legal Operations Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active litigation docket, document intelligence pipelines, and critical calendar cutoffs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {matters.length === 0 && onSeedDemoData && (
            <button
              onClick={onSeedDemoData}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Practice Samples</span>
            </button>
          )}
          <button
            onClick={onNewMatter}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Open New Matter</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-medium">Total Matters</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{matters.length}</span>
            <span className="text-[11px] text-emerald-400 font-sans">
              {activeMatters.length} active
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across commercial & regulatory dockets
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-medium">Active Matters</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{activeMatters.length}</span>
            <span className="text-[11px] text-slate-400">in litigation</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Current trial and discovery phase
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-medium">Documents Indexed</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{documents.length}</span>
            <span className="text-[11px] text-amber-400/90 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Extracted</span>
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Pleadings, contracts, and exhibits
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-medium">Upcoming Deadlines</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{pendingDeadlines.length}</span>
            <span className="text-[11px] text-rose-400 font-medium">Critical</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Statutory filings & court cutoffs
          </div>
        </div>
      </div>

      {/* Main Grid: Matters & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Matters (2 cols on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-sans">Recent Matters</h3>
            </div>
            <span className="text-xs text-slate-400">{matters.length} matter(s) registered</span>
          </div>

          {matters.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">No active matters in registry</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a new matter or load the verified practice samples to begin analyzing case files.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={onNewMatter}
                  className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-medium"
                >
                  Create First Matter
                </button>
                {onSeedDemoData && (
                  <button
                    onClick={onSeedDemoData}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                  >
                    Load Sample Cases
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {matters.slice(0, 5).map((matter) => {
                const docCount = documents.filter((d) => d.matterId === matter.id).length;
                const dlCount = deadlines.filter((d) => d.matterId === matter.id).length;

                return (
                  <div
                    key={matter.id}
                    onClick={() => onOpenMatter(matter.id)}
                    className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                            {matter.matterNumber}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusBadge(matter.status)}`}>
                            {matter.status}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityBadge(matter.priority)}`}>
                            {matter.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors mt-2">
                          {matter.matterName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          Client: <span className="text-slate-200">{matter.client}</span> • Type: {matter.matterType}
                        </p>
                        {matter.court && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            Court: {matter.court} {matter.caseNumber ? `(${matter.caseNumber})` : ""}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0 mt-2" />
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>{docCount} documents</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{dlCount} deadlines</span>
                        </span>
                      </div>
                      <div className="text-slate-500 text-[10px] truncate max-w-[220px]">
                        {matter.lastActivity || `Updated ${matter.updatedAt.split("T")[0]}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Deadlines & Activity */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Widget */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-100">Upcoming Deadlines</h3>
              </div>
              <button
                onClick={onViewAllDeadlines}
                className="text-[11px] text-amber-400 hover:underline"
              >
                View all
              </button>
            </div>

            {pendingDeadlines.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No immediate deadlines pending.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingDeadlines.slice(0, 4).map((dl) => {
                  const daysLeft = getDaysRemaining(dl.date);
                  const parentMatter = matters.find((m) => m.id === dl.matterId);

                  return (
                    <div
                      key={dl.id}
                      onClick={() => onOpenMatter(dl.matterId)}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {dl.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                            daysLeft <= 7
                              ? "bg-rose-950/60 text-rose-300 border-rose-800/60"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {daysLeft < 0 ? "Past Due" : `${daysLeft}d remaining`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {dl.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900 text-[10px] text-slate-500">
                        <span className="truncate">{parentMatter?.matterName || "Matter"}</span>
                        <span className="font-mono">{dl.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Operations Activity Widget */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-100">Audit & Intelligence Feed</h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {activities.slice(0, 4).map((item) => (
                <div key={item.id} className="text-xs flex items-start space-x-2.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-300 font-medium truncate">{item.action}</p>
                    <p className="text-slate-400 text-[11px] line-clamp-2 mt-0.5">{item.details}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5 font-mono">
                      {new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
