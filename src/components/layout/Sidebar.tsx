import React from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  Settings,
  Scale,
  LogOut,
  User,
  Users,
  Building,
} from "lucide-react";
import { useAuth } from "../../firebase/authContext.tsx";

export type NavItem =
  | "dashboard"
  | "matters"
  | "matter-workspace"
  | "documents"
  | "timeline"
  | "issues"
  | "evidence"
  | "deadlines"
  | "team"
  | "audit"
  | "ai-workspace"
  | "settings";

interface SidebarProps {
  currentNav: NavItem;
  setCurrentNav: (nav: NavItem) => void;
  activeMatterId?: string | null;
  activeMatterName?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  setCurrentNav,
  activeMatterId,
  activeMatterName,
}) => {
  const { userProfile, logout, isDemoUser, currentOrg, currentRole } = useAuth();

  const primaryNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "matters", label: "Matters", icon: Briefcase },
    { id: "deadlines", label: "All Deadlines", icon: Calendar },
    { id: "team", label: "Team & Permissions", icon: Users },
    { id: "audit", label: "Audit & Security", icon: ShieldCheck },
    { id: "settings", label: "Firm Settings", icon: Settings },
  ];

  const matterSpecificNavItems = [
    { id: "overview", label: "Overview", icon: Scale },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "issues", label: "Issues", icon: AlertCircle },
    { id: "evidence", label: "Evidence", icon: ShieldCheck },
    { id: "deadlines", label: "Deadlines", icon: Calendar },
    { id: "ai", label: "AI Intelligence", icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 select-none z-20 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentNav("dashboard")}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold tracking-wider text-sm text-slate-100 font-mono flex items-center space-x-1.5">
              <span>MATTEROS</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-amber-400/90 font-sans border border-slate-700">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Legal Matter Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {/* Practice Management */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-slate-300 uppercase font-mono">
            Practice
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentNav(item.id as NavItem)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-amber-300 border border-amber-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Matter Context */}
        {activeMatterId && (
          <div>
            <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-semibold tracking-widest text-slate-300 uppercase font-mono">
              <span>Active Case</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="px-3 py-2 mb-2 rounded bg-slate-900/80 border border-slate-800 text-xs">
              <p className="font-medium text-slate-200 truncate" title={activeMatterName || "Matter Workspace"}>
                {activeMatterName || "Matter Workspace"}
              </p>
              <button
                onClick={() => setCurrentNav("matter-workspace")}
                className="mt-1 text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Open Workspace</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Demo Indicator */}
        {isDemoUser && (
          <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
            <span className="font-semibold block mb-0.5 text-amber-200">Demo Practice Mode</span>
            Preloaded with mock arbitration and chancery court cases. All intelligence features functional.
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <div className="flex items-center justify-between p-2 rounded-md bg-slate-900/70 border border-slate-800/60">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 text-xs font-semibold shrink-0">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">
                {userProfile?.displayName || "Counsel"}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  {currentRole}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentOrg?.name?.split(" ")[0] || "Firm"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
