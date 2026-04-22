import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    setError(null);
    if (!validatePhone(phone)) {
      setError("Enter a valid Ethiopian number (e.g. 0911 234 567)");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, email, password, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtp("");
        throw new Error(data.error || "Incorrect or expired code. Request a new one.");
      }
      setLocation("/onboarding");
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, padding: "0 1rem" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              marginBottom: 16,
              boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              background: "linear-gradient(to right, #fff, #A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 6px",
            }}
          >
            Create Account
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Start your Estate IQ workspace
          </p>
        </div>

        <div
          style={{
            background: "rgba(26, 29, 46, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "36px 32px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {step === "credentials" ? (
            <form onSubmit={handleSendCode}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Abebe Bekele"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 234 5678"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: "#fca5a5", fontSize: 14 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "14px", background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7C3AED, #6D28D9)", border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)" }}
              >
                {loading ? "Sending..." : "Send Verification Code →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: 24, textAlign: "center" }}>
                <p style={{ color: "#9ca3af", fontSize: 14 }}>Code sent to <span style={{ color: "#fff", fontWeight: 600 }}>{phone}</span></p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: "0.2em", textAlign: "center", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: "#fca5a5", fontSize: 14, textAlign: "center" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{ width: "100%", padding: "14px", background: loading || otp.length !== 6 ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7C3AED, #6D28D9)", border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer", boxShadow: loading || otp.length !== 6 ? "none" : "0 4px 20px rgba(124,58,237,0.4)", marginBottom: 16 }}
              >
                {loading ? "Verifying..." : "Verify & Create Account →"}
              </button>

              <div style={{ textAlign: "center" }}>
                {cooldown > 0 ? (
                  <span style={{ color: "#6b7280", fontSize: 13 }}>Resend code in {cooldown}s</span>
                ) : (
                  <button type="button" onClick={handleResend} style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Resend code</button>
                )}
              </div>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
                  Code not arriving?{" "}
                  <a
                    href="https://wa.me/251991955555"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#25D366", fontWeight: 600, fontSize: 12 }}
                  >
                    WhatsApp us for help
                  </a>
                </p>
              </div>
            </form>
          )}

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
