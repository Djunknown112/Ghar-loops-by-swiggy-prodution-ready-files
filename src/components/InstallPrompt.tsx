import React, { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "gharloop_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari specific flag
    (window.navigator as any).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  if (isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    // Real browsers (Chrome/Edge/Android) fire this event when the app
    // is genuinely installable — this is not simulated.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari never fires beforeinstallprompt — there is no programmatic
    // install API there, so we show manual "Add to Home Screen" instructions
    // instead, rather than pretending a real prompt exists.
    if (isIos()) {
      setVisible(true);
      setShowIosHelp(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (showIosHelp) return; // iOS has no programmatic prompt; instructions stay on screen
    if (!deferredEvent) return;
    deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    // Whatever the user picks, don't nag again immediately.
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
    setDeferredEvent(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-300 hover:text-slate-500"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-4">
          <div className="w-10 h-10 rounded-xl bg-[#FC8019] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Install Gharloops</p>
            {showIosHelp ? (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tap <Share className="w-3 h-3 inline -mt-0.5" /> Share, then "Add to Home Screen" to install.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add it to your home screen for quick, app-like access.
              </p>
            )}
          </div>
        </div>

        {!showIosHelp && (
          <button
            onClick={handleInstallClick}
            className="w-full mt-3 bg-[#FC8019] hover:bg-[#e06e12] text-white font-bold text-xs py-2.5 rounded-xl transition-all"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
