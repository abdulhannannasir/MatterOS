import { Matter, UserRole, MatterTeamMember, OrganizationSettings } from "../types/matteros.ts";

export type PermissionAction =
  | "create_matter"
  | "delete_matter"
  | "close_reopen_matter"
  | "assign_matter_counsel"
  | "manage_tasks"
  | "upload_documents"
  | "delete_documents"
  | "use_ai"
  | "manage_notes"
  | "manage_deadlines"
  | "confirm_ai_suggestions"
  | "view_firm_audit_log"
  | "manage_team"
  | "manage_org_settings";

export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

export class AuthControlService {
  /**
   * Check whether a user has permission to access a specific legal matter.
   * Firm Admins always have access to all matters in the organization.
   * In non-restricted mode, Lawyers can view firm matters, but Associates/Staff must be assigned.
   * In restricted mode, only explicitly assigned lawyers, associates, staff, or lead counsel can view the matter.
   */
  public static canUserAccessMatter(
    user: { id: string; role: UserRole },
    matter: Matter,
    orgSettings?: OrganizationSettings
  ): boolean {
    if (!matter) return false;

    // Firm Admins have absolute firm-wide access for compliance, management, and billing
    if (user.role === "admin") {
      return true;
    }

    // Direct owner or lead attorney
    if (matter.ownerId === user.id || matter.leadAttorneyId === user.id) {
      return true;
    }

    // In assigned list
    if (matter.assignedUserIds && matter.assignedUserIds.includes(user.id)) {
      return true;
    }

    // In team members list
    if (matter.teamMembers && matter.teamMembers.some((tm) => tm.userId === user.id)) {
      return true;
    }

    // Restricted Access Mode check:
    // If restrictedAccessMode is FALSE and role is 'lawyer', lawyer can view firm matters.
    if (orgSettings?.restrictedAccessMode === false && user.role === "lawyer") {
      return true;
    }

    return false;
  }

  /**
   * Check whether a user can modify matter settings, assign counsel, or close/reopen the matter.
   */
  public static canUserManageMatter(
    user: { id: string; role: UserRole },
    matter: Matter
  ): boolean {
    if (user.role === "admin") return true;
    if (matter.leadAttorneyId === user.id || matter.ownerId === user.id) return true;
    const member = matter.teamMembers?.find((tm) => tm.userId === user.id);
    if (member && member.role === "lawyer" && member.canEdit) return true;
    return false;
  }

  /**
   * Check whether a user role is permitted to perform a general system action.
   */
  public static canUserPerformAction(role: UserRole, action: PermissionAction): boolean {
    switch (action) {
      case "manage_team":
      case "manage_org_settings":
        return role === "admin";

      case "view_firm_audit_log":
        return role === "admin" || role === "lawyer";

      case "create_matter":
      case "delete_matter":
      case "close_reopen_matter":
      case "assign_matter_counsel":
        return role === "admin" || role === "lawyer";

      case "confirm_ai_suggestions":
        return role === "admin" || role === "lawyer" || role === "associate";

      case "use_ai":
      case "manage_notes":
      case "manage_tasks":
      case "manage_deadlines":
      case "upload_documents":
        return true; // All roles with access to matter can perform these within permitted boundaries

      case "delete_documents":
        return role === "admin" || role === "lawyer";

      default:
        return false;
    }
  }

  /**
   * Filter matters list based on the user's role and matter assignments.
   */
  public static filterAccessibleMatters(
    matters: Matter[],
    user: { id: string; role: UserRole },
    orgSettings?: OrganizationSettings
  ): Matter[] {
    return matters.filter((m) => this.canUserAccessMatter(user, m, orgSettings));
  }
}
