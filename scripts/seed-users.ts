import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { users, workspaces } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found.");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  const accounts = [
    { email: "starter@estateiq.com", name: "Starter Agent", password: "test1234", plan: "starter" },
    { email: "pro@estateiq.com", name: "Pro Agent", password: "test1234", plan: "pro" }
  ];

  for (const acc of accounts) {
    console.log(`Processing ${acc.email}...`);
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, acc.email)).limit(1);
    
    let userId: number;
    let workspaceId: number;

    if (existingUser.length === 0) {
      console.log(`Creating user ${acc.email}...`);
      const passwordHash = await bcrypt.hash(acc.password, 12);
      const openId = `email:${nanoid(16)}`;

      // Create user
      const [{ insertId: newUserId }] = await db.insert(users).values({
        openId,
        email: acc.email,
        name: acc.name,
        passwordHash,
        loginMethod: "email",
        companyName: `${acc.name}'s Agency`,
      });

      userId = newUserId;

      // Create workspace
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

      const [{ insertId: newWorkspaceId }] = await db.insert(workspaces).values({
        ownerUserId: userId,
        name: `${acc.name}'s Workspace`,
        plan: acc.plan as "starter" | "pro",
        subscriptionStatus: "active",
        trialEndsAt,
        usageCyclePeriodStart: now,
        currentPeriodEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days active
      });

      workspaceId = newWorkspaceId;

      // Update user with workspaceId
      await db.update(users).set({ workspaceId }).where(eq(users.id, userId));
      console.log(`Created workspace ${workspaceId} and user ${userId}.`);
    } else {
      console.log(`${acc.email} already exists. Updating password and plan...`);
      userId = existingUser[0].id;
      workspaceId = existingUser[0].workspaceId!;
      
      const passwordHash = await bcrypt.hash(acc.password, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
      await db.update(workspaces).set({ 
        plan: acc.plan as "starter" | "pro", 
        subscriptionStatus: "active",
        currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }).where(eq(workspaces.id, workspaceId));
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding users:", err);
  process.exit(1);
});
