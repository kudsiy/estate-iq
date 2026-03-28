import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Chapa Webhook Handler (outside tRPC) ──
  app.post("/api/webhooks/chapa", async (req, res) => {
    // TODO: Verify Chapa HMAC signature using CHAPA_SECRET_KEY before going live
    try {
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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
