import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Briefcase,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Deadline, Matter } from "../../types/matteros.ts";

interface GlobalDeadlinesViewProps {
  deadlines: Deadline[];
  matters: Matter[];
  onOpenMatter: (matterId: string) => void;
  onUpdateDeadline: (id: string, updates: Partial<Deadline>) => Promise<void>;
}

export const GlobalDeadlinesView: React.FC<GlobalDeadlinesViewProps> = ({
  deadlines,
  matters,
  onOpenMatter,
  onUpdateDeadline,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  const getDaysRemaining = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr).getTime();
      const now = new Date().getTime();
      const diffMs = target - now;
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const filtered = deadlines.filter((dl) => {
    const parentMatter = matters.find((m) => m.id === dl.matterId);
    const matchSearch =
      dl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dl.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parentMatter && parentMatter.matterName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === "All" || dl.status === statusFilter;
    const matchPriority = priorityFilter === "All" || dl.priority === priorityFilter;

    return matchSearch && matchStatus && matchPriority;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
      case "medium":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Firm Master Calendar & Court Deadlines
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated statutory limits, scheduling orders, discovery cutoffs, and trial dates
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search deadlines across all firm matters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Deadlines Only</option>
              <option value="Completed">Completed Filings</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200"
            >
              <option value="All">All Priorities</option>
              <option value="high">High / Jurisdictional</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 pt-1">
          Showing {filtered.length} scheduled event(s) across {matters.length} matter(s)
        </div>
      </div>

      {/* Deadlines Master Table / Cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No scheduled deadlines match current filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dl) => {
            const daysLeft = getDaysRemaining(dl.date);
            const parentMatter = matters.find((m) => m.id === dl.matterId);
            const isCompleted = dl.status === "Completed";

            return (
              <div
                key={dl.id}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {dl.date}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isCompleted
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                            : daysLeft <= 7
                            ? "bg-rose-950/60 text-rose-300 border-rose-800/60 font-bold"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {isCompleted
                          ? "Completed"
                          : daysLeft < 0
                          ? `Overdue (${Math.abs(daysLeft)}d ago)`
                          : `${daysLeft} days remaining`}
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getPriorityBadge(dl.priority)}`}>
                        {dl.priority}
                      </span>

                      {dl.isLawyerConfirmed && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Lawyer Confirmed</span>
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold mt-2 ${
                        isCompleted ? "line-through text-slate-400" : "text-slate-100"
                      }`}
                    >
                      {dl.title}
                    </h4>

                    {dl.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {dl.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      {parentMatter && (
                        <div
                          onClick={() => onOpenMatter(parentMatter.id)}
                          className="flex items-center space-x-1.5 text-amber-400/90 hover:underline cursor-pointer font-medium"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>
                            {parentMatter.matterName} ({parentMatter.matterNumber})
                          </span>
                        </div>
                      )}
                      {dl.source && (
                        <span className="text-slate-500 font-mono text-[11px]">
                          • Source: {dl.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() =>
                        onUpdateDeadline(dl.id, {
                          status: isCompleted ? "Pending" : "Completed",
                        })
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                        isCompleted
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-slate-950"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isCompleted ? "Mark Pending" : "Mark Done"}</span>
                    </button>

                    {parentMatter && (
                      <button
                        onClick={() => onOpenMatter(parentMatter.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Open Matter Workspace"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
