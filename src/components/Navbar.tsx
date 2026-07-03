import { LayoutDashboard, Calendar, PlusCircle, User, Bell, Terminal } from "lucide-react";

interface NavbarProps {
  activeTab: "dashboard" | "schedule" | "add" | "profile" | "debug";
  setActiveTab: (tab: "dashboard" | "schedule" | "add" | "profile" | "debug") => void;
  pendingApprovalsCount: number;
  showDebugTab?: boolean;
}

export default function Navbar({ activeTab, setActiveTab, pendingApprovalsCount, showDebugTab }: NavbarProps) {
  interface TabItem {
    id: "dashboard" | "schedule" | "add" | "profile" | "debug";
    label: string;
    icon: any;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "schedule", label: "Schedule", icon: Calendar, badge: pendingApprovalsCount },
    { id: "add", label: "Add Product", icon: PlusCircle },
    { id: "profile", label: "Profile", icon: User }
  ];

  if (showDebugTab) {
    tabs.push({ id: "debug", label: "Dev Logs", icon: Terminal });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 py-2.5 px-6 shadow-lg flex justify-around items-center z-40 max-w-md mx-auto rounded-t-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center relative py-1 px-3 focus:outline-none transition-all duration-200 shrink-0"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              isActive 
                ? "bg-[#FFF0E6] text-[#FC8019]" 
                : "text-slate-400 hover:text-slate-600"
            }`}>
              <Icon className="w-5.5 h-5.5 transition-transform active:scale-95" />
            </div>
            <span className={`text-[10px] font-black tracking-tight mt-1 transition-all ${
              isActive ? "text-slate-800 font-black scale-100" : "text-slate-400 font-semibold scale-95"
            }`}>
              {tab.label}
            </span>

            {/* Notification Badge */}
            {!!tab.badge && (
              <span className="absolute top-0 right-3 bg-[#FC8019] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
