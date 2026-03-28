import { claimNextQueuedPost, updateSocialMediaPostStatus, getWorkspaceById } from "../db";

/**
 * Expected shape of workspace.socialConfig:
 * { 
 *   telegram: { botToken: string, chatId: string }, 
 *   facebook: { enabled: boolean }, 
 *   instagram: { enabled: boolean } 
 * }
 */

export async function processQueuedPosts() {
  console.log("[Social Publisher] Worker tick started.");
  
  while (true) {
    const post = await claimNextQueuedPost();
    if (!post) break;

    try {
      console.log(`[Social Publisher] Processing post ${post.id}.`);

      const workspace = await getWorkspaceById(post.workspaceId);
      if (!workspace || !workspace.socialConfig) {
        await updateSocialMediaPostStatus(post.id, "failed", null, {
          error: "Workspace or social configuration missing"
        });
        console.error(`[Social Publisher] Workspace ${post.workspaceId} or socialConfig missing.`);
        continue;
      }

      const config = workspace.socialConfig as any;
      const platforms = Array.isArray(post.platforms) ? post.platforms as string[] : [];
      let allSuccess = true;
      const platformResults: Record<string, any> = {};

      for (const platform of platforms) {
        if (platform === "telegram") {
          const result = await publishToTelegram(post.content || "", config.telegram);
          platformResults[platform] = result;
          if (result.status === "failed") allSuccess = false;
        } else {
          platformResults[platform] = { status: "failed", error: `Platform ${platform} not yet implemented` };
          allSuccess = false;
        }
      }

      if (allSuccess) {
        await updateSocialMediaPostStatus(post.id, "published", new Date(), platformResults);
        console.log(`[Social Publisher] Post ${post.id} successfully published.`);
      } else {
        await updateSocialMediaPostStatus(post.id, "failed", null, platformResults);
        console.error(`[Social Publisher] Post ${post.id} failed for one or more platforms.`);
      }

    } catch (error: any) {
      console.error(`[Social Publisher] Error processing post ${post.id}:`, error);
      await updateSocialMediaPostStatus(post.id, "failed", null, {
        error: error.message || "Unknown error"
      });
    }
  }
}

async function publishToTelegram(content: string, config?: { botToken: string, chatId: string }): Promise<{ status: "published" | "failed", error?: string }> {
  if (!config || !config.botToken || !config.chatId) {
    return { status: "failed", error: "Missing Bot Token or Chat ID" };
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: content,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      return { status: "failed", error: data.description || "Telegram API error" };
    }

    return { status: "published" };
  } catch (error: any) {
    return { status: "failed", error: error.message || "Fetch error" };
  }
}

export function startSocialWorker(intervalMs: number = 60000) {
  console.log(`[Social Publisher] Starting background worker (interval: ${intervalMs}ms)`);
  setInterval(async () => {
    try {
      await processQueuedPosts();
    } catch (error) {
      console.error("[Social Publisher] Worker tick error:", error);
    }
  }, intervalMs);
}
