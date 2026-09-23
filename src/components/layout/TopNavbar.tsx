import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Plus,
  Shield,
  Sparkles,
  Building,
  ChevronDown,
  UserCheck,
  Check,
} from "lucide-react";
import { useAuth } from "../../firebase/authContext.tsx";
import { UserRole } from "../../types/matteros.ts";

interface TopNavbarProps {
  onOpenSearch: () => void;
  onOpenNewMatter: () => void;
  onOpenNotifications: () => void;
  unreadActivitiesCount?: number;
  currentNav: string;
  activeMatterName?: string | null;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenSearch,
  onOpenNewMatter,
  onOpenNotifications,
  unreadActivitiesCount = 0,
  currentNav,
  activeMatterName,
}) => {
  const {
    currentOrg,
    userOrganizations,
    switchOrganization,
    currentRole,
    switchUserRole,
    userProfile,
  } = useAuth();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (currentNav) {
      case "dashboard":
        return "Practice Dashboard";
      case "matters":
        return "Legal Matters";
      case "matter-workspace":
        return activeMatterName ? `Workspace: ${activeMatterName}` : "Matter Workspace";
      case "deadlines":
        return "Calendar & Statutory Deadlines";
      case "team":
        return "Legal Team & RBAC Permissions";
      case "audit":
        return "Compliance Audit Trail & Security";
      case "settings":
        return "Firm & Security Settings";
      default:
        return "MATTEROS";
    }
  };

  const rolesList: Array<{ role: UserRole; name: string; title: string }> = [
    { role: "admin", name: "Elena Vance, Esq.", title: "Managing Admin" },
    { role: "lawyer", name: "Marcus Sterling, Esq.", title: "Partner / Lawyer" },
    { role: "associate", name: "James Chen, Esq.", title: "Associate Counsel" },
    { role: "staff", name: "Sarah Miller, CP", title: "Litigation Paralegal" },
  ];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0 gap-4">
      {/* Left: Page Title & Org Switcher */}
      <div className="flex items-center space-x-4 min-w-0">
        <h1 className="text-sm font-semibold text-slate-100 truncate tracking-tight font-sans">
          {getPageTitle()}
        </h1>

        {/* Organization Switcher Dropdown */}
        <div className="relative" ref={orgMenuRef}>
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
          >
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium max-w-[140px] truncate">{currentOrg?.name || "Law Firm"}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isOrgDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100">
              <div className="px-3 py-1.5 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-800">
                Switch Organization Workspace
              </div>
              {userOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setIsOrgDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition text-slate-200"
                >
                  <div>
                    <div className="font-medium truncate">{org.name}</div>
                    <div className="text-[10px] text-slate-500">{org.subscription.plan} Edition</div>
                  </div>
                  {currentOrg?.id === org.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center/Right: Role Switcher & Global Actions */}
      <div className="flex items-center space-x-3">
        {/* Interactive Role Switcher Pill */}
        <div className="relative hidden md:block" ref={roleMenuRef}>
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 text-xs text-slate-300 transition shadow-inner"
            title="Switch Simulated Role to test RBAC & Delegation"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400">Role:</span>
            <span className="text-[11px] font-semibold text-amber-300 capitalize">{currentRole}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100">
              <div className="px-3 py-1.5 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-800">
                Simulate Role (Test RBAC)
              </div>
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    switchUserRole(item.role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition text-slate-200"
                >
                  <div>
                    <div className="font-semibold text-slate-100">{item.name}</div>
                    <div className="text-[10px] text-amber-400/90">{item.title}</div>
                  </div>
                  {currentRole === item.role && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all shadow-inner group"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          <span className="hidden lg:inline">Search records...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Notifications / Activity Feed */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-md bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
          title="Recent Matter Activity"
        >
          <Bell className="w-4 h-4" />
          {unreadActivitiesCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950"></span>
          )}
        </button>

        {/* Primary Action: New Matter (Disabled or restricted for staff if needed) */}
        {currentRole !== "staff" ? (
          <button
            onClick={onOpenNewMatter}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs shadow-sm transition-all cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Matter</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 italic px-2">Paralegal View</span>
        )}
      </div>
    </header>
  );
};
