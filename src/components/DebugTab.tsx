import React from "react";
import { Terminal, Shield, Database, RefreshCw, Trash2, Cpu } from "lucide-react";

interface DebugTabProps {
  agentLogs: string[];
  isGuest: boolean;
  uid: string;
  onClearLogs: () => void;
  onRunAgent: () => void;
  notificationCount: number;
}

export default function DebugTab({
  agentLogs,
  isGuest,
  uid,
  onClearLogs,
  onRunAgent,
  notificationCount
}: DebugTabProps) {
  return (
    <div id="debug-tab" className="space-y-6 pb-20">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Developer Diagnostic Console</span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-rose-500" />
          Debug Console
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Inspect background automation loops, sandbox logs, and sync parameters.
        </p>
      </div>

      {/* System Status Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-[#FC8019]" />
            <span className="text-[10px] font-black uppercase tracking-wider">Storage Layer</span>
          </div>
          <p className="text-xs font-bold text-slate-800">
            {isGuest ? "Browser LocalStorage" : "Live Google Firestore"}
          </p>
          <p className="text-[10px] text-slate-400 leading-none">
            User: {isGuest ? "guest-user" : uid.substring(0, 12) + "..."}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-wider">AI Platform Engine</span>
          </div>
          <p className="text-xs font-bold text-slate-800">Gemini 3.5 Flash</p>
          <p className="text-[10px] text-slate-400 leading-none">
            Server-Side: /api/gemini-insight
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-600">
        <span>Persistent Notifications: {notificationCount}</span>
        <span className="text-slate-300">•</span>
        <span>Environment: Development</span>
      </div>

      {/* Active Agent Logs Panel (Developer-Only Terminal) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            Active Agent Execution Logs
          </span>
          <div className="flex gap-2">
            <button
              onClick={onRunAgent}
              className="text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" /> Re-Scan
            </button>
            <button
              onClick={onClearLogs}
              className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[10px] space-y-1.5 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[9px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="ml-1.5 text-slate-400 font-bold">bash - agentEngine.ts</span>
            </div>
            <span>UTC-0:00</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {agentLogs.length === 0 ? (
              <p className="text-slate-500 italic">&gt; No execution logs yet. Tap 'Re-Scan' above to run the scheduler.</p>
            ) : (
              agentLogs.map((log, index) => (
                <p key={index} className="leading-relaxed text-slate-300">
                  <span className="text-slate-500 select-none">[{new Date().toLocaleTimeString()}]</span> &gt; {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800">Developer Shield Warning</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            This console is configured for developer diagnostic purposes only. In production environments, this console and these detailed telemetry feeds are completely disabled for customer safety and privacy compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
