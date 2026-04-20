import { Request, Response } from "express";
import { 
  getWorkspaceByApiKey, 
  getLeadsByWorkspaceId, 
  createLead, 
  createContact, 
  createDeal, 
  updateLead,
  getPropertyById 
} from "../db";
import { PLAN_LIMITS, isLimitReached, isSubscriptionActive } from "./monetization";
import { z } from "zod";

const externalLeadSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  notes: z.string().optional(),
  source: z.enum(["form", "whatsapp", "facebook", "instagram", "tiktok", "manual", "tracking_link"]).default("form"),
  propertyId: z.number().int().positive().optional(),
}).refine(data => data.name || (data.firstName && data.lastName), {
  message: "Either 'name' or both 'firstName' and 'lastName' must be provided",
  path: ["name"]
});

export async function handleExternalLead(req: Request, res: Response) {
  try {
    // 1. Authenticate via Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const apiKey = authHeader.split(" ")[1];
    const workspace = await getWorkspaceByApiKey(apiKey);

    if (!workspace) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    // 2. Validate Input
    const parseResult = externalLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid lead data", issues: parseResult.error.issues });
    }

    let { name, firstName, lastName, ...input } = parseResult.data;

    // Handle name splitting if name is provided and parts are missing
    if (name && (!firstName || !lastName)) {
      const parts = name.trim().split(/\s+/);
      firstName = parts[0] || "Prospect";
      lastName = parts.slice(1).join(" ") || "Prospect";
    }

    // Final safety check for missing names
    if (!firstName) firstName = "Prospect";
    if (!lastName) lastName = "Prospect";

    // 3. Enforce Enrollment/Subscription Gate
    if (!isSubscriptionActive(workspace)) {
      return res.status(403).json({ 
        error: "Subscription Inactive", 
        message: "The trial or subscription for this workspace has expired." 
      });
    }

    // 4. Enforce Plan Limits
    const limit = PLAN_LIMITS[workspace.plan].leads;
    const currentLeads = await getLeadsByWorkspaceId(workspace.id);
    if (isLimitReached(limit, currentLeads.length)) {
      return res.status(403).json({ 
        error: "Limit Reached", 
        message: `This workspace has reached its ${workspace.plan} plan limit for leads.` 
      });
    }

    // 5. Cascade Creation (Lead -> Contact -> Deal)
    const userId = workspace.ownerUserId;
    const workspaceId = workspace.id;

    const leadId = await createLead({
      userId,
      workspaceId,
      propertyId: input.propertyId ?? null,
      source: input.source,
      leadData: {
        firstName,
        lastName,
        phone: input.phone,
        email: input.email ?? null,
        notes: input.notes ?? null,
      },
      status: "new",
    });

    const contactId = await createContact({
      userId,
      workspaceId,
      firstName,
      lastName,
      email: input.email ?? null,
      phone: input.phone,
      whatsappNumber: input.phone,
      type: "buyer",
      status: "new",
      source: input.source,
      notes: input.notes ?? null,
    });

    const dealId = await createDeal({
      userId,
      workspaceId,
      contactId,
      propertyId: input.propertyId ?? null,
      leadId,
      stage: "lead",
      notes: input.notes ?? null,
    });

    await updateLead({ userId, workspaceId }, leadId, {
      contactId,
      convertedDealId: dealId,
      status: "converted",
    });

    console.log(`[External Lead] Created lead ${leadId} for workspace ${workspaceId}`);
    
    return res.status(201).json({ 
      success: true, 
      leadId, 
      contactId, 
      dealId,
      message: "Lead processed and added to CRM pipeline"
    });

  } catch (error) {
    console.error("[External Lead API] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function handleSocialLeadInbound(params: {
  workspaceId: number,
  userId: number,
  propertyId?: number | null,
  source: string,
  name: string,
  phone: string,
  notes: string,
}) {
  try {
    const { workspaceId, userId, propertyId, source, name, phone, notes } = params;

    // 1. Resolve Name
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || "Social";
    const lastName = parts.slice(1).join(" ") || "Lead";

    // 2. Cascade Creation (Lead -> Contact -> Deal)
    const leadId = await createLead({
      userId,
      workspaceId,
      propertyId: propertyId ?? null,
      source: source as any,
      leadData: {
        firstName,
        lastName,
        phone,
        notes,
      },
      status: "new",
    });

    const contactId = await createContact({
      userId,
      workspaceId,
      firstName,
      lastName,
      phone,
      whatsappNumber: phone,
      type: "buyer",
      status: "new",
      source: source as any,
      notes,
    });

    const dealId = await createDeal({
      userId,
      workspaceId,
      contactId,
      propertyId: propertyId ?? null,
      leadId,
      stage: "lead",
      notes,
    });

    await updateLead({ userId, workspaceId }, leadId, {
      contactId,
      convertedDealId: dealId,
      status: "converted",
    });

    // 3. Create Agent Notification for "Hot Lead"
    const { createNotification } = await import("../db.js");
    await createNotification({
      userId,
      workspaceId,
      type: "lead",
      title: `🔥 Hot Lead from ${source}`,
      message: `New inquiry from ${name}: "${notes.length > 60 ? notes.substring(0, 60) + "..." : notes}"`,
      entityType: "lead",
      entityId: leadId,
      isRead: false,
    });

    console.log(`[Social Lead Inbound] Processed ${source} lead ${leadId} for workspace ${workspaceId}`);
    return leadId;

  } catch (error) {
    console.error("[Social Lead Inbound API] Error:", error);
    throw error;
  }
}
