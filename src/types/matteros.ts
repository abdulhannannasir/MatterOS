export type MatterStatus = "Active" | "Pending" | "Closed" | "Archived";
export type MatterPriority = "Urgent" | "High" | "Normal" | "Low";
export type DocumentCategory = 
  | "Pleading"
  | "Court Order"
  | "Contract"
  | "Correspondence"
  | "Evidence"
  | "Affidavit"
  | "Notice"
  | "Agreement"
  | "Other";

export type ProcessingStatus = "Uploaded" | "Processing" | "Analyzed" | "Failed";
export type AIAnalysisStatus = "Pending" | "Completed" | "Failed";
export type IssueStatus = "Open" | "Reviewing" | "Pending" | "Resolved" | "Dismissed" | string;
export type DeadlineStatus = "Suggested" | "Confirmed" | "Completed" | "Missed" | "Dismissed" | "Pending" | "Overdue" | "Adjourned" | string;
export type EvidenceStatus = "Unreviewed" | "Reviewed" | "Supporting" | "Disputed" | "Excluded" | "Admitted" | "Internal Work Product" | string;
export type EvidenceType = "Documentary" | "Physical" | "Testimony" | "Digital" | "Expert Report" | "Other" | string;
export type TaskStatus = "To Do" | "In Progress" | "Waiting" | "Completed" | "Cancelled" | "to_do" | "in_progress" | "waiting" | "completed" | "cancelled";
export type TaskPriority = "Low" | "Normal" | "High" | "Urgent" | "low" | "normal" | "high" | "urgent";
export type ConfidenceLevel = "high" | "medium" | "low";

export type UserRole = "admin" | "lawyer" | "associate" | "staff";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firmName: string;
  role: string;
  userRole?: UserRole;
  organizationId?: string;
  createdAt: string;
}

export interface OrganizationSettings {
  defaultJurisdiction?: string;
  defaultBillingType?: "hourly" | "flat" | "contingency" | "retainer";
  conflictCheckRequired?: boolean;
  require2FA?: boolean;
  sessionTimeoutMinutes?: number;
  restrictedAccessMode?: boolean; // When true, only assigned lawyers/associates/staff can see the matter
}

export interface OrganizationSubscription {
  plan: "Enterprise" | "Standard" | "Trial";
  status: "active" | "past_due" | "canceled";
  seats: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: string;
  subscription: OrganizationSubscription;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  title?: string;
  department?: string;
  joinedAt: string;
  lastActiveAt?: string;
  status: "active" | "invited" | "suspended";
}

export interface OrgInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface MatterTeamMember {
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  assignedAt: string;
  canEdit?: boolean;
}

export type AuditAction =
  | "matter.created"
  | "matter.updated"
  | "matter.closed"
  | "matter.reopened"
  | "matter.assigned"
  | "matter.archived"
  | "matter.lead_reassigned"
  | "document.uploaded"
  | "document.viewed"
  | "document.deleted"
  | "document.analyzed"
  | "task.created"
  | "task.assigned"
  | "task.completed"
  | "task.deleted"
  | "deadline.created"
  | "deadline.confirmed"
  | "deadline.updated"
  | "note.created"
  | "note.updated"
  | "ai.query"
  | "ai.synthesis"
  | "ai.suggestion_accepted"
  | "team.invited"
  | "team.member_assigned"
  | "team.member_removed"
  | "team.role_changed"
  | "team.invitation_revoked"
  | "org.settings_updated"
  | "security.access_denied"
  | "google.connected"
  | "google.disconnected"
  | "drive.file_imported"
  | "drive.sync_checked"
  | "drive.version_updated"
  | "gmail.message_imported"
  | "calendar.event_created"
  | "calendar.event_updated"
  | "calendar.sync_conflict"
  | "calendar.event_disconnected"
  | "sheets.report_exported";

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: "matter" | "document" | "task" | "deadline" | "note" | "ai" | "team" | "organization" | "security" | "integration";
  entityId?: string;
  matterId?: string;
  matterName?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | "task_assigned"
  | "task_due"
  | "deadline_approaching"
  | "ai_review_required"
  | "matter_assigned"
  | "invitation_received";

