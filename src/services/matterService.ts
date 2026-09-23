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
  Matter,
  DocumentItem,
  DocumentAnalysis,
  TimelineEvent,
  Issue,
  EvidenceItem,
  Deadline,
  ActivityItem,
  MatterRelationship,
  MatterFact,
  MatterContradiction,
  MatterMissingInfo,
  ChatMessage,
  MatterAiSummary,
  Task,
  MatterNote,
} from "../types/matteros.ts";
import {
  DEMO_MATTERS,
  DEMO_DOCUMENTS,
  DEMO_TIMELINE,
  DEMO_ISSUES,
  DEMO_DEADLINES,
  DEMO_EVIDENCE,
  DEMO_ACTIVITIES,
  DEMO_RELATIONSHIPS,
  DEMO_FACTS,
  DEMO_CONTRADICTIONS,
  DEMO_MISSING_INFO,
  DEMO_TASKS,
  DEMO_NOTES,
} from "../data/demoData.ts";

export class MatterService {
  private static demoRelationships: MatterRelationship[] = [...DEMO_RELATIONSHIPS];
  private static demoFacts: MatterFact[] = [...DEMO_FACTS];
  private static demoContradictions: MatterContradiction[] = [...DEMO_CONTRADICTIONS];
  private static demoMissingInfo: MatterMissingInfo[] = [...DEMO_MISSING_INFO];
  private static demoTasks: Task[] = [...DEMO_TASKS];
  private static demoNotes: MatterNote[] = [...DEMO_NOTES];
  private static demoConversations: Record<string, ChatMessage[]> = {
    "demo-matter-1": [
      {
        id: "msg_init_1",
        role: "user",
        content: "Summarize this matter.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg_init_2",
        role: "assistant",
        content: `### Executive Case Brief: Apex Engineering Solutions v. Vertex Construction Ltd.
**Matter Number:** \`LIT-2024-089\` | **Jurisdiction:** High Court of Justice, Commercial Division

#### 1. Claim & Exposure Overview
The dispute arises under the Master Engineering & Construction Contract (dated **14 Jan 2024**). Client **Apex Engineering Solutions** asserts a liquidated claim of **$4,250,000** for contract balance and delay compensation. Adverse party **Vertex Construction Ltd.** has counterclaimed **$6,100,000**, asserting defective turbine foundation specifications and unauthorized steel alloy substitutions.

#### 2. Authoritative Document Facts
- **Contractual Precedent:** Section 18.2 of the Construction Agreement mandates written notice within **10 business days** of any alleged unforeseen site conditions (*Construction Contract.pdf, p. 14*).
- **Independent Finding:** The independent technical audit confirms Foundation Block B structural load ratings satisfied ISO-10816 standards (*Independent Structural Inspection.pdf, p. 8*).
- **Force Majeure Notice:** Vertex served a formal notice on **18 April 2024** claiming extraordinary supply disruptions (*Notice of Force Majeure.pdf, p. 2*).

#### 3. Key Inconsistencies & Contradictions Flagged
1. **Notice Delivery Date:** Vertex's Defence asserts written notice was dispatched on **12 April 2024**, whereas internal shipping courier manifests indicate initial transmittal on **22 April 2024**.
2. **Material Substitution:** Vertex alleges Apex failed to disclose grade alterations; however, Project Meeting Minutes #14 demonstrate Vertex's Resident Engineer countersigned the approval slip.

#### 4. Open Discovery Gaps
- Schedule 4-C (Raw Material Certifications) referenced in Section 8.4 has not been produced by the defense.`,
        timestamp: new Date(Date.now() - 3590000).toISOString(),
        queryType: "matter_summary",
        modelUsed: "gemini-3.8-flash",
        status: "completed",
        sources: [
          {
            title: "Master EPC Agreement",
            documentName: "Construction Contract.pdf",
            page: "14",
            section: "18.2",
            quote: "Notice must be served within 10 business days of event occurrence.",
            infoType: "document-fact",
          },
          {
            title: "Independent Structural Inspection",
            documentName: "Technical Inspection Report.pdf",
            page: "8",
            quote: "Foundation block compliance verified under ISO-10816.",
            infoType: "document-fact",
          },
          {
            title: "Notice of Force Majeure",
            documentName: "Notice of Force Majeure.pdf",
            page: "2",
            quote: "Notice served invoking supply chain delays.",
            infoType: "document-fact",
          },
        ],
        citations: [
          { documentName: "Construction Contract.pdf", pageOrClause: "p. 14", entityType: "document" },
          { documentName: "Technical Inspection Report.pdf", pageOrClause: "p. 8", entityType: "document" },
          { documentName: "Notice of Force Majeure.pdf", pageOrClause: "p. 2", entityType: "document" },
        ],
        latencyMetrics: {
          requestStarted: Date.now() - 3600000,
          retrievalStarted: Date.now() - 3599900,
          retrievalCompleted: Date.now() - 3599850,
          geminiStarted: Date.now() - 3599800,
          firstTokenReceived: Date.now() - 3599400,
          generationCompleted: Date.now() - 3590000,
          totalLatencyMs: 980,
        },
      },
    ],
  };
  private static demoMatterSummaries: Record<string, MatterAiSummary> = {};
  // --- Matters ---
  static async getMatters(
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true,
    organizationId?: string
  ): Promise<Matter[]> {
    if (isDemo) {
      if (organizationId) {
        return DEMO_MATTERS.filter((m) => !m.organizationId || m.organizationId === organizationId);
      }
      return [...DEMO_MATTERS];
    }

    const path = "matters";
    try {
      let q = query(collection(db, path), where("ownerId", "==", userId));
      if (organizationId) {
        q = query(collection(db, path), where("organizationId", "==", organizationId));
      }
      const snapshot = await getDocs(q);
      const items: Matter[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as any), id: docSnap.id });
      });

      if (items.length === 0) {
        if (organizationId) {
          return DEMO_MATTERS.filter((m) => !m.organizationId || m.organizationId === organizationId);
        }
        return [...DEMO_MATTERS];
      }
      return items;
    } catch (err) {
      console.warn("Firestore getMatters error, falling back to practice cases:", err);
      if (organizationId) {
        return DEMO_MATTERS.filter((m) => !m.organizationId || m.organizationId === organizationId);
      }
      return [...DEMO_MATTERS];
    }
  }

  static async getMatterById(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<Matter | null> {
    if (isDemo || matterId.startsWith("demo-")) {
      const found = DEMO_MATTERS.find((m) => m.id === matterId);
      return found || null;
    }

    const path = `matters/${matterId}`;
    try {
      const snap = await getDoc(doc(db, "matters", matterId));
      if (!snap.exists()) return null;
      const data = snap.data() as Matter;
      return { ...data, id: snap.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  }

  static async createMatter(matter: Omit<Matter, "id">, isDemo: boolean = true): Promise<string> {
    const id = "mat_" + Math.random().toString(36).substring(2, 10);
    const assignedUserIds = matter.assignedUserIds || (matter.ownerId ? [matter.ownerId] : []);
    const newMatter: Matter = {
      ...matter,
      id,
      organizationId: matter.organizationId || "demo-org-1",
      assignedUserIds,
      teamMembers: matter.teamMembers || [
        {
          userId: matter.ownerId || "demo-user",
          userName: matter.leadAttorney || "Counsel",
          userEmail: "counsel@firm.law",
          role: "admin",
          assignedAt: new Date().toISOString(),
          canEdit: true,
        },
      ],
    };

    if (isDemo) {
      DEMO_MATTERS.unshift(newMatter);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId: id,
        matterName: newMatter.matterName,
        ownerId: newMatter.ownerId,
        userEmail: "counsel@matteros.law",
        action: "Matter Created",
        details: `Matter '${newMatter.matterName}' created with number ${newMatter.matterNumber}.`,
        timestamp: new Date().toISOString(),
      }, true);
      return id;
    }

    const path = `matters/${id}`;
    try {
      await setDoc(doc(db, "matters", id), newMatter);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId: id,
        matterName: newMatter.matterName,
        ownerId: newMatter.ownerId,
        userEmail: "counsel@matteros.law",
        action: "Matter Created",
        details: `Matter '${newMatter.matterName}' created with number ${newMatter.matterNumber}.`,
        timestamp: new Date().toISOString(),
      }, false);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return id;
    }
  }

  static async assignTeamMember(
    matterId: string,
    member: { userId: string; userName: string; userEmail: string; role: any; canEdit?: boolean },
    isDemo: boolean = true
  ): Promise<Matter> {
    const teamMember = {
      ...member,
      assignedAt: new Date().toISOString(),
      canEdit: member.canEdit ?? true,
    };

    if (isDemo || matterId.startsWith("demo-")) {
      const idx = DEMO_MATTERS.findIndex((m) => m.id === matterId);
      if (idx !== -1) {
        const m = DEMO_MATTERS[idx];
        const existingMembers = m.teamMembers || [];
        const filtered = existingMembers.filter((tm) => tm.userId !== member.userId);
        filtered.push(teamMember);
        const assignedIds = Array.from(new Set([...(m.assignedUserIds || []), member.userId]));
        DEMO_MATTERS[idx] = {
          ...m,
          teamMembers: filtered,
          assignedUserIds: assignedIds,
          updatedAt: new Date().toISOString(),
        };
        await this.recordActivity({
          id: "act_" + Date.now(),
          matterId,
          matterName: m.matterName,
          ownerId: m.ownerId,
          userEmail: "admin@firm.law",
          action: "Team Member Assigned",
          details: `Assigned ${member.userName} (${member.role}) to matter team.`,
          timestamp: new Date().toISOString(),
        }, true);
        return DEMO_MATTERS[idx];
      }
      throw new Error("Matter not found");
    }

    try {
      const docRef = doc(db, "matters", matterId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Matter not found");
      const current = snap.data() as Matter;
      const currentMembers = current.teamMembers || [];
      const updatedMembers = [...currentMembers.filter((tm) => tm.userId !== member.userId), teamMember];
      const assignedIds = Array.from(new Set([...(current.assignedUserIds || []), member.userId]));

      await updateDoc(docRef, {
        teamMembers: updatedMembers,
        assignedUserIds: assignedIds,
        updatedAt: new Date().toISOString(),
      });
      return { ...current, teamMembers: updatedMembers, assignedUserIds: assignedIds };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `matters/${matterId}`);
      throw e;
    }
  }

  static async removeTeamMember(
    matterId: string,
    userId: string,
    isDemo: boolean = true
  ): Promise<Matter> {
    if (isDemo || matterId.startsWith("demo-")) {
      const idx = DEMO_MATTERS.findIndex((m) => m.id === matterId);
      if (idx !== -1) {
        const m = DEMO_MATTERS[idx];
        const updatedMembers = (m.teamMembers || []).filter((tm) => tm.userId !== userId);
        const assignedIds = (m.assignedUserIds || []).filter((id) => id !== userId);
        DEMO_MATTERS[idx] = {
          ...m,
          teamMembers: updatedMembers,
          assignedUserIds: assignedIds,
          updatedAt: new Date().toISOString(),
        };
        await this.recordActivity({
          id: "act_" + Date.now(),
          matterId,
          matterName: m.matterName,
          ownerId: m.ownerId,
          userEmail: "admin@firm.law",
          action: "Team Member Removed",
          details: `Removed counsel from matter team.`,
          timestamp: new Date().toISOString(),
        }, true);
        return DEMO_MATTERS[idx];
      }
      throw new Error("Matter not found");
    }

    try {
      const docRef = doc(db, "matters", matterId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Matter not found");
      const current = snap.data() as Matter;
      const updatedMembers = (current.teamMembers || []).filter((tm) => tm.userId !== userId);
      const assignedIds = (current.assignedUserIds || []).filter((id) => id !== userId);

      await updateDoc(docRef, {
        teamMembers: updatedMembers,
        assignedUserIds: assignedIds,
        updatedAt: new Date().toISOString(),
      });
      return { ...current, teamMembers: updatedMembers, assignedUserIds: assignedIds };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `matters/${matterId}`);
      throw e;
    }
  }

  static async setLeadAttorney(
    matterId: string,
    leadAttorneyId: string,
    leadAttorneyName: string,
    isDemo: boolean = true
  ): Promise<Matter> {
    if (isDemo || matterId.startsWith("demo-")) {
      const idx = DEMO_MATTERS.findIndex((m) => m.id === matterId);
      if (idx !== -1) {
        const m = DEMO_MATTERS[idx];
        const assignedIds = Array.from(new Set([...(m.assignedUserIds || []), leadAttorneyId]));
        DEMO_MATTERS[idx] = {
          ...m,
          leadAttorney: leadAttorneyName,
          leadAttorneyId,
          assignedUserIds: assignedIds,
          updatedAt: new Date().toISOString(),
        };
        return DEMO_MATTERS[idx];
      }
      throw new Error("Matter not found");
    }

    try {
      const docRef = doc(db, "matters", matterId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Matter not found");
      const current = snap.data() as Matter;
      const assignedIds = Array.from(new Set([...(current.assignedUserIds || []), leadAttorneyId]));
      await updateDoc(docRef, {
        leadAttorney: leadAttorneyName,
        leadAttorneyId,
        assignedUserIds: assignedIds,
        updatedAt: new Date().toISOString(),
      });
      return { ...current, leadAttorney: leadAttorneyName, leadAttorneyId, assignedUserIds: assignedIds };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `matters/${matterId}`);
      throw e;
    }
  }

  static async updateMatter(matterId: string, updates: Partial<Matter>, isDemo: boolean = true): Promise<void> {
    if (isDemo || matterId.startsWith("demo-")) {
      const index = DEMO_MATTERS.findIndex((m) => m.id === matterId);
      if (index !== -1) {
        DEMO_MATTERS[index] = { ...DEMO_MATTERS[index], ...updates, updatedAt: new Date().toISOString() };
      }
      return;
    }

    const path = `matters/${matterId}`;
    try {
      await updateDoc(doc(db, "matters", matterId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  // --- Documents ---
  static async getDocuments(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<DocumentItem[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return DEMO_DOCUMENTS.filter((d) => d.matterId === matterId);
    }

    const path = "documents";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: DocumentItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items;
    } catch (err) {
      console.warn("Firestore getDocuments error:", err);
      return DEMO_DOCUMENTS.filter((d) => d.matterId === matterId);
    }
  }

  static async uploadDocument(
    matterId: string,
    userId: string,
    docData: Omit<DocumentItem, "id" | "matterId" | "ownerId">,
    isDemo: boolean = true
  ): Promise<DocumentItem> {
    const id = "doc_" + Math.random().toString(36).substring(2, 10);
    const newDoc: DocumentItem = {
      ...docData,
      id,
      matterId,
      ownerId: userId,
    };

    if (isDemo || matterId.startsWith("demo-")) {
      DEMO_DOCUMENTS.unshift(newDoc);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId,
        ownerId: userId,
        userEmail: docData.uploadedBy || "counsel@matteros.law",
        action: "Document Uploaded",
        details: `Uploaded '${docData.filename}' (${docData.category}).`,
        timestamp: new Date().toISOString(),
      }, true);
      return newDoc;
    }

    const path = `documents/${id}`;
    try {
      await setDoc(doc(db, "documents", id), newDoc);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId,
        ownerId: userId,
        userEmail: docData.uploadedBy || "counsel@matteros.law",
        action: "Document Uploaded",
        details: `Uploaded '${docData.filename}' (${docData.category}).`,
        timestamp: new Date().toISOString(),
      }, false);
      return newDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return newDoc;
    }
  }

  static async saveDocument(docItem: DocumentItem, isDemo: boolean = true): Promise<DocumentItem> {
    if (isDemo || docItem.matterId.startsWith("demo-")) {
      DEMO_DOCUMENTS.unshift(docItem);
      return docItem;
    }

    const path = `documents/${docItem.id}`;
    try {
      await setDoc(doc(db, "documents", docItem.id), docItem);
      return docItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return docItem;
    }
  }

  static async deleteDocument(docId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || docId.startsWith("demo-")) {
      const idx = DEMO_DOCUMENTS.findIndex((d) => d.id === docId);
      if (idx !== -1) DEMO_DOCUMENTS.splice(idx, 1);
      return;
    }

    const path = `documents/${docId}`;
    try {
      await deleteDoc(doc(db, "documents", docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Document Intelligence & Gemini Processing ---
  static async analyzeDocumentWithGemini(
    document: DocumentItem,
    matterNameOrContext: string | { matterName: string; matterType?: string; client?: string; court?: string },
    modelMode: "pro" | "flash" | "lite" = "flash"
  ): Promise<DocumentAnalysis> {
    const matterContext = typeof matterNameOrContext === "string"
      ? { matterName: matterNameOrContext, matterType: "Commercial Litigation", client: "Represented Client" }
      : matterNameOrContext;

    // Call server-side API proxy
    const response = await fetch("/api/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentText: document.extractedText || document.contentSummary || document.filename,
        filename: document.filename,
        matterContext,
        modelMode,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server analysis failed with status ${response.status}`);
    }

    const result = await response.json();

    const analysis: DocumentAnalysis = {
      id: "ana_" + Math.random().toString(36).substring(2, 10),
      documentId: document.id,
      matterId: document.matterId,
      ownerId: document.ownerId,
      documentSummary: result.documentSummary || "Analysis completed.",
      documentType: result.documentType || document.category,
      parties: result.parties || [],
      keyFacts: result.keyFacts || [],
      events: result.events || [],
      issues: result.issues || [],
      peopleAndOrgs: result.peopleAndOrgs || [],
      obligations: result.obligations || [],
      importantDates: result.importantDates || [],
      references: result.references || [],
      missingInformation: result.missingInformation || [],
      modelUsed: modelMode === "pro" ? "Gemini 3.1 Pro (High Thinking)" : modelMode === "lite" ? "Gemini 3.1 Flash Lite" : "Gemini 3.5 Flash",
      analyzedAt: new Date().toISOString(),
    };

    // Update document status
    document.aiAnalysisStatus = "Completed";
    document.processingStatus = "Analyzed";
    document.contentSummary = analysis.documentSummary;

    // Save to Firestore or Demo
    if (!document.matterId.startsWith("demo-")) {
      try {
        await updateDoc(doc(db, "documents", document.id), {
          aiAnalysisStatus: "Completed",
          processingStatus: "Analyzed",
          contentSummary: analysis.documentSummary,
        });
      } catch (e) {
        console.warn("Failed to persist analysis to firestore:", e);
      }
    }

    // Record activity
    await this.recordActivity({
      id: "act_" + Date.now(),
      matterId: document.matterId,
      ownerId: document.ownerId,
      userEmail: "counsel@matteros.law",
      action: "AI Analysis Completed",
      details: `Gemini analyzed ${document.filename} (${analysis.modelUsed}). Extracted ${analysis.keyFacts.length} facts, ${analysis.events.length} timeline milestones, and ${analysis.issues.length} potential issues.`,
      timestamp: new Date().toISOString(),
    }, document.matterId.startsWith("demo-"));

    return analysis;
  }

  // --- Synthesize Matter Overview ---
  static async synthesizeMatterOverview(
    matter: Matter,
    documents: DocumentItem[],
    modelMode: "pro" | "flash" | "lite" = "flash"
  ): Promise<string> {
    const response = await fetch("/api/synthesize-overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matter: {
          matterName: matter.matterName,
          matterNumber: matter.matterNumber,
          client: matter.client,
          opposingParty: matter.opposingParty,
          matterType: matter.matterType,
          court: matter.court,
          description: matter.description,
        },
        documents: documents.map((d) => ({
          filename: d.filename,
          category: d.category,
          contentSummary: d.contentSummary,
          extractedText: (d.extractedText || "").slice(0, 15000),
        })),
        modelMode,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Synthesis failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.summary || "Case overview synthesis completed.";
  }

  // --- Ask Matter Intelligence (Grounded Chat) ---
  static async askMatterIntelligence(
    matter: Matter,
    documents: DocumentItem[],
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    queryText: string,
    modelMode: "pro" | "flash" | "lite" = "flash",
    facts?: MatterFact[],
    timeline?: TimelineEvent[],
    contradictions?: MatterContradiction[],
    relationships?: MatterRelationship[],
    issues?: Issue[],
    deadlines?: Deadline[],
    missingInfo?: MatterMissingInfo[],
    tasks?: Task[],
    notes?: MatterNote[],
    evidence?: EvidenceItem[]
  ): Promise<{
    answer: string;
    citations?: any[];
    sources?: any[];
    queryType?: any;
    isFastPath?: boolean;
    latencyMetrics?: any;
    modelUsed?: string;
  }> {
    const response = await fetch("/api/matter-ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: queryText,
        history: conversationHistory,
        modelMode,
        matterContext: {
          matterName: matter.matterName,
          matterNumber: matter.matterNumber,
          client: matter.client,
          opposingParty: matter.opposingParty,
          matterType: matter.matterType,
          court: matter.court,
          status: matter.status,
          priority: matter.priority,
          leadAttorney: matter.leadAttorney,
          documentsSummary: documents.map((d) => ({
            id: d.id,
            filename: d.filename,
            category: d.category,
            summary: d.contentSummary,
            extractedText: (d.extractedText || "").slice(0, 10000),
          })),
          facts: (facts || []).map((f) => ({
            id: f.id,
            fact: f.fact,
            date: f.date,
            confidence: f.confidence,
            extractionType: f.extractionType,
            sourceDocument: f.sourceDocument,
            page: f.page,
            section: f.section,
            lawyerVerified: f.isLawyerConfirmed,
            factSourceType: f.factSourceType,
          })),
          timeline: (timeline || []).map((t) => ({
            id: t.id,
            date: t.date,
            event: t.event,
            description: t.description,
            sourceDocument: t.sourceDocument,
            sourcePage: t.sourcePage,
            sourceSection: t.sourceSection,
            lawyerVerified: t.lawyerVerified,
            hasDateConflict: t.hasDateConflict,
          })),
          issues: (issues || []).map((i) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            status: i.status,
          })),
          deadlines: (deadlines || []).map((dl) => ({
            id: dl.id,
            title: dl.title,
            date: dl.date,
            priority: dl.priority,
            status: dl.status,
            isLawyerConfirmed: dl.isLawyerConfirmed,
          })),
          contradictions: (contradictions || []).map((c) => ({
            id: c.id,
            title: c.title,
            whyFlagged: c.whyFlagged,
            statementA: c.statementA,
            statementB: c.statementB,
            status: c.status,
          })),
          relationships: (relationships || []).map((r) => ({
            id: r.id,
            sourceDocName: r.sourceDocName,
            targetDocName: r.targetDocName,
            relationshipType: r.relationshipType,
            description: r.description,
          })),
          missingInformation: (missingInfo || []).map((m) => ({
            id: m.id,
            item: m.item,
            referencedByDocument: m.referencedByDocument,
            explanation: m.explanation,
            status: m.status,
          })),
          tasks: (tasks || []).map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate,
            assignedTo: t.assignedTo,
            isAiSuggested: t.isAiSuggested,
            confirmedByLawyer: t.confirmedByLawyer,
          })),
          notes: (notes || []).map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            author: n.author,
          })),
          evidence: (evidence || []).map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            status: e.status,
            sourceDocument: e.sourceDocument,
          })),
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Intelligence inquiry failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      answer: data.answer || "No response generated.",
      citations: data.citations || [],
      sources: data.sources || [],
      queryType: data.queryType,
      isFastPath: data.isFastPath,
      latencyMetrics: data.latencyMetrics,
      modelUsed: modelMode === "pro" ? "Gemini 3.1 Pro" : modelMode === "lite" ? "Gemini 3.1 Flash Lite" : "Gemini 3.8 Flash",
    };
  }

  // --- Stream Matter Intelligence (Phase 3 SSE Streaming) ---
  static async streamMatterIntelligence(
    matter: Matter,
    documents: DocumentItem[],
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    queryText: string,
    modelMode: "pro" | "flash" | "lite" = "flash",
    facts: MatterFact[] = [],
    timeline: TimelineEvent[] = [],
    issues: Issue[] = [],
    deadlines: Deadline[] = [],
    contradictions: MatterContradiction[] = [],
    relationships: MatterRelationship[] = [],
    missingInfo: MatterMissingInfo[] = [],
    tasks: Task[] = [],
    notes: MatterNote[] = [],
    evidence: EvidenceItem[] = [],
    onEvent: (event: { type: "metadata" | "delta" | "done" | "error"; data?: any }) => void = () => {},
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch("/api/matter-ai/chat-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: queryText,
        history: conversationHistory,
        modelMode,
        matterContext: {
          matterName: matter.matterName,
          matterNumber: matter.matterNumber,
          client: matter.client,
          opposingParty: matter.opposingParty,
          matterType: matter.matterType,
          court: matter.court,
          status: matter.status,
          priority: matter.priority,
          leadAttorney: matter.leadAttorney,
          documentsSummary: documents.map((d) => ({
            id: d.id,
            filename: d.filename,
            category: d.category,
            summary: d.contentSummary,
            extractedText: (d.extractedText || "").slice(0, 10000),
          })),
          facts: facts.map((f) => ({
            id: f.id,
            fact: f.fact,
            date: f.date,
            confidence: f.confidence,
            extractionType: f.extractionType,
            sourceDocument: f.sourceDocument,
            page: f.page,
            section: f.section,
            lawyerVerified: f.isLawyerConfirmed,
            factSourceType: f.factSourceType,
          })),
          timeline: timeline.map((t) => ({
            id: t.id,
            date: t.date,
            event: t.event,
            description: t.description,
            sourceDocument: t.sourceDocument,
            sourcePage: t.sourcePage,
            sourceSection: t.sourceSection,
            lawyerVerified: t.lawyerVerified,
            hasDateConflict: t.hasDateConflict,
          })),
          issues: issues.map((i) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            status: i.status,
          })),
          deadlines: deadlines.map((dl) => ({
            id: dl.id,
            title: dl.title,
            date: dl.date,
            priority: dl.priority,
            status: dl.status,
            isLawyerConfirmed: dl.isLawyerConfirmed,
          })),
          contradictions: contradictions.map((c) => ({
            id: c.id,
            title: c.title,
            whyFlagged: c.whyFlagged,
            statementA: c.statementA,
            statementB: c.statementB,
            status: c.status,
          })),
          relationships: relationships.map((r) => ({
            id: r.id,
            sourceDocName: r.sourceDocName,
            targetDocName: r.targetDocName,
            relationshipType: r.relationshipType,
            description: r.description,
          })),
          missingInformation: missingInfo.map((m) => ({
            id: m.id,
            item: m.item,
            referencedByDocument: m.referencedByDocument,
            explanation: m.explanation,
            status: m.status,
          })),
          tasks: (tasks || []).map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate,
            assignedTo: t.assignedTo,
            isAiSuggested: t.isAiSuggested,
            confirmedByLawyer: t.confirmedByLawyer,
          })),
          notes: (notes || []).map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            author: n.author,
          })),
          evidence: (evidence || []).map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            status: e.status,
            sourceDocument: e.sourceDocument,
          })),
        },
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to stream intelligence: ${response.statusText || response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              onEvent(parsed);
            } catch (e) {
              console.warn("SSE JSON parse error:", e);
            }
          }
        }
      }
    } catch (err: any) {
      if (signal?.aborted) {
        // Aborted by user
        return;
      }
      throw err;
    }
  }

  // --- Timeline ---
  static async getTimeline(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<TimelineEvent[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return DEMO_TIMELINE.filter((t) => t.matterId === matterId).sort((a, b) => a.date.localeCompare(b.date));
    }

    const path = "timelineEvents";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: TimelineEvent[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.warn("Firestore getTimeline error:", err);
      return DEMO_TIMELINE.filter((t) => t.matterId === matterId).sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  static async getTimelineEvents(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<TimelineEvent[]> {
    return this.getTimeline(matterId, userId, isDemo);
  }

  static async addTimelineEvent(
    event: Omit<TimelineEvent, "id"> | TimelineEvent,
    isDemo: boolean = true
  ): Promise<TimelineEvent> {
    const id = "tl_" + Math.random().toString(36).substring(2, 10);
    const fullEvent: TimelineEvent = {
      ...event,
      id: (event as any).id || id,
    };

    if (isDemo || fullEvent.matterId.startsWith("demo-")) {
      DEMO_TIMELINE.push(fullEvent);
      return fullEvent;
    }

    const path = `timelineEvents/${fullEvent.id}`;
    try {
      await setDoc(doc(db, "timelineEvents", fullEvent.id), fullEvent);
      return fullEvent;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return fullEvent;
    }
  }

  static async updateTimelineEvent(
    eventId: string,
    updates: Partial<TimelineEvent>,
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || eventId.startsWith("demo-")) {
      const idx = DEMO_TIMELINE.findIndex((e) => e.id === eventId);
      if (idx !== -1) DEMO_TIMELINE[idx] = { ...DEMO_TIMELINE[idx], ...updates };
      return;
    }

    const path = `timelineEvents/${eventId}`;
    try {
      await updateDoc(doc(db, "timelineEvents", eventId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  static async deleteTimelineEvent(eventId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || eventId.startsWith("demo-")) {
      const idx = DEMO_TIMELINE.findIndex((e) => e.id === eventId);
      if (idx !== -1) DEMO_TIMELINE.splice(idx, 1);
      return;
    }

    const path = `timelineEvents/${eventId}`;
    try {
      await deleteDoc(doc(db, "timelineEvents", eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Issues ---
  static async getIssues(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<Issue[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return DEMO_ISSUES.filter((i) => i.matterId === matterId);
    }

    const path = "issues";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: Issue[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items;
    } catch (err) {
      console.warn("Firestore getIssues error:", err);
      return DEMO_ISSUES.filter((i) => i.matterId === matterId);
    }
  }

  static async addIssue(
    issue: Omit<Issue, "id"> | Issue,
    isDemo: boolean = true
  ): Promise<Issue> {
    const id = "iss_" + Math.random().toString(36).substring(2, 10);
    const fullIssue: Issue = {
      ...issue,
      id: (issue as any).id || id,
    };

    if (isDemo || fullIssue.matterId.startsWith("demo-")) {
      DEMO_ISSUES.push(fullIssue);
      return fullIssue;
    }

    const path = `issues/${fullIssue.id}`;
    try {
      await setDoc(doc(db, "issues", fullIssue.id), fullIssue);
      return fullIssue;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return fullIssue;
    }
  }

  static async updateIssue(
    issueId: string,
    updates: Partial<Issue>,
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || issueId.startsWith("demo-")) {
      const idx = DEMO_ISSUES.findIndex((i) => i.id === issueId);
      if (idx !== -1) DEMO_ISSUES[idx] = { ...DEMO_ISSUES[idx], ...updates, updatedAt: new Date().toISOString() };
      return;
    }

    const path = `issues/${issueId}`;
    try {
      await updateDoc(doc(db, "issues", issueId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  static async deleteIssue(issueId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || issueId.startsWith("demo-")) {
      const idx = DEMO_ISSUES.findIndex((i) => i.id === issueId);
      if (idx !== -1) DEMO_ISSUES.splice(idx, 1);
      return;
    }

    const path = `issues/${issueId}`;
    try {
      await deleteDoc(doc(db, "issues", issueId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Evidence ---
  static async getEvidence(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<EvidenceItem[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return DEMO_EVIDENCE.filter((e) => e.matterId === matterId);
    }

    const path = "evidence";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: EvidenceItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items;
    } catch (err) {
      console.warn("Firestore getEvidence error:", err);
      return DEMO_EVIDENCE.filter((e) => e.matterId === matterId);
    }
  }

  static async addEvidence(
    evidence: Omit<EvidenceItem, "id"> | EvidenceItem,
    isDemo: boolean = true
  ): Promise<EvidenceItem> {
    const id = "ev_" + Math.random().toString(36).substring(2, 10);
    const fullEv: EvidenceItem = {
      ...evidence,
      id: (evidence as any).id || id,
    };

    if (isDemo || fullEv.matterId.startsWith("demo-")) {
      DEMO_EVIDENCE.push(fullEv);
      return fullEv;
    }

    const path = `evidence/${fullEv.id}`;
    try {
      await setDoc(doc(db, "evidence", fullEv.id), fullEv);
      return fullEv;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return fullEv;
    }
  }

  // --- Deadlines ---
  static async getDeadlines(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<Deadline[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return DEMO_DEADLINES.filter((d) => d.matterId === matterId).sort((a, b) => a.date.localeCompare(b.date));
    }

    const path = "deadlines";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: Deadline[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.warn("Firestore getDeadlines error:", err);
      return DEMO_DEADLINES.filter((d) => d.matterId === matterId).sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  static async getAllDeadlines(
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true,
    organizationId?: string
  ): Promise<Deadline[]> {
    if (isDemo) {
      if (organizationId) {
        return DEMO_DEADLINES.filter((d) => !d.organizationId || d.organizationId === organizationId).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
      }
      return [...DEMO_DEADLINES].sort((a, b) => a.date.localeCompare(b.date));
    }

    const path = "deadlines";
    try {
      let q = query(collection(db, path), where("ownerId", "==", userId));
      if (organizationId) {
        q = query(collection(db, path), where("organizationId", "==", organizationId));
      }
      const snapshot = await getDocs(q);
      const items: Deadline[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      if (items.length === 0) {
        if (organizationId) {
          return DEMO_DEADLINES.filter((d) => !d.organizationId || d.organizationId === organizationId).sort((a, b) =>
            a.date.localeCompare(b.date)
          );
        }
        return [...DEMO_DEADLINES].sort((a, b) => a.date.localeCompare(b.date));
      }
      return items.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.warn("Firestore getAllDeadlines error:", err);
      if (organizationId) {
        return DEMO_DEADLINES.filter((d) => !d.organizationId || d.organizationId === organizationId).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
      }
      return [...DEMO_DEADLINES].sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  static async addDeadline(
    deadline: Omit<Deadline, "id"> | Deadline,
    isDemo: boolean = true
  ): Promise<Deadline> {
    const id = "dl_" + Math.random().toString(36).substring(2, 10);
    const fullDl: Deadline = {
      ...deadline,
      id: (deadline as any).id || id,
    };

    if (isDemo || fullDl.matterId.startsWith("demo-")) {
      DEMO_DEADLINES.push(fullDl);
      return fullDl;
    }

    const path = `deadlines/${fullDl.id}`;
    try {
      await setDoc(doc(db, "deadlines", fullDl.id), fullDl);
      return fullDl;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return fullDl;
    }
  }

  static async updateDeadline(
    deadlineId: string,
    updates: Partial<Deadline>,
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || deadlineId.startsWith("demo-")) {
      const idx = DEMO_DEADLINES.findIndex((d) => d.id === deadlineId);
      if (idx !== -1) DEMO_DEADLINES[idx] = { ...DEMO_DEADLINES[idx], ...updates };
      return;
    }

    const path = `deadlines/${deadlineId}`;
    try {
      await updateDoc(doc(db, "deadlines", deadlineId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  static async deleteDeadline(deadlineId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || deadlineId.startsWith("demo-")) {
      const idx = DEMO_DEADLINES.findIndex((d) => d.id === deadlineId);
      if (idx !== -1) DEMO_DEADLINES.splice(idx, 1);
      return;
    }

    const path = `deadlines/${deadlineId}`;
    try {
      await deleteDoc(doc(db, "deadlines", deadlineId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  static async confirmDeadline(
    deadlineId: string,
    lawyerName: string = "Counsel",
    customDate?: string,
    isDemo: boolean = true
  ): Promise<void> {
    const deadline = (await this.getAllDeadlines("demo-user", isDemo)).find((d) => d.id === deadlineId);
    const updates: Partial<Deadline> = {
      isLawyerConfirmed: true,
      status: "Confirmed",
      confirmedBy: lawyerName,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (customDate && customDate !== deadline?.date) {
      updates.date = customDate;
      updates.lawyerModifiedValue = { originalDate: deadline?.date, newDate: customDate };
    }
    await this.updateDeadline(deadlineId, updates, isDemo);

    await this.recordActivity({
      id: "act_" + Math.random().toString(36).substring(2, 10),
      matterId: deadline?.matterId,
      ownerId: deadline?.ownerId || "demo-user",
      userEmail: lawyerName,
      user: lawyerName,
      action: "Deadline Confirmed",
      entity: "deadline",
      entityId: deadlineId,
      details: `Counsel confirmed deadline: '${deadline?.title}' for ${updates.date || deadline?.date}.`,
      timestamp: new Date().toISOString(),
    }, isDemo);
  }

  static async dismissDeadline(deadlineId: string, isDemo: boolean = true): Promise<void> {
    const deadline = (await this.getAllDeadlines("demo-user", isDemo)).find((d) => d.id === deadlineId);
    await this.updateDeadline(deadlineId, { status: "Dismissed", updatedAt: new Date().toISOString() }, isDemo);
    await this.recordActivity({
      id: "act_" + Math.random().toString(36).substring(2, 10),
      matterId: deadline?.matterId,
      ownerId: deadline?.ownerId || "demo-user",
      userEmail: "counsel@matteros.law",
      action: "Deadline Dismissed",
      entity: "deadline",
      entityId: deadlineId,
      details: `Dismissed suggested deadline: '${deadline?.title}'.`,
      timestamp: new Date().toISOString(),
    }, isDemo);
  }

  // --- Tasks (Phase 4 Workflow) ---
  static async getTasks(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<Task[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return this.demoTasks.filter((t) => t.matterId === matterId).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    }

    const path = "tasks";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: Task[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    } catch (err) {
      console.warn("Firestore getTasks error:", err);
      return this.demoTasks.filter((t) => t.matterId === matterId);
    }
  }

  static async getAllTasks(
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<Task[]> {
    if (isDemo) {
      return [...this.demoTasks].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    }

    const path = "tasks";
    try {
      const q = query(collection(db, path), where("ownerId", "==", userId));
      const snapshot = await getDocs(q);
      const items: Task[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      if (items.length === 0) {
        return [...this.demoTasks];
      }
      return items.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    } catch (err) {
      console.warn("Firestore getAllTasks error:", err);
      return [...this.demoTasks];
    }
  }

  static async addTask(
    task: Omit<Task, "id"> | Task,
    isDemo: boolean = true
  ): Promise<Task> {
    const id = "task_" + Math.random().toString(36).substring(2, 10);
    const fullTask: Task = {
      ...task,
      id: (task as any).id || id,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemo || fullTask.matterId.startsWith("demo-")) {
      this.demoTasks.unshift(fullTask);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId: fullTask.matterId,
        ownerId: fullTask.ownerId,
        userEmail: fullTask.createdBy || "counsel@matteros.law",
        action: fullTask.isAiSuggested ? "AI Task Suggested" : "Task Created",
        entity: "task",
        entityId: fullTask.id,
        details: `Created task: '${fullTask.title}' (Priority: ${fullTask.priority}, Status: ${fullTask.status}).`,
        timestamp: new Date().toISOString(),
      }, true);
      return fullTask;
    }

    const path = `tasks/${fullTask.id}`;
    try {
      await setDoc(doc(db, "tasks", fullTask.id), fullTask);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId: fullTask.matterId,
        ownerId: fullTask.ownerId,
        userEmail: fullTask.createdBy || "counsel@matteros.law",
        action: "Task Created",
        entity: "task",
        entityId: fullTask.id,
        details: `Created task: '${fullTask.title}'.`,
        timestamp: new Date().toISOString(),
      }, false);
      return fullTask;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return fullTask;
    }
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Task>,
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || taskId.startsWith("demo-")) {
      const idx = this.demoTasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        const oldStatus = this.demoTasks[idx].status;
        this.demoTasks[idx] = {
          ...this.demoTasks[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
          ...(updates.status === "Completed" || updates.status === "completed"
            ? { completedAt: new Date().toISOString() }
            : updates.status
            ? { completedAt: undefined }
            : {}),
        };

        if (updates.status && updates.status !== oldStatus) {
          await this.recordActivity({
            id: "act_" + Date.now(),
            matterId: this.demoTasks[idx].matterId,
            ownerId: this.demoTasks[idx].ownerId,
            userEmail: updates.assignedTo || "counsel@matteros.law",
            action: (updates.status === "Completed" || updates.status === "completed") ? "Task Completed" : "Task Status Updated",
            entity: "task",
            entityId: taskId,
            details: `Task '${this.demoTasks[idx].title}' status changed to '${updates.status}'.`,
            timestamp: new Date().toISOString(),
          }, true);
        }
      }
      return;
    }

    const path = `tasks/${taskId}`;
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        ...updates,
        updatedAt: new Date().toISOString(),
        ...(updates.status === "Completed" || updates.status === "completed"
          ? { completedAt: new Date().toISOString() }
          : updates.status
          ? { completedAt: null }
          : {}),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  static async deleteTask(taskId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || taskId.startsWith("demo-")) {
      const idx = this.demoTasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) this.demoTasks.splice(idx, 1);
      return;
    }

    const path = `tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  static async confirmAiTask(taskId: string, lawyerName: string = "Counsel", isDemo: boolean = true): Promise<void> {
    await this.updateTask(taskId, {
      isAiSuggested: false,
      confirmedByLawyer: true,
      confirmedBy: lawyerName,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, isDemo);

    const task = this.demoTasks.find((t) => t.id === taskId);
    await this.recordActivity({
      id: "act_" + Date.now(),
      matterId: task?.matterId,
      ownerId: task?.ownerId || "demo-user",
      userEmail: lawyerName,
      user: lawyerName,
      action: "AI Task Approved",
      entity: "task",
      entityId: taskId,
      details: `Counsel approved AI suggested task: '${task?.title}'.`,
      timestamp: new Date().toISOString(),
    }, isDemo);
  }

  // --- Notes (Phase 4 Workflow) ---
  static async getNotes(
    matterId: string,
    userId: string = "demo-lawyer-user-1",
    isDemo: boolean = true
  ): Promise<MatterNote[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return this.demoNotes.filter((n) => n.matterId === matterId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    const path = "notes";
    try {
      const q = query(
        collection(db, path),
        where("ownerId", "==", userId),
        where("matterId", "==", matterId)
      );
      const snapshot = await getDocs(q);
      const items: MatterNote[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err) {
      console.warn("Firestore getNotes error:", err);
      return this.demoNotes.filter((n) => n.matterId === matterId);
    }
  }

  static async addNote(
    note: Omit<MatterNote, "id"> | MatterNote,
    isDemo: boolean = true
  ): Promise<MatterNote> {
    const id = "note_" + Math.random().toString(36).substring(2, 10);
    const fullNote: MatterNote = {
      ...note,
      id: (note as any).id || id,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemo || fullNote.matterId.startsWith("demo-")) {
      this.demoNotes.unshift(fullNote);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId: fullNote.matterId,
        ownerId: fullNote.ownerId,
        userEmail: fullNote.author,
        action: "Note Created",
        entity: "note",
        entityId: fullNote.id,
        details: `Created matter note: '${fullNote.title}'.`,
        timestamp: new Date().toISOString(),
      }, true);
      return fullNote;
    }

    const path = `notes/${fullNote.id}`;
    try {
      await setDoc(doc(db, "notes", fullNote.id), fullNote);
      await this.recordActivity({
        id: "act_" + Date.now(),
        matterId: fullNote.matterId,
        ownerId: fullNote.ownerId,
        userEmail: fullNote.author,
        action: "Note Created",
        entity: "note",
        entityId: fullNote.id,
        details: `Created matter note: '${fullNote.title}'.`,
        timestamp: new Date().toISOString(),
      }, false);
      return fullNote;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return fullNote;
    }
  }

  static async updateNote(
    noteId: string,
    updates: Partial<MatterNote>,
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || noteId.startsWith("demo-")) {
      const idx = this.demoNotes.findIndex((n) => n.id === noteId);
      if (idx !== -1) {
        this.demoNotes[idx] = {
          ...this.demoNotes[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return;
    }

    const path = `notes/${noteId}`;
    try {
      await updateDoc(doc(db, "notes", noteId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  static async deleteNote(noteId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || noteId.startsWith("demo-")) {
      const idx = this.demoNotes.findIndex((n) => n.id === noteId);
      if (idx !== -1) this.demoNotes.splice(idx, 1);
      return;
    }

    const path = `notes/${noteId}`;
    try {
      await deleteDoc(doc(db, "notes", noteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Matter Status & Closure Workflow (Section 17 & 18) ---
  static async closeMatter(
    matterId: string,
    lawyerName: string = "Lead Counsel",
    closureNotes?: string,
    isDemo: boolean = true
  ): Promise<void> {
    const updates: Partial<Matter> = {
      status: "Closed",
      closedAt: new Date().toISOString(),
      closureNotes: closureNotes || "Matter concluded by counsel review.",
      closedBy: lawyerName,
      updatedAt: new Date().toISOString(),
    };

    if (isDemo || matterId.startsWith("demo-")) {
      const idx = DEMO_MATTERS.findIndex((m) => m.id === matterId);
      if (idx !== -1) {
        DEMO_MATTERS[idx] = { ...DEMO_MATTERS[idx], ...updates };
      }
    } else {
      const path = `matters/${matterId}`;
      try {
        await updateDoc(doc(db, "matters", matterId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    await this.recordActivity({
      id: "act_" + Date.now(),
      matterId,
      ownerId: "current-user",
      userEmail: lawyerName,
      user: lawyerName,
      action: "Matter Closed",
      entity: "matter",
      entityId: matterId,
      details: `Counsel formally closed matter. Closure notes: ${closureNotes || "None specified"}.`,
      timestamp: new Date().toISOString(),
    }, isDemo);
  }

  static async reopenMatter(
    matterId: string,
    lawyerName: string = "Lead Counsel",
    isDemo: boolean = true
  ): Promise<void> {
    const updates: Partial<Matter> = {
      status: "Active",
      closedAt: undefined,
      closureNotes: undefined,
      closedBy: undefined,
      updatedAt: new Date().toISOString(),
    };

    if (isDemo || matterId.startsWith("demo-")) {
      const idx = DEMO_MATTERS.findIndex((m) => m.id === matterId);
      if (idx !== -1) {
        DEMO_MATTERS[idx] = { ...DEMO_MATTERS[idx], ...updates };
      }
    } else {
      const path = `matters/${matterId}`;
      try {
        await updateDoc(doc(db, "matters", matterId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    await this.recordActivity({
      id: "act_" + Date.now(),
      matterId,
      ownerId: "current-user",
      userEmail: lawyerName,
      user: lawyerName,
      action: "Matter Reopened",
      entity: "matter",
      entityId: matterId,
      details: `Counsel reopened matter to Active status.`,
      timestamp: new Date().toISOString(),
    }, isDemo);
  }

  // --- Unreviewed AI Suggestions (Section 14 & 16) ---
  static async getUnreviewedAiSuggestions(
    matterId: string,
    isDemo: boolean = true
  ): Promise<{
    deadlines: Deadline[];
    tasks: Task[];
    issues: Issue[];
    contradictions: MatterContradiction[];
    missingInfo: MatterMissingInfo[];
    totalCount: number;
  }> {
    const allDeadlines = await this.getDeadlines(matterId, "demo-user", isDemo);
    const unconfirmedDeadlines = allDeadlines.filter(
      (d) => d.isAiSuggested && !d.isLawyerConfirmed && d.status !== "Dismissed" && d.status !== "dismissed"
    );

    const allTasks = await this.getTasks(matterId, "demo-user", isDemo);
    const unconfirmedTasks = allTasks.filter(
      (t) => t.isAiSuggested && !t.confirmedByLawyer && t.status !== "Cancelled" && t.status !== "cancelled"
    );

    const allIssues = await this.getIssues(matterId, "demo-user", isDemo);
    const unconfirmedIssues = allIssues.filter(
      (i) => i.isAiSuggested && !i.confirmedByLawyer && i.status !== "Dismissed" && i.status !== "dismissed"
    );

    const allContradictions = await this.getContradictions(matterId, isDemo);
    const unresolvedContradictions = allContradictions.filter((c) => c.status === "unreviewed");

    const allMissing = await this.getMissingInformation(matterId, isDemo);
    const openMissing = allMissing.filter((m) => m.status === "open");

    const totalCount =
      unconfirmedDeadlines.length +
      unconfirmedTasks.length +
      unconfirmedIssues.length +
      unresolvedContradictions.length +
      openMissing.length;

    return {
      deadlines: unconfirmedDeadlines,
      tasks: unconfirmedTasks,
      issues: unconfirmedIssues,
      contradictions: unresolvedContradictions,
      missingInfo: openMissing,
      totalCount,
    };
  }

  // --- Global Matter Search (Section 15) ---
  static async searchMatterEntities(
    matterId: string,
    searchQuery: string,
    isDemo: boolean = true
  ): Promise<Array<{
    entityType: "DOCUMENT" | "FACT" | "ISSUE" | "EVIDENCE" | "TIMELINE" | "DEADLINE" | "TASK" | "NOTE" | "CONTRADICTION" | "AI CONVERSATION";
    id: string;
    title: string;
    subtitle: string;
    snippet: string;
    tab: string;
    date?: string;
    status?: string;
  }>> {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{
      entityType: "DOCUMENT" | "FACT" | "ISSUE" | "EVIDENCE" | "TIMELINE" | "DEADLINE" | "TASK" | "NOTE" | "CONTRADICTION" | "AI CONVERSATION";
      id: string;
      title: string;
      subtitle: string;
      snippet: string;
      tab: string;
      date?: string;
      status?: string;
    }> = [];

    // Documents
    const docs = await this.getDocuments(matterId, "demo-user", isDemo);
    for (const d of docs) {
      if (
        d.filename.toLowerCase().includes(q) ||
        (d.contentSummary && d.contentSummary.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q))
      ) {
        results.push({
          entityType: "DOCUMENT",
          id: d.id,
          title: d.filename,
          subtitle: `Category: ${d.category}`,
          snippet: d.contentSummary?.slice(0, 150) || "Uploaded document file",
          tab: "documents",
          date: d.uploadDate,
        });
      }
    }

    // Facts
    const facts = await this.getMatterFacts(matterId, isDemo);
    for (const f of facts) {
      if (f.fact.toLowerCase().includes(q) || (f.sourceDocument && f.sourceDocument.toLowerCase().includes(q))) {
        results.push({
          entityType: "FACT",
          id: f.id,
          title: f.fact.slice(0, 75) + (f.fact.length > 75 ? "..." : ""),
          subtitle: `Source: ${f.sourceDocument || "Matter record"} (Conf: ${f.confidence})`,
          snippet: f.fact,
          tab: "facts",
          date: f.date,
          status: f.isLawyerConfirmed ? "Lawyer Confirmed" : "Extracted",
        });
      }
    }

    // Issues
    const issues = await this.getIssues(matterId, "demo-user", isDemo);
    for (const i of issues) {
      if (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.lawyerNotes && i.lawyerNotes.toLowerCase().includes(q))
      ) {
        results.push({
          entityType: "ISSUE",
          id: i.id,
          title: i.title,
          subtitle: `Status: ${i.status} | Source: ${i.sourceDocument || "Counsel"}`,
          snippet: i.description.slice(0, 150),
          tab: "issues",
          status: i.status,
        });
      }
    }

    // Evidence
    const evidence = await this.getEvidence(matterId, "demo-user", isDemo);
    for (const e of evidence) {
      if (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      ) {
        results.push({
          entityType: "EVIDENCE",
          id: e.id,
          title: e.name,
          subtitle: `Type: ${e.type} | Status: ${e.status}`,
          snippet: e.description.slice(0, 150),
          tab: "evidence",
          date: e.date,
          status: e.status,
        });
      }
    }

    // Timeline
    const timeline = await this.getTimeline(matterId, "demo-user", isDemo);
    for (const t of timeline) {
      if (t.event.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        results.push({
          entityType: "TIMELINE",
          id: t.id,
          title: t.event,
          subtitle: `Date: ${t.date} | ${t.sourceDocument || ""}`,
          snippet: t.description.slice(0, 150),
          tab: "timeline",
          date: t.date,
        });
      }
    }

    // Deadlines
    const deadlines = await this.getDeadlines(matterId, "demo-user", isDemo);
    for (const dl of deadlines) {
      if (dl.title.toLowerCase().includes(q) || dl.description.toLowerCase().includes(q)) {
        results.push({
          entityType: "DEADLINE",
          id: dl.id,
          title: dl.title,
          subtitle: `Due: ${dl.date} | Status: ${dl.status} (Priority: ${dl.priority})`,
          snippet: dl.description.slice(0, 150),
          tab: "deadlines",
          date: dl.date,
          status: dl.status,
        });
      }
    }

    // Tasks
    const tasks = await this.getTasks(matterId, "demo-user", isDemo);
    for (const t of tasks) {
      if (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q))
      ) {
        results.push({
          entityType: "TASK",
          id: t.id,
          title: t.title,
          subtitle: `Assigned: ${t.assignedTo || "Unassigned"} | Status: ${t.status} (Priority: ${t.priority})`,
          snippet: t.description?.slice(0, 150) || "Matter action item",
          tab: "tasks",
          date: t.dueDate,
          status: t.status,
        });
      }
    }

    // Notes
    const notes = await this.getNotes(matterId, "demo-user", isDemo);
    for (const n of notes) {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        results.push({
          entityType: "NOTE",
          id: n.id,
          title: n.title,
          subtitle: `Author: ${n.author} | Updated: ${n.updatedAt.slice(0, 10)}`,
          snippet: n.content.slice(0, 150),
          tab: "notes",
          date: n.createdAt.slice(0, 10),
        });
      }
    }

    // Contradictions
    const contradictions = await this.getContradictions(matterId, isDemo);
    for (const c of contradictions) {
      if (
        c.title.toLowerCase().includes(q) ||
        c.whyFlagged.toLowerCase().includes(q) ||
        (c.statementA && c.statementA.text?.toLowerCase().includes(q)) ||
        (c.statementB && c.statementB.text?.toLowerCase().includes(q))
      ) {
        results.push({
          entityType: "CONTRADICTION",
          id: c.id,
          title: c.title,
          subtitle: `Category: ${c.contradictionCategory} | Status: ${c.status}`,
          snippet: c.whyFlagged.slice(0, 150),
          tab: "intelligence",
          status: c.status,
        });
      }
    }

    return results;
  }

  // --- Activities ---
  static async getActivities(matterId?: string, isDemo: boolean = true): Promise<ActivityItem[]> {
    if (isDemo) {
      if (matterId) {
        return DEMO_ACTIVITIES.filter((a) => a.matterId === matterId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
      return [...DEMO_ACTIVITIES].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    const path = "activities";
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      const items: ActivityItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...(snap.data() as any), id: snap.id });
      });
      if (matterId) {
        return items.filter((a) => a.matterId === matterId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
      return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (err) {
      console.warn("Firestore getActivities error:", err);
      return [...DEMO_ACTIVITIES].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
  }

  static async recordActivity(activity: ActivityItem, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      DEMO_ACTIVITIES.unshift(activity);
      return;
    }

    const path = `activities/${activity.id}`;
    try {
      await setDoc(doc(db, "activities", activity.id), activity);
    } catch (err) {
      console.warn("Firestore recordActivity error:", err);
    }
  }

  // --- Matter AI Conversations (Phase 3) ---
  static async getMatterAiConversation(matterId: string, isDemo: boolean = true): Promise<ChatMessage[]> {
    if (isDemo || matterId.startsWith("demo-")) {
      return [...(this.demoConversations[matterId] || [])];
    }

    try {
      const convDoc = await getDoc(doc(db, "aiConversations", matterId));
      if (!convDoc.exists()) {
        return [];
      }
      const data = convDoc.data();
      return (data?.messages || []) as ChatMessage[];
    } catch (err) {
      console.warn("Firestore getMatterAiConversation error:", err);
      return [...(this.demoConversations[matterId] || [])];
    }
  }

  static async saveMatterAiConversation(
    matterId: string,
    messages: ChatMessage[],
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || matterId.startsWith("demo-")) {
      this.demoConversations[matterId] = [...messages];
      return;
    }

    try {
      await setDoc(doc(db, "aiConversations", matterId), {
        matterId,
        messages,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Firestore saveMatterAiConversation error:", err);
      this.demoConversations[matterId] = [...messages];
    }
  }

  static async clearMatterAiConversation(matterId: string, isDemo: boolean = true): Promise<void> {
    if (isDemo || matterId.startsWith("demo-")) {
      this.demoConversations[matterId] = [];
      return;
    }

    try {
      await deleteDoc(doc(db, "aiConversations", matterId));
    } catch (err) {
      console.warn("Firestore clearMatterAiConversation error:", err);
      this.demoConversations[matterId] = [];
    }
  }

  // --- Stored Matter Summary Intelligence (Phase 3) ---
  static async getStoredMatterSummary(matterId: string, isDemo: boolean = true): Promise<MatterAiSummary | null> {
    if (isDemo || matterId.startsWith("demo-")) {
      return this.demoMatterSummaries[matterId] || null;
    }

    try {
      const snap = await getDoc(doc(db, "matterSummaries", matterId));
      if (!snap.exists()) return null;
      return snap.data() as MatterAiSummary;
    } catch (err) {
      console.warn("Firestore getStoredMatterSummary error:", err);
      return this.demoMatterSummaries[matterId] || null;
    }
  }

  static async saveStoredMatterSummary(
    matterId: string,
    summary: MatterAiSummary,
    isDemo: boolean = true
  ): Promise<void> {
    if (isDemo || matterId.startsWith("demo-")) {
      this.demoMatterSummaries[matterId] = summary;
      return;
    }

    try {
      await setDoc(doc(db, "matterSummaries", matterId), summary);
    } catch (err) {
      console.warn("Firestore saveStoredMatterSummary error:", err);
      this.demoMatterSummaries[matterId] = summary;
    }
  }

  // Seed sample firm data into user's Firestore account
  static async seedSampleFirmData(userId: string): Promise<void> {
    for (const matter of DEMO_MATTERS) {
      const mCopy = { ...matter, id: "firm_" + matter.id.replace("demo-", ""), ownerId: userId };
      await setDoc(doc(db, "matters", mCopy.id), mCopy);
    }

    for (const docItem of DEMO_DOCUMENTS) {
      const dCopy = {
        ...docItem,
        id: "firm_" + docItem.id.replace("demo-", ""),
        matterId: "firm_" + docItem.matterId.replace("demo-", ""),
        ownerId: userId,
      };
      await setDoc(doc(db, "documents", dCopy.id), dCopy);
    }

    for (const event of DEMO_TIMELINE) {
      const eCopy = {
        ...event,
        id: "firm_" + event.id.replace("demo-", ""),
        matterId: "firm_" + event.matterId.replace("demo-", ""),
        ownerId: userId,
      };
      await setDoc(doc(db, "timelineEvents", eCopy.id), eCopy);
    }

    for (const issue of DEMO_ISSUES) {
      const iCopy = {
        ...issue,
        id: "firm_" + issue.id.replace("demo-", ""),
        matterId: "firm_" + issue.matterId.replace("demo-", ""),
        ownerId: userId,
      };
      await setDoc(doc(db, "issues", iCopy.id), iCopy);
    }

    for (const dl of DEMO_DEADLINES) {
      const dlCopy = {
        ...dl,
        id: "firm_" + dl.id.replace("demo-", ""),
        matterId: "firm_" + dl.matterId.replace("demo-", ""),
        ownerId: userId,
      };
      await setDoc(doc(db, "deadlines", dlCopy.id), dlCopy);
    }

    for (const ev of DEMO_EVIDENCE) {
      const evCopy = {
        ...ev,
        id: "firm_" + ev.id.replace("demo-", ""),
        matterId: "firm_" + ev.matterId.replace("demo-", ""),
        ownerId: userId,
      };
      await setDoc(doc(db, "evidence", evCopy.id), evCopy);
    }
  }

  // ==========================================
  // PHASE 2: DEEP INTELLIGENCE SERVICES
  // ==========================================

  // --- Document Relationships ---
  static async getRelationships(matterId: string, isDemo: boolean = true): Promise<MatterRelationship[]> {
    if (isDemo) {
      return this.demoRelationships.filter((r) => r.matterId === matterId);
    }
    try {
      const q = query(collection(db, "matterRelationships"), where("matterId", "==", matterId));
      const snapshot = await getDocs(q);
      const items: MatterRelationship[] = [];
      snapshot.forEach((docSnap) => items.push({ ...(docSnap.data() as any), id: docSnap.id }));
      return items.length > 0 ? items : this.demoRelationships.filter((r) => r.matterId === matterId);
    } catch (err) {
      console.warn("Firestore getRelationships failed, using demo data:", err);
      return this.demoRelationships.filter((r) => r.matterId === matterId);
    }
  }

  static async addRelationship(rel: Omit<MatterRelationship, "id">, isDemo: boolean = true): Promise<MatterRelationship> {
    const newId = "rel-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const fullItem: MatterRelationship = { ...rel, id: newId };
    if (isDemo) {
      this.demoRelationships.unshift(fullItem);
      return fullItem;
    }
    try {
      await setDoc(doc(db, "matterRelationships", newId), fullItem);
      return fullItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "matterRelationships");
      return fullItem;
    }
  }

  static async updateRelationship(id: string, updates: Partial<MatterRelationship>, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      const idx = this.demoRelationships.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.demoRelationships[idx] = { ...this.demoRelationships[idx], ...updates, updatedAt: new Date().toISOString() };
      }
      return;
    }
    try {
      await updateDoc(doc(db, "matterRelationships", id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matterRelationships/${id}`);
    }
  }

  static async deleteRelationship(id: string, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      this.demoRelationships = this.demoRelationships.filter((r) => r.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, "matterRelationships", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `matterRelationships/${id}`);
    }
  }

  // --- Matter Facts ---
  static async getMatterFacts(matterId: string, isDemo: boolean = true): Promise<MatterFact[]> {
    if (isDemo) {
      return this.demoFacts.filter((f) => f.matterId === matterId);
    }
    try {
      const q = query(collection(db, "matterFacts"), where("matterId", "==", matterId));
      const snapshot = await getDocs(q);
      const items: MatterFact[] = [];
      snapshot.forEach((docSnap) => items.push({ ...(docSnap.data() as any), id: docSnap.id }));
      return items.length > 0 ? items : this.demoFacts.filter((f) => f.matterId === matterId);
    } catch (err) {
      console.warn("Firestore getMatterFacts failed, using demo data:", err);
      return this.demoFacts.filter((f) => f.matterId === matterId);
    }
  }

  static async addMatterFact(fact: Omit<MatterFact, "id">, isDemo: boolean = true): Promise<MatterFact> {
    const newId = "fact-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const fullItem: MatterFact = { ...fact, id: newId };
    if (isDemo) {
      this.demoFacts.unshift(fullItem);
      return fullItem;
    }
    try {
      await setDoc(doc(db, "matterFacts", newId), fullItem);
      return fullItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "matterFacts");
      return fullItem;
    }
  }

  static async updateMatterFact(id: string, updates: Partial<MatterFact>, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      const idx = this.demoFacts.findIndex((f) => f.id === id);
      if (idx !== -1) {
        this.demoFacts[idx] = { ...this.demoFacts[idx], ...updates, updatedAt: new Date().toISOString() };
      }
      return;
    }
    try {
      await updateDoc(doc(db, "matterFacts", id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matterFacts/${id}`);
    }
  }

  static async deleteMatterFact(id: string, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      this.demoFacts = this.demoFacts.filter((f) => f.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, "matterFacts", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `matterFacts/${id}`);
    }
  }

  // --- Contradictions ---
  static async getContradictions(matterId: string, isDemo: boolean = true): Promise<MatterContradiction[]> {
    if (isDemo) {
      return this.demoContradictions.filter((c) => c.matterId === matterId);
    }
    try {
      const q = query(collection(db, "matterContradictions"), where("matterId", "==", matterId));
      const snapshot = await getDocs(q);
      const items: MatterContradiction[] = [];
      snapshot.forEach((docSnap) => items.push({ ...(docSnap.data() as any), id: docSnap.id }));
      return items.length > 0 ? items : this.demoContradictions.filter((c) => c.matterId === matterId);
    } catch (err) {
      console.warn("Firestore getContradictions failed, using demo data:", err);
      return this.demoContradictions.filter((c) => c.matterId === matterId);
    }
  }

  static async addContradiction(contra: Omit<MatterContradiction, "id">, isDemo: boolean = true): Promise<MatterContradiction> {
    const newId = "contra-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const fullItem: MatterContradiction = { ...contra, id: newId };
    if (isDemo) {
      this.demoContradictions.unshift(fullItem);
      return fullItem;
    }
    try {
      await setDoc(doc(db, "matterContradictions", newId), fullItem);
      return fullItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "matterContradictions");
      return fullItem;
    }
  }

  static async updateContradiction(id: string, updates: Partial<MatterContradiction>, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      const idx = this.demoContradictions.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.demoContradictions[idx] = { ...this.demoContradictions[idx], ...updates, updatedAt: new Date().toISOString() };
      }
      return;
    }
    try {
      await updateDoc(doc(db, "matterContradictions", id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matterContradictions/${id}`);
    }
  }

  // --- Missing Information ---
  static async getMissingInformation(matterId: string, isDemo: boolean = true): Promise<MatterMissingInfo[]> {
    if (isDemo) {
      return this.demoMissingInfo.filter((m) => m.matterId === matterId);
    }
    try {
      const q = query(collection(db, "matterMissingInformation"), where("matterId", "==", matterId));
      const snapshot = await getDocs(q);
      const items: MatterMissingInfo[] = [];
      snapshot.forEach((docSnap) => items.push({ ...(docSnap.data() as any), id: docSnap.id }));
      return items.length > 0 ? items : this.demoMissingInfo.filter((m) => m.matterId === matterId);
    } catch (err) {
      console.warn("Firestore getMissingInformation failed, using demo data:", err);
      return this.demoMissingInfo.filter((m) => m.matterId === matterId);
    }
  }

  static async addMissingInformation(info: Omit<MatterMissingInfo, "id">, isDemo: boolean = true): Promise<MatterMissingInfo> {
    const newId = "missing-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const fullItem: MatterMissingInfo = { ...info, id: newId };
    if (isDemo) {
      this.demoMissingInfo.unshift(fullItem);
      return fullItem;
    }
    try {
      await setDoc(doc(db, "matterMissingInformation", newId), fullItem);
      return fullItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "matterMissingInformation");
      return fullItem;
    }
  }

  static async updateMissingInformation(id: string, updates: Partial<MatterMissingInfo>, isDemo: boolean = true): Promise<void> {
    if (isDemo) {
      const idx = this.demoMissingInfo.findIndex((m) => m.id === id);
      if (idx !== -1) {
        this.demoMissingInfo[idx] = { ...this.demoMissingInfo[idx], ...updates };
      }
      return;
    }
    try {
      await updateDoc(doc(db, "matterMissingInformation", id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matterMissingInformation/${id}`);
    }
  }

  // --- Date Conflict Resolution ---
  static async resolveDateConflict(
    eventId: string,
    resolvedDate: string,
    notes: string,
    isDemo: boolean = true
  ): Promise<void> {
    await this.updateTimelineEvent(
      eventId,
      {
        date: resolvedDate,
        resolvedDate,
        conflictStatus: "resolved",
        sourceType: "lawyer-modified",
        lawyerVerified: true,
        description: notes ? notes : undefined,
      },
      isDemo
    );
  }

  // --- Multi-Document Collective Intelligence Trigger ---
  static async runMultiDocumentAnalysis(
    matterOrId: Matter | string,
    docsOrMode?: DocumentItem[] | ("pro" | "flash" | "lite"),
    modeParam: "pro" | "flash" | "lite" = "flash",
    isDemoParam: boolean = true
  ): Promise<{
    executiveSynthesis: string;
    newRelationshipsCount: number;
    newFactsCount: number;
    newEventsCount: number;
    newContradictionsCount: number;
    newMissingCount: number;
  }> {
    let matter: Matter | null = null;
    let documents: DocumentItem[] = [];
    let modelMode: "pro" | "flash" | "lite" = modeParam;
    let isDemo: boolean = isDemoParam;

    if (typeof matterOrId === "object") {
      matter = matterOrId;
      documents = Array.isArray(docsOrMode) ? docsOrMode : [];
      modelMode = modeParam;
      isDemo = isDemoParam;
    } else {
      isDemo = isDemoParam;
      modelMode = typeof docsOrMode === "string" ? docsOrMode : "flash";
      matter = await this.getMatterById(matterOrId, "demo-lawyer-user-1", isDemo);
      if (matter) {
        documents = await this.getDocuments(matterOrId, matter.ownerId || "demo-lawyer-user-1", isDemo);
      }
    }

    if (!matter) throw new Error("Matter not found");
    const matterId = matter.id;

    if (!documents || documents.length === 0) {
      documents = await this.getDocuments(matterId, matter.ownerId || "demo-lawyer-user-1", isDemo);
    }

    if (!documents || documents.length === 0) {
      throw new Error("No documents uploaded for this matter. Please upload documents first.");
    }

    // 2. Fetch existing verified facts to preserve lawyer modifications
    const existingFacts = await this.getMatterFacts(matterId, isDemo);
    const confirmedFacts = existingFacts.filter((f) => f.isLawyerConfirmed);

    const existingTimeline = await this.getTimeline(matterId, matter.ownerId || "demo-lawyer-user-1", isDemo);
    const verifiedEvents = existingTimeline.filter((t) => t.lawyerVerified);

    // 3. Call backend endpoint
    const response = await fetch("/api/matter-ai/multi-document-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: documents.map((d: DocumentItem) => ({
          id: d.id,
          filename: d.filename,
          category: d.category,
          contentSummary: d.contentSummary,
          extractedText: d.extractedText || "",
        })),
        matterContext: {
          matterName: matter.matterName,
          matterNumber: matter.matterNumber,
          matterType: matter.matterType,
          client: matter.client,
          court: matter.court,
          jurisdiction: matter.jurisdiction,
          opposingParty: matter.opposingParty,
        },
        existingData: {
          lawyerConfirmedFacts: confirmedFacts.map((f) => ({ fact: f.fact, sourceDocument: f.sourceDocument })),
          lawyerVerifiedEvents: verifiedEvents.map((e) => ({ date: e.date, event: e.event })),
        },
        modelMode,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || "Multi-document intelligence extraction failed");
    }

    const data = await response.json();

    // 4. Save extracted relationships (avoid exact duplicates)
    const currentRels = await this.getRelationships(matterId, isDemo);
    let newRelationshipsCount = 0;
    for (const rel of data.relationships || []) {
      const exists = currentRels.some(
        (cr) =>
          cr.sourceDocName === rel.sourceDocName &&
          cr.targetDocName === rel.targetDocName &&
          cr.relationshipType === rel.relationshipType
      );
      if (!exists) {
        await this.addRelationship(
          {
            matterId,
            ownerId: matter.ownerId || "demo-user",
            sourceDocName: rel.sourceDocName,
            targetDocName: rel.targetDocName,
            relationshipType: rel.relationshipType,
            description: rel.description,
            clauseOrSection: rel.clauseOrSection,
            isAiDetected: true,
            isLawyerConfirmed: false,
            createdBy: "ai",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isDemo
        );
        newRelationshipsCount++;
      }
    }

    // 5. Save extracted facts (preserve confirmed facts)
    let newFactsCount = 0;
    for (const fact of data.matterFacts || []) {
      const isAlreadyConfirmed = confirmedFacts.some(
        (cf) => cf.fact.toLowerCase().trim() === fact.fact.toLowerCase().trim()
      );
      if (!isAlreadyConfirmed) {
        await this.addMatterFact(
          {
            matterId,
            ownerId: matter.ownerId || "demo-user",
            fact: fact.fact,
            sourceDocument: fact.sourceDocument,
            page: fact.page,
            section: fact.section,
            confidence: fact.confidence || "high",
            extractionType: fact.extractionType || "factual_assertion",
            relatedParty: fact.relatedParty,
            amount: fact.amount,
            date: fact.date,
            factSourceType: "document-extracted",
            isLawyerConfirmed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isDemo
        );
        newFactsCount++;
      }
    }

    // 6. Save timeline events (preserve verified events)
    let newEventsCount = 0;
    for (const ev of data.timelineEvents || []) {
      const isAlreadyVerified = verifiedEvents.some(
        (ve) => ve.date === ev.date && ve.event.toLowerCase() === ev.event.toLowerCase()
      );
      if (!isAlreadyVerified) {
        await this.addTimelineEvent(
          {
            matterId,
            ownerId: matter.ownerId || "demo-user",
            date: ev.date,
            event: ev.event,
            description: ev.description,
            sourceDocument: ev.sourceDocument,
            sourcePage: ev.sourcePage,
            sourceSection: ev.sourceSection,
            confidence: ev.confidence || "high",
            isAiGenerated: true,
            lawyerVerified: false,
            sourceType: "document-extracted",
            hasDateConflict: ev.hasDateConflict,
            dateConflictWithDoc: ev.dateConflictWithDoc,
            dateConflictDate: ev.dateConflictDate,
            dateConflictReason: ev.dateConflictReason,
            conflictStatus: ev.hasDateConflict ? "unresolved" : undefined,
            createdAt: new Date().toISOString(),
          },
          isDemo
        );
        newEventsCount++;
      }
    }

    // 7. Save contradictions
    let newContradictionsCount = 0;
    for (const contra of data.contradictions || []) {
      await this.addContradiction(
        {
          matterId,
          ownerId: matter.ownerId || "demo-user",
          title: contra.title,
          statementA: contra.statementA,
          statementB: contra.statementB,
          contradictionCategory: contra.contradictionCategory || "event_description",
          whyFlagged: contra.whyFlagged,
          status: "unreviewed",
          isAiDetected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isDemo
      );
      newContradictionsCount++;
    }

    // 8. Save missing info
    let newMissingCount = 0;
    for (const miss of data.missingInformation || []) {
      await this.addMissingInformation(
        {
          matterId,
          ownerId: matter.ownerId || "demo-user",
          item: miss.item,
          referencedByDocument: miss.referencedByDocument,
          clauseOrContext: miss.clauseOrContext,
          explanation: miss.explanation,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        isDemo
      );
      newMissingCount++;
    }

    // Log Activity
    await this.recordActivity(
      {
        id: "act_" + Math.random().toString(36).substring(2, 10),
        matterId,
        matterName: matter.matterName,
        ownerId: matter.ownerId || "demo-user",
        userEmail: "counsel@matteros.ai",
        action: "Multi-Document Intelligence Executed",
        details: `Synthesized ${documents.length} documents: ${newRelationshipsCount} relationships, ${newFactsCount} facts, ${newEventsCount} events, ${newContradictionsCount} potential inconsistencies detected.`,
        timestamp: new Date().toISOString(),
      },
      isDemo
    );

    return {
      executiveSynthesis: data.executiveSynthesis || "Multi-document intelligence extraction complete.",
      newRelationshipsCount,
      newFactsCount,
      newEventsCount,
      newContradictionsCount,
      newMissingCount,
    };
  }

  static async seedDemoData(userId: string): Promise<void> {
    return this.seedSampleFirmData(userId);
  }
}
