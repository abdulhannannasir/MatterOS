import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export interface DocumentAnalysisResult {
  documentSummary: string;
  documentType: string;
  parties: Array<{ name: string; role: string; representation?: string }>;
  keyFacts: Array<{ fact: string; sourceQuote?: string; date?: string; confidence: "high" | "medium" | "low" }>;
  events: Array<{ date: string; event: string; description: string; sourceDocument?: string; sourcePage?: string; confidence: "high" | "medium" | "low" }>;
  issues: Array<{ title: string; description: string; category?: string; sourceDocument?: string; relatedFacts?: string[] }>;
  peopleAndOrgs: Array<{ name: string; type: "person" | "organization" | "court" | "counsel"; role: string }>;
  obligations: Array<{ obligation: string; responsibleParty: string; deadline?: string; source?: string }>;
  importantDates: Array<{ date: string; description: string; source: string; isBindingDeadline?: boolean; priority?: "high" | "medium" | "low" }>;
  references: Array<{ documentName: string; clauseOrSection?: string; description?: string }>;
  missingInformation: string[];
}

export interface MultiDocumentAnalysisResult {
  executiveSynthesis: string;
  relationships: Array<{
    sourceDocName: string;
    targetDocName: string;
    relationshipType: "references" | "amends" | "responds_to" | "relies_upon" | "supports" | "contradicts" | "follows" | "precedes" | "related_to";
    description: string;
    clauseOrSection?: string;
    sharedEntities?: {
      parties?: string[];
      dates?: string[];
      issues?: string[];
    };
  }>;
  matterFacts: Array<{
    fact: string;
    sourceDocument: string;
    page?: string;
    section?: string;
    confidence: "high" | "medium" | "low";
    extractionType: "allegation" | "admission" | "denial" | "agreement" | "payment" | "communication" | "notice" | "application" | "order" | "procedural" | "factual_assertion" | "obligation";
    relatedParty?: string;
    amount?: string;
    date?: string;
    factSourceType: "document-extracted" | "ai-interpretation";
  }>;
  timelineEvents: Array<{
    date: string;
    event: string;
    description: string;
    sourceDocument: string;
    sourcePage?: string;
    sourceSection?: string;
    confidence: "high" | "medium" | "low";
    hasDateConflict?: boolean;
    dateConflictWithDoc?: string;
    dateConflictDate?: string;
    dateConflictReason?: string;
  }>;
  contradictions: Array<{
    title: string;
    statementA: {
      text: string;
      sourceDocument: string;
      page?: string;
      date?: string;
    };
    statementB: {
      text: string;
      sourceDocument: string;
      page?: string;
      date?: string;
    };
    contradictionCategory: "date_conflict" | "payment_discrepancy" | "event_description" | "position_shift" | "admission_denial" | "agreement_terms" | "notice_delivery" | "party_assertion";
    whyFlagged: string;
  }>;
  missingInformation: Array<{
    item: string;
    referencedByDocument: string;
    clauseOrContext?: string;
    explanation: string;
  }>;
}

export async function analyzeLegalDocument(
  documentText: string,
  filename: string,
  matterContext?: { matterName: string; matterType: string; client: string; court?: string },
  modelMode: "pro" | "flash" | "lite" = "flash"
): Promise<DocumentAnalysisResult> {
  const model = modelMode === "pro" 
    ? "gemini-3.1-pro-preview" 
    : modelMode === "lite" 
    ? "gemini-3.1-flash-lite" 
    : "gemini-3.5-flash";

  const systemInstruction = `You are a Senior Legal Intelligence Extraction Engine for MATTEROS, an enterprise legal tech workspace for practicing attorneys and barristers.
Your mission is to perform rigorous, objective document extraction from uploaded legal files.
CRITICAL SAFETY & INTEGRITY RULES:
1. You are NOT an autonomous lawyer. You extract structured factual intelligence for attorney review.
2. NEVER fabricate citations, case law, dates, party names, quotes, or clauses.
3. If any field or fact is absent or cannot be verified from the document, explicitly record "Not found in the provided documents." or omit it.
4. Distinguish verified direct facts from allegations or claims (indicate confidence level high/medium/low).
5. Extract explicit obligations, deadlines, events chronologically, and potential issues for lawyer consideration.
6. Provide accurate page/section references or source quotes where possible.`;

  const prompt = `Analyze the following legal document named "${filename}".
${matterContext ? `Matter Context: ${matterContext.matterName} (${matterContext.matterType}), Client: ${matterContext.client}, Court: ${matterContext.court || "Not specified"}` : ""}

DOCUMENT TEXT CONTENT:
"""
${documentText.slice(0, 100000)}
"""

Extract structured intelligence in strictly valid JSON format conforming to the requested schema.`;

  const config: any = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        documentSummary: { type: Type.STRING, description: "Executive summary of the document (2-4 concise paragraphs)" },
        documentType: { type: Type.STRING, description: "Categorized legal type, e.g. Pleading, Court Order, Contract, Correspondence, Evidence, Affidavit, Notice, Agreement, Other" },
        parties: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING, description: "e.g. Claimant, Defendant, Petitioner, Respondent, Witness" },
              representation: { type: Type.STRING, description: "Legal counsel if stated" },
            },
            required: ["name", "role"],
          },
        },
        keyFacts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fact: { type: Type.STRING },
              sourceQuote: { type: Type.STRING },
              date: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
            },
            required: ["fact", "confidence"],
          },
        },
        events: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD or specific date description" },
              event: { type: Type.STRING, description: "Short milestone title" },
              description: { type: Type.STRING },
              sourceDocument: { type: Type.STRING },
              sourcePage: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
            },
            required: ["date", "event", "description", "confidence"],
          },
        },
        issues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              sourceDocument: { type: Type.STRING },
              relatedFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "description"],
          },
        },
        peopleAndOrgs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["person", "organization", "court", "counsel"] },
              role: { type: Type.STRING },
            },
            required: ["name", "type", "role"],
          },
        },
        obligations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              obligation: { type: Type.STRING },
              responsibleParty: { type: Type.STRING },
              deadline: { type: Type.STRING },
              source: { type: Type.STRING },
            },
            required: ["obligation", "responsibleParty"],
          },
        },
        importantDates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              source: { type: Type.STRING },
              isBindingDeadline: { type: Type.BOOLEAN },
              priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
            },
            required: ["date", "description", "source"],
          },
        },
        references: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              documentName: { type: Type.STRING },
              clauseOrSection: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["documentName"],
          },
        },
        missingInformation: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Missing documents, ambiguous dates, or unverified claims needing attorney inquiry",
        },
      },
      required: [
        "documentSummary",
        "documentType",
        "parties",
        "keyFacts",
        "events",
        "issues",
        "obligations",
        "importantDates",
        "references",
        "missingInformation",
      ],
    },
  };

  if (model === "gemini-3.1-pro-preview") {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  const text = response.text || "{}";
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("Failed to parse Gemini structured JSON:", err, text);
    throw new Error("Invalid structured JSON returned by analysis engine");
  }
}