export interface NotificationItem {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: "matter" | "task" | "deadline" | "document" | "note";
  entityId?: string;
  matterId?: string;
  read: boolean;
  createdAt: string;
}

export interface Matter {
  id: string;
  organizationId?: string;
  ownerId: string;
  matterName: string;
  matterNumber: string;
  client: string;
  opposingParty?: string;
  matterType: string;
  jurisdiction?: string;
  court?: string;
  caseNumber?: string;
  description?: string;
  status: MatterStatus;
  priority: MatterPriority;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  leadAttorney?: string;
  leadAttorneyId?: string;
  assignedUserIds?: string[];
  teamMembers?: MatterTeamMember[];
  documentCount?: number;
  deadlineCount?: number;
  lastActivity?: string;
  closedAt?: string;
  closureNotes?: string;
  closureReason?: string;
  closedBy?: string;
}

export interface DocumentItem {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  filename: string;
  fileType: string;
  category: DocumentCategory;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  processingStatus: ProcessingStatus;
  aiAnalysisStatus: AIAnalysisStatus;
  contentSummary?: string;
  extractedText: string;
  fileData?: string;
  // External Provider Integration fields
  provider?: "google_drive" | "gmail" | "upload" | "manual";
  providerFileId?: string;
  providerName?: string;
  providerUrl?: string;
  mimeType?: string;
  lastModifiedAt?: string;
  importedAt?: string;
  importedBy?: string;
  externalVersionChanged?: boolean;
  externalLastModifiedAt?: string;
  // Email Correspondence Metadata
  emailMetadata?: {
    providerMessageId?: string;
    threadId?: string;
    sender?: string;
    recipients?: string[];
    subject?: string;
    sentAt?: string;
    hasAttachments?: boolean;
    attachmentCount?: number;
    attachments?: Array<{
      id: string;
      name: string;
      mimeType: string;
      size: number;
      importedAsDocId?: string;
    }>;
  };
}

