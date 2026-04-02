import { useState } from "react";
import { useLocation } from "wouter";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setLocation("/");
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
          <form onSubmit={handleSubmit}>
            {[
              { label: "Full Name", type: "text", val: name, set: setName, placeholder: "Abebe Bekele" },
              { label: "Email Address", type: "email", val: email, set: setEmail, placeholder: "you@example.com" },
              { label: "Password", type: "password", val: password, set: setPassword, placeholder: "Min 8 characters" },
            ].map(({ label, type, val, set, placeholder }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </label>
                <input
                  type={type}
                  required
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  minLength={type === "password" ? 8 : undefined}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            ))}

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
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

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