export async function analyzeMultiDocuments(
  documents: Array<{ id?: string; filename: string; category: string; contentSummary?: string; extractedText: string }>,
  matterContext: { matterName: string; matterNumber?: string; matterType: string; client: string; court?: string; jurisdiction?: string; opposingParty?: string },
  existingData?: {
    lawyerConfirmedFacts?: Array<{ fact: string; sourceDocument: string }>;
    lawyerVerifiedEvents?: Array<{ date: string; event: string }>;
  },
  modelMode: "pro" | "flash" | "lite" = "flash"
): Promise<MultiDocumentAnalysisResult> {
  const model = modelMode === "pro"
    ? "gemini-3.1-pro-preview"
    : modelMode === "lite"
    ? "gemini-3.1-flash-lite"
    : "gemini-3.5-flash";

  const systemInstruction = `You are a Senior Legal Intelligence Analyst and Multi-Document Cross-Referencing Engine for MATTEROS.
Your objective is to analyze the collective corpus of legal documents in a single matter to establish cross-document intelligence.
MANDATORY RULES:
1. Identify true relationships between documents (references, amends, responds_to, relies_upon, supports, contradicts, follows, precedes, related_to).
2. Extract matter-level facts with classification: allegation, admission, denial, agreement, payment, communication, notice, application, order, procedural, factual_assertion, obligation.
3. Detect potential date conflicts: If Document A and Document B state conflicting dates for what appears to be the same event or milestone (e.g. execution date, breach date, delivery date), explicitly report the conflict with both sources! DO NOT SILENTLY RESOLVE CONFLICTS.
4. Detect potential contradictions: Inconsistencies across documents (e.g. different dates, different payment amounts, different descriptions of events, position changes, admission in one doc vs denial in another, conflicting versions of clauses). Flag them as potential inconsistencies.
5. Detect missing information: If any document explicitly refers to an exhibit, schedule, notice, bank record, or prior order that is not present among the provided documents, record it as missing.
6. PRESERVE LAWYER INTEGRITY: Do not contradict confirmed facts. Ground all outputs strictly in the provided texts.`;

  const docsSummary = documents.map((doc, idx) => {
    return `=== DOCUMENT ${idx + 1}: ${doc.filename} [Category: ${doc.category}] ===
Summary: ${doc.contentSummary || "None"}
Key Excerpt / Text:
${(doc.extractedText || "").slice(0, 15000)}
=== END DOCUMENT ${idx + 1} ===`;
  }).join("\n\n");

  const prompt = `Perform comprehensive multi-document legal intelligence extraction on this case file.
Matter: ${matterContext.matterName} (#${matterContext.matterNumber || "N/A"})
Client: ${matterContext.client}
Opposing Party: ${matterContext.opposingParty || "Not stated"}
Court / Jurisdiction: ${matterContext.court || matterContext.jurisdiction || "General"}

${existingData?.lawyerConfirmedFacts?.length ? `Existing Lawyer-Confirmed Facts (DO NOT OVERWRITE OR DISCARD):\n${existingData.lawyerConfirmedFacts.map(f => `- ${f.fact} (${f.sourceDocument})`).join("\n")}\n` : ""}

DOCUMENTS CORPUS (${documents.length} files):
${docsSummary}

Produce structured matter intelligence matching the JSON schema.`;

  const config: any = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        executiveSynthesis: {
          type: Type.STRING,
          description: "Authoritative executive case overview synthesizing the multi-document claims, verified facts, defense posture, and exposure.",
        },
        relationships: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceDocName: { type: Type.STRING },
              targetDocName: { type: Type.STRING },
              relationshipType: {
                type: Type.STRING,
                enum: [
                  "references",
                  "amends",
                  "responds_to",
                  "relies_upon",
                  "supports",
                  "contradicts",
                  "follows",
                  "precedes",
                  "related_to",
                ],
              },
              description: { type: Type.STRING },
              clauseOrSection: { type: Type.STRING },
            },
            required: ["sourceDocName", "targetDocName", "relationshipType", "description"],
          },
        },
        matterFacts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fact: { type: Type.STRING },
              sourceDocument: { type: Type.STRING },
              page: { type: Type.STRING },
              section: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
              extractionType: {
                type: Type.STRING,
                enum: [
                  "allegation",
                  "admission",
                  "denial",
                  "agreement",
                  "payment",
                  "communication",
                  "notice",
                  "application",
                  "order",
                  "procedural",
                  "factual_assertion",
                  "obligation",
                ],
              },
              relatedParty: { type: Type.STRING },
              amount: { type: Type.STRING },
              date: { type: Type.STRING },
              factSourceType: { type: Type.STRING, enum: ["document-extracted", "ai-interpretation"] },
            },
            required: ["fact", "sourceDocument", "confidence", "extractionType", "factSourceType"],
          },
        },
        timelineEvents: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              event: { type: Type.STRING },
              description: { type: Type.STRING },
              sourceDocument: { type: Type.STRING },
              sourcePage: { type: Type.STRING },
              sourceSection: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
              hasDateConflict: { type: Type.BOOLEAN },
              dateConflictWithDoc: { type: Type.STRING },
              dateConflictDate: { type: Type.STRING },
              dateConflictReason: { type: Type.STRING },
            },
            required: ["date", "event", "description", "sourceDocument", "confidence"],
          },
        },
        contradictions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              statementA: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  sourceDocument: { type: Type.STRING },
                  page: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
                required: ["text", "sourceDocument"],
              },
              statementB: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  sourceDocument: { type: Type.STRING },
                  page: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
                required: ["text", "sourceDocument"],
              },
              contradictionCategory: {
                type: Type.STRING,
                enum: [
                  "date_conflict",
                  "payment_discrepancy",
                  "event_description",
                  "position_shift",
                  "admission_denial",
                  "agreement_terms",
                  "notice_delivery",
                  "party_assertion",
                ],
              },
              whyFlagged: { type: Type.STRING },
            },
            required: ["title", "statementA", "statementB", "contradictionCategory", "whyFlagged"],
          },
        },
        missingInformation: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              referencedByDocument: { type: Type.STRING },
              clauseOrContext: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["item", "referencedByDocument", "explanation"],
          },
        },
      },
      required: [
        "executiveSynthesis",
        "relationships",
        "matterFacts",
        "timelineEvents",
        "contradictions",
        "missingInformation",
      ],
    },
  };

  if (model === "gemini-3.1-pro-preview") {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  const text = response.text || "{}";
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("Failed to parse multi-document analysis JSON:", err, text);
    throw new Error("Multi-document intelligence engine returned invalid format.");
  }
}

