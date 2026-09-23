import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Briefcase,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  Matter,
  MatterTeamMember,
  OrgMember,
  UserRole,
  ActivityItem,
} from "../../../types/matteros.ts";
import { useAuth } from "../../../firebase/authContext.tsx";
import { OrganizationService } from "../../../services/organizationService.ts";
import { AuthControlService } from "../../../services/authControlService.ts";

interface MatterTeamTabProps {
  matter: Matter;
  activities?: ActivityItem[];
  onAssignMember: (member: MatterTeamMember) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onSetLeadAttorney: (leadId: string, leadName: string) => Promise<void>;
}

export const MatterTeamTab: React.FC<MatterTeamTabProps> = ({
  matter,
  activities = [],
  onAssignMember,
  onRemoveMember,
  onSetLeadAttorney,
}) => {
  const { currentOrg, currentRole, currentUser, isDemoUser } = useAuth();

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [canEditPermission, setCanEditPermission] = useState<boolean>(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManage = AuthControlService.canUserManageMatter(
    { id: currentUser?.uid || "user-elena-vance", role: currentRole },
    matter
  );

  useEffect(() => {
    const loadMembers = async () => {
      if (!currentOrg) return;
      try {
        const mems = await OrganizationService.getOrgMembers(currentOrg.id, isDemoUser);
        setOrgMembers(mems);
        if (mems.length > 0) setSelectedMemberId(mems[0].userId);
      } catch (e) {
        console.error("Error loading firm members:", e);
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [currentOrg?.id, isDemoUser]);

  const assignedMembers = matter.teamMembers || [];
  const matterActivities = activities.filter((a) => a.matterId === matter.id);

  const handleAssign = async () => {
    const targetMember = orgMembers.find((m) => m.userId === selectedMemberId);
    if (!targetMember) return;
    setIsAssigning(true);
    try {
      await onAssignMember({
        userId: targetMember.userId,
        userName: targetMember.userName,
        userEmail: targetMember.userEmail,
        role: targetMember.role,
        assignedAt: new Date().toISOString(),
        canEdit: canEditPermission,
      });
    } catch (err: any) {
      alert("Failed to assign member: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-900/40 text-purple-300 border border-purple-700/60">
            <Shield className="w-2.5 h-2.5 mr-1" />
            Managing Admin
          </span>
        );
      case "lawyer":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/60">
            <Key className="w-2.5 h-2.5 mr-1" />
            Lead / Partner
          </span>
        );
      case "associate":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-700/60">
            <Briefcase className="w-2.5 h-2.5 mr-1" />
            Associate Counsel
          </span>
        );
      case "staff":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/60">
            <Users className="w-2.5 h-2.5 mr-1" />
            Litigation Paralegal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Matter Access Status */}
      <div className="p-4 rounded-lg bg-stone-900/80 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-200 flex items-center gap-2">
              <span>Matter Access Governance & Delegation</span>
              <span className="px-2 py-0.2 rounded text-[10px] bg-stone-800 text-stone-400 font-mono">
                {assignedMembers.length} Assigned Counsel & Staff
              </span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Lead Counsel: <strong className="text-amber-300">{matter.leadAttorney || "Unassigned"}</strong> • Organization: <span className="text-stone-300 font-medium">{currentOrg?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canManage ? (
            <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Full Matter Management Authority
            </span>
          ) : (
            <span className="inline-flex items-center text-xs text-stone-400 bg-stone-900 px-2.5 py-1 rounded border border-stone-700">
              <Shield className="w-3.5 h-3.5 mr-1 text-stone-500" />
              Assigned Counsel (Read/Collaborate)
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assigned Team Members Table (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Assigned Matter Legal Team ({assignedMembers.length})
                </h3>
                <p className="text-xs text-stone-400">
                  Lawyers, associates, and paralegals with authorized access to this docket
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/40">
                    <th className="py-2.5 px-3">Counsel / Staff</th>
                    <th className="py-2.5 px-3">Firm Role</th>
                    <th className="py-2.5 px-3">Matter Status</th>
                    <th className="py-2.5 px-3">Assigned Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {assignedMembers.map((member) => {
                    const isLead =
                      matter.leadAttorneyId === member.userId ||
                      (matter.leadAttorney && matter.leadAttorney.includes(member.userName));
                    return (
                      <tr key={member.userId} className="hover:bg-stone-800/30 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-stone-100 flex items-center gap-1.5">
                            {member.userName}
                            {isLead && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-600/40 font-mono">
                                Lead Counsel
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-500" />
                            {member.userEmail}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {getRoleBadge(member.role)}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[11px] text-stone-300">
                            {member.canEdit !== false ? "Can Edit & File" : "Read-Only / Assist"}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-stone-400 text-[11px]">
                          {member.assignedAt ? new Date(member.assignedAt).toLocaleDateString() : "Matter Inception"}
                        </td>

                        <td className="py-3 px-3 text-right space-x-2">
                          {canManage && !isLead && (
                            <button
                              onClick={() => onSetLeadAttorney(member.userId, member.userName)}
                              className="text-[11px] px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition"
                              title="Designate as Lead Attorney"
                            >
                              Make Lead
                            </button>
                          )}

                          {canManage && assignedMembers.length > 1 && (
                            <button
                              onClick={() => onRemoveMember(member.userId)}
                              className="text-[11px] text-rose-400 hover:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40 transition"
                              title="Remove from matter team"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {assignedMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-500 text-xs">
                        No team members currently assigned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matter Specific Audit Activities */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <h3 className="text-sm font-serif font-bold text-stone-100 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Matter Activity & Chain-of-Custody Log
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Cryptographic chronological trail of team operations and AI analyses
            </p>

            <div className="space-y-3">
              {matterActivities.slice(0, 8).map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-200">{act.action}</span>
                      <span className="text-[11px] text-amber-400 font-medium">• {act.user || act.userEmail}</span>
                    </div>
                    <p className="text-stone-300 text-[11px] mt-1 leading-relaxed">{act.details}</p>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}

              {matterActivities.length === 0 && (
                <div className="p-6 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded">
                  No activity logged yet for this matter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Assign Counsel Form & Matter Security Card */}
        <div className="space-y-6">
          {/* Assignment Card */}
          {canManage ? (
            <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
              <h3 className="text-sm font-serif font-bold text-stone-100 mb-1 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Assign Firm Personnel
              </h3>
              <p className="text-xs text-stone-400 mb-4">
                Delegate work to associates, trial lawyers, or litigation paralegals
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-300 mb-1 font-medium">Select Firm Member</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    {orgMembers.map((m) => {
                      const already = assignedMembers.some((am) => am.userId === m.userId);
                      return (
                        <option key={m.userId} value={m.userId}>
                          {m.userName} ({m.role.toUpperCase()}) {already ? "— Already Assigned" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-200">Grant Edit Privileges</span>
                    <input
                      type="checkbox"
                      checked={canEditPermission}
                      onChange={(e) => setCanEditPermission(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Allows creating tasks, filing notes, uploading exhibits, and verifying AI facts.
                  </p>
                </div>

                <button
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedMemberId}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded text-xs transition flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAssigning ? "Assigning..." : "Assign to Matter Team"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
              <h3 className="text-sm font-serif font-bold text-stone-100 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Team Delegation
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Matter staffing is managed by Lead Counsel (<strong>{matter.leadAttorney}</strong>) or Managing Firm Administrators.
              </p>
            </div>
          )}

          {/* Access Security Policy Card */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <h4 className="text-xs font-serif font-bold text-stone-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Matter Security Policy
            </h4>

            <div className="space-y-2.5 text-[11px] text-stone-300">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Tenant Isolation: Scoped to {currentOrg?.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict RBAC: Document deletions restricted to Partners</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Audit Trail: All AI queries and document views recorded immutably</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
