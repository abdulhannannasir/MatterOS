import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  CheckCircle,
  XCircle,
  Key,
  Lock,
  Building,
  RefreshCw,
  Search,
  Briefcase,
  AlertTriangle,
  Copy,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../firebase/authContext.tsx";
import {
  OrgMember,
  OrgInvitation,
  UserRole,
  OrganizationSettings,
} from "../../types/matteros.ts";
import { OrganizationService } from "../../services/organizationService.ts";

export const TeamManagementView: React.FC = () => {
  const { currentOrg, currentRole, currentUser, isDemoUser, refreshOrganizations } = useAuth();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Forms
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("associate");
  const [inviteDepartment, setInviteDepartment] = useState("Commercial Litigation");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<OrganizationSettings>(currentOrg?.settings || {});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const isAdmin = currentRole === "admin";

  const loadTeamData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const [mems, invs] = await Promise.all([
        OrganizationService.getOrgMembers(currentOrg.id, isDemoUser),
        OrganizationService.getInvitations(currentOrg.id, isDemoUser),
      ]);
      setMembers(mems);
      setInvitations(invs);
      if (currentOrg.settings) {
        setSettings(currentOrg.settings);
      }
    } catch (err) {
      console.error("Error loading team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [currentOrg?.id, isDemoUser]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !inviteEmail.trim()) return;
    setInviteSubmitting(true);
    try {
      await OrganizationService.inviteMember(
        {
          organizationId: currentOrg.id,
          organizationName: currentOrg.name,
          email: inviteEmail.trim(),
          role: inviteRole,
          invitedBy: currentUser?.uid || "user-elena-vance",
          invitedByName: currentUser?.displayName || "Elena Vance, Esq.",
        },
        isDemoUser
      );
      setInviteEmail("");
      setInviteTitle("");
      setIsInviteModalOpen(false);
      await loadTeamData();
    } catch (err: any) {
      alert("Failed to send invitation: " + err.message);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!confirm("Revoke this pending invitation?")) return;
    try {
      await OrganizationService.revokeInvitation(
        invId,
        {
          id: currentUser?.uid || "user-elena-vance",
          name: currentUser?.displayName || "Elena Vance, Esq.",
          email: currentUser?.email || "elena.vance@vance-sterling.law",
          role: currentRole,
        },
        isDemoUser
      );
      await loadTeamData();
    } catch (err: any) {
      alert("Failed to revoke: " + err.message);
    }
  };

  const handleSimulateAccept = async (inv: OrgInvitation) => {
    try {
      await OrganizationService.acceptInvitation(
        inv.id,
        {
          id: `user-${inv.email.split("@")[0]}`,
          name: inv.email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()) + ", Esq.",
          email: inv.email,
        },
        isDemoUser
      );
      await loadTeamData();
    } catch (err: any) {
      alert("Error accepting invitation: " + err.message);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!isAdmin) {
      alert("Only firm administrators can alter member permissions.");
      return;
    }
    try {
      await OrganizationService.updateMemberRole(
        memberId,
        newRole,
        {
          id: currentUser?.uid || "user-elena-vance",
          name: currentUser?.displayName || "Elena Vance, Esq.",
          email: currentUser?.email || "elena.vance@vance-sterling.law",
          role: currentRole,
        },
        isDemoUser
      );
      await loadTeamData();
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleRemoveMember = async (member: OrgMember) => {
    if (!isAdmin) {
      alert("Only firm administrators can remove members.");
      return;
    }
    if (member.userId === currentUser?.uid) {
      alert("Cannot remove yourself from the organization.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${member.userName} from ${currentOrg?.name}?`)) {
      return;
    }
    try {
      await OrganizationService.removeMember(
        member.id,
        {
          id: currentUser?.uid || "user-elena-vance",
          name: currentUser?.displayName || "Elena Vance, Esq.",
          email: currentUser?.email || "elena.vance@vance-sterling.law",
          role: currentRole,
        },
        isDemoUser
      );
      await loadTeamData();
    } catch (err: any) {
      alert("Failed to remove member: " + err.message);
    }
  };

  const handleSavePolicySettings = async () => {
    if (!currentOrg || !isAdmin) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      await OrganizationService.updateOrganizationSettings(
        currentOrg.id,
        settings,
        {
          id: currentUser?.uid || "user-elena-vance",
          name: currentUser?.displayName || "Elena Vance, Esq.",
          email: currentUser?.email || "elena.vance@vance-sterling.law",
          role: currentRole,
        },
        isDemoUser
      );
      await refreshOrganizations();
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to update settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-700/60">
            <Shield className="w-3 h-3 mr-1 text-purple-400" />
            Managing Admin
          </span>
        );
      case "lawyer":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/60">
            <Key className="w-3 h-3 mr-1 text-blue-400" />
            Partner / Lawyer
          </span>
        );
      case "associate":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-700/60">
            <Briefcase className="w-3 h-3 mr-1 text-emerald-400" />
            Associate Counsel
          </span>
        );
      case "staff":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/60">
            <Users className="w-3 h-3 mr-1 text-amber-400" />
            Paralegal / Staff
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-950 p-6 text-stone-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-serif font-bold text-stone-100">
                  {currentOrg?.name || "Law Firm Workspace"}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                  {currentOrg?.subscription.plan} Edition ({members.length} / {currentOrg?.subscription.seats} Seats)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Multi-Tenant Law Firm Architecture • Role-Based Access Control (RBAC) • Matter Delegation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadTeamData}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Refresh</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Counsel / Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Summary Bar */}
      <div className="my-6 p-4 rounded-lg bg-stone-900/60 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-stone-800 border border-stone-700 text-stone-300">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-200">
              Your Current Session Role: {getRoleBadge(currentRole)}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {isAdmin
                ? "Full organizational authority: manage firm settings, all matter assignments, invitations, and firm audit logs."
                : currentRole === "lawyer"
                ? "Partner/Lawyer privileges: create matters, manage assigned cases, supervise associates, upload documents, utilize deep AI intelligence."
                : currentRole === "associate"
                ? "Associate Counsel: access assigned matters, draft documents, review facts, verify AI citations, resolve deadlines."
                : "Paralegal / Staff: litigation support on assigned matters, filing intake, task completion, document uploading."}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-stone-400">Matter Privacy Mode:</span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
              settings.restrictedAccessMode
                ? "bg-rose-950/40 text-rose-300 border-rose-800"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-800"
            }`}
          >
            {settings.restrictedAccessMode ? "Strict Matter Isolation (Assigned Only)" : "Firm-Wide Collaborative"}
          </span>
        </div>
      </div>

      {/* Members & Invitations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Table (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Active Legal Team ({filteredMembers.length})
                </h2>
                <p className="text-xs text-stone-400">Members authorized to access this firm workspace</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Filter counsel or staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-stone-950 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/40">
                    <th className="py-2.5 px-3">Counsel / Staff</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Practice Area</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-medium text-stone-100">{member.userName}</div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-500" />
                          {member.userEmail}
                        </div>
                        {member.title && (
                          <div className="text-[10px] text-amber-400/90 mt-0.5">{member.title}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isAdmin && member.userId !== currentUser?.uid ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                            className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="admin">Managing Admin</option>
                            <option value="lawyer">Partner / Lawyer</option>
                            <option value="associate">Associate Counsel</option>
                            <option value="staff">Paralegal / Staff</option>
                          </select>
                        ) : (
                          getRoleBadge(member.role)
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-300">
                        {member.department || "General Practice"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isAdmin && member.userId !== currentUser?.uid && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="text-stone-400 hover:text-rose-400 p-1 rounded hover:bg-stone-800 transition"
                            title="Remove from firm"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-500 text-xs">
                        No team members matching your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  Pending Invitations ({invitations.length})
                </h2>
                <p className="text-xs text-stone-400">Authorized invitations pending acceptance</p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-6 text-center text-stone-500 border border-dashed border-stone-800 rounded-lg text-xs">
                No outstanding invitations. All authorized counsel are active.
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-200 text-xs">{inv.email}</span>
                        {getRoleBadge(inv.role)}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        Invited by {inv.invitedByName} • Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/?invite=${inv.token}`;
                          navigator.clipboard.writeText(link);
                          setCopiedToken(inv.id);
                          setTimeout(() => setCopiedToken(null), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded transition"
                      >
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>{copiedToken === inv.id ? "Link Copied!" : "Copy Link"}</span>
                      </button>

                      <button
                        onClick={() => handleSimulateAccept(inv)}
                        className="px-2.5 py-1 text-[11px] bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded transition"
                        title="Simulate user joining firm"
                      >
                        Accept
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-950/30 rounded border border-rose-900/50 transition"
                          title="Revoke invitation"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Access Control & Firm Governance Policies (1 col) */}
        <div className="space-y-6">
          {/* Policy Settings Card */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <h2 className="text-base font-serif font-bold text-stone-100 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Firm Security & Privacy Policies
            </h2>
            <p className="text-xs text-stone-400 mb-4">
              Enforce access boundaries and regulatory requirements across all matters
            </p>

            <div className="space-y-4 text-xs">
              {/* Restricted Access Mode Toggle */}
              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-200">Restricted Matter Isolation</span>
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={settings.restrictedAccessMode || false}
                    onChange={(e) =>
                      setSettings({ ...settings, restrictedAccessMode: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  When enabled, lawyers and associates only see matters to which they are explicitly assigned as counsel.
                </p>
              </div>

              {/* Conflict Check */}
              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-200">Mandatory Conflict Checks</span>
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={settings.conflictCheckRequired || false}
                    onChange={(e) =>
                      setSettings({ ...settings, conflictCheckRequired: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Requires opposing party conflict validation before intake into active matters.
                </p>
              </div>

              {/* Require 2FA */}
              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-200">Enforce Two-Factor Authentication</span>
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={settings.require2FA || false}
                    onChange={(e) => setSettings({ ...settings, require2FA: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Require hardware key or authenticator app confirmation for all firm personnel.
                </p>
              </div>

              {/* Default Billing Type */}
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Default Firm Billing Structure</label>
                <select
                  disabled={!isAdmin}
                  value={settings.defaultBillingType || "hourly"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultBillingType: e.target.value as any,
                    })
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                >
                  <option value="hourly">Hourly Rate Billing</option>
                  <option value="retainer">Monthly Retainer</option>
                  <option value="contingency">Contingency Fee</option>
                  <option value="flat">Fixed Flat Fee</option>
                </select>
              </div>

              {/* Default Jurisdiction */}
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Primary Firm Jurisdiction</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.defaultJurisdiction || ""}
                  onChange={(e) => setSettings({ ...settings, defaultJurisdiction: e.target.value })}
                  placeholder="e.g. Delaware Court of Chancery / SDNY"
                  className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                />
              </div>

              {isAdmin ? (
                <div className="pt-2">
                  <button
                    onClick={handleSavePolicySettings}
                    disabled={savingSettings}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded text-xs transition flex items-center justify-center gap-1.5"
                  >
                    {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{savingSettings ? "Updating Policies..." : "Save Firm Policies"}</span>
                  </button>
                  {settingsSuccess && (
                    <div className="text-center text-[11px] text-emerald-400 mt-2 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Firm security policies updated successfully.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-stone-950 rounded text-stone-500 text-[11px] text-center border border-stone-800">
                  Firm policies can only be modified by Managing Admins.
                </div>
              )}
            </div>
          </div>

          {/* RBAC Permission Matrix Card */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-5">
            <h3 className="text-xs font-serif font-bold text-stone-200 uppercase tracking-wider mb-3">
              Role Authority Matrix
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className="p-2 rounded bg-stone-950 border border-stone-800">
                <span className="font-semibold text-purple-300">Managing Admin:</span> Full practice control, workspace creation, member role management, security audits, all matters.
              </div>
              <div className="p-2 rounded bg-stone-950 border border-stone-800">
                <span className="font-semibold text-blue-300">Partner / Lawyer:</span> Create and lead matters, assign counsel, review & confirm AI citations, examine contradictory evidence.
              </div>
              <div className="p-2 rounded bg-stone-950 border border-stone-800">
                <span className="font-semibold text-emerald-300">Associate Counsel:</span> Conduct case analysis on assigned matters, draft filings, query MatterOS AI, manage tasks.
              </div>
              <div className="p-2 rounded bg-stone-950 border border-stone-800">
                <span className="font-semibold text-amber-300">Paralegal / Staff:</span> Upload pleading documents, track docket deadlines, execute assigned administrative tasks.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                Invite Legal Personnel
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 mb-1 font-medium">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="lawyer@firm.law"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-medium">Organizational Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="lawyer">Partner / Senior Lawyer</option>
                  <option value="associate">Associate Counsel</option>
                  <option value="staff">Litigation Paralegal / Staff</option>
                  <option value="admin">Managing Firm Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-medium">Practice Department</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Litigation, IP, White Collar"
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-medium">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Trial Associate"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 border border-stone-700 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded transition"
                >
                  {inviteSubmitting ? "Issuing Invite..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
