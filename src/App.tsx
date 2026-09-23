import React, { useState, useEffect, useCallback, useRef } from "react";
import { AuthProvider, useAuth } from "./firebase/authContext.tsx";
import { Sidebar, NavItem } from "./components/layout/Sidebar.tsx";
import { TopNavbar } from "./components/layout/TopNavbar.tsx";
import { GlobalSearchModal } from "./components/layout/GlobalSearchModal.tsx";
import { NotificationsDrawer } from "./components/layout/NotificationsDrawer.tsx";
import { AuthModal } from "./components/auth/AuthModal.tsx";
import { DashboardView } from "./components/dashboard/DashboardView.tsx";
import { MattersListView } from "./components/matters/MattersListView.tsx";
import { NewMatterModal } from "./components/matters/NewMatterModal.tsx";
import { MatterWorkspace } from "./components/matters/MatterWorkspace.tsx";
import { GlobalDeadlinesView } from "./components/deadlines/GlobalDeadlinesView.tsx";
import { SettingsView } from "./components/settings/SettingsView.tsx";
import { TeamManagementView } from "./components/team/TeamManagementView.tsx";
import { AuditLogView } from "./components/security/AuditLogView.tsx";
import { MatterService } from "./services/matterService.ts";
import { OrganizationService } from "./services/organizationService.ts";
import { AuthControlService } from "./services/authControlService.ts";
import {
  Matter,
  DocumentItem,
  TimelineEvent,
  Issue,
  EvidenceItem,
  Deadline,
  ActivityItem,
  ChatMessage,
  DocumentCategory,
  MatterRelationship,
  MatterFact,
  MatterContradiction,
  MatterMissingInfo,
  Task,
  MatterNote,
  MatterTeamMember,
} from "./types/matteros.ts";