// ==========================================
// PHASE 3 — MATTEROS AI INTELLIGENCE LAYER
// ==========================================

export interface MatterRetrievalPackage {
  queryType: "fast_path_database" | "matter_summary" | "timeline_chronology" | "evidence_query" | "contradiction_query" | "cross_document_reasoning" | "unsupported";
  isFastPath: boolean;
  contextBlock: string;
  retrievedSources: Array<{
    title: string;
    documentName: string;
    page?: string;
    section?: string;
    quote?: string;
    infoType: "document-fact" | "lawyer-input" | "lawyer-confirmed" | "ai-interpretation" | "ai-suggestion";
  }>;
  suggestedFollowUps?: string[];
  latencyMetrics?: {
    requestStarted: number;
    retrievalStarted?: number;
    retrievalCompleted?: number;
    geminiStarted?: number;
    firstTokenReceived?: number;
    generationCompleted?: number;
    totalLatencyMs: number;
  };
}

export function evaluateFastPathQuery(
  question: string,
  matterContext: any
): { isFastPath: boolean; answer?: string; queryType?: any; sources?: any[] } {
  const q = question.trim().toLowerCase();
  
  // Case number / matter number
  if (/(\bcase\s*number\b|\bmatter\s*number\b|\bcase\s*#\b|\bmatter\s*#\b)/i.test(q) && (q.startsWith("what") || q.startsWith("show") || q.startsWith("give") || q.length < 40)) {
    const num = matterContext.matterNumber || matterContext.caseNumber || "Not recorded";
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Matter Number:** \`${num}\`\n\n*Direct lookup from active matter record for **${matterContext.matterName}**.*`,
      sources: [{
        title: "Matter Profile Docket",
        documentName: "Matter File Record",
        infoType: "lawyer-input",
      }]
    };
  }

  // Who is the client?
  if (/(\bwho\s+is\s+the\s+client\b|\bclient\s*name\b|\bwho\s+is\s+our\s+client\b|\brepresented\s+party\b)/i.test(q)) {
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Client Name:** **${matterContext.client || "Unspecified"}**\n\n*Direct lookup from active matter record for **${matterContext.matterName}**.*`,
      sources: [{
        title: "Client Profile",
        documentName: "Matter File Record",
        infoType: "lawyer-input",
      }]
    };
  }

  // Who is opposing party?
  if (/(\bwho\s+is\s+the\s+opposing\s+party\b|\bopposing\s+party\b|\bwho\s+is\s+the\s+defendant\b|\bwho\s+is\s+the\s+plaintiff\b|\badverse\s+party\b)/i.test(q) && q.length < 50) {
    const adverse = matterContext.opposingParty || "Not stated on record";
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Opposing Party:** **${adverse}**\n\n*Direct lookup from active matter record for **${matterContext.matterName}**.*`,
      sources: [{
        title: "Opposing Party Register",
        documentName: "Matter File Record",
        infoType: "lawyer-input",
      }]
    };
  }

  // Status and priority
  if (/(\bwhat\s+is\s+(this\s+)?matter('s|\s)?\s*status\b|\bmatter\s+status\b|\bcase\s+status\b|\bcurrent\s+status\b)/i.test(q) && q.length < 45) {
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Matter Status:** **${matterContext.status || "Active"}**\n**Priority Level:** **${matterContext.priority || "Normal"}**\n**Assigned Counsel:** ${matterContext.leadAttorney || "Assigned Lead Counsel"}\n\n*Direct database query completed in fast path.*`,
      sources: [{
        title: "Matter Management Profile",
        documentName: "Matter File Record",
        infoType: "lawyer-input",
      }]
    };
  }

  // Document count or uploaded documents list
  if (/(\bhow\s+many\s+documents\b|\bnumber\s+of\s+documents\b|\blist\s+(the\s+)?documents\b)/i.test(q) && q.length < 50) {
    const docs = matterContext.documentsSummary || [];
    const docList = docs.map((d: any, i: number) => `${i + 1}. **${d.filename}** — *${d.category || "General"}*`).join("\n");
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Total Indexed Documents:** **${docs.length}**\n\n${docList || "No documents uploaded yet to this matter."}`,
      sources: docs.map((d: any) => ({
        title: d.filename,
        documentName: d.filename,
        infoType: "document-fact" as const,
      }))
    };
  }

  // Deadlines recorded
  if (/(\bwhat\s+deadlines\s+are\s+recorded\b|\blist\s+(all\s+)?deadlines\b|\bany\s+upcoming\s+deadlines\b|\bwhat\s+are\s+the\s+deadlines\b)/i.test(q) && q.length < 55) {
    const deadlines = matterContext.deadlines || [];
    if (deadlines.length === 0) {
      return {
        isFastPath: true,
        queryType: "fast_path_database",
        answer: `**Recorded Deadlines:** No statutory or court deadlines currently scheduled for **${matterContext.matterName}**.`,
        sources: []
      };
    }
    const dlList = deadlines.map((dl: any, i: number) => 
      `${i + 1}. **${dl.date}** — **${dl.title}** (${dl.status}, Priority: *${dl.priority}*)${dl.isLawyerConfirmed ? " ✓ *Confirmed by Counsel*" : ""}`
    ).join("\n");
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Recorded Deadlines (${deadlines.length}):**\n\n${dlList}`,
      sources: [{
        title: "Calendar Docket",
        documentName: "Matter Deadlines Docket",
        infoType: "lawyer-confirmed",
      }]
    };
  }

  // Open issues count
  if (/(\bhow\s+many\s+(open\s+)?issues\b|\blist\s+(all\s+)?(open\s+)?issues\b|\bwhat\s+issues\s+are\s+recorded\b)/i.test(q) && q.length < 50) {
    const issues = matterContext.issues || [];
    const openIssues = issues.filter((i: any) => i.status !== "Resolved");
    if (issues.length === 0) {
      return {
        isFastPath: true,
        queryType: "fast_path_database",
        answer: `**Legal Issues Repository:** No open legal issues currently identified or logged.`,
        sources: []
      };
    }
    const issList = issues.map((iss: any, i: number) => 
      `${i + 1}. **${iss.title}** [Status: *${iss.status}*] — ${iss.description}`
    ).join("\n");
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Recorded Legal Issues (${openIssues.length} Open / ${issues.length} Total):**\n\n${issList}`,
      sources: [{
        title: "Issues Register",
        documentName: "Matter Issues Docket",
        infoType: "lawyer-input",
      }]
    };
  }

  // Tasks fast path
  if (/(\bwhat\s+(are\s+my\s+)?tasks\b|\blist\s+(all\s+)?tasks\b|\bmy\s+tasks\b|\bpending\s+tasks\b|\btasks\s+assigned\b)/i.test(q) && q.length < 50) {
    const tasks = matterContext.tasks || [];
    if (tasks.length === 0) {
      return {
        isFastPath: true,
        queryType: "fast_path_database",
        answer: `**Matter Tasks:** No active or pending tasks currently logged for **${matterContext.matterName}**.`,
        sources: []
      };
    }
    const taskList = tasks.map((t: any, i: number) =>
      `${i + 1}. **${t.title}** [Status: *${t.status}*, Priority: *${t.priority}*] — Due: **${t.dueDate || "Not set"}** (Assigned: ${t.assignedTo || "Unassigned"})${t.isAiSuggested && !t.confirmedByLawyer ? " ⚠ *AI Suggested (Awaiting Lawyer Approval)*" : ""}`
    ).join("\n");
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Matter Tasks (${tasks.length} Total):**\n\n${taskList}`,
      sources: [{
        title: "Tasks Ledger",
        documentName: "Matter Tasks Docket",
        infoType: "lawyer-input",
      }]
    };
  }

  // Matter Notes fast path
  if (/(\bwhat\s+notes\s+are\s+recorded\b|\blist\s+(all\s+)?notes\b|\bshow\s+notes\b|\bany\s+notes\b)/i.test(q) && q.length < 50) {
    const notes = matterContext.notes || [];
    if (notes.length === 0) {
      return {
        isFastPath: true,
        queryType: "fast_path_database",
        answer: `**Attorney Notes:** No attorney work-product notes currently recorded for this matter.`,
        sources: []
      };
    }
    const noteList = notes.map((n: any, i: number) =>
      `${i + 1}. **${n.title}** (*${n.author}*):\n   ${n.content.slice(0, 180)}...`
    ).join("\n\n");
    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer: `**Attorney Work Product Notes (${notes.length}):**\n\n${noteList}`,
      sources: [{
        title: "Work Product Notes",
        documentName: "Matter Case Notes",
        infoType: "lawyer-input",
      }]
    };
  }

  // "What needs my attention?" workflow fast path
  if (/(\bwhat\s+needs\s+(my\s+)?attention\b|\baction\s+items\b|\bwhat('s|\s+is)\s+pending\b|\bworkflow\s+summary\b)/i.test(q) && q.length < 50) {
    const tasks = matterContext.tasks || [];
    const deadlines = matterContext.deadlines || [];
    const contradictions = matterContext.contradictions || [];
    const missing = matterContext.missingInformation || [];

    const pendingAiTasks = tasks.filter((t: any) => t.isAiSuggested && !t.confirmedByLawyer);
    const urgentTasks = tasks.filter((t: any) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed" && t.status !== "Completed");
    const unconfirmedDeadlines = deadlines.filter((d: any) => d.isAiSuggested && !d.isLawyerConfirmed);
    const upcomingDeadlines = deadlines.filter((d: any) => d.status !== "Dismissed" && d.status !== "dismissed");
    const unresolvedContradictions = contradictions.filter((c: any) => c.status === "unresolved");

    const sections: string[] = [];
    if (unconfirmedDeadlines.length > 0) {
      sections.push(`📅 **AI-Suggested Deadlines Needing Confirmation (${unconfirmedDeadlines.length}):**\n` +
        unconfirmedDeadlines.map((d: any) => `  • **${d.title}** (Target Date: ${d.date}) — Source: ${d.source || "Document Extraction"}`).join("\n"));
    }
    if (pendingAiTasks.length > 0) {
      sections.push(`⚡ **AI-Suggested Action Items Awaiting Approval (${pendingAiTasks.length}):**\n` +
        pendingAiTasks.map((t: any) => `  • **${t.title}** (Priority: ${t.priority})`).join("\n"));
    }
    if (urgentTasks.length > 0) {
      sections.push(`🔥 **High & Urgent Active Tasks (${urgentTasks.length}):**\n` +
        urgentTasks.map((t: any) => `  • **${t.title}** [Due: ${t.dueDate || "N/A"}, Assigned: ${t.assignedTo || "Unassigned"}]`).join("\n"));
    }
    if (unresolvedContradictions.length > 0) {
      sections.push(`⚠ **Unresolved Cross-Document Contradictions (${unresolvedContradictions.length}):**\n` +
        unresolvedContradictions.map((c: any) => `  • ${c.title}`).join("\n"));
    }
    if (missing.length > 0) {
      sections.push(`🔍 **Discovery & Document Gaps (${missing.length}):**\n` +
        missing.map((m: any) => `  • ${m.item}`).join("\n"));
    }

    const answer = sections.length > 0
      ? `### Action Items Requiring Attention for **${matterContext.matterName}**:\n\n` + sections.join("\n\n")
      : `All tasks and deadlines for **${matterContext.matterName}** are up to date. No pending AI suggestions or unresolved conflicts requiring immediate counsel action.`;

    return {
      isFastPath: true,
      queryType: "fast_path_database",
      answer,
      sources: [{
        title: "Matter Action Docket",
        documentName: "Matter Workflow Ledger",
        infoType: "lawyer-confirmed",
      }]
    };
  }

  return { isFastPath: false };
}

