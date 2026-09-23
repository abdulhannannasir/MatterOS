import React, { useState } from "react";
import {
  Settings,
  Scale,
  ShieldCheck,
  Database,
  User,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useAuth } from "../../firebase/authContext.tsx";

interface SettingsViewProps {
  onSeedDemoData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSeedDemoData }) => {
  const { userProfile, updateUserProfileData, isDemoUser } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "Elena Vance, Esq.");
  const [firmName, setFirmName] = useState(userProfile?.firmName || "Sterling Vance & Associates LLP");
  const [role, setRole] = useState(userProfile?.role || "Senior Managing Partner");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfileData({
        displayName,
        firmName,
        role,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await onSeedDemoData();
      alert("Sample firm cases, documents, timeline milestones, and issues seeded successfully!");
    } catch (err: any) {
      alert("Failed to seed sample data: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
          Firm & Security Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Lawyer credentials, Gemini intelligence engine configuration, and Firestore data persistence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attorney & Firm Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <User className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Attorney Profile & Law Practice
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {savedSuccess && (
                <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Profile updated in database.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Counsel Full Name & Credentials
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Law Firm / Chambers
                  </label>
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Practice Role / Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Registered Email (Read-Only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={userProfile?.email || "counsel@firm.law"}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-md text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Update Practice Credentials"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Seed Sample Cases */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Sample Legal Cases & Practice Data
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Populate realistic complex commercial litigation, ICC arbitration, and SEC regulatory inquiry cases with verified pleadings, contracts, expert reports, timelines, and issues.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${seeding ? "animate-spin" : ""}`} />
              <span>{seeding ? "Seeding Cases..." : "Re-Seed Practice Sample Cases into Firestore"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Engine & Security Safeguards */}
        <div className="space-y-6">
          {/* AI Intelligence Architecture */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">Intelligence Pipeline</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span>Default Analysis Model:</span>
                <span className="font-mono text-amber-300">Gemini 3.5 Flash</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span>Complex Reasoning Model:</span>
                <span className="font-mono text-amber-300">Gemini 3.1 Pro (Thinking)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span>Low Latency Model:</span>
                <span className="font-mono text-amber-300">Gemini 3.1 Flash Lite</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex justify-between">
                <span>Architecture:</span>
                <span className="text-emerald-400 font-mono">Server-Side Proxy (Secure)</span>
              </div>
            </div>
          </div>

          {/* Ethics & Privilege Safe Harbor */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Privilege & Safe Harbor</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong>ABA Model Rule 1.6 Compliance:</strong> MATTEROS enforces strict multi-tenant boundary isolation. Document processing remains confidential.
              </p>
              <p>
                <strong>Independent Legal Judgment:</strong> MATTEROS outputs assist counsel and do not replace legal representation or formal ethical responsibilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
