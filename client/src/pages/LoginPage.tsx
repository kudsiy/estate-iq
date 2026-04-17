import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Building2, Globe, Clock, Zap } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("en");

  const handleSubmit = async (e: React.FormEvent) => {
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

  const t = {
    en: {
      title: "Market smarter.",
      subtitle: "Ethiopia's Real Estate Engine",
      email: "Email address",
      pass: "Password",
      btn: "Sign In",
      reg: "Create account",
      error: "Invalid credentials. Try again."
    },
    am: {
      title: "በብልሃት ይገበያዩ::",
      subtitle: "የኢትዮጵያ የሪል እስቴት ኢንጂን",
      email: "የኢሜይል አድራሻ",
      pass: "የይለፍ ቃል",
      btn: "ግባ",
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
              {t[lang].error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Clock className="w-5 h-5 animate-spin mx-auto" /> : t[lang].btn}
          </button>
          
          <Link href="/register">
            <button type="button" className="w-full h-14 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">
              {t[lang].reg}
            </button>
          </Link>
        </form>
      </main>

      <footer className="relative z-10 px-6 py-8 border-t border-white/5 text-center">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
          Estate IQ · 2026 · Addis Ababa
        </p>
      </footer>
    </div>
  );
}
