import React, { useState } from "react";
import { ScheduleItem, ApprovalRequest, Frequency, AutomationLevel, UserProfile } from "../types";
import { Check, X, Calendar, Bell, Trash2, Smartphone, ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, List, Mail } from "lucide-react";
import { calculateNextDueDate } from "../lib/agentEngine";

const categoryColors = {
  Groceries: { bg: "bg-[#FC8019]", text: "text-[#FC8019]", light: "bg-[#FFF0E6]", border: "border-[#FC8019]/20" },
  Meals: { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-50", border: "border-amber-500/20" },
  Medicines: { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-50", border: "border-rose-500/20" },
  Subscriptions: { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-50", border: "border-indigo-500/20" }
};

interface ScheduleTabProps {
  schedules: ScheduleItem[];
  approvals: ApprovalRequest[];
  isGuest: boolean;
  profile: UserProfile;
  onUpdateScheduleItem: (itemId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onDeleteScheduleItem: (itemId: string) => Promise<void>;
  onApproveRequest: (approval: ApprovalRequest) => Promise<void>;
  onSkipRequest: (approval: ApprovalRequest) => Promise<void>;
  onRescheduleRequest: (approval: ApprovalRequest, newDate: string) => Promise<void>;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function ScheduleTab({
  schedules,
  approvals,
  isGuest,
  profile,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
  onApproveRequest,
  onSkipRequest,
  onRescheduleRequest,
  onUpdateProfile
}: ScheduleTabProps) {
  const pushEnabled = profile.pushEnabled !== false;
  const emailEnabled = profile.emailEnabled !== false;
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [customRescheduleDate, setCustomRescheduleDate] = useState<string>("");

  // View modes: Calendar vs List
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Calendar Year/Month States - defaulting to July 2026 based on user environment
  const today = new Date();
  const defaultYear = today.getFullYear() === 2026 ? 2026 : today.getFullYear();
  const defaultMonth = today.getFullYear() === 2026 ? today.getMonth() : today.getMonth();
  
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(6); // July is index 6
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("2026-07-02");

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await onUpdateProfile({ pushEnabled: e.target.checked });
  };

  const handleEmailToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await onUpdateProfile({ emailEnabled: e.target.checked });
  };

  // Month Names Helper
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar generator logic
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const numDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const daysGrid: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dayVal = prevMonthDays - i;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
    daysGrid.push({ day: dayVal, isCurrentMonth: false, dateString: dateStr });
  }

  // Current month active days
  for (let d = 1; d <= numDaysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ day: d, isCurrentMonth: true, dateString: dateStr });
  }

  // Next month filler days to align Grid of 7s
  const totalSlots = daysGrid.length <= 35 ? 35 : 42;
  let nextMonthDay = 1;
  while (daysGrid.length < totalSlots) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextMonthDay).padStart(2, '0')}`;
    daysGrid.push({ day: nextMonthDay, isCurrentMonth: false, dateString: dateStr });
    nextMonthDay++;
  }

  // Navigate Months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get scheduled items specifically for a date string
  const getItemsForDate = (dateStr: string) => {
    return schedules.filter((s) => {
      const anchor = new Date(s.nextDue);
      const target = new Date(dateStr);
      
      // Set hours to 0 to compare dates purely
      anchor.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      
      if (target < anchor) return false;
      
      const diffTime = target.getTime() - anchor.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (s.frequency === "Daily") {
        return true;
      } else if (s.frequency === "Weekly") {
        return target.getDay() === anchor.getDay();
      } else if (s.frequency === "Monthly") {
        return target.getDate() === anchor.getDate();
      } else if (s.frequency === "Custom") {
        const interval = s.customIntervalDays || 3;
        return diffDays % interval === 0;
      }
      
      return s.nextDue === dateStr;
    });
  };

  const selectedDateItems = getItemsForDate(selectedCalendarDate);

  // Format date readable
  const formatReadableDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return dObj.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
      }
    } catch {}
    return dateStr;
  };

  return (
    <div id="schedule-tab" className="space-y-6 pb-20 select-none">
      
      {/* Header section with toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FC8019]">Sub & Reorders</span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Scheduling Control</h1>
          <p className="text-xs text-slate-500 font-medium">Manage automation rules and calendars</p>
        </div>
        
        {/* Toggle between Calendar and List view */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/50">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "calendar" 
                ? "bg-white text-slate-800 shadow-xs font-black" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "list" 
                ? "bg-white text-slate-800 shadow-xs font-black" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* In-App Push & Email Notification Channels */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">GharLoop App Notification Routing</h2>
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center">
              <div className="bg-orange-50 p-2 rounded-lg text-[#FC8019] shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">In-App Push Alerts</p>
                <p className="text-[10px] text-slate-400 font-semibold">Immediate push-alerts on due dates</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={handlePushToggle}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FC8019]"></div>
            </label>
          </div>

          {/* Email alert block */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
            <div className="flex gap-2.5 items-center font-semibold">
              <div className="bg-orange-50 p-2 rounded-lg text-[#FC8019] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800">Email Alerts & OTPs</p>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${emailEnabled ? "bg-[#FC8019]/10 text-[#FC8019]" : "bg-slate-100 text-slate-400"}`}>
                    {emailEnabled ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">Receive secure verification and refilling updates</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={handleEmailToggle}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FC8019]"></div>
            </label>
          </div>
        </div>

        <div className="text-[9px] text-slate-500 bg-slate-50 rounded-xl p-3 font-semibold border border-slate-100">
          🔔 <span className="font-bold">Active Delivery Rule:</span> All notifications are routed entirely through GharLoop's background engine directly to your active browser push frames and {profile.email || "registered email"} address.
        </div>
      </div>

    {/* PENDING APPROVAL FLOW */}
    <div className="space-y-3 px-6">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-1.5 h-3 bg-[#FC8019] rounded-xs inline-block"></span>
        Pending Approvals ({pendingApprovals.length})
      </h3>

      {pendingApprovals.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
          <h4 className="text-xs font-bold text-slate-800">No Pending Approvals</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Any scheduled items on \"Ask me first\" mode will queue up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingApprovals.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[req.category]?.bg || "bg-slate-400"}`}></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {req.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] font-black text-[#FC8019] uppercase tracking-wider">{req.brand}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">Due {req.dueDate}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-800 leading-tight">{req.productName}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Qty: {req.quantity} • <span className="text-slate-800 font-bold">₹{req.price * req.quantity}</span>
                  </p>
                </div>
                <div>
                  <span className="inline-block bg-[#FFF5EE] text-[#FC8019] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Pending approval
                  </span>
                </div>
              </div>

              {/* Reschedule custom date select popup inside card */}
              {rescheduleTargetId === req.id && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex gap-2 items-center">
                  <input
                    type="date"
                    value={customRescheduleDate}
                    onChange={(e) => setCustomRescheduleDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 flex-1 focus:outline-none focus:border-[#FC8019]"
                  />
                  <button
                    onClick={() => {
                      if (customRescheduleDate) {
                        onRescheduleRequest(req, customRescheduleDate);
                        setRescheduleTargetId(null);
                      }
                    }}
                    className="bg-[#FC8019] text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-[#e06e12]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setRescheduleTargetId(null)}
                    className="text-slate-400 hover:text-slate-600 px-1"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Actions row */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onApproveRequest(req)}
                  className="flex-1 bg-[#FC8019] hover:bg-[#e06e12] text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => onSkipRequest(req)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Skip
                </button>
                <button
                  onClick={() => {
                    setRescheduleTargetId(req.id);
                    setCustomRescheduleDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]); // Default tomorrow
                  }}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-500 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" /> Delay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* CONDITIONAL RENDER: CALENDAR VIEW */}
    {viewMode === "calendar" ? (
      <div className="space-y-4 px-6 animate-fade-in">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4.5 space-y-4">
          
          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid columns labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
              <span key={dayName} className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-1">
                {dayName}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((cell, idx) => {
              const dayItems = getItemsForDate(cell.dateString);
              const hasItems = dayItems.length > 0;
              const isSelected = selectedCalendarDate === cell.dateString;
              const isTodayCell = new Date().toISOString().split("T")[0] === cell.dateString;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCalendarDate(cell.dateString)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    !cell.isCurrentMonth ? "opacity-30 text-slate-400" : "text-slate-700"
                  } ${
                    isSelected 
                      ? "bg-[#FC8019] text-white font-black shadow-md shadow-[#FC8019]/25 scale-105" 
                      : isTodayCell 
                        ? "bg-[#FFF0E6] text-[#FC8019] font-black border border-[#FC8019]/35" 
                        : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold">{cell.day}</span>
                  
                  {/* Dot indication badge */}
                  {hasItems && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-[#FC8019]"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Schedules list underneath */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Reorders for {formatReadableDate(selectedCalendarDate)} ({selectedDateItems.length})
          </h4>

          {selectedDateItems.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center">
              <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">No scheduled loops on this date.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pick another calendar cell with a dot badge.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDateItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${categoryColors[item.category]?.bg || "bg-slate-400"}`}></span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[9px] font-black text-[#FC8019] uppercase tracking-wider">{item.brand}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-1">{item.productName}</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {item.quantity} x {item.unit} • <span className="text-slate-800">₹{item.price * item.quantity}</span>
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
      </div>
    ) : (
      
      // EXISTING RECURRING LIST VIEW
      <div className="space-y-3 px-6 animate-fade-in">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          Active Recurring Subscriptions ({schedules.length})
        </h3>

        {schedules.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center">
            <Trash2 className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-700">No recurring items setup.</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Browse the 'Add Product' tab to schedule household essentials.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[item.category]?.bg || "bg-slate-400"}`}></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-black text-[#FC8019] uppercase tracking-wider">{item.brand}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 mt-1.5 leading-tight">{item.productName}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      {item.quantity} x {item.unit} • <span className="text-slate-800 font-extrabold font-mono">₹{item.price * item.quantity}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onDeleteScheduleItem(item.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                    title="Remove subscription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Interactive scheduling selectors */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Interval</label>
                    <select
                      value={item.frequency}
                      onChange={(e) => onUpdateScheduleItem(item.id, { frequency: e.target.value as Frequency })}
                      className="w-full bg-slate-50 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg border-none focus:ring-1 focus:ring-[#FC8019]"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Custom">Custom ({item.customIntervalDays || 3} Days)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Automation</label>
                    <select
                      value={item.automationLevel}
                      onChange={(e) => onUpdateScheduleItem(item.id, { automationLevel: e.target.value as AutomationLevel })}
                      className="w-full bg-slate-50 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg border-none focus:ring-1 focus:ring-[#FC8019]"
                    >
                      <option value="Remind me">Remind me</option>
                      <option value="Ask me first">Ask me first</option>
                      <option value="Auto-order">Auto-order</option>
                    </select>
                  </div>
                </div>

                {item.frequency === "Custom" && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Custom Interval (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={item.customIntervalDays || 3}
                      onChange={(e) => onUpdateScheduleItem(item.id, { customIntervalDays: parseInt(e.target.value) || 3 })}
                      className="w-full bg-slate-50 text-xs font-bold text-slate-700 py-1 px-2 rounded-lg border-none focus:ring-1 focus:ring-[#FC8019]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50/55 px-3 py-2 rounded-xl text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Next Reorder Due:
                  </span>
                  <span className="text-slate-800 font-bold font-mono">{item.nextDue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    </div>
  );
}
