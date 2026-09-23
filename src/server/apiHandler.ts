import { IncomingMessage, ServerResponse } from "http";
import {
  analyzeLegalDocument,
  analyzeMultiDocuments,
  askMatterAssistant,
  streamMatterAssistant,
  evaluateFastPathQuery,
  buildSelectiveRetrievalContext,
  ai
} from "./geminiService.js";
import { ThinkingLevel } from "@google/genai";

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export async function handleApiRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || "";

  if (!url.startsWith("/api/")) {
    return false;
  }

  res.setHeader("Content-Type", "application/json");

  // Health check
  if (url === "/api/health" && req.method === "GET") {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
    return true;
  }

  // Document Analysis
  if (url === "/api/analyze-document" && req.method === "POST") {
    try {
      const data = await parseJsonBody(req);
      const { documentText, filename, matterContext, modelMode } = data;
      if (!documentText || !filename) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing documentText or filename" }));
        return true;
      }
      const result = await analyzeLegalDocument(documentText, filename, matterContext, modelMode);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error("API Error in /api/analyze-document:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to analyze document" }));
    }
    return true;
  }

  // Multi-Document Collective Intelligence
  if (url === "/api/matter-ai/multi-document-analyze" && req.method === "POST") {
    try {
      const data = await parseJsonBody(req);
      const { documents, matterContext, existingData, modelMode } = data;
      if (!documents || !documents.length) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing documents array for multi-document intelligence" }));
        return true;
      }
      const result = await analyzeMultiDocuments(documents, matterContext, existingData, modelMode);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error("API Error in /api/matter-ai/multi-document-analyze:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to execute multi-document intelligence" }));
    }
    return true;
  }

  // Streaming Matter Assistant Endpoint (Phase 3 SSE)
  if (url === "/api/matter-ai/chat-stream" && req.method === "POST") {
    try {
      const data = await parseJsonBody(req);
      const question = data.question || data.query;
      const history = data.history || data.conversationHistory || [];
      const modelMode = data.modelMode || "flash";
      const matterContext = data.matterContext || {
        matterName: data.matter?.matterName || "Active Matter",
        matterNumber: data.matter?.matterNumber,
        client: data.matter?.client,
        opposingParty: data.matter?.opposingParty,
        matterType: data.matter?.matterType,
        court: data.matter?.court,
        status: data.matter?.status,
        priority: data.matter?.priority,
        leadAttorney: data.matter?.leadAttorney,
        documentsSummary: data.documentsSummary || data.documents || [],
        facts: data.facts || [],
        timeline: data.timeline || [],
        issues: data.issues || [],
        deadlines: data.deadlines || [],
        contradictions: data.contradictions || [],
        relationships: data.relationships || [],
        missingInformation: data.missingInformation || [],
        tasks: data.tasks || [],
        notes: data.notes || [],
        evidence: data.evidence || [],
      };

      if (!question) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing question" }));
        return true;
      }

      // Set SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      });

      let isClosed = false;
      req.on("close", () => {
        isClosed = true;
      });

      await streamMatterAssistant(question, history, matterContext, modelMode, (event) => {
        if (isClosed) return;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });

      if (!isClosed) {
        res.end();
      }
    } catch (err: any) {
      console.error("API Error in /api/matter-ai/chat-stream:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err.message || "Failed to stream matter assistant" }));
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", data: { error: err.message || "Stream error" } })}\n\n`);
        res.end();
      }
    }
    return true;
  }

  // AI Matter Chat & Grounded Q&A with Selective Retrieval Context (Non-streaming fallback)
  if ((url === "/api/matter-ai/chat" || url === "/api/matter-qa") && req.method === "POST") {
    try {
      const data = await parseJsonBody(req);
      const question = data.question || data.query;
      const history = data.history || data.conversationHistory || [];
      const modelMode = data.modelMode || "flash";

      const matterContext = data.matterContext || {
        matterName: data.matter?.matterName || "Active Matter",
        matterNumber: data.matter?.matterNumber,
        client: data.matter?.client,
        opposingParty: data.matter?.opposingParty,
        matterType: data.matter?.matterType,
        court: data.matter?.court,
        status: data.matter?.status,
        priority: data.matter?.priority,
        leadAttorney: data.matter?.leadAttorney,
        documentsSummary: data.documentsSummary || data.documents || [],
        facts: data.facts || [],
        timeline: data.timeline || [],
        issues: data.issues || [],
        deadlines: data.deadlines || [],
        contradictions: data.contradictions || [],
        relationships: data.relationships || [],
        missingInformation: data.missingInformation || [],
        tasks: data.tasks || [],
        notes: data.notes || [],
        evidence: data.evidence || [],
      };

      if (!question) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing question" }));
        return true;
      }
      const result = await askMatterAssistant(question, history, matterContext, modelMode);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error("API Error in matter chat:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to query matter AI" }));
    }
    return true;
  }

  // Matter Executive Synthesis
  if (url === "/api/matter-ai/synthesize" && req.method === "POST") {
    try {
      const data = await parseJsonBody(req);
      const { matter, documents, timeline, issues, modelMode } = data;
      const model = modelMode === "pro" 
        ? "gemini-3.1-pro-preview" 
        : modelMode === "lite" 
        ? "gemini-3.1-flash-lite" 
        : "gemini-3.5-flash";

      const prompt = `Synthesize an authoritative Legal Case Overview for the following legal matter:
Matter: ${matter.matterName} (#${matter.matterNumber})
Client: ${matter.client}
Opposing: ${matter.opposingParty || "Not stated"}
Jurisdiction/Court: ${matter.court || matter.jurisdiction || "General"}
Description: ${matter.description || ""}

Analyzed Documents (${documents?.length || 0}):
${(documents || []).map((d: any) => `- [${d.filename}] (${d.category}): ${d.contentSummary || d.extractedText?.slice(0, 300) || "No summary"}`).join("\n")}

Key Timeline Events (${timeline?.length || 0}):
${(timeline || []).map((t: any) => `- ${t.date}: ${t.event} (${t.description})`).join("\n")}

Key Legal Issues (${issues?.length || 0}):
${(issues || []).map((i: any) => `- ${i.title} (${i.status}): ${i.description}`).join("\n")}

Produce a structured legal brief with:
1. Executive Summary (objective overview of the claim/dispute)
2. Verified Facts vs Disputed Allegations
3. Strategic Vulnerabilities & Missing Documentation
4. Recommended Immediate Counsel Actions`;

      const config: any = {
        systemInstruction: "You are a Senior Legal Strategist for MATTEROS. Output concise, professional, clear legal analysis.",
      };
      if (model === "gemini-3.1-pro-preview") {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      res.statusCode = 200;
      res.end(JSON.stringify({ synthesis: response.text || "No synthesis generated" }));
    } catch (err: any) {
      console.error("API Error in /api/matter-ai/synthesize:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to synthesize matter overview" }));
    }
    return true;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Endpoint not found" }));
  return true;
}
