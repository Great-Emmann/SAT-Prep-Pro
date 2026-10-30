import React, { useState } from "react";
import { signInWithGoogle, signInAsGuest, logOut } from "../lib/firebase";
import { User, LogOut, CheckCircle, ShieldCheck, X } from "lucide-react";

interface FirebaseAuthModalProps {
  currentUser: any;
  onClose: () => void;
  onUserChanged?: (user: any) => void;
}

export function FirebaseAuthModal({ currentUser, onClose, onUserChanged }: FirebaseAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const user = await signInWithGoogle();
      if (onUserChanged) onUserChanged(user);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const user = await signInAsGuest();
      if (onUserChanged) onUserChanged(user);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to sign in as Guest.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logOut();
      if (onUserChanged) onUserChanged(null);
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Firebase Account & Auth</h3>
            <p className="text-xs text-slate-400 font-medium">Securely identify user & sync study data to Firestore</p>
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4 text-xs font-medium">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-emerald-300" />
              ) : (
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {currentUser.displayName?.[0] || "U"}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span>{currentUser.displayName || "Signed In User"}</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-mono">{currentUser.email || currentUser.uid}</p>
                <p className="text-[10px] text-emerald-700 mt-1 font-semibold">✓ Persistent Firestore Cloud Sync Active</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={15} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-medium">
            <p className="text-slate-600">
              Sign in to enable automatic Firestore database persistence across all your devices, saving study logs, mistake journal entries, test scores, and reminder settings.
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google Account</span>
              </button>

              <button
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <User size={15} />
                <span>Continue as Anonymous Guest</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
