import React, { useState } from "react";
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Archive,
  Scale,
  Calendar,
  FileText,
  Clock,
  MoreVertical,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Matter, DocumentItem, Deadline } from "../../types/matteros.ts";

interface MattersListViewProps {
  matters: Matter[];
  documents: DocumentItem[];
  deadlines: Deadline[];
  onOpenMatter: (matterId: string) => void;
  onNewMatter: () => void;
  onArchiveMatter: (matterId: string) => void;
}

export const MattersListView: React.FC<MattersListViewProps> = ({
  matters,
  documents,
  deadlines,
  onOpenMatter,
  onNewMatter,
  onArchiveMatter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">("updated");

  const matterTypes = Array.from(new Set(matters.map((m) => m.matterType))).filter(Boolean);

  const filteredMatters = matters
    .filter((m) => {
      const matchSearch =
        m.matterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.matterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.opposingParty && m.opposingParty.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      const matchType = typeFilter === "All" || m.matterType === typeFilter;

      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      if (sortBy === "created") return b.createdAt.localeCompare(a.createdAt);
      return a.matterName.localeCompare(b.matterName);
    });

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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Legal Matters Docket
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active litigation files, arbitrations, regulatory inquiries, and transactional briefs
          </p>
        </div>
        <button
          onClick={onNewMatter}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Legal Matter</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by matter name, docket number, client, opposing party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500/80"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500/80"
            >
              <option value="All">All Practice Areas</option>
              {matterTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>Showing {filteredMatters.length} of {matters.length} matter(s)</span>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500">Sort by:</span>
            <button
              onClick={() => setSortBy("updated")}
              className={`text-[11px] px-2 py-0.5 rounded ${
                sortBy === "updated" ? "bg-slate-800 text-amber-300 font-medium" : "text-slate-400"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy("created")}
              className={`text-[11px] px-2 py-0.5 rounded ${
                sortBy === "created" ? "bg-slate-800 text-amber-300 font-medium" : "text-slate-400"
              }`}
            >
              Date Opened
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`text-[11px] px-2 py-0.5 rounded ${
                sortBy === "name" ? "bg-slate-800 text-amber-300 font-medium" : "text-slate-400"
              }`}
            >
              Title
            </button>
          </div>
        </div>
      </div>

      {/* Matters Cards List */}
      {filteredMatters.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No matters match current criteria</p>
          <p className="mt-1">Try resetting the search filters or register a new matter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredMatters.map((matter) => {
            const matterDocs = documents.filter((d) => d.matterId === matter.id);
            const matterDeadlines = deadlines.filter((d) => d.matterId === matter.id && d.status === "Pending");

            return (
              <div
                key={matter.id}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-amber-500/50 transition-all shadow-sm group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {matter.matterNumber}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getStatusBadge(matter.status)}`}>
                        {matter.status}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${getPriorityBadge(matter.priority)}`}>
                        {matter.priority}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700 font-sans">
                        {matter.matterType}
                      </span>
                    </div>

                    <h3
                      onClick={() => onOpenMatter(matter.id)}
                      className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors mt-2.5 cursor-pointer leading-snug"
                    >
                      {matter.matterName}
                    </h3>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {matter.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/70 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500 text-[11px]">Client: </span>
                        <span className="text-slate-200 font-medium">{matter.client}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Lead: </span>
                        <span className="text-amber-300/90 font-medium truncate">{matter.leadAttorney || "Unassigned"}</span>
                      </div>
                      {matter.opposingParty && (
                        <div>
                          <span className="text-slate-500 text-[11px]">Opposing: </span>
                          <span className="text-slate-200">{matter.opposingParty}</span>
                        </div>
                      )}
                      {matter.court && (
                        <div className="truncate">
                          <span className="text-slate-500 text-[11px]">Forum: </span>
                          <span className="text-slate-300">{matter.court}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions & Meta */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => onOpenMatter(matter.id)}
                      className="px-4 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer group-hover:border-amber-400"
                    >
                      <span>Enter Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <span className="flex items-center space-x-1" title="Legal Team Assigned">
                        <Users className="w-3.5 h-3.5 text-amber-500/80" />
                        <span>{matter.teamMembers?.length || 1}</span>
                      </span>
                      <span className="flex items-center space-x-1" title="Documents">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>{matterDocs.length}</span>
                      </span>
                      <span className="flex items-center space-x-1" title="Upcoming Deadlines">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{matterDeadlines.length}</span>
                      </span>
                      <button
                        onClick={() => onArchiveMatter(matter.id)}
                        className="p-1 text-slate-500 hover:text-purple-400 rounded transition-colors"
                        title="Archive Matter"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
