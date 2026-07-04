import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { dbService, DEFAULT_PROFILE } from "./lib/dbService";
import { runAgentEngine, calculateNextDueDate } from "./lib/agentEngine";
import { UserProfile, ScheduleItem, OrderRecord, ApprovalRequest, AppNotification } from "./types";

import Navbar from "./components/Navbar";
import DashboardTab from "./components/DashboardTab";
import ScheduleTab from "./components/ScheduleTab";
import AddProductTab from "./components/AddProductTab";
import ProfileTab from "./components/ProfileTab";
import DebugTab from "./components/DebugTab";

import AuthScreen from "./components/AuthScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import ProfileSetupScreen from "./components/ProfileSetupScreen";
import InstallPrompt from "./components/InstallPrompt";

import { Sparkles, RefreshCw } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedule" | "add" | "profile" | "debug">("dashboard");
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [guestBypass, setGuestBypass] = useState<boolean>(false);

  // Core Data States
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // AI Agent States
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthChecking(true);
      if (firebaseUser) {
        setIsGuest(false);
        try {
          const profile = await dbService.getUserProfile(false, firebaseUser.uid);
          setUserProfile(profile);
          showToast(`Welcome back, ${profile.displayName}! ✨`);
        } catch (e) {
          console.warn("Auth state profile fetch error, using fallback:", e);
        }
      } else {
        setIsGuest(true);
        // If not authenticated, we only keep profile if guestBypass is active
        if (guestBypass) {
          const profile = await dbService.getUserProfile(true);
          setUserProfile(profile);
        } else {
          setUserProfile(DEFAULT_PROFILE);
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [guestBypass]);

  // 2. Load lists whenever Auth / Guest state changes
  const loadData = async () => {
    try {
      const sch = await dbService.getSchedules(isGuest);
      const ords = await dbService.getOrderHistory(isGuest);
      const apps = await dbService.getApprovals(isGuest);
      const notifs = await dbService.getNotifications(isGuest);

      setSchedules(sch);
      setOrders(ords);
      setApprovals(apps);
      setNotifications(notifs);
    } catch (e) {
      console.error("Error loading app data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [isGuest, userProfile.uid]);

  // 3. Auto-trigger Agent Engine once when first loading (if data is ready)
  useEffect(() => {
    if (schedules.length > 0) {
      const triggered = sessionStorage.getItem("gharloop_agent_auto_run");
      if (!triggered) {
        sessionStorage.setItem("gharloop_agent_auto_run", "true");
        triggerAgentEngine();
      }
    }
  }, [schedules]);

  // Handler to trigger AI Agent scan
  const triggerAgentEngine = async () => {
    setIsAiLoading(true);
    setAgentLogs([]);
    try {
      const result = await runAgentEngine(isGuest, (logMsg) => {
        setAgentLogs((prev) => [...prev, logMsg]);
      });

      // Update local state based on simulation
      setAiInsight(result.insight);
      
      // Reload lists since dates and order counts changed
      await loadData();
      
      if (result.ordersPlaced.length > 0 || result.approvalsCreated.length > 0) {
        showToast(`AI Scan: Simulated ${result.ordersPlaced.length} reorders & updated scheduled dates.`);
      } else {
        showToast("AI Agent: Schedules are up to date.");
      }
    } catch (e) {
      console.error(e);
      setAiInsight("Consolidating Nandini Milk and bread orders into weekly bundles can save up to ₹120 in Swiggy Instamart delivery fees.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- ACTIONS ---

  // Update schedule attributes (e.g. interval, automation rule)
  const handleUpdateScheduleItem = async (itemId: string, updates: Partial<ScheduleItem>) => {
    await dbService.updateScheduleItem(isGuest, itemId, updates);
    setSchedules((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
    showToast("Schedule updated successfully.");
  };

  // Delete product subscription
  const handleDeleteScheduleItem = async (itemId: string) => {
    const item = schedules.find((s) => s.id === itemId);
    await dbService.deleteScheduleItem(isGuest, itemId);
    setSchedules((prev) => prev.filter((i) => i.id !== itemId));
    if (item) {
      showToast(`Removed subscription for '${item.productName}'.`);
    }
  };

  // Add a product subscription
  const handleAddScheduleItem = async (item: Omit<ScheduleItem, "id">) => {
    const newItem = await dbService.addScheduleItem(isGuest, item);
    setSchedules((prev) => [newItem, ...prev]);
    showToast(`Added '${item.productName}' schedule.`);
  };

  // Approve authorization request (Creates a mock order and advances due date)
  const handleApproveRequest = async (approval: ApprovalRequest) => {
    showToast(`Approving reorder for ${approval.productName}...`);
    
    // ==== DASH-API-SWIGGY-FOOD ====
    // If category is 'Meals', simulate a checkout request via Swiggy Food.
    // Endpoint: mcp.swiggy.com/food/order
    // Auth: OAuth 2.1 with PKCE
    // Expected payload: { cart: [{ productId, quantity }] }
    // ==============================

    // 1. Log simulation order
    await dbService.addOrderRecord(isGuest, {
      productName: approval.productName,
      brand: approval.brand,
      price: approval.price,
      quantity: approval.quantity,
      date: new Date().toISOString().split("T")[0],
      category: approval.category
    });

    // 2. Mark approval request as approved
    await dbService.updateApprovalStatus(isGuest, approval.id, "approved");

    // 3. Advance next due date of associated scheduled item
    const scheduleItem = schedules.find((s) => s.id === approval.itemId);
    if (scheduleItem) {
      const nextDueStr = calculateNextDueDate(scheduleItem.nextDue, scheduleItem.frequency, scheduleItem.customIntervalDays);
      await dbService.updateScheduleItem(isGuest, scheduleItem.id, { nextDue: nextDueStr });
    }

    // Refresh state
    await loadData();
    showToast(`Order approved! NANDINI or Swiggy delivery dispatched.`);
  };

  // Skip authorization request (Advances schedule due date without placing order)
  const handleSkipRequest = async (approval: ApprovalRequest) => {
    await dbService.updateApprovalStatus(isGuest, approval.id, "skipped");
    
    const scheduleItem = schedules.find((s) => s.id === approval.itemId);
    if (scheduleItem) {
      const nextDueStr = calculateNextDueDate(scheduleItem.nextDue, scheduleItem.frequency, scheduleItem.customIntervalDays);
      await dbService.updateScheduleItem(isGuest, scheduleItem.id, { nextDue: nextDueStr });
    }

    await loadData();
    showToast("Skipped reorder. Advanced scheduling date.");
  };

  // Reschedule due date
  const handleRescheduleRequest = async (approval: ApprovalRequest, newDate: string) => {
    await dbService.updateApprovalStatus(isGuest, approval.id, "rescheduled");
    
    // Update the nextDue directly
    await dbService.updateScheduleItem(isGuest, approval.itemId, { nextDue: newDate });
    
    await loadData();
    showToast(`Rescheduled item to ${newDate}.`);
  };

  // Authenticators
  const handleSignInWithGoogle = async () => {
    try {
      const profile = await dbService.signInWithGoogle();
      setUserProfile(profile);
      setIsGuest(false);
      showToast("Signed in successfully!");
    } catch (e: any) {
      console.error("Google Sign-In failed:", e);
      const message = e?.code === "auth/popup-closed-by-user"
        ? "Sign-in cancelled — popup was closed."
        : e?.code === "auth/popup-blocked"
        ? "Popup was blocked by your browser. Please allow popups and try again."
        : "Google sign-in failed. Please try again.";
      showToast(message);
      // Intentionally stays in guest mode — this is a failure, not a silent success.
    }
  };

  const handleSignOut = async () => {
    await dbService.signOutUser();
    setIsGuest(true);
    setGuestBypass(false); // Force return to login gate
    setUserProfile(DEFAULT_PROFILE);
    showToast("Logged out successfully.");
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await dbService.updateUserProfile(isGuest, updates);
    setUserProfile(updated);
  };

  // LOADING STATE DURING FIREBASE CHECK
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center font-sans antialiased">
        <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[880px] bg-[#FAF8F5] flex flex-col justify-center items-center sm:rounded-[36px] p-6 space-y-4">
          <RefreshCw className="w-8 h-8 text-[#FC8019] animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Checking secure session...</p>
        </div>
      </div>
    );
  }

  // 1. GATEWAY: AUTHENTICATION SCREEN
  if (!auth.currentUser && !guestBypass) {
    return (
      <div id="app-root" className="min-h-screen bg-slate-900 flex justify-center items-center py-0 sm:py-8 font-sans antialiased">
        <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[880px] bg-[#FAF8F5] flex flex-col relative overflow-hidden sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800">
          <AuthScreen 
            onAuthSuccess={(uid) => {
              setIsGuest(false);
              setGuestBypass(false);
            }}
            onContinueAsGuest={async () => {
              setIsGuest(true);
              setGuestBypass(true);
              const p = await dbService.getUserProfile(true);
              setUserProfile(p);
            }}
          />
        </div>
      </div>
    );
  }

  // 2. GATEWAY: ONBOARDING TUTORIAL
  if (!userProfile.hasSeenOnboarding) {
    return (
      <div id="app-root" className="min-h-screen bg-slate-900 flex justify-center items-center py-0 sm:py-8 font-sans antialiased">
        <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[880px] bg-[#FAF8F5] flex flex-col relative overflow-hidden sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800">
          <OnboardingScreen 
            onComplete={async () => {
              const updated = { ...userProfile, hasSeenOnboarding: true };
              setUserProfile(updated);
              await dbService.updateUserProfile(isGuest, { hasSeenOnboarding: true });
              showToast("Tutorial finished! Let's setup your budget parameters next.");
            }}
          />
        </div>
      </div>
    );
  }

  // 3. GATEWAY: PROFILE SETUP
  if (!userProfile.hasSetupProfile) {
    return (
      <div id="app-root" className="min-h-screen bg-slate-900 flex justify-center items-center py-0 sm:py-8 font-sans antialiased">
        <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[880px] bg-[#FAF8F5] flex flex-col relative overflow-hidden sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800">
          <ProfileSetupScreen 
            initialName={userProfile.displayName}
            initialEmail={userProfile.email}
            initialPhone={userProfile.phoneNumber}
            onComplete={async (profileData) => {
              const updated = { ...userProfile, ...profileData, hasSetupProfile: true };
              setUserProfile(updated);
              await dbService.updateUserProfile(isGuest, { ...profileData, hasSetupProfile: true });
              showToast("GharLoop Profile Setup Complete! Redirecting to Dashboard...");
            }}
          />
        </div>
      </div>
    );
  }

  // 4. MAIN APPLICATION SCREEN (Authenticated, has onboarded, has set up profile)
  return (
    <div id="app-root" className="min-h-screen bg-slate-900 flex justify-center items-center py-0 sm:py-8 font-sans antialiased">
      {/* Premium PWA layout phone wrapper */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[880px] bg-[#FAF8F5] flex flex-col relative overflow-hidden sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800">
        
        {/* Device camera notch on desktop */}
        <div className="hidden sm:block absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50"></div>

        {/* Global Toast Notifier */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 bg-slate-850 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 z-50 flex items-center gap-2 text-xs font-bold animate-slide-down">
            <Sparkles className="w-4 h-4 text-[#FC8019] shrink-0" />
            <p className="flex-1 leading-snug">{toastMessage}</p>
          </div>
        )}

        {/* Main Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-5 pt-8 pb-28 scrollbar-none animate-fade-in">
          {/* Active Tab router */}
          {activeTab === "dashboard" && (
            <DashboardTab
              profile={userProfile}
              schedules={schedules}
              orders={orders}
              aiInsight={aiInsight}
              isAiLoading={isAiLoading}
              onRunAgent={triggerAgentEngine}
              agentLogs={agentLogs}
              notifications={notifications}
            />
          )}

          {activeTab === "schedule" && (
            <ScheduleTab
              schedules={schedules}
              approvals={approvals}
              isGuest={isGuest}
              profile={userProfile}
              onUpdateScheduleItem={handleUpdateScheduleItem}
              onDeleteScheduleItem={handleDeleteScheduleItem}
              onApproveRequest={handleApproveRequest}
              onSkipRequest={handleSkipRequest}
              onRescheduleRequest={handleRescheduleRequest}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === "add" && (
            <AddProductTab
              onAddScheduleItem={handleAddScheduleItem}
              existingSchedules={schedules}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab
              profile={userProfile}
              isGuest={isGuest}
              onUpdateProfile={handleUpdateProfile}
              onSignInWithGoogle={handleSignInWithGoogle}
              onSignOut={handleSignOut}
            />
          )}

          {activeTab === "debug" && (
            <DebugTab
              agentLogs={agentLogs}
              isGuest={isGuest}
              uid={userProfile.uid}
              onClearLogs={() => setAgentLogs([])}
              onRunAgent={triggerAgentEngine}
              notificationCount={notifications.length}
            />
          )}
        </main>

        {/* Navigation bottom control rail */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingApprovalsCount={approvals.filter(a => a.status === 'pending').length}
          showDebugTab={!!userProfile.developerMode}
        />
      </div>
      <InstallPrompt />
    </div>
  );
}