export function buildSelectiveRetrievalContext(
  question: string,
  matterContext: any
): MatterRetrievalPackage {
  const qLower = question.toLowerCase();
  const queryTokens = qLower.split(/\W+/).filter((t) => t.length > 2);

  // Check Fast Path first
  const fastCheck = evaluateFastPathQuery(question, matterContext);
  if (fastCheck.isFastPath) {
    return {
      queryType: "fast_path_database",
      isFastPath: true,
      contextBlock: "",
      retrievedSources: fastCheck.sources || [],
    };
  }

  // Classify Query Type
  let queryType: MatterRetrievalPackage["queryType"] = "cross_document_reasoning";
  if (qLower.includes("summar") || qLower.includes("overview") || qLower.includes("brief") || qLower.includes("tell me about this matter")) {
    queryType = "matter_summary";
  } else if (qLower.includes("timeline") || qLower.includes("chronology") || qLower.includes("after") || qLower.includes("before") || qLower.includes("when did") || qLower.includes("date")) {
    queryType = "timeline_chronology";
  } else if (qLower.includes("contradict") || qLower.includes("inconsisten") || qLower.includes("conflict") || qLower.includes("discrepan") || qLower.includes("shift")) {
    queryType = "contradiction_query";
  } else if (qLower.includes("evidence") || qLower.includes("support") || qLower.includes("exhibit") || qLower.includes("proof") || qLower.includes("payment")) {
    queryType = "evidence_query";
  }

  const retrievedSources: MatterRetrievalPackage["retrievedSources"] = [];

  // 1. Prioritize Lawyer-Confirmed & Lawyer-Entered Facts
  const facts = matterContext.facts || [];
  const scoredFacts = facts.map((f: any) => {
    let score = 0;
    const fLower = (f.fact + " " + (f.sourceDocument || "") + " " + (f.extractionType || "")).toLowerCase();
    
    // Lawyer verification hierarchy
    if (f.lawyerVerified) score += 8; // HIGHEST PRIORITY: Lawyer Confirmed
    if (f.factSourceType === "document-extracted") score += 4;
    if (f.factSourceType === "ai-interpretation") score += 1;

    for (const token of queryTokens) {
      if (fLower.includes(token)) score += 3;
    }

    if (qLower.includes("payment") && (f.extractionType === "payment" || fLower.includes("payment") || fLower.includes("$"))) score += 6;
    if (qLower.includes("admission") && f.extractionType === "admission") score += 5;
    if (qLower.includes("denial") && f.extractionType === "denial") score += 5;
    if (qLower.includes("obligation") && f.extractionType === "obligation") score += 4;
    return { item: f, score };
  });
  scoredFacts.sort((a: any, b: any) => b.score - a.score);
  const selectedFacts = scoredFacts.slice(0, 14).map((sf: any) => sf.item);

  selectedFacts.forEach((f: any) => {
    retrievedSources.push({
      title: f.fact.slice(0, 60) + "...",
      documentName: f.sourceDocument || "Matter Facts Record",
      page: f.page,
      section: f.section,
      quote: f.fact,
      infoType: f.lawyerVerified ? "lawyer-confirmed" : (f.factSourceType === "ai-interpretation" ? "ai-interpretation" : "document-fact"),
    });
  });

  // 2. Timeline Milestones
  const timeline = matterContext.timeline || [];
  const isChronology = queryType === "timeline_chronology" || qLower.includes("timeline");
  const scoredTimeline = timeline.map((ev: any) => {
    let score = 0;
    const evLower = (ev.event + " " + ev.description + " " + ev.date + " " + (ev.sourceDocument || "")).toLowerCase();
    if (ev.lawyerVerified) score += 6;
    if (ev.hasDateConflict) score += 5;
    for (const token of queryTokens) {
      if (evLower.includes(token)) score += 3;
    }
    if (isChronology) score += 4;
    return { item: ev, score };
  });
  scoredTimeline.sort((a: any, b: any) => b.score - a.score);
  const selectedTimeline = isChronology ? timeline.slice(0, 20) : scoredTimeline.slice(0, 8).map((st: any) => st.item);

  selectedTimeline.forEach((ev: any) => {
    retrievedSources.push({
      title: `${ev.date}: ${ev.event}`,
      documentName: ev.sourceDocument || "Matter Docket",
      page: ev.sourcePage,
      section: ev.sourceSection,
      quote: ev.description,
      infoType: ev.lawyerVerified ? "lawyer-confirmed" : "document-fact",
    });
  });

  // 3. Contradictions & Inconsistencies
  const contradictions = matterContext.contradictions || [];
  const relevantContradictions = contradictions.filter((c: any) => {
    if (queryType === "contradiction_query") return true;
    const cLower = (c.title + " " + c.whyFlagged + " " + (c.statementA?.text || "") + " " + (c.statementB?.text || "")).toLowerCase();
    return queryTokens.some((t: string) => cLower.includes(t));
  }).slice(0, 6);

  relevantContradictions.forEach((c: any) => {
    retrievedSources.push({
      title: `Inconsistency: ${c.title}`,
      documentName: c.statementA?.sourceDocument || c.statementB?.sourceDocument || "Cross-Document Comparison",
      page: c.statementA?.page || c.statementB?.page,
      quote: `${c.statementA?.sourceDocument}: "${c.statementA?.text}" vs ${c.statementB?.sourceDocument}: "${c.statementB?.text}"`,
      infoType: c.status === "confirmed_contradiction" ? "lawyer-confirmed" : "ai-suggestion",
    });
  });

  // 4. Relationships
  const relationships = matterContext.relationships || [];
  const relevantRelationships = relationships.filter((r: any) => {
    const rLower = (r.sourceDocName + " " + r.targetDocName + " " + r.relationshipType + " " + r.description).toLowerCase();
    return queryTokens.some((t: string) => rLower.includes(t)) || queryType === "matter_summary";
  }).slice(0, 6);

  // 5. Missing Info
  const missingInfo = matterContext.missingInformation || [];
  const relevantMissing = missingInfo.filter((m: any) => {
    const mLower = (m.item + " " + m.referencedByDocument + " " + m.explanation).toLowerCase();
    return queryTokens.some((t: string) => mLower.includes(t)) || qLower.includes("missing") || queryType === "matter_summary";
  }).slice(0, 5);

  // 6. Relevant Document Excerpts (Chunks)
  const docs = matterContext.documentsSummary || [];
  const matchedDocChunks: Array<{ filename: string; excerpt: string; category: string }> = [];
  docs.forEach((doc: any) => {
    const text = doc.summary || doc.contentSummary || doc.extractedText || "";
    const lowerText = text.toLowerCase();
    let hasMatch = queryTokens.some((tok: string) => lowerText.includes(tok));
    if (hasMatch || queryType === "matter_summary") {
      matchedDocChunks.push({
        filename: doc.filename,
        category: doc.category || "Legal Record",
        excerpt: text.slice(0, 800),
      });
    }
  });

  // Compose Focused Context Block
  const contextBlock = `
=== RETRIEVED MATTER CONTEXT (SELECTED FOR QUERY) ===
MATTER IDENTITY:
- Name: ${matterContext.matterName}
- Number: ${matterContext.matterNumber || "N/A"}
- Client: ${matterContext.client}
- Opposing Party: ${matterContext.opposingParty || "Not stated on record"}
- Court/Jurisdiction: ${matterContext.court || matterContext.jurisdiction || "General Jurisdiction"}
- Lead Counsel: ${matterContext.leadAttorney || "Assigned Counsel"}

DOCUMENTS INDEXED ON RECORD:
${docs.map((d: any, i: number) => `${i + 1}. [${d.filename}] (${d.category}): ${d.summary || "Indexed"}`).join("\n") || "No documents uploaded."}

RELEVANT DOCUMENT TEXT EXCERPTS:
${matchedDocChunks.map((c) => `[Document: ${c.filename} | ${c.category}]\n${c.excerpt}`).join("\n\n") || "No text excerpts matched."}

AUTHORITATIVE STRUCTURED FACTS (Prioritized: Lawyer-Confirmed > Extracted):
${selectedFacts.map((f: any) => `- [${f.lawyerVerified ? "LAWYER-CONFIRMED" : (f.factSourceType || "DOCUMENT-FACT").toUpperCase()}] ${f.fact} (Source: ${f.sourceDocument || "Matter"} ${f.page ? `p.${f.page}` : ""})`).join("\n") || "No matching extracted facts."}

CHRONOLOGICAL MILESTONES:
${selectedTimeline.map((e: any) => `- ${e.date}: ${e.event} - ${e.description} [Source: ${e.sourceDocument || "N/A"}]${e.lawyerVerified ? " (LAWYER-VERIFIED)" : ""}${e.hasDateConflict ? " (DATE CONFLICT DETECTED)" : ""}`).join("\n") || "No milestones retrieved."}

POTENTIAL CONTRADICTIONS & INCONSISTENCIES:
${relevantContradictions.map((c: any) => `- [Status: ${c.status}]: ${c.title} — ${c.whyFlagged}\n  Statement A (${c.statementA?.sourceDocument}): "${c.statementA?.text}"\n  Statement B (${c.statementB?.sourceDocument}): "${c.statementB?.text}"`).join("\n") || "None flagged."}

CROSS-DOCUMENT RELATIONSHIPS:
${relevantRelationships.map((r: any) => `- [${r.sourceDocName}] --(${r.relationshipType})--> [${r.targetDocName}]: ${r.description}`).join("\n") || "None identified."}

MISSING DOCUMENTATION & DISCOVERY GAPS:
${relevantMissing.map((m: any) => `- "${m.item}" (Referenced in ${m.referencedByDocument}): ${m.explanation}`).join("\n") || "None identified."}

OPEN LEGAL ISSUES:
${(matterContext.issues || []).map((iss: any) => `- [${iss.status}] ${iss.title}: ${iss.description}`).join("\n") || "None specified."}

MATTER TASKS & ACTION ITEMS:
${(matterContext.tasks || []).map((t: any) => `- [${t.status.toUpperCase()} | Priority: ${t.priority.toUpperCase()}] ${t.title} (Due: ${t.dueDate || "Not set"}, Assigned: ${t.assignedTo || "Unassigned"})${t.isAiSuggested && !t.confirmedByLawyer ? " [AI-SUGGESTED - Awaiting Lawyer Approval]" : ""}`).join("\n") || "No tasks recorded."}

COURT & STATUTORY DEADLINES:
${(matterContext.deadlines || []).map((dl: any) => `- [${dl.date}] ${dl.title} (Status: ${dl.status}, Priority: ${dl.priority})${dl.isLawyerConfirmed ? " [LAWYER-CONFIRMED]" : " [AI-SUGGESTED - Unconfirmed]"}`).join("\n") || "No deadlines recorded."}

ATTORNEY CASE NOTES & WORK PRODUCT:
${(matterContext.notes || []).map((n: any) => `- [Note by ${n.author}]: "${n.title}"\n  ${n.content.slice(0, 300)}`).join("\n") || "No attorney notes recorded."}

EVIDENCE MATRIX:
${(matterContext.evidence || []).map((e: any) => `- [${e.status}] ${e.name} (${e.type}) — Source: ${e.sourceDocument || "Exhibit record"}`).join("\n") || "No evidence recorded."}
=== END RETRIEVED CONTEXT ===`;

  return {
    queryType,
    isFastPath: false,
    contextBlock,
    retrievedSources,
  };
}

