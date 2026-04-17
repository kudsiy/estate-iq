import "dotenv/config";
import { getDb } from "../server/db";
import { workspaces } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { eq, isNull } from "drizzle-orm";

async function seed() {
  console.log("Starting token generation...");
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  const allWorkspaces = await db.select().from(workspaces).where(isNull(workspaces.trackingToken));
  console.log(`Found ${allWorkspaces.length} workspaces without trackingToken.`);

  for (const w of allWorkspaces) {
    const token = `et_${nanoid(24)}`;
    console.log(`Updating workspace ${w.id} with token ${token}`);
    await db.update(workspaces)
      .set({ trackingToken: token } as any)
      .where(eq(workspaces.id, w.id));
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
