import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config.ts";
import { handleFirestoreError, OperationType } from "../firebase/error.ts";
import {
  Organization,
  OrganizationSettings,
  OrgMember,
  OrgInvitation,
  UserRole,
  AuditLogEntry,
  AuditAction,
  NotificationItem,
  NotificationType,
} from "../types/matteros.ts";

export const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: "demo-org-1",
    name: "Vance & Sterling Global Litigators LLP",
    slug: "vance-sterling",
    logoUrl: "",
    ownerId: "user-elena-vance",
    subscription: {
      plan: "Enterprise",
      status: "active",
      seats: 25,
    },
    settings: {
      defaultJurisdiction: "Delaware Court of Chancery / SDNY",
      defaultBillingType: "hourly",
      conflictCheckRequired: true,
      require2FA: true,
      sessionTimeoutMinutes: 60,
      restrictedAccessMode: false,
    },
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2026-09-20T12:00:00Z",
  },
  {
    id: "demo-org-2",
    name: "Kestrel Legal Chambers",
    slug: "kestrel-chambers",
    logoUrl: "",
    ownerId: "user-marcus-sterling",
    subscription: {
      plan: "Standard",
      status: "active",
      seats: 10,
    },
    settings: {
      defaultJurisdiction: "ICC International Court of Arbitration (London / Zurich)",
      defaultBillingType: "retainer",
      conflictCheckRequired: true,
      require2FA: false,
      sessionTimeoutMinutes: 30,
      restrictedAccessMode: true,
    },
    createdAt: "2025-06-01T09:30:00Z",
    updatedAt: "2026-09-18T10:00:00Z",
  },
];

export const DEMO_MEMBERS: OrgMember[] = [
  {
    id: "mem-1",
    organizationId: "demo-org-1",
    userId: "user-elena-vance",
    userEmail: "elena.vance@vance-sterling.law",
    userName: "Elena Vance, Esq.",
    role: "admin",
    title: "Managing Senior Partner",
    department: "Complex Commercial Litigation",
    joinedAt: "2025-01-15T08:00:00Z",
    lastActiveAt: "2026-09-22T17:15:00Z",
    status: "active",
  },
  {
    id: "mem-2",
    organizationId: "demo-org-1",
    userId: "user-marcus-sterling",
    userEmail: "marcus.sterling@vance-sterling.law",
    userName: "Marcus Sterling, Esq.",
    role: "lawyer",
    title: "Senior Trial Partner",
    department: "Cross-Border Arbitration & IP",
    joinedAt: "2025-02-01T10:00:00Z",
    lastActiveAt: "2026-09-22T16:40:00Z",
    status: "active",
  },
  {
    id: "mem-3",
    organizationId: "demo-org-1",
    userId: "user-james-chen",
    userEmail: "james.chen@vance-sterling.law",
    userName: "James Chen, Esq.",
    role: "associate",
    title: "Senior Associate Counsel",
    department: "Regulatory & Financial Crimes",
    joinedAt: "2025-07-10T09:00:00Z",
    lastActiveAt: "2026-09-22T14:20:00Z",
    status: "active",
  },
  {
    id: "mem-4",
    organizationId: "demo-org-1",
    userId: "user-sarah-miller",
    userEmail: "sarah.miller@vance-sterling.law",
    userName: "Sarah Miller, CP",
    role: "staff",
    title: "Head Litigation Paralegal",
    department: "Trial Practice Support",
    joinedAt: "2025-03-12T11:00:00Z",
    lastActiveAt: "2026-09-22T15:55:00Z",
    status: "active",
  },
  // Members for demo-org-2
  {
    id: "mem-kestrel-1",
    organizationId: "demo-org-2",
    userId: "user-marcus-sterling",
    userEmail: "marcus@kestrel-chambers.co.uk",
    userName: "Marcus Sterling, KC",
    role: "admin",
    title: "Head of Chambers",
    department: "International Arbitrations",
    joinedAt: "2025-06-01T09:30:00Z",
    lastActiveAt: "2026-09-22T11:00:00Z",
    status: "active",
  },
  {
    id: "mem-kestrel-2",
    organizationId: "demo-org-2",
    userId: "user-james-chen",
    userEmail: "j.chen@kestrel-chambers.co.uk",
    userName: "James Chen, Barrister",
    role: "lawyer",
    title: "Junior Counsel",
    department: "Commercial Chancery",
    joinedAt: "2025-08-15T09:00:00Z",
    lastActiveAt: "2026-09-21T18:00:00Z",
    status: "active",
  },
];