export const MATTEROS_SYSTEM_INSTRUCTION = `You are MATTEROS AI, an intelligent, confidential legal matter assistant operating strictly inside the user's selected matter.

PRIMARY OBJECTIVE & FIDELITY CONSTRAINTS:
1. MATTER-SPECIFIC GROUNDING: You operate exclusively within the provided matter materials. You must NEVER assume or incorporate facts from outside the selected matter context.
2. SOURCE-FIRST REASONING: Ground every single factual statement strictly in the provided matter intelligence.
3. CITATION REQUIREMENTS: Always provide clear inline source citations when referencing facts, dates, clauses, or statements (e.g., "[Agreement.pdf — Section 4.2]" or "[Letter.pdf — Page 2]").
4. UNSUPPORTED INFORMATION PROTOCOL:
   - If the retrieved matter information does not support the answer, DO NOT GUESS OR INVENT.
   - Use explicitly: "I couldn't find support for this in the documents currently available in this matter."
   - If the information may exist but retrieval is uncertain, state: "I couldn't locate supporting information in the currently indexed matter records."
5. LEGAL AUTHORITY BOUNDARY:
   - DO NOT fabricate case law, citations, statutes, regulations, court decisions, or legal quotations.
   - If asked for legal authority or external precedents not contained in the matter's available records, explicitly clarify:
     "External legal research (statutes, case law precedents, and court opinions) is outside the currently indexed matter sources."
   - Never present general legal knowledge as though it came from the uploaded documents.
6. DISTINGUISH INFORMATION TYPES:
   - Make clear in your text whether a point is a direct Document Fact, Lawyer Input, Lawyer Confirmed finding, AI Interpretation, or an AI Suggestion.
   - Authoritative priority: Lawyer Confirmed > Lawyer Input > Document Fact > AI Interpretation.
7. AI ACTION BOUNDARY:
   - You may suggest strategic next steps or actions, but the lawyer retains all consequential decision-making and legal judgment.
   - You cannot autonomously file court documents, contact opposing parties, close matters, or modify confirmed deadlines.
8. FORMATTING: Use structured, crisp Markdown (headings, bullet points, bold key terms) so practicing attorneys can review findings in seconds.`;

