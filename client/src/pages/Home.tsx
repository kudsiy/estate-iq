import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useEffect, useState } from "react";

// ── Countdown helper ───────────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const calc = () => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ── Feature data ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "👥",
    title: "CRM & Lead Management",
    desc: "Track buyers, sellers & interactions. Score leads and automate follow-ups to close more deals.",
  },
  {
    icon: "📊",
    title: "Deal Pipeline Tracker",
    desc: "Visualize your sales process from lead to closed deal with drag-and-drop pipeline analytics.",
  },
  {
    icon: "🎨",
    title: "Design Studio",
    desc: "Create property posters, Instagram posts, flyers and video reels — all in one place.",
  },
  {
    icon: "📱",
    title: "Social Media Automation",
    desc: "Schedule content and prepare multi-platform publishing for Telegram, Instagram & more.",
  },
  {
    icon: "📈",
    title: "Engagement Analytics",
    desc: "Measure stored engagement metrics, compare platform activity, and build toward deeper ROI reporting.",
  },
  {
    icon: "⚡",
    title: "Lead Capture System",
    desc: "Capture leads through manual entry and website-ready flows, with WhatsApp import paths expanding over time.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const deadline = new Date("2026-05-01T00:00:00");
  const cd = useCountdown(deadline);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6">🏠</div>
          <h1 className="text-3xl font-extrabold text-white mb-4">Welcome back!</h1>
          <p className="text-white/60 mb-8">You're already logged in.</p>
          <Link href="/dashboard">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl transition-all">
              Go to Dashboard →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        fontFamily: "'Sora', 'Noto Sans Ethiopic', sans-serif",
        backgroundColor: "#020617",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Urgent top ticker ─────────────────────────────────────────── */}
      <div className="bg-blue-600 text-white py-3 px-6 text-center text-[11px] font-black tracking-widest uppercase shadow-lg relative z-50">
        <span className="mr-2 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>ልዩ ቅናሽ፦</span>
        ONLY 14 SLOTS REMAINING FOR THE ADDIS ABABA BETA PROGRAM.{" "}
        <a href="/register" className="underline ml-2 decoration-2 underline-offset-4 hover:text-blue-200">
          CLAIM YOUR SPOT →
        </a>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center px-6 lg:px-24"
        style={{
          background: `
            linear-gradient(to right, rgba(2,6,23,1) 10%, rgba(2,6,23,0.78) 45%, rgba(2,6,23,0.35) 100%),
            url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      >
        {/* Nav */}
        <nav className="absolute top-0 left-0 w-full px-6 lg:px-24 pt-8 flex justify-between items-center z-50">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-xl shadow-blue-900/40">
              EQ
            </div>
            <span className="text-2xl font-extrabold tracking-tighter uppercase text-white">Estate IQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <button className="text-white/80 hover:text-white font-bold text-sm px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all hidden sm:block">
                Pricing
              </button>
            </Link>
            <a href="/register">
              <button className="text-white/80 hover:text-white font-bold text-sm px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all">
                ይመዝገቡ
              </button>
            </a>
            <a href={getLoginUrl()}>
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-6 py-2.5 rounded-xl transition-all">
                ይግቡ
              </button>
            </a>
          </div>
        </nav>

        {/* Hero grid */}
        <div className="container mx-auto grid lg:grid-cols-2 gap-20 items-center pt-36 pb-20 w-full">
          {/* Left: content */}
          <div className="z-10">
            {/* Urgency badge */}
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-10"
              style={{
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.75)",
                color: "#fbbf24",
                animation: "pulse-gold 2.5s infinite",
              }}
            >
              <span>🔥</span>
              <span
                className="text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                አሁኑኑ ይቀላቀሉ! (Limited Access)
              </span>
            </div>

            <h1 className="text-5xl lg:text-[5.5rem] font-extrabold leading-[1.05] mb-10 tracking-tighter text-white">
              <span
                className="block text-4xl lg:text-6xl mb-5 text-blue-400"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif", fontWeight: 700 }}
              >
                የሪል እስቴት ሽያጮን ያዘምኑ
              </span>
              Master the Market in{" "}
              <span className="text-blue-400">Addis Ababa</span>
            </h1>

            <p
              className="text-white text-xl lg:text-2xl mb-12 max-w-xl leading-relaxed"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)", letterSpacing: "0.02em" }}
            >
              The ultimate toolkit for Ethiopia's elite agents.{" "}
              <strong className="text-white">
                Find properties fast, post everywhere and Close a deal 🤝
              </strong>{" "}
              with AI-driven intelligence.
              <span className="block mt-8 text-white font-bold border-l-4 border-white pl-6 text-lg italic">
                Don't let the best commissions go to your competitors.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <a href="/register">
                <button
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:brightness-110 text-white font-black text-xl px-14 py-7 rounded-2xl shadow-2xl flex items-center gap-4 transition-all"
                  style={{ boxShadow: "0 20px 40px -10px rgba(37,99,235,0.6)" }}
                >
                  <span style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>በነጻ ይጀምሩ</span>
                  <span className="text-base">→</span>
                </button>
              </a>
              <Link href="/pricing">
                <button className="bg-white/5 border border-white/40 backdrop-blur-md px-10 py-7 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all text-white">
                  View Pricing
                </button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-20 flex items-center gap-12">
              <div className="flex -space-x-5">
                {["A", "S", "Y", "M"].map((l, i) => (
                  <div
                    key={l}
                    className="w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-white text-lg shadow-xl"
                    style={{
                      borderColor: "#020617",
                      background: `hsl(${215 + i * 12}, 80%, ${40 + i * 5}%)`,
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <p
                  className="text-white font-black text-xl"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  500+ የኢትዮጵያ ወኪሎች ተመዝግበዋል
                </p>
                <p className="text-white/60 text-[10px] font-black tracking-[0.3em] uppercase mt-1">
                  Dominating the Addis Market
                </p>
              </div>
            </div>
          </div>

          {/* Right: floating stat cards */}
          <div className="relative hidden lg:flex flex-col items-end gap-10 pr-8">
            {/* Card 1 – Leads */}
            <div
              className="w-80 rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-2"
              style={{
                background: "rgba(15,23,42,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
                transform: "translateX(-10px)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <span
                  className="text-white text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  የደንበኞች እድገት
                </span>
                <div className="bg-emerald-500 text-white text-[9px] px-3 py-1.5 rounded-full font-black tracking-widest">
                  LIVE TRACKING
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-extrabold text-white">12</span>
                <span className="text-white/60 text-sm font-bold uppercase tracking-widest">Leads Today</span>
              </div>
              <div className="mt-8">
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "85%",
                      background: "white",
                      boxShadow: "0 0 20px rgba(255,255,255,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2 – Telegram */}
            <div
              className="w-80 rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-2"
              style={{
                background: "rgba(15,23,42,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
                transform: "translateX(-80px)",
              }}
            >
              <div className="flex items-center gap-5">
                <div className="bg-sky-500 w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl text-3xl">
                  ✈️
                </div>
                <div>
                  <div
                    className="text-xl font-extrabold text-white"
                    style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                  >
                    ቴሌግራም አውቶማቲክ
                  </div>
                  <div className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    48 Listings Synced
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 – Deals */}
            <div
              className="w-72 rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-2"
              style={{
                background: "rgba(15,23,42,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
                transform: "translateX(-20px)",
              }}
            >
              <div className="flex items-center gap-5">
                <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20 text-2xl">
                  🤝
                </div>
                <div>
                  <div
                    className="text-lg font-extrabold text-white"
                    style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                  >
                    ውል በመፈረም ላይ
                  </div>
                  <div className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">
                    8 Deals Closing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Urgency / Countdown ───────────────────────────────────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "#020617", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="container mx-auto px-6">
          <div
            className="flex flex-col lg:flex-row items-center justify-between gap-16 p-12 lg:p-16 rounded-[40px]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)" }}
          >
            <div className="text-center lg:text-left max-w-2xl">
              <h3
                className="text-4xl lg:text-5xl font-extrabold text-white mb-6"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                የተወሰነ ቦታ ብቻ ነው የቀረው!
              </h3>
              <p className="text-white/90 text-xl font-medium leading-relaxed">
                Join before May 1st to lock in your lifetime{" "}
                <strong className="text-white underline decoration-blue-500 decoration-4 underline-offset-8">
                  50% discount
                </strong>
                . Our beta program for top-tier Addis agents is filling up fast.
              </p>
            </div>
            <div className="flex items-center gap-6">
              {[
                { label: "Days", val: cd.days },
                { label: "Hours", val: cd.hours },
                { label: "Mins", val: cd.mins },
                { label: "Secs", val: cd.secs },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <div
                    className="text-4xl font-black text-white mb-3"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "20px",
                      padding: "1.5rem",
                      minWidth: "90px",
                    }}
                  >
                    {pad(val)}
                  </div>
                  <span className="text-[11px] text-white/40 uppercase font-black tracking-[0.3em]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6 lg:px-24" style={{ background: "#020617" }}>
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase px-5 py-2 rounded-full mb-6">
              Platform Features
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tighter">
              Everything an elite agent needs
            </h2>
            <p className="text-white/50 mt-4 text-lg max-w-2xl mx-auto">
              One unified platform — built specifically for the Ethiopian real estate market.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 cursor-default"
                style={{
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.6)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.5)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px -10px rgba(59,130,246,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.6)";
                }}
              >
                <div className="text-4xl mb-6">{f.icon}</div>
                <h3 className="text-xl font-extrabold text-white mb-3">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-24" style={{ background: "#020617" }}>
        <div className="container mx-auto">
          <div
            className="p-16 rounded-[40px] text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(2,6,23,1) 60%)",
              border: "1px solid rgba(59,130,246,0.3)",
              boxShadow: "0 40px 80px -20px rgba(37,99,235,0.3)",
            }}
          >
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tighter mb-6">
                Ready to Dominate{" "}
                <span className="text-blue-400">Addis Ababa</span>?
              </h2>
              <p className="text-white/60 text-xl max-w-2xl mx-auto mb-12">
                Join 500+ Ethiopian real estate professionals already using Estate IQ to win more deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <a href="/register">
                  <button
                    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:brightness-110 text-white font-black text-lg px-12 py-6 rounded-2xl shadow-2xl transition-all"
                    style={{ boxShadow: "0 20px 40px -10px rgba(37,99,235,0.6)" }}
                  >
                    Start Free Trial →
                  </button>
                </a>
                <Link href="/pricing">
                  <button className="bg-white/5 border border-white/30 text-white font-bold text-lg px-12 py-6 rounded-2xl hover:bg-white/10 transition-all">
                    View Pricing
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="py-10 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-white/30 text-[11px] font-black tracking-[0.4em] uppercase">
          © 2026 Estate IQ Intelligence · Addis Ababa, Ethiopia
        </p>
      </footer>

      {/* ── Keyframe injection ───────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
        @keyframes pulse-gold {
          0%   { box-shadow: 0 0 0 0   rgba(251,191,36,0.5); }
          70%  { box-shadow: 0 0 0 15px rgba(251,191,36,0);   }
          100% { box-shadow: 0 0 0 0   rgba(251,191,36,0);   }
        }
      `}</style>
    </div>
  );
}
