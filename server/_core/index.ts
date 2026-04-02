import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleExternalLead } from "./leads";
import { startSocialWorker } from "./social";

// ── Global Error Catching (Diagnostic for Staging Crashes) ──
process.on("uncaughtException", (error) => {
  console.error("FATAL: Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("FATAL: Unhandled Rejection at:", reason);
  process.exit(1);
});

// Extend Express Request to include rawBody for HMAC verification
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── Dev One-Click Auth Dashboard (Always first, Staging/Dev only) ──
  app.get("/auth-dev", (req, res) => {
    if (process.env.NODE_ENV === "production") return res.status(403).send("Forbidden");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Estate IQ Staging - Auth Dashboard</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #1a1d2e; border: 1px solid #2a2d3e; border-radius: 16px; padding: 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
          h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; background: linear-gradient(to right, #7C3AED, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          p { color: #9ca3af; font-size: 14px; margin-bottom: 32px; }
          .btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 12px; text-decoration: none; transition: all 0.2s; }
          .btn-pro { background: #7C3AED; color: #fff; }
          .btn-pro:hover { background: #6D28D9; transform: translateY(-1px); }
          .btn-starter { background: #374151; color: #fff; border: 1px solid #4b5563; }
          .btn-starter:hover { background: #4b5563; }
          .status { margin-top: 24px; font-size: 12px; color: #059669; display: flex; align-items: center; justify-content: center; gap: 6px; }
          .dot { width: 8px; height: 8px; background: #059669; border-radius: 50%; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Estate IQ - Local Auth</h1>
          <p>Login to your Cloud DB instance without OAuth</p>
          <a href="/api/dev/login?openId=pro_test&returnTo=/" class="btn btn-pro">Login as PRO Agent</a>
          <a href="/api/dev/login?openId=starter_test&returnTo=/" class="btn btn-starter">Login as STARTER Agent</a>
          <div class="status"><span class="dot"></span> Database Connected (Railway)</div>
        </div>
      </body>
      </html>
    `);
  });

  // ── Dev Login Implementation (Prioritized) ──
  app.get("/api/dev/login", async (req, res) => {
    if (process.env.NODE_ENV === "production") return res.status(403).send("Forbidden");
    const { openId } = req.query;
    const returnTo = (req.query.returnTo as string) || "/";
    if (!openId) return res.status(400).send("Missing openId");
    try {
      const { sdk } = await import("./sdk.js");
      const { getSessionCookieOptions } = await import("./cookies.js");
      const { COOKIE_NAME, ONE_YEAR_MS } = await import("@shared/const");
      const sessionToken = await sdk.createSessionToken(openId as string, {
        name: (openId as string).includes("starter") ? "Starter Agent" : "Pro Agent",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.redirect(302, returnTo);
    } catch (e) {
      console.error("[Local Auth] Login failed:", e);
      return res.status(500).send("Login failed internally");
    }
  });

  // Configure body parser with larger size limit for file uploads.
  // We use the 'verify' property to capture the raw body for HMAC checks.
  app.use(express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── Dev Subscription Fix ──
  app.get("/api/dev/fix-subscription", async (req, res) => {
    try {
      const db = await import("../db.js");
      const user = await db.getUserByEmail("pro@estateiq.com");
      if (!user || !user.workspaceId) {
        return res.status(404).json({ error: "Pro user or workspace not found" });
      }
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.updateWorkspace(user.workspaceId, {
        currentPeriodEndsAt: nextMonth,
        subscriptionStatus: "active"
      });
      return res.json({ success: true, message: "PRO subscription updated", endsAt: nextMonth });
    } catch (e) {
      console.error("[Fix Subscription] Error:", e);
      return res.status(500).json({ error: "Failed to fix subscription" });
    }
  });

  // ── Health Check (Railway uses this) ──
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // ── Email/Password Auth ──
  app.post("/api/auth/login", async (req, res) => {
    try {
      const bcrypt = await import("bcryptjs");
      const { sdk } = await import("./sdk.js");
      const { getSessionCookieOptions } = await import("./cookies.js");
      const { COOKIE_NAME, ONE_YEAR_MS } = await import("@shared/const");
      const db = await import("../db.js");

      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const user = await db.getUserByEmail(email.toLowerCase().trim());
      if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || email,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ ok: true });
    } catch (e) {
      console.error("[Auth] Login error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const bcrypt = await import("bcryptjs");
      const { sdk } = await import("./sdk.js");
      const { getSessionCookieOptions } = await import("./cookies.js");
      const { COOKIE_NAME, ONE_YEAR_MS } = await import("@shared/const");
      const db = await import("../db.js");
      const { nanoid } = await import("nanoid");

      const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
      if (!email || !password || !name) return res.status(400).json({ error: "Name, email and password required" });
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

      const existing = await db.getUserByEmail(email.toLowerCase().trim());
      if (existing) return res.status(409).json({ error: "An account with this email already exists" });

      const passwordHash = await bcrypt.hash(password, 12);
      const openId = `email:${nanoid(16)}`;

      await db.upsertUser({
        openId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Store password hash
      const newUser = await db.getUserByEmail(email.toLowerCase().trim());
      if (newUser) {
        await db.setUserPasswordHash(newUser.id, passwordHash);
      }

      await db.ensureWorkspaceForUser({ openId, id: newUser?.id ?? 0 } as any);

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name.trim(),
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ ok: true });
    } catch (e) {
      console.error("[Auth] Register error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Social Webhook Handler (Comments/DMs -> Leads) ──
  app.post("/api/webhooks/social", async (req, res) => {
    const { processSocialInteraction } = await import("./social.js");
    const { postId, platform, userHandle, text, metadata } = req.body;
    
    // Process asynchronously to keep webhook response times low
    processSocialInteraction(postId, platform, userHandle, text, metadata).catch(err => {
      console.error("[Social Webhook] Failed to process interaction:", err);
    });

    return res.status(200).json({ received: true });
  });

  // ── Chapa Webhook Handler (outside tRPC) ──
  app.post("/api/webhooks/chapa", async (req, res) => {
    try {
      // 1. Verify Chapa HMAC signature
      const secret = process.env.CHAPA_SECRET_KEY;
      const signature = req.headers["x-chapa-signature"];

      if (!secret) {
        console.warn("[Chapa Webhook] CHAPA_SECRET_KEY not set. Signature check skipped for development.");
      } else if (!signature || !req.rawBody) {
        console.error("[Chapa Webhook] Missing signature or raw body");
        return res.status(401).json({ error: "Missing signature" });
      } else {
        const hash = crypto
          .createHmac("sha256", secret)
          .update(req.rawBody)
          .digest("hex");

        if (hash !== signature) {
          console.error("[Chapa Webhook] Invalid signature");
          return res.status(401).json({ error: "Invalid signature" });
        }
      }

      // 2. Process payload
      const { tx_ref, status, plan } = req.body as {
        tx_ref?: string;
        status?: string;
        plan?: string;
      };

      if (!tx_ref || status !== "success") {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      // Extract workspaceId from tx_ref format: eiq-{workspaceId}-{nanoid}
      const match = tx_ref.match(/^eiq-(\d+)-/);
      if (!match) {
        return res.status(400).json({ error: "Invalid tx_ref format" });
      }

      const workspaceId = parseInt(match[1], 10);

      // Dynamically import db functions
      const db = await import("../db.js");
      const workspace = await db.getWorkspaceById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }

      const billingInterval = (req.body.billingInterval === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";
      const now = new Date();
      const nextPeriodEnd = new Date(now);
      nextPeriodEnd.setDate(nextPeriodEnd.getDate() + (billingInterval === "yearly" ? 365 : 30));

      // Activate subscription
      await db.updateWorkspace(workspaceId, {
        plan: (plan as "starter" | "pro" | "agency") ?? workspace.plan,
        subscriptionStatus: "active",
        currentPeriodEndsAt: nextPeriodEnd,
        trialEndsAt: null,
        usageCyclePeriodStart: now,
        aiCaptionsCount: 0,
        aiImagesCount: 0,
        billingInterval,
      });

      console.log(`[Chapa Webhook] Activated subscription for workspace ${workspaceId}, plan: ${plan ?? workspace.plan}`);
      return res.json({ success: true });
    } catch (error) {
      console.error("[Chapa Webhook] Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── Mock Chapa Checkout Page (for development/testing) ──
  app.get("/api/webhooks/chapa/mock-checkout", (req, res) => {
    const { tx_ref, amount, return_url } = req.query as {
      tx_ref?: string;
      amount?: string;
      return_url?: string;
    };

    // Extract plan from tx_ref or default
    const plan = (req.query.plan as string) || "pro";

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chapa Mock Checkout</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .card { background: #1a1d2e; border-radius: 16px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
          .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #7C3AED; }
          .amount { text-align: center; font-size: 36px; font-weight: 800; margin-bottom: 8px; }
          .currency { color: #9ca3af; font-size: 14px; text-align: center; margin-bottom: 32px; }
          .detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #2a2d3e; font-size: 14px; color: #9ca3af; }
          .detail span:last-child { color: #fff; font-weight: 500; }
          .btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 24px; transition: all 0.2s; }
          .btn-pay { background: #7C3AED; color: white; }
          .btn-pay:hover { background: #6D28D9; transform: translateY(-1px); }
          .btn-cancel { background: transparent; color: #9ca3af; border: 1px solid #2a2d3e; margin-top: 12px; }
          .btn-cancel:hover { border-color: #9ca3af; }
          .badge { display: inline-block; background: #374151; padding: 4px 10px; border-radius: 6px; font-size: 11px; color: #d1d5db; margin-bottom: 16px; text-align: center; width: 100%; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🏦 Chapa Mock Checkout</div>
          <div class="badge">⚠️ SANDBOX MODE — No real charges</div>
          <div class="amount">ETB ${amount || "0"}</div>
          <div class="currency">Ethiopian Birr / month</div>
          <div class="detail"><span>Transaction</span><span>${tx_ref || "N/A"}</span></div>
          <div class="detail"><span>Service</span><span>Estate IQ</span></div>
          <div class="detail"><span>Plan</span><span style="text-transform:capitalize">${plan}</span></div>
          <form id="payForm">
            <button type="submit" class="btn btn-pay">✅ Simulate Successful Payment</button>
          </form>
          <a href="${return_url || '/billing'}"><button class="btn btn-cancel">Cancel</button></a>
        </div>
        <script>
          document.getElementById('payForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.textContent = 'Processing...';
            btn.disabled = true;
            try {
              await fetch('/api/webhooks/chapa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tx_ref: '${tx_ref || ""}',
                  status: 'success',
                  plan: '${plan}',
                  amount: ${amount || 0},
                }),
              });
              btn.textContent = '✅ Payment Successful! Redirecting...';
              btn.style.background = '#059669';
              setTimeout(() => { window.location.href = '${return_url || "/billing"}'; }, 1500);
            } catch (err) {
              btn.textContent = '❌ Payment Failed';
              btn.style.background = '#DC2626';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    console.log("[Server] Initializing Vite dev server...");
    await setupVite(app, server);
    console.log("[Server] Vite initialization complete.");
  } else {
    serveStatic(app);
  }

  // Start background workers
  startSocialWorker(60000);

  const port = Number(process.env.PORT) || 3000;

  console.log(`[Server] Starting on port ${port}...`);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
