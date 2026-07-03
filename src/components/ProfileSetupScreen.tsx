import React, { useState } from "react";
import { User, CreditCard, Sparkles, UserCheck, ShieldCheck, Heart, GraduationCap, Briefcase, Users, Mail, Phone } from "lucide-react";

interface ProfileSetupScreenProps {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  onComplete: (profileData: {
    displayName: string;
    email: string;
    phoneNumber: string;
    monthlyBudget: number;
    persona: "Hostel Student" | "Young Professional" | "Family" | "Fitness";
    photoURL?: string;
  }) => void;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120"
];

const PERSONAS = [
  { id: "Hostel Student", label: "Hostel Student", desc: "Maggi, milk, and basic items.", icon: <GraduationCap className="w-5 h-5 text-indigo-500" /> },
  { id: "Young Professional", label: "Young Pro", desc: "Ready-to-eat meals and grocery staples.", icon: <Briefcase className="w-5 h-5 text-[#FC8019]" /> },
  { id: "Family", label: "Family Planner", desc: "Veggies, dal, oil, and medicine refills.", icon: <Users className="w-5 h-5 text-emerald-500" /> },
  { id: "Fitness", label: "Fitness Buff", desc: "Eggs, avocados, nuts, and clean foods.", icon: <Heart className="w-5 h-5 text-rose-500" /> }
];

export default function ProfileSetupScreen({ initialName, initialEmail, initialPhone, onComplete }: ProfileSetupScreenProps) {
  const [name, setName] = useState(initialName || "");
  const [email, setEmail] = useState(initialEmail || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [budget, setBudget] = useState<number>(5500);
  const [selectedPersona, setSelectedPersona] = useState<"Hostel Student" | "Young Professional" | "Family" | "Fitness">("Young Professional");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please fill out your name to get started.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setError("Please provide your mobile phone number.");
      return;
    }
    if (budget <= 0) {
      setError("Please enter a valid monthly budget.");
      return;
    }
    
    onComplete({
      displayName: name.trim(),
      email: email.trim(),
      phoneNumber: phone.trim(),
      monthlyBudget: budget,
      persona: selectedPersona,
      photoURL: selectedAvatar
    });
  };

  return (
    <div className="flex flex-col min-h-[700px] justify-between p-6 bg-[#FAF8F5] select-none">
      
      {/* Header */}
      <div className="space-y-1.5 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FC8019]">Step 2 of 2</span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
          <UserCheck className="w-6 h-6 text-[#FC8019]" />
          Setup Your Profile
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Personalize GharLoop parameters to tailor the smart reorder recommendations.
        </p>
      </div>

      {/* Setup Card Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 my-5 space-y-4.5 flex-1 flex flex-col justify-between">
        
        <div className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* 1. Profile Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Dheeraj Joshi"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E.g. dheeraj@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="E.g. +919876543210"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* 2. Choose Avatar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Select Profile Picture</label>
            <div className="flex gap-3.5 items-center">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                    selectedAvatar === avatar 
                      ? "border-[#FC8019] scale-110 shadow-md shadow-[#FC8019]/20" 
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <img src={avatar} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* 3. Monthly Budget */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Monthly Budget (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-500">₹</span>
              <input
                type="number"
                required
                min={500}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="5500"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-7 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none font-bold"
              />
            </div>
            <p className="text-[9px] text-slate-400">Used to dynamically calculate warning meters.</p>
          </div>

          {/* 4. Persona Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Your Persona Category</label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => {
                const active = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      active 
                        ? "bg-orange-50/40 border-[#FC8019] shadow-2xs" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      {p.icon}
                      <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-[#FC8019]" : "bg-transparent"}`}></span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 leading-none">{p.label}</p>
                      <p className="text-[9px] text-slate-400 leading-tight mt-1">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          className="w-full bg-[#FC8019] hover:bg-[#e06e12] text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 mt-4"
        >
          <span>Complete Setup</span>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Footer warning */}
      <div className="text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5 pb-2">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Parameters secure & encrypted on live Firestore database.</span>
      </div>
    </div>
  );
}