export const DEMO_INVITATIONS: OrgInvitation[] = [
  {
    id: "inv-1",
    organizationId: "demo-org-1",
    organizationName: "Vance & Sterling Global Litigators LLP",
    email: "rachel.zane@vance-sterling.law",
    role: "associate",
    invitedBy: "user-elena-vance",
    invitedByName: "Elena Vance, Esq.",
    status: "pending",
    token: "tok_inv_rz_8914",
    createdAt: "2026-09-18T14:00:00Z",
    expiresAt: "2026-10-02T14:00:00Z",
  },
  {
    id: "inv-2",
    organizationId: "demo-org-1",
    organizationName: "Vance & Sterling Global Litigators LLP",
    email: "david.ross@vance-sterling.law",
    role: "staff",
    invitedBy: "user-marcus-sterling",
    invitedByName: "Marcus Sterling, Esq.",
    status: "pending",
    token: "tok_inv_dr_4192",
    createdAt: "2026-09-19T10:30:00Z",
    expiresAt: "2026-10-03T10:30:00Z",
  },
];

export const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "audit-1",
    organizationId: "demo-org-1",
    userId: "user-elena-vance",
    userName: "Elena Vance, Esq.",
    userEmail: "elena.vance@vance-sterling.law",
    userRole: "admin",
    action: "ai.query",
    entityType: "ai",
    matterId: "demo-matter-1",
    matterName: "Apex Meridian Holdings Ltd v. Crestview Infrastructure Partners",
    details: "Executive matter synthesis generated across 5 pleading & expert documents",
    timestamp: "2026-09-22T17:15:22Z",
    ipAddress: "192.0.2.45",
  },
  {
    id: "audit-2",
    organizationId: "demo-org-1",
    userId: "user-marcus-sterling",
    userName: "Marcus Sterling, Esq.",
    userEmail: "marcus.sterling@vance-sterling.law",
    userRole: "lawyer",
    action: "task.created",
    entityType: "task",
    entityId: "task-demo-2",
    matterId: "demo-matter-1",
    matterName: "Apex Meridian Holdings Ltd v. Crestview Infrastructure Partners",
    details: "Created task: Deposition Preparation — Dr. Julian Vance (Engineering Expert)",
    timestamp: "2026-09-22T16:30:10Z",
    ipAddress: "192.0.2.88",
  },
  {
    id: "audit-3",
    organizationId: "demo-org-1",
    userId: "user-james-chen",
    userName: "James Chen, Esq.",
    userEmail: "james.chen@vance-sterling.law",
    userRole: "associate",
    action: "document.viewed",
    entityType: "document",
    entityId: "demo-doc-1",
    matterId: "demo-matter-1",
    matterName: "Apex Meridian Holdings Ltd v. Crestview Infrastructure Partners",
    details: "Viewed verified complaint and cross-checked liquidated damages paragraph 42",
    timestamp: "2026-09-22T14:15:00Z",
    ipAddress: "192.0.2.112",
  },
  {
    id: "audit-4",
    organizationId: "demo-org-1",
    userId: "user-elena-vance",
    userName: "Elena Vance, Esq.",
    userEmail: "elena.vance@vance-sterling.law",
    userRole: "admin",
    action: "team.invited",
    entityType: "team",
    details: "Invited Rachel Zane (rachel.zane@vance-sterling.law) as Associate",
    timestamp: "2026-09-18T14:00:00Z",
    ipAddress: "192.0.2.45",
  },
  {
    id: "audit-5",
    organizationId: "demo-org-1",
    userId: "user-sarah-miller",
    userName: "Sarah Miller, CP",
    userEmail: "sarah.miller@vance-sterling.law",
    userRole: "staff",
    action: "deadline.created",
    entityType: "deadline",
    entityId: "demo-dl-1",
    matterId: "demo-matter-1",
    matterName: "Apex Meridian Holdings Ltd v. Crestview Infrastructure Partners",
    details: "Logged statutory Chancery Court cutoff: Opposition to Motion for Protective Order",
    timestamp: "2026-09-16T11:45:00Z",
    ipAddress: "192.0.2.99",
  },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    organizationId: "demo-org-1",
    userId: "user-elena-vance",
    type: "deadline_approaching",
    title: "Chancery Court Filing in 48 Hours",
    message: "Opposition to Motion for Protective Order is due on September 28, 2026.",
    entityType: "deadline",
    entityId: "demo-dl-1",
    matterId: "demo-matter-1",
    read: false,
    createdAt: "2026-09-22T08:00:00Z",
  },
  {
    id: "notif-2",
    organizationId: "demo-org-1",
    userId: "user-elena-vance",
    type: "ai_review_required",
    title: "AI Review: Unreviewed Contradiction",
    message: "2 potential date contradictions in Apex v Crestview await lawyer verification.",
    entityType: "matter",
    matterId: "demo-matter-1",
    read: false,
    createdAt: "2026-09-21T15:30:00Z",
  },
  {
    id: "notif-3",
    organizationId: "demo-org-1",
    userId: "user-elena-vance",
    type: "task_assigned",
    title: "New Matter Task Assigned",
    message: "Marcus Sterling assigned you 'Review Expert Witness Rebuttal Disclosures'.",
    entityType: "task",
    entityId: "task-demo-1",
    matterId: "demo-matter-1",
    read: true,
    createdAt: "2026-09-20T10:00:00Z",
  },
];

