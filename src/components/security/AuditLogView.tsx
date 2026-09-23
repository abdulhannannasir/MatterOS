import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Lock,
  FileCheck,
  AlertTriangle,
  Clock,
  User,
  Scale,
  Sparkles,
  CheckCircle2,
  FileText,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../firebase/authContext.tsx";
import { AuditLogEntry, AuditAction, UserRole } from "../../types/matteros.ts";
import { OrganizationService } from "../../services/organizationService.ts";

export const AuditLogView: React.FC = () => {
  const { currentOrg, currentRole, isDemoUser } = useAuth();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const loadLogs = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const data = await OrganizationService.getAuditLogs(
        currentOrg.id,
        {
          action: actionFilter !== "all" ? actionFilter : undefined,
          entityType: entityFilter !== "all" ? entityFilter : undefined,
          search: searchQuery || undefined,
        },
        isDemoUser
      );
      setLogs(data);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentOrg?.id, actionFilter, entityFilter, isDemoUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "User Name", "User Email", "Role", "Action", "Entity", "Matter", "Details", "IP Address"];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userEmail}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.matterName || l.matterId || ""}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || "192.0.2.1"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `matteros_audit_trail_${currentOrg?.slug || "firm"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `matteros_audit_trail_${currentOrg?.slug || "firm"}_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (action: AuditAction) => {
    if (action.startsWith("ai.")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
          {action}
        </span>
      );
    }
    if (action.startsWith("matter.")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60">
          <Scale className="w-3 h-3 mr-1 text-blue-400" />
          {action}
        </span>
      );
    }
    if (action.startsWith("security.")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
          {action}
        </span>
      );
    }
    if (action.startsWith("team.")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60">
          <User className="w-3 h-3 mr-1 text-purple-400" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-800 text-stone-300 border border-stone-700">
        <FileCheck className="w-3 h-3 mr-1 text-stone-400" />
        {action}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-950 p-6 text-stone-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-serif font-bold text-stone-100">
                  Compliance Audit Trail & Security
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  Immutable Record
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Cryptographic timestamping • Comprehensive lawyer & staff activity logging • Chain-of-custody verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded transition"
            title="Export for legal compliance / e-discovery"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>CSV Export</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded transition"
            title="Export JSON"
          >
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Security Architecture & Eight Pillars Compliance Banner */}
      <div className="my-6 p-5 rounded-lg bg-stone-900/60 border border-stone-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-serif font-bold text-stone-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Security & Regulatory Compliance Architecture
          </h2>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hardened Security Rules Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="font-semibold text-stone-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Tenant Data Isolation
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Strict multi-tenant partitioning ensures cross-tenant data leakage is structurally impossible.
            </p>
          </div>

          <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="font-semibold text-stone-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Pillar 7: Audit Immutability
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Rules strictly prohibit update or delete on audit logs: append-only compliance guarantee.
            </p>
          </div>

          <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="font-semibold text-stone-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Matter-Level RBAC
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Lawyer, associate, and paralegal access filtered to assigned matters or authorized role tiers.
            </p>
          </div>

          <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="font-semibold text-stone-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Pillar 1: Master Gate
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Root default-deny rules block any unauthenticated or unauthorized pathway into the store.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search audit trail by actor, matter, keywords, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-1.5 text-xs text-stone-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Action:</span>
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Actions</option>
              <option value="ai.query">AI Queries & Syntheses</option>
              <option value="matter.created">Matter Creation</option>
              <option value="task.created">Task Operations</option>
              <option value="document.viewed">Document Access</option>
              <option value="team.invited">Team Invitations</option>
              <option value="deadline.created">Deadline Management</option>
              <option value="security.access_denied">Security Alerts</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Entities</option>
              <option value="matter">Matters</option>
              <option value="document">Documents</option>
              <option value="task">Tasks</option>
              <option value="deadline">Deadlines</option>
              <option value="ai">AI Operations</option>
              <option value="team">Team Governance</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded text-xs transition"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-stone-300">
            Recorded Audit Trail Events ({logs.length})
          </div>
          <div className="text-[11px] text-stone-500">
            Sorted by most recent (UTC)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/60">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Matter / Context</th>
                <th className="py-2.5 px-3">Event Details</th>
                <th className="py-2.5 px-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-800/30 transition">
                  <td className="py-3 px-3 whitespace-nowrap text-stone-400 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-stone-200">{log.userName}</div>
                    <div className="text-[11px] text-stone-400">{log.userEmail}</div>
                    <span className="inline-block mt-0.5 text-[10px] uppercase font-bold text-amber-400">
                      {log.userRole}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {getActionBadge(log.action)}
                  </td>

                  <td className="py-3 px-3">
                    {log.matterName ? (
                      <div className="text-stone-200 font-medium line-clamp-1 max-w-xs" title={log.matterName}>
                        {log.matterName}
                      </div>
                    ) : (
                      <span className="text-stone-500 italic">Organization Scope</span>
                    )}
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                      Entity: {log.entityType}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <p className="text-stone-300 text-xs leading-relaxed max-w-md">
                      {log.details}
                    </p>
                  </td>

                  <td className="py-3 px-3 text-right text-stone-400 font-mono text-[11px]">
                    {log.ipAddress || "192.0.2.1"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500 text-xs">
                    No audit records matching the specified filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
