import React, { useState } from "react";
import { Scale, Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../firebase/authContext.tsx";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, loginAsDemoLawyer } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await loginWithEmail(email, password);
        if (onClose) onClose();
      } else if (mode === "signup") {
        if (!displayName.trim()) throw new Error("Full attorney name is required");
        await registerWithEmail(email, password, displayName, firmName);
        if (onClose) onClose();
      } else if (mode === "reset") {
        await resetPassword(email);
        setSuccessMessage("Password reset email transmitted. Check your inbox.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Google sign-in was cancelled or encountered an error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Brand Banner */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 text-center relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
            MATTEROS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Legal Matter Intelligence Workspace
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-3 font-medium transition-colors text-center ${
              mode === "signin"
                ? "text-amber-400 border-b-2 border-amber-400 bg-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Counsel Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-3 font-medium transition-colors text-center ${
              mode === "signup"
                ? "text-amber-400 border-b-2 border-amber-400 bg-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register Practice
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-100 transition-all shadow-sm hover:border-slate-600 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (Firebase Auth)</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              or email credentials
            </span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Counsel Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Elena Vance, Esq."
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Law Firm / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sterling & Vance Litigation LLP"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="attorney@lawfirm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>
            </div>

            {mode !== "reset" && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-[10px] text-amber-400/90 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {mode === "signin"
                  ? "Sign In to Workspace"
                  : mode === "signup"
                  ? "Create Attorney Account"
                  : "Send Reset Link"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-slate-800/80">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center mb-2">
              Instant Demo Evaluation Mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  loginAsDemoLawyer("partner");
                  if (onClose) onClose();
                }}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-left transition-all"
              >
                <span className="font-semibold text-amber-300 block truncate">Elena Vance, Esq.</span>
                <span className="text-[10px] text-slate-400 block truncate">Managing Senior Partner</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginAsDemoLawyer("counsel");
                  if (onClose) onClose();
                }}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-left transition-all"
              >
                <span className="font-semibold text-blue-300 block truncate">Marcus Sterling</span>
                <span className="text-[10px] text-slate-400 block truncate">Senior Trial Counsel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Ethics Safe Harbor Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/60 text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Strict Attorney-Client Privilege Protection & SOC-2 Tier Security</span>
        </div>
      </div>
    </div>
  );
};