export interface ExtractedFact {
  fact: string;
  sourceQuote?: string;
  date?: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedEvent {
  date: string;
  event: string;
  description: string;
  sourceDocument?: string;
  sourcePage?: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedIssue {
  title: string;
  description: string;
  category?: string;
  sourceDocument?: string;
  relatedFacts?: string[];
}

export interface ExtractedObligation {
  obligation: string;
  responsibleParty: string;
  deadline?: string;
  source?: string;
}

export interface ExtractedDate {
  date: string;
  description: string;
  source: string;
  isBindingDeadline?: boolean;
  priority?: "high" | "medium" | "low";
}

export interface ExtractedReference {
  documentName: string;
  clauseOrSection?: string;
  description?: string;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  matterId: string;
  ownerId: string;
  documentSummary: string;
  documentType: string;
  parties: Array<{ name: string; role: string; representation?: string }>;
  keyFacts: ExtractedFact[];
  events: ExtractedEvent[];
  issues: ExtractedIssue[];
  peopleAndOrgs: Array<{ name: string; type: "person" | "organization" | "court" | "counsel"; role: string }>;
  obligations: ExtractedObligation[];
  importantDates: ExtractedDate[];
  references: ExtractedReference[];
  missingInformation: string[];
  modelUsed: string;
  analyzedAt: string;
}

export type RelationshipType =
  | "references"
  | "amends"
  | "responds_to"
  | "relies_upon"
  | "supports"
  | "contradicts"
  | "follows"
  | "precedes"
  | "related_to";

export type FactExtractionType =
  | "allegation"
  | "admission"
  | "denial"
  | "agreement"
  | "payment"
  | "communication"
  | "notice"
  | "application"
  | "order"
  | "procedural"
  | "factual_assertion"
  | "obligation";

export type FactSourceType =
  | "document-extracted"
  | "lawyer-entered"
  | "ai-interpretation"
  | "ai-suggestion";

export type ContradictionCategory =
  | "date_conflict"
  | "payment_discrepancy"
  | "event_description"
  | "position_shift"
  | "admission_denial"
  | "agreement_terms"
  | "notice_delivery"
  | "party_assertion";

export type ContradictionStatus = "unreviewed" | "reviewed" | "confirmed" | "dismissed";
export type MissingInfoStatus = "open" | "resolved" | "dismissed";

export interface MatterRelationship {
  id: string;
  matterId: string;
  ownerId: string;
  sourceDocId?: string;
  sourceDocName: string;
  targetDocId?: string;
  targetDocName: string;
  relationshipType: RelationshipType;
  description: string;
  clauseOrSection?: string;
  isAiDetected: boolean;
  isLawyerConfirmed: boolean;
  sharedEntities?: {
    parties?: string[];
    dates?: string[];
    issues?: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatterFact {
  id: string;
  matterId: string;
  ownerId: string;
  fact: string;
  sourceDocument: string;
  sourceDocId?: string;
  page?: string;
  section?: string;
  confidence: ConfidenceLevel;
  extractionType: FactExtractionType;
  relatedParty?: string;
  relatedIssueId?: string;
  relatedEvidenceId?: string;
  amount?: string;
  location?: string;
  date?: string;
  factSourceType: FactSourceType;
  isLawyerConfirmed: boolean;
  isDismissed?: boolean;
  lawyerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatterContradiction {
  id: string;
  matterId: string;
  ownerId: string;
  title: string;
  statementA: {
    text: string;
    sourceDocument: string;
    sourceDocId?: string;
    page?: string;
    date?: string;
  };
  statementB: {
    text: string;
    sourceDocument: string;
    sourceDocId?: string;
    page?: string;
    date?: string;
  };
  contradictionCategory: ContradictionCategory;
  whyFlagged: string;
  status: ContradictionStatus;
  lawyerNotes?: string;
  isAiDetected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatterMissingInfo {
  id: string;
  matterId: string;
  ownerId: string;
  item: string;
  referencedByDocument: string;
  clauseOrContext?: string;
  explanation: string;
  status: MissingInfoStatus;
  lawyerNotes?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  date: string;
  event: string;
  description: string;
  sourceDocument?: string;
  sourcePage?: string;
  sourceSection?: string;
  relatedIssue?: string;
  relatedParty?: string;
  confidence: ConfidenceLevel;
  sourceType?: "document-extracted" | "lawyer-entered" | "lawyer-modified";
  isAiGenerated: boolean;
  lawyerVerified: boolean;
  hasDateConflict?: boolean;
  dateConflictWithDoc?: string;
  dateConflictDate?: string;
  dateConflictReason?: string;
  conflictStatus?: "unresolved" | "resolved" | "dismissed";
  resolvedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Issue {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  title: string;
  description: string;
  sourceDocument?: string;
  source?: "lawyer_created" | "ai_suggested" | string;
  priority?: "low" | "normal" | "high" | "urgent" | "Low" | "Normal" | "High" | "Urgent";
  relatedFacts?: string[];
  relatedDocuments?: string[];
  relatedEvidence?: string[];
  relatedTasks?: string[];
  notes?: string[] | string;
  status: IssueStatus;
  lawyerNotes?: string;
  isAiSuggested: boolean;
  confirmedByLawyer?: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  originalAiSuggestion?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceItem {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  name: string;
  type: EvidenceType;
  description: string;
  sourceDocument?: string;
  sourceDocId?: string;
  sourcePage?: string;
  sourceSection?: string;
  date?: string;
  relatedIssueId?: string;
  relatedIssueIds?: string[];
  relatedFactId?: string;
  status: EvidenceStatus;
  notes?: string;
  isAiSuggested?: boolean;
  confirmedByLawyer?: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  originalAiSuggestion?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Deadline {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  title: string;
  date: string;
  description: string;
  source?: string;
  sourceDocument?: string;
  sourcePage?: string;
  relevantText?: string;
  confidence?: number;
  status: DeadlineStatus;
  priority: "high" | "medium" | "low" | "critical" | "urgent";
  isAiSuggested: boolean;
  isLawyerConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  originalAiSuggestion?: {
    date?: string;
    sourceDocument?: string;
    sourcePage?: string;
    relevantText?: string;
    confidence?: number;
    extractionTimestamp?: string;
  };
  lawyerModifiedValue?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  // Google Calendar synchronization metadata
  calendarSync?: {
    providerEventId?: string;
    calendarId?: string;
    matterId?: string;
    deadlineId?: string;
    syncedAt?: string;
    lastSyncedDate?: string;
    externalStatus?: "synced" | "modified_externally" | "deleted_externally";
    lastExternalETag?: string;
    externalSummary?: string;
    externalDate?: string;
  };
}

export interface Task {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  createdBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  relatedIssue?: string;
  relatedDocument?: string;
  relatedDeadline?: string;
  isAiSuggested?: boolean;
  aiSuggestionSource?: {
    documentName?: string;
    page?: string;
    quote?: string;
    confidence?: number;
  };
  confirmedByLawyer?: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  originalAiSuggestion?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MatterNote {
  id: string;
  organizationId?: string;
  matterId: string;
  ownerId: string;
  title: string;
  content: string;
  relatedIssue?: string;
  relatedDocument?: string;
  author: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  organizationId?: string;
  matterId?: string;
  matterName?: string;
  ownerId: string;
  userEmail: string;
  user?: string;
  action: string;
  entity?: "matter" | "document" | "issue" | "evidence" | "task" | "deadline" | "note" | "ai" | "contradiction" | string;
  entityId?: string;
  details: string;
  timestamp: string;
  metadata?: any;
}

export type InformationType = 
  | "document-fact" 
  | "lawyer-input" 
  | "lawyer-confirmed" 
  | "ai-interpretation" 
  | "ai-suggestion";

export type QueryClassificationType =
  | "fast_path_database"
  | "matter_summary"
  | "timeline_chronology"
  | "evidence_query"
  | "contradiction_query"
  | "cross_document_reasoning"
  | "unsupported";

export interface LatencyMetrics {
  requestStarted: number;
  retrievalStarted?: number;
  retrievalCompleted?: number;
  geminiStarted?: number;
  firstTokenReceived?: number;
  generationCompleted?: number;
  totalLatencyMs: number;
}

export interface SourceReference {
  id?: string;
  title: string;
  documentName: string;
  page?: string;
  section?: string;
  quote?: string;
  infoType: InformationType;
  entityId?: string;
}

export interface ChatCitation {
  documentName: string;
  pageOrClause?: string;
  quote?: string;
  entityType?: "fact" | "event" | "issue" | "contradiction" | "document";
  entityId?: string;
  infoType?: InformationType;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: ChatCitation[];
  sources?: SourceReference[];
  modelUsed?: string;
  status?: "streaming" | "completed" | "stopped" | "error";
  queryType?: QueryClassificationType;
  isFastPath?: boolean;
  latencyMetrics?: LatencyMetrics;
  error?: string;
}

export interface MatterAiSummary {
  matterId: string;
  lastUpdated: string;
  executiveOverview: string;
  partiesSummary: string;
  keyFacts: string[];
  currentIssues: string[];
  importantProceduralEvents: string[];
  keyEvidence: string[];
  potentialContradictions: string[];
  missingInformation: string[];
  importantDates: Array<{ date: string; event: string; isBinding: boolean }>;
  version: number;
}

// ==========================================
// External Integrations Architecture (Phase 6)
// ==========================================

export type IntegrationServiceId = "google_drive" | "gmail" | "google_calendar" | "google_sheets";

export interface WorkspaceIntegrationStatus {
  id: IntegrationServiceId;
  name: string;
  provider: "google";
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
  scopes: string[];
  status: "connected" | "disconnected" | "error" | "expired";
  errorMessage?: string;
}

export interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  description?: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  date: string;
  hasAttachments: boolean;
  attachmentCount?: number;
  isImportant?: boolean;
}

export interface GmailAttachmentInfo {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  extractedText?: string;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyText: string;
  bodyHtml?: string;
  attachments: GmailAttachmentInfo[];
}

export interface GoogleCalendarEventPayload {
  id?: string;
  summary: string;
  description: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  location?: string;
}

export interface GoogleCalendarSyncResult {
  providerEventId: string;
  calendarId: string;
  htmlLink?: string;
  syncedAt: string;
}

export interface SheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetName: string;
  rowCount: number;
  exportedAt: string;
}