export class OrganizationService {
  private static organizations: Organization[] = [...DEMO_ORGANIZATIONS];
  private static members: OrgMember[] = [...DEMO_MEMBERS];
  private static invitations: OrgInvitation[] = [...DEMO_INVITATIONS];
  private static auditLogs: AuditLogEntry[] = [...DEMO_AUDIT_LOGS];
  private static notifications: NotificationItem[] = [...DEMO_NOTIFICATIONS];

  // --- Organizations ---
  public static async getOrganizations(userId: string, isDemo = true): Promise<Organization[]> {
    if (isDemo) {
      // In demo mode, return organizations the user belongs to or all demo orgs
      return [...this.organizations];
    }
    try {
      const q = query(collection(db, "organizations"));
      const snap = await getDocs(q);
      if (snap.empty) {
        return [...this.organizations];
      }
      return snap.docs.map((d) => d.data() as Organization);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "organizations");
      return [...this.organizations];
    }
  }

  public static async getOrganization(orgId: string, isDemo = true): Promise<Organization | null> {
    if (isDemo) {
      return this.organizations.find((o) => o.id === orgId) || this.organizations[0];
    }
    try {
      const docRef = doc(db, "organizations", orgId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Organization;
      }
      return this.organizations.find((o) => o.id === orgId) || null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `organizations/${orgId}`);
      return this.organizations.find((o) => o.id === orgId) || null;
    }
  }

  public static async createOrganization(
    data: { name: string; ownerId: string; ownerEmail: string; ownerName: string },
    isDemo = true
  ): Promise<Organization> {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name,
      slug,
      ownerId: data.ownerId,
      subscription: {
        plan: "Standard",
        status: "active",
        seats: 5,
      },
      settings: {
        defaultJurisdiction: "General Jurisdiction",
        defaultBillingType: "hourly",
        conflictCheckRequired: true,
        require2FA: false,
        sessionTimeoutMinutes: 60,
        restrictedAccessMode: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ownerMember: OrgMember = {
      id: `mem-${Date.now()}`,
      organizationId: newOrg.id,
      userId: data.ownerId,
      userEmail: data.ownerEmail,
      userName: data.ownerName,
      role: "admin",
      title: "Founding Partner",
      department: "Management",
      joinedAt: new Date().toISOString(),
      status: "active",
    };

    if (isDemo) {
      this.organizations.unshift(newOrg);
      this.members.unshift(ownerMember);
      await this.logAudit({
        organizationId: newOrg.id,
        userId: data.ownerId,
        userName: data.ownerName,
        userEmail: data.ownerEmail,
        userRole: "admin",
        action: "org.settings_updated",
        entityType: "organization",
        details: `Firm workspace created: ${newOrg.name}`,
      }, true);
      return newOrg;
    }

    try {
      await setDoc(doc(db, "organizations", newOrg.id), newOrg);
      await setDoc(doc(db, "organizationMembers", ownerMember.id), ownerMember);
      return newOrg;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `organizations/${newOrg.id}`);
      return newOrg;
    }
  }

  public static async updateOrganizationSettings(
    orgId: string,
    settings: Partial<OrganizationSettings>,
    updatedBy: { id: string; name: string; email: string; role: UserRole },
    isDemo = true
  ): Promise<Organization> {
    if (isDemo) {
      const idx = this.organizations.findIndex((o) => o.id === orgId);
      if (idx !== -1) {
        this.organizations[idx] = {
          ...this.organizations[idx],
          settings: { ...this.organizations[idx].settings, ...settings },
          updatedAt: new Date().toISOString(),
        };
        await this.logAudit({
          organizationId: orgId,
          userId: updatedBy.id,
          userName: updatedBy.name,
          userEmail: updatedBy.email,
          userRole: updatedBy.role,
          action: "org.settings_updated",
          entityType: "organization",
          details: `Updated organization settings: ${Object.keys(settings).join(", ")}`,
        }, true);
        return this.organizations[idx];
      }
      throw new Error("Organization not found");
    }

    try {
      const docRef = doc(db, "organizations", orgId);
      await updateDoc(docRef, {
        settings,
        updatedAt: new Date().toISOString(),
      });
      const updated = await this.getOrganization(orgId, false);
      return updated!;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `organizations/${orgId}`);
      throw e;
    }
  }

  // --- Members ---
  public static async getOrgMembers(orgId: string, isDemo = true): Promise<OrgMember[]> {
    if (isDemo) {
      return this.members.filter((m) => m.organizationId === orgId);
    }
    try {
      const q = query(collection(db, "organizationMembers"), where("organizationId", "==", orgId));
      const snap = await getDocs(q);
      if (snap.empty) {
        return this.members.filter((m) => m.organizationId === orgId);
      }
      return snap.docs.map((d) => d.data() as OrgMember);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "organizationMembers");
      return this.members.filter((m) => m.organizationId === orgId);
    }
  }

  public static async updateMemberRole(
    memberId: string,
    newRole: UserRole,
    performedBy: { id: string; name: string; email: string; role: UserRole },
    isDemo = true
  ): Promise<OrgMember> {
    if (performedBy.role !== "admin") {
      throw new Error("Unauthorized: Only firm administrators can modify member roles");
    }

    if (isDemo) {
      const idx = this.members.findIndex((m) => m.id === memberId);
      if (idx !== -1) {
        const oldRole = this.members[idx].role;
        this.members[idx].role = newRole;
        await this.logAudit({
          organizationId: this.members[idx].organizationId,
          userId: performedBy.id,
          userName: performedBy.name,
          userEmail: performedBy.email,
          userRole: performedBy.role,
          action: "team.role_changed",
          entityType: "team",
          entityId: memberId,
          details: `Changed role for ${this.members[idx].userName} from ${oldRole} to ${newRole}`,
        }, true);
        return this.members[idx];
      }
      throw new Error("Member not found");
    }

    try {
      const docRef = doc(db, "organizationMembers", memberId);
      await updateDoc(docRef, { role: newRole });
      const snap = await getDoc(docRef);
      return snap.data() as OrgMember;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `organizationMembers/${memberId}`);
      throw e;
    }
  }

  public static async removeMember(
    memberId: string,
    performedBy: { id: string; name: string; email: string; role: UserRole },
    isDemo = true
  ): Promise<void> {
    if (performedBy.role !== "admin") {
      throw new Error("Unauthorized: Only firm administrators can remove team members");
    }

    if (isDemo) {
      const member = this.members.find((m) => m.id === memberId);
      if (member) {
        this.members = this.members.filter((m) => m.id !== memberId);
        await this.logAudit({
          organizationId: member.organizationId,
          userId: performedBy.id,
          userName: performedBy.name,
          userEmail: performedBy.email,
          userRole: performedBy.role,
          action: "team.member_removed",
          entityType: "team",
          entityId: memberId,
          details: `Removed member ${member.userName} (${member.userEmail}) from organization`,
        }, true);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, "organizationMembers", memberId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `organizationMembers/${memberId}`);
      throw e;
    }
  }

  // --- Invitations ---
  public static async getInvitations(orgId: string, isDemo = true): Promise<OrgInvitation[]> {
    if (isDemo) {
      return this.invitations.filter((i) => i.organizationId === orgId && i.status === "pending");
    }
    try {
      const q = query(
        collection(db, "organizationInvitations"),
        where("organizationId", "==", orgId),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as OrgInvitation);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "organizationInvitations");
      return this.invitations.filter((i) => i.organizationId === orgId);
    }
  }

  public static async inviteMember(
    data: {
      organizationId: string;
      organizationName: string;
      email: string;
      role: UserRole;
      invitedBy: string;
      invitedByName: string;
    },
    isDemo = true
  ): Promise<OrgInvitation> {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const token = `inv_${Math.random().toString(36).substring(2, 10)}`;
    const newInvitation: OrgInvitation = {
      id: `inv-${Date.now()}`,
      organizationId: data.organizationId,
      organizationName: data.organizationName,
      email: data.email.toLowerCase().trim(),
      role: data.role,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      status: "pending",
      token,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    if (isDemo) {
      this.invitations.unshift(newInvitation);
      await this.logAudit({
        organizationId: data.organizationId,
        userId: data.invitedBy,
        userName: data.invitedByName,
        userEmail: "counsel@firm.law",
        userRole: "admin",
        action: "team.invited",
        entityType: "team",
        details: `Sent invitation to ${newInvitation.email} as ${newInvitation.role}`,
      }, true);
      return newInvitation;
    }

    try {
      await setDoc(doc(db, "organizationInvitations", newInvitation.id), newInvitation);
      return newInvitation;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `organizationInvitations/${newInvitation.id}`);
      return newInvitation;
    }
  }

  public static async revokeInvitation(
    invitationId: string,
    performedBy: { id: string; name: string; email: string; role: UserRole },
    isDemo = true
  ): Promise<void> {
    if (isDemo) {
      const inv = this.invitations.find((i) => i.id === invitationId);
      if (inv) {
        inv.status = "revoked";
        await this.logAudit({
          organizationId: inv.organizationId,
          userId: performedBy.id,
          userName: performedBy.name,
          userEmail: performedBy.email,
          userRole: performedBy.role,
          action: "team.invitation_revoked",
          entityType: "team",
          entityId: invitationId,
          details: `Revoked pending invitation for ${inv.email}`,
        }, true);
      }
      return;
    }

    try {
      await updateDoc(doc(db, "organizationInvitations", invitationId), { status: "revoked" });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `organizationInvitations/${invitationId}`);
      throw e;
    }
  }

  public static async acceptInvitation(
    tokenOrId: string,
    user: { id: string; email: string; name: string },
    isDemo = true
  ): Promise<OrgMember> {
    const inv = this.invitations.find(
      (i) => (i.id === tokenOrId || i.token === tokenOrId) && i.status === "pending"
    );

    if (!inv) {
      throw new Error("Invalid or expired invitation link");
    }

    const newMember: OrgMember = {
      id: `mem-${Date.now()}`,
      organizationId: inv.organizationId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      role: inv.role,
      joinedAt: new Date().toISOString(),
      status: "active",
    };

    if (isDemo) {
      inv.status = "accepted";
      this.members.unshift(newMember);
      await this.logAudit({
        organizationId: inv.organizationId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: inv.role,
        action: "team.invited",
        entityType: "team",
        details: `${user.name} accepted invitation and joined as ${inv.role}`,
      }, true);
      return newMember;
    }

    try {
      await setDoc(doc(db, "organizationMembers", newMember.id), newMember);
      await updateDoc(doc(db, "organizationInvitations", inv.id), { status: "accepted" });
      return newMember;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `organizationMembers/${newMember.id}`);
      return newMember;
    }
  }

  // --- Audit Logs ---
  public static async getAuditLogs(
    orgId: string,
    filters?: { action?: string; entityType?: string; userId?: string; matterId?: string; search?: string },
    isDemo = true
  ): Promise<AuditLogEntry[]> {
    let logs = this.auditLogs.filter((l) => l.organizationId === orgId);

    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters?.entityType) {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.matterId) {
      logs = logs.filter((l) => l.matterId === filters.matterId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          (l.matterName && l.matterName.toLowerCase().includes(q))
      );
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static async logAudit(
    entry: Omit<AuditLogEntry, "id" | "timestamp">,
    isDemo = true
  ): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    if (isDemo) {
      this.auditLogs.unshift(fullEntry);
      return fullEntry;
    }

    try {
      await setDoc(doc(db, "auditLogs", fullEntry.id), fullEntry);
      return fullEntry;
    } catch (e) {
      // Non-blocking log failure
      console.warn("Could not write audit log to firestore:", e);
      return fullEntry;
    }
  }

  // --- Notifications ---
  public static async getNotifications(
    orgId: string,
    userId: string,
    isDemo = true
  ): Promise<NotificationItem[]> {
    if (isDemo) {
      return this.notifications.filter(
        (n) => n.organizationId === orgId && (n.userId === userId || n.userId === "all")
      );
    }
    try {
      const q = query(
        collection(db, "notifications"),
        where("organizationId", "==", orgId),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as NotificationItem);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "notifications");
      return this.notifications.filter((n) => n.organizationId === orgId);
    }
  }

  public static async markNotificationRead(notificationId: string, isDemo = true): Promise<void> {
    if (isDemo) {
      const n = this.notifications.find((notif) => notif.id === notificationId);
      if (n) n.read = true;
      return;
    }
    try {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  }

  public static async markAllNotificationsRead(orgId: string, userId: string, isDemo = true): Promise<void> {
    if (isDemo) {
      this.notifications
        .filter((n) => n.organizationId === orgId && (n.userId === userId || n.userId === "all"))
        .forEach((n) => (n.read = true));
      return;
    }
    try {
      const q = query(
        collection(db, "notifications"),
        where("organizationId", "==", orgId),
        where("userId", "==", userId),
        where("read", "==", false)
      );
      const snap = await getDocs(q);
      const promises = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
      await Promise.all(promises);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "notifications");
    }
  }

  public static async createNotification(
    data: Omit<NotificationItem, "id" | "createdAt" | "read">,
    isDemo = true
  ): Promise<NotificationItem> {
    const item: NotificationItem = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    if (isDemo) {
      this.notifications.unshift(item);
      return item;
    }

    try {
      await setDoc(doc(db, "notifications", item.id), item);
      return item;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `notifications/${item.id}`);
      return item;
    }
  }
}