export async function askMatterAssistant(
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  matterContext: any,
  modelMode: "pro" | "flash" | "lite" = "flash"
): Promise<{
  answer: string;
  queryType: string;
  isFastPath: boolean;
  citations: Array<{
    documentName: string;
    pageOrClause?: string;
    quote?: string;
    entityType?: "fact" | "event" | "issue" | "contradiction" | "document";
    entityId?: string;
  }>;
  sources: Array<{
    title: string;
    documentName: string;
    page?: string;
    section?: string;
    quote?: string;
    infoType: "document-fact" | "lawyer-input" | "lawyer-confirmed" | "ai-interpretation" | "ai-suggestion";
  }>;
  latencyMetrics: {
    requestStarted: number;
    retrievalStarted: number;
    retrievalCompleted: number;
    geminiStarted?: number;
    generationCompleted?: number;
    totalLatencyMs: number;
  };
}> {
  const reqStart = Date.now();

  // Fast Path Check
  const fastCheck = evaluateFastPathQuery(question, matterContext);
  if (fastCheck.isFastPath) {
    const totalLatency = Date.now() - reqStart;
    return {
      answer: fastCheck.answer || "",
      queryType: "fast_path_database",
      isFastPath: true,
      citations: [],
      sources: fastCheck.sources || [],
      latencyMetrics: {
        requestStarted: reqStart,
        retrievalStarted: reqStart,
        retrievalCompleted: reqStart + 5,
        generationCompleted: reqStart + totalLatency,
        totalLatencyMs: totalLatency,
      },
    };
  }

  const retStart = Date.now();
  const retrieval = buildSelectiveRetrievalContext(question, matterContext);
  const retEnd = Date.now();

  const model = modelMode === "pro" 
    ? "gemini-3.1-pro-preview" 
    : modelMode === "lite" 
    ? "gemini-3.1-flash-lite" 
    : "gemini-3.8-flash";

  // Context management: if history is long, summarize older messages
  let conversationHistory = "";
  if (history && history.length > 0) {
    if (history.length > 6) {
      const older = history.slice(0, history.length - 4);
      const recent = history.slice(-4);
      const summaryNotes = older.map((m) => `(${m.role}): ${m.content.slice(0, 100)}...`).join(" | ");
      conversationHistory = `PRIOR CONVERSATION SUMMARY: [${summaryNotes}]\n\nRECENT DIALOGUE:\n` +
        recent.map((msg) => `${msg.role === "user" ? "Lawyer" : "MATTEROS"}: ${msg.content}`).join("\n\n");
    } else {
      conversationHistory = history
        .map((msg) => `${msg.role === "user" ? "Lawyer" : "MATTEROS"}: ${msg.content}`)
        .join("\n\n");
    }
  }

  const prompt = `${retrieval.contextBlock}

${conversationHistory ? `${conversationHistory}\n\n` : ""}LAWYER'S INQUIRY:
"${question}"

Analyze the inquiry against the retrieved matter context. Formulate a comprehensive, highly grounded legal response in clean Markdown with explicit inline document citations.`;

  const config: any = {
    systemInstruction: MATTEROS_SYSTEM_INSTRUCTION,
  };

  if (model === "gemini-3.1-pro-preview") {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const geminiStart = Date.now();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });
  const genEnd = Date.now();

  const text = response.text || "I couldn't locate supporting information in the currently indexed matter records.";

  // Extract inline document mentions as citations
  const citations = retrieval.retrievedSources.map((s) => ({
    documentName: s.documentName,
    pageOrClause: s.page || s.section,
    quote: s.quote,
    entityType: "document" as const,
  }));

  return {
    answer: text,
    queryType: retrieval.queryType,
    isFastPath: false,
    citations,
    sources: retrieval.retrievedSources,
    latencyMetrics: {
      requestStarted: reqStart,
      retrievalStarted: retStart,
      retrievalCompleted: retEnd,
      geminiStarted: geminiStart,
      generationCompleted: genEnd,
      totalLatencyMs: genEnd - reqStart,
    },
  };
}

