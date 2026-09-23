import React, { useState } from "react";
import { X, Briefcase, Plus, Scale } from "lucide-react";
import { Matter, MatterStatus, MatterPriority } from "../../types/matteros.ts";

interface NewMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatter: (matterData: Omit<Matter, "id">) => Promise<void>;
  userId: string;
}

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  onCreateMatter,
  userId,
}) => {
  const [matterName, setMatterName] = useState("");
  const [matterNumber, setMatterNumber] = useState(
    `MAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [client, setClient] = useState("");
  const [opposingParty, setOpposingParty] = useState("");
  const [matterType, setMatterType] = useState("Commercial Litigation");
  const [jurisdiction, setJurisdiction] = useState("");
  const [court, setCourt] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MatterPriority>("Normal");
  const [status, setStatus] = useState<MatterStatus>("Active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matterName.trim() || !client.trim()) {
      setError("Matter name and client name are required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreateMatter({
        ownerId: userId,
        matterName: matterName.trim(),
        matterNumber: matterNumber.trim(),
        client: client.trim(),
        opposingParty: opposingParty.trim() || undefined,
        matterType,
        jurisdiction: jurisdiction.trim() || undefined,
        court: court.trim() || undefined,
        caseNumber: caseNumber.trim() || undefined,
        description: description.trim(),
        status,
        priority,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentCount: 0,
        deadlineCount: 0,
        lastActivity: "Matter created",
      });
      onClose();
    } catch (err: any) {
      console.error("Failed to create matter:", err);
      setError(err.message || "Failed to create matter in database.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-sans">
                Open New Legal Matter
              </h3>
              <p className="text-xs text-slate-400">Initialize confidential case workspace and document index</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {error && (
            <div className="p-3 rounded bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Matter Title / Case Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Meridian Holdings v. Crestview Infrastructure"
                value={matterName}
                onChange={(e) => setMatterName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Matter Number
              </label>
              <input
                type="text"
                required
                value={matterNumber}
                onChange={(e) => setMatterNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Client (Represented Party) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Meridian Holdings Ltd"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Opposing Party (if applicable)
              </label>
              <input
                type="text"
                placeholder="e.g. Crestview Infrastructure Partners LLC"
                value={opposingParty}
                onChange={(e) => setOpposingParty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Matter Type
              </label>
              <select
                value={matterType}
                onChange={(e) => setMatterType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Commercial Litigation">Commercial Litigation</option>
                <option value="IP Infringement & Licensing">IP Infringement & Licensing</option>
                <option value="Regulatory Enforcement">Regulatory Enforcement</option>
                <option value="International Arbitration">International Arbitration</option>
                <option value="M&A / Transactional Dispute">M&A / Transactional Dispute</option>
                <option value="Employment & Executive Dispute">Employment & Executive Dispute</option>
                <option value="White Collar & Internal Investigation">White Collar & Internal Investigation</option>
                <option value="General Advisory">General Advisory</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MatterPriority)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatterStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Court / Arbitral Tribunal
              </label>
              <input
                type="text"
                placeholder="e.g. Delaware Court of Chancery / ICC Tribunal"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Docket / Case Number
              </label>
              <input
                type="text"
                placeholder="e.g. C.A. No. 2026-0419-JTL"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Case Narrative & Background
            </label>
            <textarea
              rows={3}
              placeholder="Summary of the claims, legal posture, contract background, and strategic objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{submitting ? "Provisioning..." : "Create Legal Matter"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
