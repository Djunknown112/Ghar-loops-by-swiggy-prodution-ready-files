import React, { useState } from "react";
import { 
  Sparkles, 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentCard, setCurrentCard] = useState(0);

  const cards = [
    {
      title: "Welcome to GharLoop",
      description: "GharLoop automates your repeating household essentials and groceries so you never run out of milk, dal, or medicines.",
      icon: <RefreshCw className="w-12 h-12 text-[#FC8019]" />,
      bg: "bg-orange-50/50"
    },
    {
      title: "Control Dashboard",
      description: "Monitor your budget and track spending patterns at a glance with sleek, honest visual breakdowns.",
      icon: <LayoutDashboard className="w-12 h-12 text-blue-500" />,
      bg: "bg-blue-50/50"
    },
    {
      title: "Add Product Essentials",
      description: "Browse curated essentials in a high-speed, card-based Blinkit-style catalog with generous tap targets.",
      icon: <ShoppingBag className="w-12 h-12 text-emerald-500" />,
      bg: "bg-emerald-50/50"
    },
    {
      title: "Intelligent Schedules",
      description: "Establish exactly when and how often products should replenish. Set custom date-based reorder frequencies.",
      icon: <Calendar className="w-12 h-12 text-indigo-500" />,
      bg: "bg-indigo-50/50"
    },
    {
      title: "Automation Rules",
      description: "Choose your level: 'Auto-order' instantly, 'Ask me first' for safe approvals, or 'Remind me' with notification alerts.",
      icon: <Bell className="w-12 h-12 text-rose-500" />,
      bg: "bg-rose-50/50"
    },
    {
      title: "You're Fully Ready!",
      description: "You have unlocked the power of effortless household loop operations. Next, configure your personal settings.",
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-600" />,
      bg: "bg-amber-50/50"
    }
  ];

  const handleNext = () => {
    if (currentCard === cards.length - 1) {
      onComplete();
    } else {
      setCurrentCard((prev) => prev + 1);
    }
  };

  return (
    <div className={`flex flex-col justify-between p-6 min-h-[650px] transition-colors duration-500 ${cards[currentCard].bg}`}>
      
      {/* Top Header - Skip Action */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          GharLoop Guide • {currentCard + 1} of 6
        </span>
        {currentCard < cards.length - 1 && (
          <button
            onClick={onComplete}
            className="text-xs font-bold text-[#FC8019] hover:text-orange-600 transition-colors bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-100 shadow-2xs"
          >
            Skip
          </button>
        )}
      </div>

      {/* Main Flashcard Illustration + Text */}
      <div className="flex-1 flex flex-col justify-center items-center py-8 text-center space-y-6">
        {/* Animated Icon Circle */}
        <div className="w-24 h-24 rounded-[32px] bg-white shadow-md shadow-slate-100/40 flex items-center justify-center border border-slate-50 animate-bounce">
          {cards[currentCard].icon}
        </div>

        <div className="space-y-3.5 max-w-xs">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {cards[currentCard].title}
          </h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {cards[currentCard].description}
          </p>
        </div>
      </div>

      {/* Bottom Actions - Dots + Next Button */}
      <div className="space-y-6">
        {/* Indicators */}
        <div className="flex justify-center items-center gap-1.5">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentCard 
                  ? "w-6 bg-[#FC8019]" 
                  : "w-2 bg-slate-200"
              }`}
            ></div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3.5 rounded-[18px] text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all"
        >
          <span>{currentCard === cards.length - 1 ? "Let's Go to Profile Setup" : "Next Slide"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
