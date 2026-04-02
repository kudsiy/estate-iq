import "dotenv/config";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { users, workspaces } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("[Seed] Connecting to Railway DB...");

  const accounts = [
    {
      openId: "email:pro_staging_001",
      name: "Abebe Bekele (PRO)",
      email: "pro@estateiq.test",
      password: "staging123",
      plan: "pro" as const,
      loginMethod: "email",
    },
    {
      openId: "email:starter_staging_001",
      name: "Tigist Worku (STARTER)",
      email: "starter@estateiq.test",
      password: "staging123",
      plan: "starter" as const,
      loginMethod: "email",
    },
  ];

  for (const account of accounts) {
    console.log(`[Seed] Creating account: ${account.email}`);
    const passwordHash = await hash(account.password, 12);

    // Upsert user
    await db
      .insert(users)
      .values({
        openId: account.openId,
        name: account.name,
        email: account.email,
        loginMethod: account.loginMethod,
        passwordHash,
        onboardingCompleted: true,
        lastSignedIn: new Date(),
      } as any)
      .onDuplicateKeyUpdate({
        set: {
          name: account.name,
          email: account.email,
          passwordHash,
          onboardingCompleted: true,
        } as any,
      });

    // Get the user to link workspace
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.openId, account.openId))
      .limit(1);

    if (!user) {
      console.error(`[Seed] Failed to find user after insert: ${account.email}`);
      continue;
    }

    // Check if workspace exists
    const [existingWs] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerUserId, user.id))
      .limit(1);

    if (!existingWs) {
      const [ws] = await db
        .insert(workspaces)
        .values({
          ownerUserId: user.id,
          name: `${account.name}'s Workspace`,
          plan: account.plan,
          subscriptionStatus: account.plan === "pro" ? "active" : "trial",
        })
        .$returningId();

      // Link workspace to user
      await db
        .update(users)
        .set({ workspaceId: (ws as any).id })
        .where(eq(users.id, user.id));

      console.log(`[Seed] ✓ Created workspace for ${account.email} (plan: ${account.plan})`);
    } else {
      // Update plan
      await db
        .update(workspaces)
        .set({ plan: account.plan })
        .where(eq(workspaces.id, existingWs.id));
      console.log(`[Seed] ✓ Updated workspace for ${account.email} (plan: ${account.plan})`);
    }
  }

  console.log("\n[Seed] ✅ Done! Test accounts:");
  console.log("  PRO     → pro@estateiq.test     / staging123");
  console.log("  STARTER → starter@estateiq.test / staging123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] ❌ Failed:", err);
  process.exit(1);
});
