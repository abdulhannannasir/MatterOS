import React from "react";
import { X, Clock, FileText, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";
import { ActivityItem } from "../../types/matteros.ts";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
  onSelectMatter?: (matterId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  activities,
  onSelectMatter,
}) => {
  if (!isOpen) return null;

  const getActivityIcon = (action: string) => {
    if (action.includes("AI") || action.includes("Analyzed")) {
      return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (action.includes("Document")) {
      return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (action.includes("Matter")) {
      return <Briefcase className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Matter Operations & Audit Log
            </h3>
            <p className="text-xs text-slate-400">Verifiable matter activity and intelligence trail</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {activities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>No recent activity logged yet.</p>
            </div>
          ) : (
            activities.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.matterId && onSelectMatter) {
                    onSelectMatter(item.matterId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 transition-all ${
                  item.matterId ? "cursor-pointer hover:border-amber-500/40 hover:bg-slate-950" : ""
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getActivityIcon(item.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200">{item.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.details}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                      <span className="truncate">{item.matterName || "General Practice"}</span>
                      <span className="font-mono text-slate-400">{item.userEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 text-center">
          Cryptographically timestamped attorney audit trail
        </div>
      </div>
    </div>
  );
};
