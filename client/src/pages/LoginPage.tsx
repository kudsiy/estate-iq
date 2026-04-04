import { useState } from "react";
import { useLocation, Link } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("returnTo") || "/";
  })();

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
      setLocation(returnTo);
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
        width: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/login-bg.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center 35%"
        }}
      />
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(110deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.55) 50%,rgba(0,0,0,0.72) 100%)"
        }}
      />
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "28px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div 
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span 
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "0.04em"
            }}
          >
            Estate IQ
          </span>
        </div>
        <div 
          style={{
            padding: "6px 16px",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "50px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.08em"
          }}
        >
          EN
        </div>
      </div>
      
      <div 
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "1100px",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "48px"
        }}
      >
        <div style={{ flex: 1, maxWidth: "460px" }}>
          <div 
            style={{
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              marginBottom: "18px"
            }}
          >
            Ethiopia's Real Estate Intelligence Platform
          </div>
          <h1 
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "66px",
              fontWeight: 500,
              color: "#fff",
              lineHeight: 1.08,
              marginBottom: "20px",
              letterSpacing: "-0.01em"
            }}
          >
            Market your<br />listings smarter.
          </h1>
          <p 
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.75,
              fontWeight: 300,
              maxWidth: "360px"
            }}
          >
            Generate professional property graphics, capture leads automatically, and close deals — built for Addis Ababa agents.
          </p>
        </div>
        
        <div 
          style={{
            width: "390px",
            flexShrink: 0,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "20px",
            padding: "40px 34px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
          }}
        >
          <h2 
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "26px",
              fontWeight: 500,
              color: "#fff",
              marginBottom: "4px"
            }}
          >
            Sign in to your workspace
          </h2>
          <p 
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "28px",
              fontWeight: 300
            }}
          >
            Welcome back. Enter your details below.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <input 
                type="email" 
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "50px",
                  padding: "14px 22px",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "15px",
                  outline: "none"
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "50px",
                  padding: "14px 22px",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "15px",
                  outline: "none"
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>
            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <a href="#" style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", textDecoration: "none" }}>
                Forgot password?
              </a>
            </div>
            
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 20,
                  color: "#fca5a5",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                background: loading ? "rgba(17,17,17,0.5)" : "#111",
                border: "none",
                borderRadius: "50px",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "15px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          
          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
            Don't have an account?{" "}
            <Link href="/register">
              <span style={{ color: "#fff", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.4)", cursor: "pointer" }}>
                Create one
              </span>
            </Link>
          </div>
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
            By signing in you agree to our Terms of Service
          </div>
        </div>
      </div>
      
      <div 
        style={{
          position: "absolute",
          bottom: "28px",
          left: "48px",
          zIndex: 10,
          fontSize: "12px",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.06em"
        }}
      >
        © 2026 Estate IQ · Addis Ababa, Ethiopia
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');
      `}} />
    </div>
  );
}
