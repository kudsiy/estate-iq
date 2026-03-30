import { describe, it, expect, vi } from "vitest";

// Mocking dependencies to unit test the router logic
vi.mock("./db", async () => {
  return {
    createContact: vi.fn().mockResolvedValue(1),
    getContactsByScope: vi.fn().mockResolvedValue([]),
    createContactEvent: vi.fn().mockResolvedValue(1),
    getWorkspaceById: vi.fn().mockResolvedValue({ 
      plan: "starter", 
      subscriptionStatus: "active",
      currentPeriodEndsAt: new Date(Date.now() + 100000)
    }),
  };
});

import { createContact, createContactEvent } from "./db";
import { appRouter } from "./routers";

// Create a dummy caller for the trpc router
const caller = appRouter.createCaller({
  req: {} as any,
  res: {} as any,
  user: { id: 1, workspaceId: 1, openId: "test", role: "admin" } as any,
});

describe("CRM Contacts Router", () => {
  it("should create a contact and extract subcity, woreda, propertyInterest directly", async () => {
    // Clear mocks
    vi.clearAllMocks();

    const result = await caller.crm.contacts.create({
      firstName: "Abebe",
      lastName: "Beso",
      type: "buyer",
      subcity: "Bole",
      woreda: "12",
      propertyInterest: "villa",
    });

    expect(result.success).toBe(true);
    // Verify createContact was called with the direct fields
    expect(createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Abebe",
        subcity: "Bole",
        woreda: "12",
        propertyInterest: "villa",
        userId: 1,
        workspaceId: 1,
      })
    );
  });

  it("should create a contactEvent when a contact is created", async () => {
    vi.clearAllMocks();

    await caller.crm.contacts.create({
      firstName: "Kebede",
      lastName: "Mikael",
      type: "seller",
      source: "Facebook",
    });

    expect(createContactEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 1,
        type: "system",
        label: "Contact created",
        description: "Source: Facebook",
        userId: 1,
        workspaceId: 1,
      })
    );
  });
});