function MainApp() {
  const { currentUser, isDemoUser, userProfile, currentOrg, currentRole } = useAuth();

  // Navigation State
  const [currentNav, setCurrentNav] = useState<NavItem>("dashboard");
  const [activeMatterId, setActiveMatterId] = useState<string | null>(null);

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false);

  // Core Data
  const [matters, setMatters] = useState<Matter[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<MatterNote[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Phase 2 Deep Intelligence State
  const [relationships, setRelationships] = useState<MatterRelationship[]>([]);
  const [facts, setFacts] = useState<MatterFact[]>([]);
  const [contradictions, setContradictions] = useState<MatterContradiction[]>([]);
  const [missingInfo, setMissingInfo] = useState<MatterMissingInfo[]>([]);
  const [isAnalyzingMultiDoc, setIsAnalyzingMultiDoc] = useState(false);

  // AI Operation States
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedOverview, setSynthesizedOverview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = currentUser?.uid || (isDemoUser ? "demo-lawyer-user-1" : "anonymous");
  const isDemoMode = isDemoUser || !currentUser;

  // Load all data on mount or user change
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedMatters, fetchedDeadlines, fetchedActivities] = await Promise.all([
        MatterService.getMatters(userId, isDemoMode, currentOrg?.id),
        MatterService.getAllDeadlines(userId, isDemoMode, currentOrg?.id),
        MatterService.getActivities(undefined, isDemoMode),
      ]);

      setMatters(fetchedMatters);
      setDeadlines(fetchedDeadlines);
      setActivities(fetchedActivities);

      // If there's an active matter, load its sub-collections
      if (activeMatterId) {
        const [docs, timeline, iss, ev, rels, fcts, contras, missing, tsk, nts] = await Promise.all([
          MatterService.getDocuments(activeMatterId, userId, isDemoMode),
          MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode),
          MatterService.getIssues(activeMatterId, userId, isDemoMode),
          MatterService.getEvidence(activeMatterId, userId, isDemoMode),
          MatterService.getRelationships(activeMatterId, isDemoMode),
          MatterService.getMatterFacts(activeMatterId, isDemoMode),
          MatterService.getContradictions(activeMatterId, isDemoMode),
          MatterService.getMissingInformation(activeMatterId, isDemoMode),
          MatterService.getTasks(activeMatterId, userId, isDemoMode),
          MatterService.getNotes(activeMatterId, userId, isDemoMode),
        ]);
        setDocuments(docs);
        setTimelineEvents(timeline);
        setIssues(iss);
        setEvidence(ev);
        setRelationships(rels);
        setFacts(fcts);
        setContradictions(contras);
        setMissingInfo(missing);
        setTasks(tsk);
        setNotes(nts);
      } else {
        // Load documents for all matters to compute counts
        const allDocsArrays = await Promise.all(
          fetchedMatters.map((m) => MatterService.getDocuments(m.id, userId, isDemoMode))
        );
        setDocuments(allDocsArrays.flat());
      }
    } catch (err) {
      console.error("Failed to load initial legal data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, isDemoMode, activeMatterId, currentOrg?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When active matter changes, load its child data
  useEffect(() => {
    if (!activeMatterId) return;

    let isMounted = true;
    async function loadMatterSubData() {
      try {
        const [docs, timeline, iss, ev, rels, fcts, contras, missing, conv, tsk, nts] = await Promise.all([
          MatterService.getDocuments(activeMatterId!, userId, isDemoMode),
          MatterService.getTimelineEvents(activeMatterId!, userId, isDemoMode),
          MatterService.getIssues(activeMatterId!, userId, isDemoMode),
          MatterService.getEvidence(activeMatterId!, userId, isDemoMode),
          MatterService.getRelationships(activeMatterId!, isDemoMode),
          MatterService.getMatterFacts(activeMatterId!, isDemoMode),
          MatterService.getContradictions(activeMatterId!, isDemoMode),
          MatterService.getMissingInformation(activeMatterId!, isDemoMode),
          MatterService.getMatterAiConversation(activeMatterId!, isDemoMode),
          MatterService.getTasks(activeMatterId!, userId, isDemoMode),
          MatterService.getNotes(activeMatterId!, userId, isDemoMode),
        ]);
        if (isMounted) {
          setDocuments(docs);
          setTimelineEvents(timeline);
          setIssues(iss);
          setEvidence(ev);
          setRelationships(rels);
          setFacts(fcts);
          setContradictions(contras);
          setMissingInfo(missing);
          setChatMessages(conv || []);
          setTasks(tsk);
          setNotes(nts);
          setSynthesizedOverview(null);
        }
      } catch (err) {
        console.error("Failed to load matter sub-data:", err);
      }
    }
    loadMatterSubData();
    return () => {
      isMounted = false;
    };
  }, [activeMatterId, userId, isDemoMode]);

  // Keyboard shortcut for Cmd/Ctrl + K (Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handlers
  const handleOpenMatter = (matterId: string) => {
    const targetMatter = matters.find((m) => m.id === matterId);
    if (targetMatter) {
      const isAllowed = AuthControlService.canUserAccessMatter(
        { id: userId, role: currentRole },
        targetMatter,
        currentOrg?.settings
      );

      if (!isAllowed) {
        alert(
          `Matter Access Restricted: As ${currentRole.toUpperCase()}, you do not have permission to view or access "${targetMatter.matterName}". Contact Lead Counsel (${targetMatter.leadAttorney || "Counsel"}) or a Managing Admin.`
        );
        OrganizationService.logAudit(
          {
            organizationId: currentOrg?.id || "demo-org-1",
            userId,
            userName: currentUser?.displayName || "Counsel",
            userEmail: currentUser?.email || "counsel@firm.law",
            userRole: currentRole,
            action: "security.access_denied",
            entityType: "matter",
            entityId: targetMatter.id,
            matterId: targetMatter.id,
            matterName: targetMatter.matterName,
            details: `Unauthorized matter access blocked under firm isolation policy for role ${currentRole}.`,
          },
          isDemoMode
        );
        return;
      }
    }

    setActiveMatterId(matterId);
    setCurrentNav("matter-workspace");
  };

  const handleBackToMatters = () => {
    setActiveMatterId(null);
    setCurrentNav("matters");
  };

  const handleCreateMatter = async (matterData: Omit<Matter, "id">) => {
    const withOrg = {
      ...matterData,
      organizationId: currentOrg?.id || "demo-org-1",
      leadAttorney: matterData.leadAttorney || currentUser?.displayName || "Elena Vance, Esq.",
      leadAttorneyId: userId,
      assignedUserIds: [userId],
      teamMembers: [
        {
          userId,
          userName: currentUser?.displayName || "Elena Vance, Esq.",
          userEmail: currentUser?.email || "elena.vance@vance-sterling.law",
          role: currentRole,
          assignedAt: new Date().toISOString(),
          canEdit: true,
        },
      ],
    };
    const newId = await MatterService.createMatter(withOrg, isDemoMode);

    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "matter.created",
        entityType: "matter",
        entityId: newId,
        matterId: newId,
        matterName: withOrg.matterName,
        details: `Matter initiated: ${withOrg.matterName} (${withOrg.matterNumber}). Lead Attorney: ${withOrg.leadAttorney}.`,
      },
      isDemoMode
    );

    await loadData();
    handleOpenMatter(newId);
  };

  const handleAssignTeamMember = async (member: MatterTeamMember) => {
    if (!activeMatterId) return;
    const current = matters.find((m) => m.id === activeMatterId);
    await MatterService.assignTeamMember(activeMatterId, member, isDemoMode);

    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "team.member_assigned",
        entityType: "team",
        entityId: member.userId,
        matterId: activeMatterId,
        matterName: current?.matterName,
        details: `Assigned ${member.userName} (${member.role.toUpperCase()}) to matter legal team.`,
      },
      isDemoMode
    );

    await loadData();
  };

  const handleRemoveTeamMember = async (targetUserId: string) => {
    if (!activeMatterId) return;
    const current = matters.find((m) => m.id === activeMatterId);
    const removedMember = current?.teamMembers?.find((m) => m.userId === targetUserId);

    await MatterService.removeTeamMember(activeMatterId, targetUserId, isDemoMode);

    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "team.member_removed",
        entityType: "team",
        entityId: targetUserId,
        matterId: activeMatterId,
        matterName: current?.matterName,
        details: `Removed ${removedMember?.userName || targetUserId} from matter legal team.`,
      },
      isDemoMode
    );

    await loadData();
  };

  const handleSetLeadAttorney = async (leadId: string, leadName: string) => {
    if (!activeMatterId) return;
    const current = matters.find((m) => m.id === activeMatterId);

    await MatterService.setLeadAttorney(activeMatterId, leadId, leadName, isDemoMode);

    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "matter.lead_reassigned",
        entityType: "matter",
        entityId: activeMatterId,
        matterId: activeMatterId,
        matterName: current?.matterName,
        details: `Lead Counsel updated to ${leadName}.`,
      },
      isDemoMode
    );

    await loadData();
  };

  const handleArchiveMatter = async (matterId: string) => {
    await MatterService.updateMatter(
      matterId,
      {
        status: "Archived",
        archived: true,
        lastActivity: "Matter archived",
      },
      isDemoMode
    );
    await loadData();
  };

  // Document Upload
  const handleUploadDocument = async (file: File, category: DocumentCategory) => {
    if (!activeMatterId) return;

    let extractedText = "";
    try {
      extractedText = await file.text();
    } catch {
      extractedText = `Binary file contents of ${file.name}.`;
    }

    if (!extractedText || extractedText.length < 5) {
      extractedText = `[EXTRACTED CONTENT FOR ${file.name}]\nDocument received and logged into case file for matter ID: ${activeMatterId}.\nSize: ${file.size} bytes.`;
    }

    await MatterService.uploadDocument(
      activeMatterId,
      userId,
      {
        filename: file.name,
        fileType: file.name.split(".").pop()?.toUpperCase() || "PDF",
        category,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        uploadedBy: userProfile?.displayName || "Counsel",
        processingStatus: "Processing",
        aiAnalysisStatus: "Pending",
        extractedText,
      },
      isDemoMode
    );

    const refreshedDocs = await MatterService.getDocuments(activeMatterId, userId, isDemoMode);
    setDocuments(refreshedDocs);
    await loadData();
  };

  // Add quick sample doc
  const handleAddSampleDoc = async (
    title: string,
    category: DocumentCategory,
    content: string
  ) => {
    if (!activeMatterId) return;

    await MatterService.uploadDocument(
      activeMatterId,
      userId,
      {
        filename: title,
        fileType: title.split(".").pop()?.toUpperCase() || "PDF",
        category,
        fileSize: content.length * 2,
        uploadDate: new Date().toISOString(),
        uploadedBy: userProfile?.displayName || "Counsel",
        processingStatus: "Processing",
        aiAnalysisStatus: "Pending",
        extractedText: content,
      },
      isDemoMode
    );

    const refreshedDocs = await MatterService.getDocuments(activeMatterId, userId, isDemoMode);
    setDocuments(refreshedDocs);
    await loadData();
  };

  // Trigger Gemini Analysis on single document
  const handleTriggerDocumentAnalysis = async (
    doc: DocumentItem,
    modelMode: "pro" | "flash" | "lite"
  ) => {
    if (!activeMatterId) return;

    const parentMatter = matters.find((m) => m.id === activeMatterId);
    if (!parentMatter) return;

    const result = await MatterService.analyzeDocumentWithGemini(
      doc,
      parentMatter,
      modelMode
    );

    // Save extracted timeline events into the matter
    if (result.events && result.events.length > 0) {
      for (const ev of result.events) {
        await MatterService.addTimelineEvent(
          {
            matterId: activeMatterId,
            ownerId: userId,
            date: ev.date,
            event: ev.event,
            description: ev.description,
            sourceDocument: doc.filename,
            sourcePage: ev.sourcePage,
            confidence: ev.confidence || "high",
            isAiGenerated: true,
            lawyerVerified: false,
            createdAt: new Date().toISOString(),
          },
          isDemoMode
        );
      }
    }

    // Save extracted issues
    if (result.issues && result.issues.length > 0) {
      for (const iss of result.issues) {
        await MatterService.addIssue(
          {
            matterId: activeMatterId,
            ownerId: userId,
            title: iss.title,
            description: iss.description,
            sourceDocument: doc.filename,
            relatedFacts: iss.relatedFacts || [],
            relatedDocuments: [doc.filename],
            status: "Open",
            isAiSuggested: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isDemoMode
        );
      }
    }

    // Save extracted deadlines
    if (result.importantDates && result.importantDates.length > 0) {
      for (const dt of result.importantDates) {
        await MatterService.addDeadline(
          {
            matterId: activeMatterId,
            ownerId: userId,
            title: dt.description,
            date: dt.date,
            description: dt.source || `Extracted from ${doc.filename}`,
            source: doc.filename,
            status: "Pending",
            priority: dt.priority || "high",
            isAiSuggested: true,
            isLawyerConfirmed: false,
            createdAt: new Date().toISOString(),
          },
          isDemoMode
        );
      }
    }

    // Refresh sub-collections
    const [refreshedDocs, refreshedTimeline, refreshedIssues, refreshedDeadlines] =
      await Promise.all([
        MatterService.getDocuments(activeMatterId, userId, isDemoMode),
        MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode),
        MatterService.getIssues(activeMatterId, userId, isDemoMode),
        MatterService.getDeadlines(activeMatterId, userId, isDemoMode),
      ]);

    setDocuments(refreshedDocs);
    setTimelineEvents(refreshedTimeline);
    setIssues(refreshedIssues);
    setDeadlines(refreshedDeadlines);
  };

  // Phase 2: Multi-Document Collective Intelligence Extraction
  const handleRunMultiDocAnalysis = async (modelMode: "pro" | "flash" | "lite") => {
    if (!activeMatterId) return;
    const parentMatter = matters.find((m) => m.id === activeMatterId);
    if (!parentMatter) return;

    setIsAnalyzingMultiDoc(true);
    try {
      const res = await MatterService.runMultiDocumentAnalysis(
        parentMatter,
        documents,
        modelMode,
        isDemoMode
      );

      // Refresh all intelligence collections
      const [refreshedTimeline, refreshedIssues, refreshedRels, refreshedFacts, refreshedContras, refreshedMissing] =
        await Promise.all([
          MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode),
          MatterService.getIssues(activeMatterId, userId, isDemoMode),
          MatterService.getRelationships(activeMatterId, isDemoMode),
          MatterService.getMatterFacts(activeMatterId, isDemoMode),
          MatterService.getContradictions(activeMatterId, isDemoMode),
          MatterService.getMissingInformation(activeMatterId, isDemoMode),
        ]);

      setTimelineEvents(refreshedTimeline);
      setIssues(refreshedIssues);
      setRelationships(refreshedRels);
      setFacts(refreshedFacts);
      setContradictions(refreshedContras);
      setMissingInfo(refreshedMissing);

      return res;
    } catch (err: any) {
      console.error("Multi-doc intelligence error:", err);
      alert("Multi-document intelligence failed: " + err.message);
    } finally {
      setIsAnalyzingMultiDoc(false);
    }
  };

  // Date Conflict Resolution
  const handleResolveDateConflict = async (eventId: string, resolvedDate: string, notes: string) => {
    await MatterService.resolveDateConflict(eventId, resolvedDate, notes, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode);
      setTimelineEvents(list);
    }
  };

  // Trigger Matter Overview Synthesis
  const handleTriggerMatterSynthesis = async (modelMode: "pro" | "flash" | "lite") => {
    if (!activeMatterId) return;
    const parentMatter = matters.find((m) => m.id === activeMatterId);
    if (!parentMatter) return;

    setIsSynthesizing(true);
    try {
      const summary = await MatterService.synthesizeMatterOverview(
        parentMatter,
        documents,
        modelMode
      );
      setSynthesizedOverview(summary);
    } catch (err: any) {
      console.error("Overview synthesis error:", err);
      alert("Synthesis failed: " + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Interactive AI Workspace Query with Selective Context Retrieval & SSE Streaming
  const handleStopStreaming = () => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    setIsAiStreaming(false);
    setIsAiThinking(false);
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.status === "streaming" ? { ...msg, status: "stopped" as const } : msg
      )
    );
  };

  const handleClearChat = async () => {
    if (!activeMatterId) return;
    await MatterService.clearMatterAiConversation(activeMatterId, isDemoMode);
    setChatMessages([]);
  };

  const handleSendChatMessage = async (
    query: string,
    modelMode: "pro" | "flash" | "lite"
  ) => {
    if (!activeMatterId) return;
    const parentMatter = matters.find((m) => m.id === activeMatterId);
    if (!parentMatter) return;

    // Stop any existing stream
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    streamAbortControllerRef.current = abortController;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    const aiMsgId = `msg-${Date.now()}-ai`;
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      modelUsed:
        modelMode === "pro"
          ? "Gemini 3.1 Pro"
          : modelMode === "lite"
          ? "Gemini 3.1 Flash Lite"
          : "Gemini 3.8 Flash",
      status: "streaming",
      sources: [],
      citations: [],
    };

    const updatedWithUser = [...chatMessages, userMsg];
    setChatMessages([...updatedWithUser, initialAiMsg]);
    setIsAiThinking(true);
    setIsAiStreaming(true);

    const historyForAi = updatedWithUser.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let accumulatedContent = "";

    try {
      await MatterService.streamMatterIntelligence(
        parentMatter,
        documents,
        historyForAi,
        query,
        modelMode,
        facts,
        timelineEvents,
        issues,
        deadlines,
        contradictions,
        relationships,
        missingInfo,
        tasks,
        notes,
        evidence,
        (event) => {
          if (event.type === "metadata") {
            setIsAiThinking(false);
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === aiMsgId) {
                  return {
                    ...msg,
                    queryType: event.data?.queryType,
                    isFastPath: event.data?.isFastPath,
                    sources: event.data?.sources || msg.sources,
                    latencyMetrics: event.data?.latencyMetrics || msg.latencyMetrics,
                  };
                }
                return msg;
              })
            );
          } else if (event.type === "delta") {
            setIsAiThinking(false);
            accumulatedContent += event.data?.text || "";
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === aiMsgId) {
                  return {
                    ...msg,
                    content: accumulatedContent,
                    status: "streaming" as const,
                  };
                }
                return msg;
              })
            );
          } else if (event.type === "done") {
            setIsAiThinking(false);
            setIsAiStreaming(false);
            setChatMessages((prev) => {
              const next = prev.map((msg) => {
                if (msg.id === aiMsgId) {
                  return {
                    ...msg,
                    content: accumulatedContent || msg.content,
                    status: "completed" as const,
                    citations: event.data?.citations || msg.citations,
                    sources: event.data?.sources || msg.sources,
                    latencyMetrics: event.data?.latencyMetrics || msg.latencyMetrics,
                  };
                }
                return msg;
              });
              // Persist conversation
              MatterService.saveMatterAiConversation(activeMatterId, next, isDemoMode);
              return next;
            });

            // Log activity
            MatterService.recordActivity(
              {
                id: "act_" + Math.random().toString(36).substring(2, 10),
                matterId: parentMatter.id,
                matterName: parentMatter.matterName,
                ownerId: parentMatter.ownerId || userId,
                userEmail: currentUser?.email || "counsel@matteros.ai",
                action: "AI Matter Inquiry Executed",
                details: `Inquiry: "${query.slice(0, 80)}..." [Model: ${modelMode}, Type: ${
                  event.data?.queryType || "Grounded"
                }]`,
                timestamp: new Date().toISOString(),
              },
              isDemoMode
            );
          } else if (event.type === "error") {
            setIsAiThinking(false);
            setIsAiStreaming(false);
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      status: "error" as const,
                      content: accumulatedContent
                        ? accumulatedContent +
                          `\n\n[Intelligence Stream Interrupted: ${
                            event.data?.message || "Stream error"
                          }]`
                        : `Error generating intelligence response: ${
                            event.data?.message || "Inquiry failed"
                          }`,
                    }
                  : msg
              )
            );
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      if (abortController.signal.aborted) {
        // Stopped by user
        setChatMessages((prev) => {
          const next = prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  status: "stopped" as const,
                  content: accumulatedContent || "[Generation stopped by counsel]",
                }
              : msg
          );
          MatterService.saveMatterAiConversation(activeMatterId, next, isDemoMode);
          return next;
        });
        return;
      }

      console.warn("Streaming chat failed, attempting non-streaming fallback:", err);
      // Fallback to standard askMatterIntelligence
      try {
        const fallbackRes = await MatterService.askMatterIntelligence(
          parentMatter,
          documents,
          historyForAi,
          query,
          modelMode,
          facts,
          timelineEvents,
          contradictions,
          relationships,
          issues,
          deadlines,
          missingInfo
        );

        setChatMessages((prev) => {
          const next = prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: fallbackRes.answer,
                  citations: fallbackRes.citations || [],
                  sources: fallbackRes.sources || [],
                  queryType: fallbackRes.queryType,
                  isFastPath: fallbackRes.isFastPath,
                  latencyMetrics: fallbackRes.latencyMetrics,
                  status: "completed" as const,
                  modelUsed: fallbackRes.modelUsed,
                }
              : msg
          );
          MatterService.saveMatterAiConversation(activeMatterId, next, isDemoMode);
          return next;
        });
      } catch (fallbackErr: any) {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  status: "error" as const,
                  content: `Error generating intelligence response: ${
                    fallbackErr.message || err.message
                  }`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsAiThinking(false);
      setIsAiStreaming(false);
      streamAbortControllerRef.current = null;
    }
  };

  // Timeline Handlers
  const handleAddTimelineEvent = async (ev: Omit<TimelineEvent, "id">) => {
    await MatterService.addTimelineEvent(ev, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode);
      setTimelineEvents(list);
    }
  };

  const handleUpdateTimelineEvent = async (id: string, updates: Partial<TimelineEvent>) => {
    await MatterService.updateTimelineEvent(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode);
      setTimelineEvents(list);
    }
  };

  const handleDeleteTimelineEvent = async (id: string) => {
    await MatterService.deleteTimelineEvent(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTimelineEvents(activeMatterId, userId, isDemoMode);
      setTimelineEvents(list);
    }
  };

  // Issues Handlers
  const handleAddIssue = async (iss: Omit<Issue, "id">) => {
    await MatterService.addIssue(iss, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getIssues(activeMatterId, userId, isDemoMode);
      setIssues(list);
    }
  };

  const handleUpdateIssue = async (id: string, updates: Partial<Issue>) => {
    await MatterService.updateIssue(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getIssues(activeMatterId, userId, isDemoMode);
      setIssues(list);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    await MatterService.deleteIssue(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getIssues(activeMatterId, userId, isDemoMode);
      setIssues(list);
    }
  };

  // Evidence Handlers
  const handleAddEvidence = async (ev: Omit<EvidenceItem, "id">) => {
    await MatterService.addEvidence(ev, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getEvidence(activeMatterId, userId, isDemoMode);
      setEvidence(list);
    }
  };

  // Relationships Handlers
  const handleAddRelationship = async (rel: Omit<MatterRelationship, "id">) => {
    await MatterService.addRelationship(rel, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getRelationships(activeMatterId, isDemoMode);
      setRelationships(list);
    }
  };

  const handleUpdateRelationship = async (id: string, updates: Partial<MatterRelationship>) => {
    await MatterService.updateRelationship(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getRelationships(activeMatterId, isDemoMode);
      setRelationships(list);
    }
  };

  const handleDeleteRelationship = async (id: string) => {
    await MatterService.deleteRelationship(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getRelationships(activeMatterId, isDemoMode);
      setRelationships(list);
    }
  };

  // Facts Handlers
  const handleAddFact = async (fact: Omit<MatterFact, "id">) => {
    await MatterService.addMatterFact(fact, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getMatterFacts(activeMatterId, isDemoMode);
      setFacts(list);
    }
  };

  const handleUpdateFact = async (id: string, updates: Partial<MatterFact>) => {
    await MatterService.updateMatterFact(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getMatterFacts(activeMatterId, isDemoMode);
      setFacts(list);
    }
  };

  const handleDeleteFact = async (id: string) => {
    await MatterService.deleteMatterFact(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getMatterFacts(activeMatterId, isDemoMode);
      setFacts(list);
    }
  };

  // Contradictions Handlers
  const handleAddContradiction = async (contra: Omit<MatterContradiction, "id">) => {
    await MatterService.addContradiction(contra, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getContradictions(activeMatterId, isDemoMode);
      setContradictions(list);
    }
  };

  const handleUpdateContradiction = async (id: string, updates: Partial<MatterContradiction>) => {
    await MatterService.updateContradiction(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getContradictions(activeMatterId, isDemoMode);
      setContradictions(list);
    }
  };

  // Missing Information Handlers
  const handleAddMissingInfo = async (info: Omit<MatterMissingInfo, "id">) => {
    await MatterService.addMissingInformation(info, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getMissingInformation(activeMatterId, isDemoMode);
      setMissingInfo(list);
    }
  };

  const handleUpdateMissingInfo = async (id: string, updates: Partial<MatterMissingInfo>) => {
    await MatterService.updateMissingInformation(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getMissingInformation(activeMatterId, isDemoMode);
      setMissingInfo(list);
    }
  };

  // Deadlines Handlers
  const handleAddDeadline = async (dl: Omit<Deadline, "id">) => {
    await MatterService.addDeadline(dl, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getDeadlines(activeMatterId, userId, isDemoMode);
      setDeadlines(list);
    }
  };

  const handleUpdateDeadline = async (id: string, updates: Partial<Deadline>) => {
    await MatterService.updateDeadline(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getDeadlines(activeMatterId, userId, isDemoMode);
      setDeadlines(list);
    } else {
      const all = await MatterService.getAllDeadlines(userId, isDemoMode);
      setDeadlines(all);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    await MatterService.deleteDeadline(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getDeadlines(activeMatterId, userId, isDemoMode);
      setDeadlines(list);
    } else {
      const all = await MatterService.getAllDeadlines(userId, isDemoMode);
      setDeadlines(all);
    }
  };

  const handleConfirmDeadline = async (id: string, customDate?: string) => {
    await MatterService.confirmDeadline(id, customDate, "Counsel", isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getDeadlines(activeMatterId, userId, isDemoMode);
      setDeadlines(list);
    }
  };

  const handleDismissDeadline = async (id: string) => {
    await MatterService.dismissDeadline(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getDeadlines(activeMatterId, userId, isDemoMode);
      setDeadlines(list);
    }
  };

  // Tasks Handlers
  const handleAddTask = async (task: Omit<Task, "id">) => {
    await MatterService.addTask(task, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTasks(activeMatterId, userId, isDemoMode);
      setTasks(list);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await MatterService.updateTask(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTasks(activeMatterId, userId, isDemoMode);
      setTasks(list);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await MatterService.deleteTask(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTasks(activeMatterId, userId, isDemoMode);
      setTasks(list);
    }
  };

  const handleConfirmAiTask = async (id: string) => {
    await MatterService.confirmAiTask(id, "Counsel", isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getTasks(activeMatterId, userId, isDemoMode);
      setTasks(list);
    }
  };

  // Notes Handlers
  const handleAddNote = async (note: Omit<MatterNote, "id">) => {
    await MatterService.addNote(note, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getNotes(activeMatterId, userId, isDemoMode);
      setNotes(list);
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<MatterNote>) => {
    await MatterService.updateNote(id, updates, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getNotes(activeMatterId, userId, isDemoMode);
      setNotes(list);
    }
  };

  const handleDeleteNote = async (id: string) => {
    await MatterService.deleteNote(id, isDemoMode);
    if (activeMatterId) {
      const list = await MatterService.getNotes(activeMatterId, userId, isDemoMode);
      setNotes(list);
    }
  };

  // Matter Status Lifecycle Handlers
  const handleCloseMatter = async (matterId: string, reason?: string) => {
    const parentMatter = matters.find((m) => m.id === matterId);
    await MatterService.closeMatter(matterId, currentUser?.displayName || "Lead Counsel", reason, isDemoMode);
    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "matter.closed",
        entityType: "matter",
        entityId: matterId,
        matterId,
        matterName: parentMatter?.matterName,
        details: `Matter marked closed. Disposition reason: "${reason || "No disposition notes provided"}".`,
      },
      isDemoMode
    );
    const updated = await MatterService.getMatters(userId, isDemoMode, currentOrg?.id);
    setMatters(updated);
  };

  const handleReopenMatter = async (matterId: string) => {
    const parentMatter = matters.find((m) => m.id === matterId);
    await MatterService.reopenMatter(matterId, currentUser?.displayName || "Lead Counsel", isDemoMode);
    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "matter.reopened",
        entityType: "matter",
        entityId: matterId,
        matterId,
        matterName: parentMatter?.matterName,
        details: `Matter returned to active litigation docket.`,
      },
      isDemoMode
    );
    const updated = await MatterService.getMatters(userId, isDemoMode, currentOrg?.id);
    setMatters(updated);
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    const targetDoc = documents.find((d) => d.id === docId);
    const parentMatter = matters.find((m) => m.id === activeMatterId);
    await MatterService.deleteDocument(docId, isDemoMode);
    await OrganizationService.logAudit(
      {
        organizationId: currentOrg?.id || "demo-org-1",
        userId,
        userName: currentUser?.displayName || "Counsel",
        userEmail: currentUser?.email || "counsel@firm.law",
        userRole: currentRole,
        action: "document.deleted",
        entityType: "document",
        entityId: docId,
        matterId: activeMatterId || undefined,
        matterName: parentMatter?.matterName,
        details: `Deleted case document: ${targetDoc?.filename || docId}.`,
      },
      isDemoMode
    );
    if (activeMatterId) {
      const list = await MatterService.getDocuments(activeMatterId, userId, isDemoMode);
      setDocuments(list);
    }
  };

  // Seed sample data
  const handleSeedDemoData = async () => {
    await MatterService.seedDemoData(userId);
    await loadData();
  };

  const activeMatter = matters.find((m) => m.id === activeMatterId);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Sidebar */}
      <Sidebar
        currentNav={currentNav}
        setCurrentNav={(nav: NavItem) => {
          if (nav !== "matter-workspace") {
            setActiveMatterId(null);
          }
          setCurrentNav(nav);
        }}
        activeMatterId={activeMatterId}
        activeMatterName={activeMatter?.matterName}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          currentNav={currentNav}
          activeMatterName={activeMatter?.matterName}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenNewMatter={() => setIsNewMatterOpen(true)}
          unreadActivitiesCount={activities.length}
        />

        {/* Content Views */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
          {currentNav === "dashboard" && (
            <DashboardView
              matters={matters}
              documents={documents}
              deadlines={deadlines}
              activities={activities}
              onOpenMatter={handleOpenMatter}
              onNewMatter={() => setIsNewMatterOpen(true)}
              onViewAllDeadlines={() => setCurrentNav("deadlines")}
              onSeedDemoData={handleSeedDemoData}
            />
          )}

          {currentNav === "matters" && (
            <MattersListView
              matters={matters}
              documents={documents}
              deadlines={deadlines}
              onOpenMatter={handleOpenMatter}
              onNewMatter={() => setIsNewMatterOpen(true)}
              onArchiveMatter={handleArchiveMatter}
            />
          )}

          {currentNav === "matter-workspace" && activeMatter && (
            <MatterWorkspace
              matter={activeMatter}
              documents={documents}
              timelineEvents={timelineEvents}
              issues={issues}
              evidence={evidence}
              deadlines={deadlines}
              tasks={tasks}
              notes={notes}
              chatMessages={chatMessages}
              relationships={relationships}
              facts={facts}
              contradictions={contradictions}
              missingInfo={missingInfo}
              onBackToMatters={handleBackToMatters}
              onUploadDocument={handleUploadDocument}
              onTriggerDocumentAnalysis={handleTriggerDocumentAnalysis}
              onDeleteDocument={handleDeleteDocument}
              onAddTimelineEvent={handleAddTimelineEvent}
              onUpdateTimelineEvent={handleUpdateTimelineEvent}
              onDeleteTimelineEvent={handleDeleteTimelineEvent}
              onAddIssue={handleAddIssue}
              onUpdateIssue={handleUpdateIssue}
              onDeleteIssue={handleDeleteIssue}
              onAddEvidence={handleAddEvidence}
              onAddDeadline={handleAddDeadline}
              onUpdateDeadline={handleUpdateDeadline}
              onDeleteDeadline={handleDeleteDeadline}
              onConfirmDeadline={handleConfirmDeadline}
              onDismissDeadline={handleDismissDeadline}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onConfirmAiTask={handleConfirmAiTask}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onCloseMatter={handleCloseMatter}
              onReopenMatter={handleReopenMatter}
              onSendChatMessage={handleSendChatMessage}
              onStopStreaming={handleStopStreaming}
              isAiStreaming={isAiStreaming}
              isAiThinking={isAiThinking}
              onClearChat={handleClearChat}
              onTriggerMatterSynthesis={handleTriggerMatterSynthesis}
              isSynthesizing={isSynthesizing}
              synthesizedOverview={synthesizedOverview}
              onArchiveMatter={handleArchiveMatter}
              onAddSampleDoc={handleAddSampleDoc}
              onRunMultiDocAnalysis={handleRunMultiDocAnalysis}
              isAnalyzingMultiDoc={isAnalyzingMultiDoc}
              onResolveDateConflict={handleResolveDateConflict}
              onAddRelationship={handleAddRelationship}
              onUpdateRelationship={handleUpdateRelationship}
              onDeleteRelationship={handleDeleteRelationship}
              onAddFact={handleAddFact}
              onUpdateFact={handleUpdateFact}
              onDeleteFact={handleDeleteFact}
              onAddContradiction={handleAddContradiction}
              onUpdateContradiction={handleUpdateContradiction}
              onAddMissingInfo={handleAddMissingInfo}
              onUpdateMissingInfo={handleUpdateMissingInfo}
              activities={activities}
              onAssignTeamMember={handleAssignTeamMember}
              onRemoveTeamMember={handleRemoveTeamMember}
              onSetLeadAttorney={handleSetLeadAttorney}
            />
          )}

          {currentNav === "deadlines" && (
            <GlobalDeadlinesView
              deadlines={deadlines}
              matters={matters}
              onOpenMatter={handleOpenMatter}
              onUpdateDeadline={handleUpdateDeadline}
            />
          )}

          {currentNav === "team" && (
            <TeamManagementView />
          )}

          {currentNav === "audit" && (
            <AuditLogView />
          )}

          {currentNav === "settings" && (
            <SettingsView onSeedDemoData={handleSeedDemoData} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        matters={matters}
        documents={documents}
        timelineEvents={timelineEvents}
        issues={issues}
        evidence={evidence}
        tasks={tasks}
        notes={notes}
        deadlines={deadlines}
        onSelectMatter={handleOpenMatter}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        activities={activities}
        onSelectMatter={handleOpenMatter}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <NewMatterModal
        isOpen={isNewMatterOpen}
        onClose={() => setIsNewMatterOpen(false)}
        onCreateMatter={handleCreateMatter}
        userId={userId}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
