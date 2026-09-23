import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  Search,
  Eye,
  Trash2,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FilePlus2,
  RefreshCw,
} from "lucide-react";
import {
  DocumentItem,
  DocumentCategory,
  ProcessingStatus,
  Matter,
} from "../../../types/matteros.ts";

interface DocumentsTabProps {
  matter: Matter;
  documents: DocumentItem[];
  onUploadDocument: (file: File, category: DocumentCategory) => Promise<void>;
  onTriggerAnalysis: (doc: DocumentItem, modelMode: "pro" | "flash" | "lite") => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onPreviewDocument: (doc: DocumentItem) => void;
  onAddSampleDoc?: (title: string, category: DocumentCategory, content: string) => Promise<void>;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  matter,
  documents,
  onUploadDocument,
  onTriggerAnalysis,
  onDeleteDocument,
  onPreviewDocument,
  onAddSampleDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = useState<DocumentCategory>("Pleading");
  const [selectedModel, setSelectedModel] = useState<"pro" | "flash" | "lite">("flash");
  const [uploading, setUploading] = useState(false);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: DocumentCategory[] = [
    "Pleading",
    "Court Order",
    "Contract",
    "Correspondence",
    "Evidence",
    "Affidavit",
    "Notice",
    "Agreement",
    "Other",
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.contentSummary && doc.contentSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.extractedText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === "All" || doc.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUploadDocument(file, selectedCategoryForUpload);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRunAnalysis = async (doc: DocumentItem) => {
    setAnalyzingDocId(doc.id);
    try {
      await onTriggerAnalysis(doc, selectedModel);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const insertQuickSample = async (type: "motion" | "demand" | "witness") => {
    if (!onAddSampleDoc) return;
    if (type === "motion") {
      await onAddSampleDoc(
        "Motion_for_Summary_Judgment_on_Liability.pdf",
        "Pleading",
        `IN THE COURT OF CHANCERY OF THE STATE OF DELAWARE
PLAINTIFF'S MOTION FOR PARTIAL SUMMARY JUDGMENT ON CONTRACT LIABILITY
1. Plaintiff moves under Court of Chancery Rule 56 for summary judgment establishing Defendants' breach of Section 8.2 of the EPC Master Agreement.
2. The undisputed facts show that Defendants missed the Guaranteed Commercial Operation Date of December 1, 2025.
3. Defendants' notice of force majeure was served 87 days late, violating the 5-day notice condition precedent in Section 18.3.
4. Independent technical inspections conclusively establish that inverter trips stemmed from unauthorized hardware substitution.
WHEREFORE, Plaintiff respectfully requests an order entering judgment as to liability and setting trial solely on quantum.`
      );
    } else if (type === "demand") {
      await onAddSampleDoc(
        "Supplemental_Subpoena_Duces_Tecum_Response.pdf",
        "Evidence",
        `STATE OF DELAWARE / SUBPOENA DUCES TECUM PRODUCTION CERTIFICATION
Re: Apex Meridian v. Crestview Infrastructure
Custodians: VP of Procurement, Site Quality Control Engineer
Attached Exhibit A contains 450 pages of internal email correspondence and technical engineering specs concerning Model-X inverter delivery schedules.
Key Email from Site Engineer (dated Oct 15, 2025): 'The OEM supplier warned us that these inverters overheat above 35°C without supplemental chillers. We cannot certify commissioning under the Owner specification.'`
      );
    } else {
      await onAddSampleDoc(
        "Deposition_Transcript_Excerpts_Chief_Engineer.txt",
        "Evidence",
        `CONFIDENTIAL TRIAL DEPOSITION OF DR. JULIAN WEISS (DEFENDANT CHIEF TECHNICAL OFFICER)
Q. Dr. Weiss, did you personally approve the procurement of Model-X inverters for the Cape Meridian facility?
A. Yes, after consultation with our project management team.
Q. Were you aware that Schedule C of the Turnkey Agreement explicitly required Tier-1 BloombergNEF certification?
A. I was aware of the clause, yes.
Q. Did you seek or obtain written Owner consent prior to replacing the contractually specified units?
A. We did not submit a formal variance request to Apex Meridian, no.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Quick Sample Generator */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-sans flex items-center space-x-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Matter Document Repository</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload pleadings, agreements, evidence, or transcripts for deep Gemini intelligence extraction
            </p>
          </div>

          {/* Model Mode Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-sans">Analysis Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="flash">Gemini 3.5 Flash</option>
              <option value="pro">Gemini 3.1 Pro (High Thinking)</option>
              <option value="lite">Gemini 3.1 Flash Lite</option>
            </select>
          </div>
        </div>

        {/* Upload Action Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
            className="hidden"
          />

          <select
            value={selectedCategoryForUpload}
            onChange={(e) => setSelectedCategoryForUpload(e.target.value as DocumentCategory)}
            className="px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{uploading ? "Extracting Text..." : "Upload Case File (PDF / DOCX / TXT)"}</span>
          </button>

          {/* Quick Sample Document Buttons */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span className="text-[11px] text-slate-500">Quick Insert:</span>
            <button
              onClick={() => insertQuickSample("motion")}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
            >
              + Motion for SJ
            </button>
            <button
              onClick={() => insertQuickSample("witness")}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
            >
              + Deposition Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search document names and extracted text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 font-mono">
            {filteredDocs.length} file(s)
          </span>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No documents in this category</p>
          <p className="mt-1">Upload case files or use the quick sample buttons above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isAnalyzing = analyzingDocId === doc.id;
            const isAnalyzed = doc.aiAnalysisStatus === "Completed";

            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-blue-400 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100 hover:text-amber-300 transition-colors cursor-pointer truncate" onClick={() => onPreviewDocument(doc)}>
                          {doc.filename}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {doc.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border flex items-center space-x-1 ${
                            isAnalyzed
                              ? "bg-amber-950/50 text-amber-300 border-amber-800/50"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {isAnalyzed ? (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Gemini Analyzed</span>
                            </>
                          ) : (
                            <span>Pending Analysis</span>
                          )}
                        </span>
                      </div>

                      {doc.contentSummary ? (
                        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                          <span className="font-semibold text-amber-400/90">Summary: </span>
                          {doc.contentSummary}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-mono">
                          {doc.extractedText.slice(0, 140)}...
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-500">
                        <span>Size: {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>Uploaded: {doc.uploadDate.split("T")[0]}</span>
                        <span>•</span>
                        <span>By: {doc.uploadedBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleRunAnalysis(doc)}
                      disabled={isAnalyzing}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                        isAnalyzed
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      } disabled:opacity-50`}
                      title="Trigger Gemini Legal Intelligence"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-amber-400" : ""}`} />
                      <span>{isAnalyzing ? "Analyzing..." : isAnalyzed ? "Re-Analyze" : "Analyze File"}</span>
                    </button>

                    <button
                      onClick={() => onPreviewDocument(doc)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Preview Document Text"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
