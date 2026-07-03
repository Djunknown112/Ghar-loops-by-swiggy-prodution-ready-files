import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { ShieldCheck, LogOut, Lock, Database, CreditCard, Sparkles, Check, Terminal } from "lucide-react";

interface ProfileTabProps {
  profile: UserProfile;
  isGuest: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export default function ProfileTab({
  profile,
  isGuest,
  onUpdateProfile,
  onSignInWithGoogle,
  onSignOut
}: ProfileTabProps) {
  const [budgetVal, setBudgetVal] = useState<number>(profile.monthlyBudget);
  const [editingBudget, setEditingBudget] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [emailVal, setEmailVal] = useState<string>(profile.email || "");
  const [phoneVal, setPhoneVal] = useState<string>(profile.phoneNumber || "");

  useEffect(() => {
    setEmailVal(profile.email || "");
    setPhoneVal(profile.phoneNumber || "");
  }, [profile.email, profile.phoneNumber]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetVal(Number(e.target.value));
  };

  const saveBudget = async () => {
    await onUpdateProfile({ monthlyBudget: budgetVal });
    setEditingBudget(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePersonaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = e.target.value as any;
    await onUpdateProfile({ persona: p });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDisplayNameChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val && val !== profile.displayName) {
      await onUpdateProfile({ displayName: val });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleEmailChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val !== profile.email) {
      await onUpdateProfile({ email: val });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handlePhoneChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val !== profile.phoneNumber) {
      await onUpdateProfile({ phoneNumber: val });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div id="profile-tab" className="space-y-6 pb-20">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FC8019]">Security & Profile</span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Household Profile</h1>
        <p className="text-xs text-slate-500 font-medium">Control budget goals, personas, and privacy configurations</p>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
          <Check className="w-4 h-4 text-emerald-500" />
          Settings updated successfully!
        </div>
      )}

      {/* Profile Card & Google Sign-In Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF0E6] text-[#FC8019] flex items-center justify-center font-black text-lg border border-[#FC8019]/10">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <input
              type="text"
              defaultValue={profile.displayName}
              onBlur={handleDisplayNameChange}
              placeholder="Name"
              className="text-base font-black text-slate-800 focus:outline-none focus:border-b focus:border-[#FC8019] border-b border-transparent pb-0.5 bg-transparent"
            />
            <p className="text-xs text-slate-400 font-medium">{profile.email}</p>
          </div>
        </div>

        {isGuest ? (
          <div className="bg-[#FFF5ED] border border-orange-100 rounded-xl p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#FC8019] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-slate-800">You are browsing in Guest Mode</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Your data is currently backed up in your local browser sandbox. Log in with Google to synchronize schedules across devices and unlock persistent cloud-sync storage.
                </p>
              </div>
            </div>
            <button
              onClick={onSignInWithGoogle}
              className="w-full bg-[#FC8019] hover:bg-[#e06e12] text-white py-2 px-4 rounded-lg text-xs font-black tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              Sign In with Google Account
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500">Connected with Google</span>
            <button
              onClick={onSignOut}
              className="text-xs font-bold text-slate-500 hover:text-rose-500 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        )}
      </div>

      {/* Household Settings Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Household Configuration</h2>

        {/* Persona Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800">Household Persona</label>
          <p className="text-[10px] text-slate-400">Customizes reorder consolidation recommendations</p>
          <select
            value={profile.persona}
            onChange={handlePersonaChange}
            className="w-full bg-slate-50 text-xs font-bold text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/50 focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
          >
            <option value="Family Planner">Family Planner (Standard Groceries & Subscriptions)</option>
            <option value="Single Professional">Single Professional (Convenience Foods & Milk)</option>
            <option value="Student">Student (Meals & Snacks Focus)</option>
            <option value="Elderly Caretaker">Elderly Caretaker (Medicines & Daily Essentials)</option>
          </select>
        </div>

        {/* Email & Mobile Number Configuration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800">Email Address</label>
            <input
              type="email"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              onBlur={handleEmailChange}
              placeholder="email@example.com"
              className="w-full bg-slate-50 text-xs font-bold text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/50 focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800">Mobile Number</label>
            <input
              type="tel"
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value)}
              onBlur={handlePhoneChange}
              placeholder="+91XXXXXXXXXX"
              className="w-full bg-slate-50 text-xs font-bold text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/50 focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
            />
          </div>
        </div>

        {/* Budget Goals Config */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-xs font-black text-slate-800">Monthly Budget Threshold</label>
              <p className="text-[10px] text-slate-400">Trigger warnings as you approach this limit</p>
            </div>
            <span className="text-sm font-black text-slate-800">₹{budgetVal.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={budgetVal}
              onChange={handleBudgetChange}
              onMouseUp={saveBudget}
              onTouchEnd={saveBudget}
              className="w-full accent-[#FC8019]"
            />
          </div>
        </div>

        {/* Developer Console Toggle */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-2">
          <div className="flex gap-2.5 items-center">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-500 shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Developer Console Logs</p>
              <p className="text-[10px] text-slate-400 font-semibold">Enable debug terminal view & logs</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!profile.developerMode}
              onChange={async (e) => {
                await onUpdateProfile({ developerMode: e.target.checked });
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 2000);
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FC8019]"></div>
          </label>
        </div>
      </div>

      {/* DATA & PRIVACY COMPLIANCE CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Lock className="w-4 h-4 text-[#FC8019]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Data & Privacy Compliance</h2>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-1 rounded-lg mt-0.5 shrink-0">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Scoped User Firestore Vault</p>
              <p className="text-[10px] text-slate-400 leading-snug">
                All scheduled items, delivery history, and approvals are stored per-user, isolated securely to your signed-in Google account UID.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-1 rounded-lg mt-0.5 shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">No Cards or Payment Data Collected</p>
              <p className="text-[10px] text-slate-400 leading-snug">
                GharLoop never requests, processes, or stores credit cards or banking details. Real order payments are completed on Swiggy's native authenticated checkout application securely.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-1 rounded-lg mt-0.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Strict Permission Boundaries</p>
              <p className="text-[10px] text-slate-400 leading-snug">
                No orders are ever initiated without either (1) explicit "Auto-order" opt-in preference enabled per item by you, or (2) manual validation via "Ask me first" approval card actions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
