import React, { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { Mail, Phone, Lock, Sparkles, LogIn, ArrowRight, ShieldCheck, User, RefreshCw, KeyRound } from "lucide-react";
import gharloopIcon from "../assets/gharloop-icon.png";

interface AuthScreenProps {
  onAuthSuccess: (uid: string) => void;
  onContinueAsGuest: () => void;
}

export default function AuthScreen({ onAuthSuccess, onContinueAsGuest }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<"options" | "email" | "phone" | "otp">("options");
  const [emailMode, setEmailMode] = useState<"login" | "signup">("login");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  // Statuses
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Clean error when switching modes
  useEffect(() => {
    setError(null);
  }, [authMode, emailMode]);

  // Set up invisible reCAPTCHA for Phone Auth
  useEffect(() => {
    if (authMode === "phone" || authMode === "otp") {
      try {
        // Initialize recaptcha verifier
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved, proceeding with OTP send...");
          },
          "expired-callback": () => {
            setError("reCAPTCHA expired. Please try sending OTP again.");
          }
        });
        setRecaptchaVerifier(verifier);
        
        return () => {
          verifier.clear();
        };
      } catch (err: any) {
        console.error("reCAPTCHA init error:", err);
      }
    }
  }, [authMode]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onAuthSuccess(result.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill out all fields.");
      setLoading(false);
      return;
    }

    try {
      if (emailMode === "login") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(result.user.uid);
      } else {
        if (!fullName) {
          setError("Please provide your name.");
          setLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
          await updateProfile(result.user, { displayName: fullName });
        }
        onAuthSuccess(result.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Email authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Format phone number to E.164 if it isn't already
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      // If it looks like a standard Indian 10-digit number
      if (formattedPhone.length === 10) {
        formattedPhone = "+91" + formattedPhone;
      } else {
        setError("Please enter a valid phone number with country code (e.g. +91XXXXXXXXXX)");
        setLoading(false);
        return;
      }
    }

    if (!recaptchaVerifier) {
      setError("reCAPTCHA verifier is not initialized. Please reload.");
      setLoading(false);
      return;
    }

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setAuthMode("otp");
    } catch (err: any) {
      console.error("Phone Auth Send OTP error:", err);
      setError(err.message || "Failed to send verification code. Check phone format.");
      // Re-initialize reCAPTCHA
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch {}
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        setRecaptchaVerifier(verifier);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!otpCode || otpCode.length < 6) {
      setError("Please enter the 6-digit OTP code.");
      setLoading(false);
      return;
    }

    if (!confirmationResult) {
      setError("Verification expired. Please send OTP again.");
      setAuthMode("phone");
      setLoading(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(otpCode);
      if (result.user) {
        onAuthSuccess(result.user.uid);
      }
    } catch (err: any) {
      console.error("Phone Auth Verification error:", err);
      setError("Invalid OTP verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[750px] justify-between p-6 bg-[#FAF8F5] relative select-none">
      
      {/* Invisible reCAPTCHA container required for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Branded Header Section */}
      <div className="text-center pt-8 space-y-4">
        {/* Real GharLoop logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl overflow-hidden shadow-md shadow-[#FC8019]/20">
          <img src={gharloopIcon} alt="Gharloops" className="w-full h-full object-cover" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            Ghar<span className="text-[#FC8019]">loops</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Ghar chalta rahe, bina bar-bar soche.
          </p>
        </div>

        {/* Powered by Swiggy badge */}
        <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          <span>Powered by Swiggy</span>
        </div>
      </div>

      {/* Main Authentication Card container */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 my-6 space-y-5">
        
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-semibold leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {authMode === "options" && (
          <div className="space-y-3.5">
            <div className="text-center pb-2">
              <h2 className="text-sm font-bold text-slate-700">Welcome! Let's get you set up</h2>
            </div>

            {/* Google Authentication */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.42 3.68 1.54 7.57l3.75 2.91C6.18 7.39 8.84 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.35 3.55l3.65 2.84c2.13-1.97 3.75-4.87 3.75-8.49z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.88c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.54 7.35C.56 9.29 0 11.45 0 13.76s.56 4.47 1.54 6.41l3.75-2.91z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.84c-1.01.68-2.31 1.09-4.31 1.09-3.16 0-5.82-2.35-6.71-5.44L1.54 16.4C3.42 20.32 7.35 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Phone Authentication Option */}
            <button
              onClick={() => setAuthMode("phone")}
              disabled={loading}
              className="w-full bg-[#FC8019] hover:bg-[#e06e12] text-white font-black py-3 rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Continue with Phone</span>
            </button>

            {/* Email Authentication Option */}
            <button
              onClick={() => {
                setAuthMode("email");
                setEmailMode("login");
              }}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Continue with Email</span>
            </button>
          </div>
        )}

        {/* EMAIL LOGIN/SIGNUP FORM */}
        {authMode === "email" && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-400">
                {emailMode === "login" ? "Email Sign-In" : "Create Account"}
              </span>
              <button
                type="button"
                onClick={() => setAuthMode("options")}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
              >
                Back
              </button>
            </div>

            {emailMode === "signup" && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Dheeraj Joshi"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FC8019] hover:bg-[#e06e12] text-white font-black py-2.5 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>{emailMode === "login" ? "Sign In" : "Sign Up"}</span>
                  <LogIn className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setEmailMode(emailMode === "login" ? "signup" : "login")}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
              >
                {emailMode === "login" 
                  ? "Don't have an account? Sign up here" 
                  : "Already have an account? Sign in here"}
              </button>
            </div>
          </form>
        )}

        {/* PHONE NUMBER ENTRY */}
        {authMode === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#FC8019]" /> Mobile OTP Setup
              </span>
              <button
                type="button"
                onClick={() => setAuthMode("options")}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
              >
                Back
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">10-Digit Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-500">+91</span>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter 10-digit mobile"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-12 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none font-bold"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-medium">
                We'll transmit a secure OTP code to verify your SIM and activate scheduling.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneNumber || phoneNumber.length < 10}
              className="w-full bg-[#FC8019] hover:bg-[#e06e12] text-white font-black py-2.5 rounded-xl text-xs uppercase flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Send OTP Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* PHONE OTP VERIFICATION */}
        {authMode === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#FC8019]" /> Enter OTP Code
              </span>
              <button
                type="button"
                onClick={() => setAuthMode("phone")}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
              >
                Back
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="XXXXXX"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base py-3 rounded-xl focus:ring-1 focus:ring-orange-400 focus:outline-none text-center font-mono font-black tracking-[1.2em] pl-4"
              />
              <p className="text-[9px] text-slate-400 mt-1 font-medium text-center">
                Check your messages. OTP sent to {phoneNumber}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-xs uppercase flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Verify and Log In</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 pb-6 space-y-3">
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[260px] mx-auto">
          By continuing, you agree to our <span className="text-slate-500 font-semibold">Terms &amp; Privacy Policy</span>
        </p>

        <button
          onClick={onContinueAsGuest}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 underline block mx-auto py-1"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
