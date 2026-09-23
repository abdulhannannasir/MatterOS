import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  FileText,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Bot,
  User,
  Quote,
  Scale,
  Copy,
  Check,
  Square,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Matter,
  DocumentItem,
  ChatMessage,
  InformationType,
  MatterFact,
  MatterContradiction,
  TimelineEvent,
  Issue,
  Deadline,
} from "../../../types/matteros.ts";

interface AiWorkspaceTabProps {
  matter: Matter;
  documents: DocumentItem[];
  facts?: MatterFact[];
  contradictions?: MatterContradiction[];
  timeline?: TimelineEvent[];
  issues?: Issue[];
  deadlines?: Deadline[];
  chatMessages: ChatMessage[];
  onSendMessage: (query: string, modelMode: "pro" | "flash" | "lite") => Promise<void>;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  isThinking: boolean;
  onClearChat: () => void;
  onPreviewSourceDoc?: (docName: string) => void;
}

export const AiWorkspaceTab: React.FC<AiWorkspaceTabProps> = ({
  matter,
  documents,
  facts = [],
  contradictions = [],
  timeline = [],
  issues = [],
  deadlines = [],
  chatMessages,
  onSendMessage,
  onStopStreaming,
  isStreaming = false,
  isThinking,
  onClearChat,
  onPreviewSourceDoc,
}) => {
  const [inputText, setInputText] = useState("");
  const [modelMode, setModelMode] = useState<"pro" | "flash" | "lite">("flash");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isThinking, isStreaming]);

  // Context-aware suggested legal questions
  const dynamicSuggestedQuestions = [
    "Summarize this matter.",
    "What are the strongest factual points on record?",
    contradictions.length > 0
      ? "What contradictions or inconsistencies have been identified?"
      : "Are there any conflicting dates or assertions?",
    "Give me the complete chronology of events.",
    "What is the case number and current status?",
    "Who is the client and who is the opposing party?",
    deadlines.length > 0
      ? "What deadlines are recorded for this case?"
      : "What procedural deadlines apply?",
    "Which documents support the main claim?",
    "What information or discovery exhibits are missing?",
  ];

  const handleSubmit = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : inputText).trim();
    if (!textToSend || isThinking || isStreaming) return;

    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSendMessage(textToSend, modelMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderInfoTypeBadge = (type?: InformationType) => {
    switch (type) {
      case "document-fact":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
            Document Fact
          </span>
        );
      case "lawyer-confirmed":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/80">
            Lawyer Confirmed
          </span>
        );
      case "lawyer-input":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/80">
            Lawyer Input
          </span>
        );
      case "ai-interpretation":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80">
            AI Interpretation
          </span>
        );
      case "ai-suggestion":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            AI Suggestion
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            Matter Source
          </span>
        );
    }
  };

  // Helper to render markdown content with clickable citations
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");

    return (
      <div className="space-y-2 text-xs leading-relaxed font-sans text-slate-200">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();

          // Headers
          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={lineIdx} className="text-xs font-bold text-amber-400 pt-2 font-mono uppercase tracking-wide">
                {trimmed.replace(/^###\s+/, "")}
              </h4>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h3 key={lineIdx} className="text-sm font-bold text-slate-100 pt-3 border-b border-slate-800/80 pb-1">
                {trimmed.replace(/^##\s+/, "")}
              </h3>
            );
          }
          if (trimmed.startsWith("# ")) {
            return (
              <h2 key={lineIdx} className="text-sm font-extrabold text-amber-300 pt-3">
                {trimmed.replace(/^#\s+/, "")}
              </h2>
            );
          }

          // Bullet points
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={lineIdx} className="flex items-start space-x-2 pl-2">
                <span className="text-amber-500 font-mono mt-0.5">•</span>
                <span className="flex-1">{parseFormattedText(trimmed.replace(/^[-*]\s+/, ""))}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={lineIdx} className="flex items-start space-x-2 pl-2">
                <span className="text-amber-400 font-mono font-semibold">{numMatch[1]}.</span>
                <span className="flex-1">{parseFormattedText(numMatch[2])}</span>
              </div>
            );
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            return (
              <div
                key={lineIdx}
                className="pl-3 py-1 border-l-2 border-amber-500/70 bg-amber-500/5 text-slate-300 italic rounded-r text-[11px]"
              >
                {parseFormattedText(trimmed.replace(/^>\s+/, ""))}
              </div>
            );
          }

          // Empty line
          if (!trimmed) {
            return <div key={lineIdx} className="h-1" />;
          }

          // Regular paragraph
          return <p key={lineIdx}>{parseFormattedText(line)}</p>;
        })}
      </div>
    );
  };

  // Helper to format bold, code, and inline citations inside text
  const parseFormattedText = (text: string) => {
    // Match inline bold **bold**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Inline document citation [Document.pdf — Page X]
      if (part.startsWith("[") && part.endsWith("]") && (part.includes(".pdf") || part.includes("Doc") || part.includes("Contract") || part.includes("Page") || part.includes("Report"))) {
        const raw = part.slice(1, -1);
        const docName = raw.split("—")[0].trim();
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onPreviewSourceDoc?.(docName)}
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono cursor-pointer transition-colors"
            title={`Preview cited record: ${raw}`}
          >
            <FileText className="w-2.5 h-2.5" />
            <span>{raw}</span>
            <ExternalLink className="w-2 h-2 ml-0.5 opacity-60" />
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[78vh] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-sm font-semibold text-slate-100 font-sans tracking-tight">
                MATTEROS AI
              </h3>
              <span className="text-[11px] text-slate-400 font-sans">
                • Matter-Grounded Intelligence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                {matter.matterName} ({matter.matterNumber || "File Record"})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {documents.length} Docs Indexed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Retrieval-first legal reasoning grounded strictly in active case records. Fast path database lookups enabled.
            </p>
          </div>
        </div>

        {/* Header Controls: Legend, Model Switcher, Clear */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`px-2.5 py-1.5 rounded-md border text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              showLegend
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Information Types Legend"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Legend</span>
            {showLegend ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <select
            value={modelMode}
            onChange={(e) => setModelMode(e.target.value as any)}
            disabled={isStreaming || isThinking}
            className="px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono disabled:opacity-50 cursor-pointer"
          >
            <option value="flash">Gemini 3.8 Flash (Balanced & Fast)</option>
            <option value="pro">Gemini 3.1 Pro (Deep Legal Reasoning)</option>
            <option value="lite">Gemini 3.1 Flash Lite (Ultra Low Latency)</option>
          </select>

          <button
            onClick={onClearChat}
            disabled={isStreaming}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            title="Clear Matter Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Information Types Legend Drawer */}
      {showLegend && (
        <div className="p-3 bg-slate-950/95 border-b border-slate-800/80 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-5 gap-2 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-slate-200 font-mono">Document Fact</p>
              <p className="text-[10px] text-slate-400">Directly extracted from records</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-slate-200 font-mono">Lawyer Confirmed</p>
              <p className="text-[10px] text-slate-400">Verified by counsel</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-slate-200 font-mono">Lawyer Input</p>
              <p className="text-[10px] text-slate-400">Manually entered by counsel</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-slate-200 font-mono">AI Interpretation</p>
              <p className="text-[10px] text-slate-400">Synthesized reasoning</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-slate-200 font-mono">AI Suggestion</p>
              <p className="text-[10px] text-slate-400">Flagged potential gap/issue</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="py-8 max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-slate-200 font-sans">
                Matter-Specific Legal AI Assistant
              </h4>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Operating strictly inside <strong className="text-slate-200">{matter.matterName}</strong>.
                Ask about key claims, timeline chronology, contradictory evidence, or procedural deadlines.
              </p>
            </div>

            {/* Suggested Questions Grid */}
            <div className="space-y-2 pt-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Suggested Case Inquiries:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {dynamicSuggestedQuestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(prompt)}
                    className="p-3 text-left rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 text-xs text-slate-300 transition-all leading-relaxed group cursor-pointer flex items-start justify-between shadow-sm"
                  >
                    <span className="group-hover:text-amber-300 transition-colors">
                      "{prompt}"
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500/40 group-hover:text-amber-400 shrink-0 mt-0.5 ml-1 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-500/10 text-slate-100 border border-amber-500/30 ml-12"
                    : "bg-slate-950/90 text-slate-200 border border-slate-800 shadow-lg space-y-3"
                }`}
              >
                {/* Header bar inside message */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2 gap-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[11px] text-slate-400 font-mono uppercase">
                      {msg.role === "user" ? "Counsel Inquiry" : "MATTEROS Intelligence"}
                    </span>

                    {/* Query classification tag */}
                    {msg.isFastPath ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Fast Path (Database Lookup)</span>
                      </span>
                    ) : msg.queryType ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {msg.queryType.replace(/_/g, " ")}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    {/* Latency metric badge */}
                    {msg.latencyMetrics && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {msg.latencyMetrics.totalLatencyMs < 100
                            ? `${msg.latencyMetrics.totalLatencyMs}ms`
                            : `${(msg.latencyMetrics.totalLatencyMs / 1000).toFixed(2)}s`}
                        </span>
                      </span>
                    )}

                    {msg.modelUsed && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {msg.modelUsed}
                      </span>
                    )}

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors cursor-pointer"
                      title="Copy response text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="leading-relaxed">
                  {renderMessageContent(msg.content)}
                  {msg.status === "streaming" && (
                    <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-1 align-middle" />
                  )}
                  {msg.status === "stopped" && (
                    <p className="text-[11px] text-amber-500/80 italic mt-2">
                      [Generation stopped by counsel]
                    </p>
                  )}
                </div>

                {/* Grounded Source Citations */}
                {((msg.sources && msg.sources.length > 0) || (msg.citations && msg.citations.length > 0)) && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-mono text-amber-400/90 font-semibold block flex items-center space-x-1">
                      <Quote className="w-3 h-3" />
                      <span>Verified Matter Sources & Citations:</span>
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {msg.sources && msg.sources.length > 0
                        ? msg.sources.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => onPreviewSourceDoc?.(src.documentName)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group flex flex-col space-y-0.5"
                            >
                              <div className="flex items-center space-x-1.5">
                                <FileText className="w-3 h-3 text-amber-400" />
                                <span className="text-[11px] font-mono text-slate-200 group-hover:text-amber-300 font-semibold">
                                  {src.documentName}
                                </span>
                                {(src.page || src.section) && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {src.page ? `p. ${src.page}` : src.section}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5 pt-0.5">
                                {renderInfoTypeBadge(src.infoType)}
                                {src.title && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                    {src.title}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        : (msg.citations || []).map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => onPreviewSourceDoc?.(c.documentName)}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-amber-300/90 hover:text-amber-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-amber-400" />
                              <span className="font-mono">{c.documentName}</span>
                              {c.pageOrClause && (
                                <span className="text-slate-400 font-sans">({c.pageOrClause})</span>
                              )}
                            </button>
                          ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Thinking Indicator (prior to first token stream) */}
        {isThinking && !isStreaming && (
          <div className="flex items-start space-x-3 justify-start animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-center space-x-3 shadow-md">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                {modelMode === "pro"
                  ? "Gemini 3.1 Pro is executing deep multi-file legal reasoning and verification..."
                  : "Retrieving prioritized facts and synthesizing grounded legal response..."}
              </span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Query Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/95 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-end space-x-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask an inquiry grounded strictly in this matter's uploaded documents (Enter to send, Shift+Enter for new line)..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              disabled={isThinking || isStreaming}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans disabled:opacity-50 resize-none max-h-32 scrollbar-thin"
            />
          </div>

          {/* If streaming, offer Stop button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1"
              title="Stop Streaming Generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono text-[11px] hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center"
              title="Send Inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 px-1">
          <span>
            Strict legal work product boundary: AI assists counsel and never automatically performs consequential legal acts.
          </span>
          <span className="font-mono text-slate-400">
            {matter.matterName} • {documents.length} Records
          </span>
        </div>
      </div>
    </div>
  );
};
