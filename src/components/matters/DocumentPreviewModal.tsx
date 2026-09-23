import React from "react";
import { X, FileText, Download, Calendar, Tag, ShieldCheck } from "lucide-react";
import { DocumentItem } from "../../types/matteros.ts";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onTriggerAnalysis?: (doc: DocumentItem) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onTriggerAnalysis,
}) => {
  if (!isOpen || !document) return null;

  const handleDownload = () => {
    const blob = new Blob([document.extractedText || "No text available."], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.filename.replace(/\.pdf$/i, ".txt");
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 truncate font-sans">
                {document.filename}
              </h3>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  <span>{document.category}</span>
                </span>
                <span>•</span>
                <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{document.uploadDate.split("T")[0]}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
              title="Download Extracted Plaintext"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Text</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Summary Banner if Analyzed */}
        {document.contentSummary && (
          <div className="p-3.5 bg-amber-950/20 border-b border-amber-900/30 px-6 text-xs text-amber-200/90 leading-relaxed flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300 block mb-0.5">Gemini Executive Extraction:</span>
              <p className="text-slate-300">{document.contentSummary}</p>
            </div>
          </div>
        )}

        {/* Text Document Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text scrollbar-thin">
          {document.extractedText || "No document text available. Document may be binary format or empty."}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center px-6">
          <span>Uploaded by: {document.uploadedBy || "Counsel"}</span>
          <span>Status: {document.processingStatus}</span>
        </div>
      </div>
    </div>
  );
};
