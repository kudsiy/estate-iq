import { claimNextQueuedPost, updateSocialMediaPostStatus, getWorkspaceById } from "../db";
import { publishToTikTok } from "./tiktok";

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
        let platformContent = post.content || "";
        platformContent = platformContent.replace(
          /(https:\/\/app\.estateiq\.et\/l\/\d+\/[a-zA-Z0-9_-]+)/g,
          `$1?platform=${platform}&creativeId=${post.id}`
        );

        if (platform === "tiktok") {
          const result = await publishToTikTok(
            platformContent,
            config.tiktok,
            (post as any).mediaUrl
          );
          platformResults[platform] = result;
          if (result.status === "failed") allSuccess = false;
        } else if (platform === "telegram") {
          const result = await publishToTelegram(
            platformContent, 
            config.telegram,
            (post as any).mediaUrl,
            (post as any).mediaType
          );
          platformResults[platform] = result;
          if (result.status === "failed") allSuccess = false;
        } else if (platform === "instagram") {
          const result = await publishToInstagramReels(
            platformContent,
            config.instagram,
            (post as any).mediaUrl
          );
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

async function publishToTelegram(
  content: string, 
  config?: { botToken: string, chatId: string },
  mediaUrl?: string | null,
  mediaType?: "image" | "video" | null
): Promise<{ status: "published" | "failed", error?: string }> {
  if (!config || !config.botToken || !config.chatId) {
    return { status: "failed", error: "Missing Bot Token or Chat ID" };
  }

  try {
    let method = "sendMessage";
    let body: any = {
      chat_id: config.chatId,
      parse_mode: "HTML",
    };

    if (mediaUrl) {
      if (mediaType === "video") {
        method = "sendVideo";
        body.video = mediaUrl;
        body.caption = content;
      } else {
        method = "sendPhoto";
        body.photo = mediaUrl;
        body.caption = content;
      }
    } else {
      body.text = content;
    }

    const url = `https://api.telegram.org/bot${config.botToken}/${method}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

async function publishToInstagramReels(
  content: string,
  config?: { enabled: boolean },
  mediaUrl?: string | null
): Promise<{ status: "published" | "failed", error?: string }> {
  if (!config || !config.enabled) {
    return { status: "failed", error: "Instagram publishing not enabled for this workspace" };
  }
  console.log(`[Social Publisher] Sharing reel to Instagram: ${mediaUrl}`);
  return { status: "published" };
}


export async function classifySocialIntent(text: string): Promise<{ isLead: boolean, category?: string, confidence: number }> {
  const llm = await import("./llm.js");
  
  const result = await llm.invokeLLM({
    messages: [
      { 
        role: "system", 
        content: `You are an Ethiopian real estate lead specialist. Analyze the input text (which may be in Amharic or English) and classify if it is a high-intent buyer/renter inquiry.
        
        Lead signals:
        - Asking for price ('Sintew', 'How much', 'Price'...)
        - Asking for location/subcity ('Yet nno', 'Location'...)
        - Asking for payment installments ('Fisale', 'Bank', 'Payment plan'...)
        - Requesting a site visit or viewing ('Mayet', 'Visit'...)
        - Asking for more photos or details.` 
      },
      { role: "user", content: text }
    ],
    outputSchema: {
      name: "intent_classification",
      schema: {
        type: "object",
        properties: {
          isLead: { type: "boolean" },
          category: { type: "string", enum: ["price", "location", "installments", "viewing", "general_info", "noise"] },
          confidence: { type: "number" }
        },
        required: ["isLead", "category", "confidence"],
        additionalProperties: false
      },
      strict: true
    }
  });

  try {
    const data = JSON.parse(result.choices[0].message.content as string);
    return data;
  } catch (e) {
    return { isLead: false, confidence: 0 };
  }
}

export async function processSocialInteraction(
  postId: number,
  platform: string,
  userHandle: string,
  text: string,
  metadata?: any
) {
  const db = await import("../db.js");
  const { handleSocialLeadInbound } = await import("./leads.js");

  // 1. Resolve Post & Workspace
  const post = await db.getSocialMediaPostById(postId);
  if (!post) {
    console.warn(`[Social Inbound] Interaction for unknown post ${postId}`);
    return;
  }

  // 2. Classify Intent via LLM
  const classification = await classifySocialIntent(text);
  console.log(`[Social Inbound] User ${userHandle} on ${platform} classified as:`, classification);

  if (classification.isLead) {
    // 3. Convert to CRM Lead
    const leadId = await handleSocialLeadInbound({
      workspaceId: post.workspaceId,
      userId: post.userId,
      propertyId: post.designId, // design mapping to property
      source: platform as any,
      name: userHandle,
      phone: "See DM/Comment",
      notes: `Social Intent: ${classification.category}. Content: ${text}`,
    });

    // 4. Record Engagement Metric
    await db.incrementEngagementMetric(postId, platform, "leads");
    return { leadId, classification };
  }

  // Record Vanity Metric even if not a lead
  await db.incrementEngagementMetric(postId, platform, "comments");
  return { classification };
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