export async function streamMatterAssistant(
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  matterContext: any,
  modelMode: "pro" | "flash" | "lite" = "flash",
  onEvent: (event: {
    type: "metadata" | "delta" | "done" | "error";
    data?: any;
  }) => void
): Promise<void> {
  const reqStart = Date.now();

  // 1. Fast Path Check
  const fastCheck = evaluateFastPathQuery(question, matterContext);
  if (fastCheck.isFastPath) {
    const latency = Date.now() - reqStart;
    onEvent({
      type: "metadata",
      data: {
        isFastPath: true,
        queryType: "fast_path_database",
        sources: fastCheck.sources || [],
        latencyMetrics: {
          requestStarted: reqStart,
          retrievalStarted: reqStart,
          retrievalCompleted: reqStart + 3,
          firstTokenReceived: reqStart + 5,
          totalLatencyMs: latency,
        },
      },
    });

    onEvent({
      type: "delta",
      data: { text: fastCheck.answer || "" },
    });

    onEvent({
      type: "done",
      data: {
        totalLatencyMs: latency,
        answer: fastCheck.answer,
        isFastPath: true,
        queryType: "fast_path_database",
        sources: fastCheck.sources || [],
      },
    });
    return;
  }

  // 2. Retrieval-First
  const retStart = Date.now();
  const retrieval = buildSelectiveRetrievalContext(question, matterContext);
  const retEnd = Date.now();

  const model = modelMode === "pro" 
    ? "gemini-3.1-pro-preview" 
    : modelMode === "lite" 
    ? "gemini-3.1-flash-lite" 
    : "gemini-3.8-flash";

  // Context management for history
  let conversationHistory = "";
  if (history && history.length > 0) {
    if (history.length > 6) {
      const older = history.slice(0, history.length - 4);
      const recent = history.slice(-4);
      const summaryNotes = older.map((m) => `(${m.role}): ${m.content.slice(0, 100)}...`).join(" | ");
      conversationHistory = `PRIOR CONVERSATION SUMMARY: [${summaryNotes}]\n\nRECENT DIALOGUE:\n` +
        recent.map((msg) => `${msg.role === "user" ? "Lawyer" : "MATTEROS"}: ${msg.content}`).join("\n\n");
    } else {
      conversationHistory = history
        .map((msg) => `${msg.role === "user" ? "Lawyer" : "MATTEROS"}: ${msg.content}`)
        .join("\n\n");
    }
  }

  const prompt = `${retrieval.contextBlock}

${conversationHistory ? `${conversationHistory}\n\n` : ""}LAWYER'S INQUIRY:
"${question}"

Analyze the inquiry against the retrieved matter context. Formulate a comprehensive, highly grounded legal response in clean Markdown with explicit inline document citations.`;

  const config: any = {
    systemInstruction: MATTEROS_SYSTEM_INSTRUCTION,
  };

  if (model === "gemini-3.1-pro-preview") {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const geminiStart = Date.now();
  let firstTokenReceived: number | undefined;

  onEvent({
    type: "metadata",
    data: {
      isFastPath: false,
      queryType: retrieval.queryType,
      sources: retrieval.retrievedSources,
      retrievalLatencyMs: retEnd - retStart,
    },
  });

  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config,
    });

    let fullAnswer = "";

    for await (const chunk of stream) {
      if (!firstTokenReceived) {
        firstTokenReceived = Date.now();
      }
      const chunkText = chunk.text || "";
      if (chunkText) {
        fullAnswer += chunkText;
        onEvent({
          type: "delta",
          data: { text: chunkText },
        });
      }
    }

    const genEnd = Date.now();
    const citations = retrieval.retrievedSources.map((s) => ({
      documentName: s.documentName,
      pageOrClause: s.page || s.section,
      quote: s.quote,
      entityType: "document" as const,
    }));

    onEvent({
      type: "done",
      data: {
        answer: fullAnswer,
        queryType: retrieval.queryType,
        isFastPath: false,
        citations,
        sources: retrieval.retrievedSources,
        latencyMetrics: {
          requestStarted: reqStart,
          retrievalStarted: retStart,
          retrievalCompleted: retEnd,
          geminiStarted: geminiStart,
          firstTokenReceived: firstTokenReceived || genEnd,
          generationCompleted: genEnd,
          totalLatencyMs: genEnd - reqStart,
        },
      },
    });
  } catch (err: any) {
    onEvent({
      type: "error",
      data: { error: err.message || "Failed to generate matter intelligence" },
    });
  }
}

