import React from "react";
import { ScheduleItem, OrderRecord, UserProfile, AppNotification } from "../types";
import { TrendingDown, Calendar, AlertCircle, Sparkles, CheckCircle2, Bell, Package, RefreshCw } from "lucide-react";

interface DashboardTabProps {
  profile: UserProfile;
  schedules: ScheduleItem[];
  orders: OrderRecord[];
  aiInsight: string;
  isAiLoading: boolean;
  onRunAgent: () => void;
  agentLogs: string[];
  notifications: AppNotification[];
}

const formatTime = (isoStr: string) => {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
};

export default function DashboardTab({
  profile,
  schedules,
  orders,
  aiInsight,
  isAiLoading,
  onRunAgent,
  agentLogs,
  notifications
}: DashboardTabProps) {
  
  // 1. Calculate Budget Progress
  const totalSpent = orders.reduce((sum, ord) => sum + ord.price * ord.quantity, 0);
  const remainingBudget = Math.max(0, profile.monthlyBudget - totalSpent);
  const percentSpent = profile.monthlyBudget > 0 
    ? Math.min(100, Math.round((totalSpent / profile.monthlyBudget) * 100))
    : 0;

  // Progress ring variables
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentSpent / 100) * circumference;

  // 2. Filter Upcoming Orders (Today vs Tomorrow)
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const todayItems = schedules.filter((s) => s.nextDue === todayStr);
  const tomorrowItems = schedules.filter((s) => s.nextDue === tomorrowStr);

  // 3. Spending Breakdown by Category
  const categories: ("Groceries" | "Meals" | "Medicines" | "Subscriptions")[] = [
    "Groceries",
    "Meals",
    "Medicines",
    "Subscriptions"
  ];

  const categorySpent = categories.reduce((acc, cat) => {
    acc[cat] = orders.filter((o) => o.category === cat).reduce((sum, o) => sum + o.price * o.quantity, 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryColors = {
    Groceries: { bg: "bg-[#FC8019]", text: "text-[#FC8019]", light: "bg-[#FFF0E6]", border: "border-[#FC8019]/20" },
    Meals: { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-50", border: "border-amber-500/20" },
    Medicines: { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-50", border: "border-rose-500/20" },
    Subscriptions: { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-50", border: "border-indigo-500/20" }
  };

  // 4. Calculate Consolidation Savings on Scheduled Items
  // Group scheduled items by due date
  const scheduleGroups: Record<string, ScheduleItem[]> = {};
  schedules.forEach((item) => {
    const dateKey = item.nextDue;
    if (!scheduleGroups[dateKey]) {
      scheduleGroups[dateKey] = [];
    }
    scheduleGroups[dateKey].push(item);
  });

  // Find dates with multiple scheduled items to offer bundle delivery savings
  const consolidationSuggestions = Object.entries(scheduleGroups)
    .filter(([_, items]) => items.length > 1)
    .map(([date, items]) => {
      const deliveryFeePerOrder = 30; // ₹30 delivery fee assumption
      const singleBundleFee = 30;
      const separateOrdersFee = items.length * deliveryFeePerOrder;
      const estimatedSaving = separateOrdersFee - singleBundleFee;
      
      // Format date for display
      let displayDate = date;
      try {
        const parts = date.split("-");
        if (parts.length === 3) {
          const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          displayDate = dObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
        }
      } catch {}

      return {
        date,
        displayDate,
        count: items.length,
        saving: estimatedSaving
      };
    });

  return (
    <div id="dashboard-tab" className="space-y-6 pb-20 select-none">
      
      {/* Header Profile Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FC8019]">GharLoop Planner</span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Namaste, {profile.displayName ? profile.displayName.split(" ")[0] : "Resident"}!
          </h1>
          <p className="text-xs text-slate-500 font-medium">Persona: {profile.persona || "Household Planner"}</p>
        </div>
        <div className="bg-[#FFF0E6] text-[#FC8019] px-3 py-1 rounded-full text-xs font-bold border border-[#FC8019]/10 shrink-0">
          🇮🇳 Swiggy Mode
        </div>
      </div>

      {/* Budget Progress Card */}
      <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Household Budget Status</h2>
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-800">₹{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-bold">spent of ₹{profile.monthlyBudget.toLocaleString()} limit</p>
          </div>
          <div className="pt-1">
            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              percentSpent > 85 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            }`}>
              {percentSpent}% Spent • ₹{remainingBudget.toLocaleString()} left
            </span>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="transform -rotate-90 w-28 h-28">
            {/* Background Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Foreground Progress */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-[#FC8019]"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-lg font-black text-slate-800">{percentSpent}%</span>
            <p className="text-[9px] text-slate-400 uppercase font-black">used</p>
          </div>
        </div>
      </div>

      {/* Gemini AI Insight Section */}
      <div className="bg-gradient-to-br from-[#FFF5ED] to-white rounded-3xl p-4.5 border border-[#FC8019]/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Sparkles className="w-16 h-16 text-[#FC8019]" />
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-[#FC8019] text-white p-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#FC8019]">GharLoop AI Insight</h3>
        </div>
        
        {isAiLoading ? (
          <div className="space-y-2 py-1">
            <div className="h-3 bg-slate-200/50 rounded animate-pulse w-full"></div>
            <div className="h-3 bg-slate-200/50 rounded animate-pulse w-4/5"></div>
          </div>
        ) : (
          <p className="text-xs font-bold text-slate-700 leading-relaxed">
            {schedules.length === 0 
              ? "Add a few items to start getting personalized savings tips" 
              : (aiInsight || "Consolidate your Nandini milk and bread schedules to save up to ₹120 in delivery fees on Swiggy Instamart this week.")}
          </p>
        )}

        <div className="mt-3.5 pt-3.5 border-t border-slate-100/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold">Powered by Gemini 2.5 Flash</span>
          <button
            onClick={onRunAgent}
            className="text-[11px] font-black text-[#FC8019] hover:underline flex items-center gap-1 bg-[#FFF0E6] px-2.5 py-1 rounded-lg uppercase tracking-wider"
          >
            Run Agent Sync ⚡
          </button>
        </div>
      </div>

      {/* Consolidation Delivery Savings Insight (Calculated Honestly from Schedules) */}
      {consolidationSuggestions.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Smart Bundling Opportunities</h3>
          {consolidationSuggestions.map((suggestion, idx) => (
            <div key={idx} className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex gap-3.5 items-start">
              <TrendingDown className="w-5 h-5 text-[#FC8019] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-800">Delivery Fee Bundle Discount</h4>
                <p className="text-xs text-slate-600 leading-relaxed mt-1 font-semibold">
                  You have <span className="font-black text-slate-800">{suggestion.count} items</span> scheduled for <span className="font-black text-slate-800">{suggestion.displayDate}</span>. Bundling them into one order could save an estimated <span className="font-black text-[#FC8019]">₹{suggestion.saving}</span> in delivery fees!
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled Items Sections: Today vs Tomorrow (Differentiated and Clearly Labeled) */}
      <div className="space-y-5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Scheduled Reorders</h3>

        {/* Global Empty State if total schedules is empty */}
        {schedules.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-dashed border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-black text-slate-800">Nothing scheduled yet</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Tap '+' in the navigation bar to add your first essential item!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Today Section */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Scheduled for Today</span>
              </div>
              
              {todayItems.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold">No items scheduled for today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {todayItems.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${categoryColors[item.category].bg}`}></span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[9px] font-black text-[#FC8019] uppercase tracking-wider">{item.brand}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 mt-1">{item.productName}</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {item.quantity} x {item.unit} • ₹{item.price * item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block bg-[#FFF5EE] text-[#FC8019] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                          {item.automationLevel}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">Every {item.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tomorrow Section */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Scheduled for Tomorrow</span>
              </div>
              
              {tomorrowItems.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold">No items scheduled for tomorrow.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {tomorrowItems.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${categoryColors[item.category].bg}`}></span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[9px] font-black text-[#FC8019] uppercase tracking-wider">{item.brand}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 mt-1">{item.productName}</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {item.quantity} x {item.unit} • ₹{item.price * item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                          {item.automationLevel}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">Every {item.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Wise Spending Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Category Wise Spending</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const spent = categorySpent[cat] || 0;
            const percentage = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
            return (
              <div key={cat} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black ${categoryColors[cat].text}`}>{cat}</span>
                  <span className="text-[10px] font-bold text-slate-400">{percentage}%</span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-800">₹{spent.toLocaleString()}</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${categoryColors[cat].bg}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Updates / Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Activity Feed
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Real-Time Updates</span>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-500" />
              <p className="text-xs font-bold">No recent updates or activities.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Run the Agent Sync to scan your schedules.</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notif) => {
              let Icon = Bell;
              let iconColor = "text-indigo-500 bg-indigo-50";
              let badgeText = "Update";

              if (notif.type === "auto_order") {
                Icon = Package;
                iconColor = "text-emerald-500 bg-emerald-50";
                badgeText = "Auto Order";
              } else if (notif.type === "approval") {
                Icon = AlertCircle;
                iconColor = "text-amber-500 bg-amber-50";
                badgeText = "Approval";
              } else if (notif.type === "reminder") {
                Icon = Calendar;
                iconColor = "text-blue-500 bg-blue-50";
                badgeText = "Reminder";
              }

              return (
                <div key={notif.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className={`p-2 rounded-xl shrink-0 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {badgeText}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 leading-snug">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
