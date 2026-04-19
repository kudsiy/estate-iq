import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Building2, Globe, Clock, Zap } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("en");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const validatePhone = (p: string) => /^(\+251|09|07)\d{8,9}$/.test(p);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "email") return handleSubmitEmail(e);
    
    setError(null);
    if (!validatePhone(phone)) {
      setError("Enter a valid Ethiopian number (e.g. 0911 234 567)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setStep("otp");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtp("");
        throw new Error(data.error || "Incorrect or expired code. Request a new one.");
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: "Market smarter.",
      subtitle: "Ethiopia's Real Estate Engine",
      email: "Email address",
      phone: "Phone number doesn't need country code",
      phoneLabel: "+251 91 234 5678",
      pass: "Password",
      btn: "Sign In",
      btnOtp: "Send Verification Code →",
      btnVerify: "Verify & Sign In →",
      reg: "Create account",
      error: "Invalid credentials. Try again."
    },
    am: {
      title: "በብልሃት ይገበያዩ::",
      subtitle: "የኢትዮጵያ የሪል እስቴት ኢንጂን",
      email: "የኢሜይል አድራሻ",
      phone: "ስልክ ቁጥር",
      phoneLabel: "+251 91 234 5678",
      pass: "የይለፍ ቃል",
      btn: "ግባ",
      btnOtp: "Send Verification Code →",
      btnVerify: "Verify & Sign In →",
      reg: "መለያ ይክፈቱ",
      error: "የተሳሳተ መረጃ ገብቷል። እባክዎን እንደገና ይሞክሩ።"
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col font-sans selection:bg-accent/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <nav className="relative z-10 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
              <Building2 className="w-4 h-4 text-white" />
           </div>
           <span className="font-black tracking-tighter text-lg uppercase italic">Estate IQ</span>
        </div>
        <button 
          onClick={() => setLang(l => l === "en" ? "am" : "en")}
          className="h-10 px-4 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang === "en" ? "AM" : "EN"}
        </button>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-[390px] mx-auto w-full pb-20">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest mb-6">
             <Zap className="w-3 h-3" /> {t[lang].subtitle}
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic leading-[0.9] uppercase mb-4">
            {t[lang].title}
          </h1>
          <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[280px]">
            The high-pressure CRM for Addis Ababa agents who mean business.
          </p>
        </div>

        {step === "credentials" && (
          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
            <button 
              type="button"
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === "phone" ? "bg-accent text-white shadow-md shadow-accent/20" : "text-white/40 hover:text-white/80"}`}
              onClick={() => { setTab("phone"); setError(null); }}
            >
              Phone
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === "email" ? "bg-accent text-white shadow-md shadow-accent/20" : "text-white/40 hover:text-white/80"}`}
              onClick={() => { setTab("email"); setError(null); }}
            >
              Email
            </button>
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            {tab === "phone" ? (
              <div className="space-y-1.5">
                <input 
                  type="tel" 
                  placeholder={t[lang].phoneLabel}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-white/20"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <input 
                  type="email" 
                  placeholder={t[lang].email}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-white/20"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <input 
                type="password" 
                placeholder={t[lang].pass}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-white/20"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Clock className="w-5 h-5 animate-spin mx-auto" /> : (tab === "phone" ? t[lang].btnOtp : t[lang].btn)}
            </button>
            
            <Link href="/register">
              <button type="button" className="w-full h-14 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                {t[lang].reg}
              </button>
            </Link>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-white/60 text-center mb-6">
              Code sent to <span className="text-white font-bold">{phone}</span>
            </p>
            
            <div className="space-y-1.5">
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="000000"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-5 text-2xl tracking-[0.4em] text-center font-bold focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-white/10"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-16 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Clock className="w-5 h-5 animate-spin mx-auto" /> : t[lang].btnVerify}
            </button>

            <div className="text-center mt-4">
              {cooldown > 0 ? (
                <span className="text-white/40 text-xs font-medium">Resend code in {cooldown}s</span>
              ) : (
                <button type="button" onClick={handleResend} className="text-accent hover:text-accent/80 text-xs font-bold underline transition-colors">Resend code</button>
              )}
            </div>
          </form>
        )}
      </main>

      <footer className="relative z-10 px-6 py-8 border-t border-white/5 text-center">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
          Estate IQ · 2026 · Addis Ababa
        </p>
      </footer>
    </div>
  );
}
