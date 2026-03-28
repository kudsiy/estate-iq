import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createBuyerProfile: vi.fn(),
  createBrandKit: vi.fn(),
  createContact: vi.fn(),
  createDeal: vi.fn(),
  createDesign: vi.fn(),
  createLead: vi.fn(),
  createNotification: vi.fn(),
  createProperty: vi.fn(),
  createSocialMediaPost: vi.fn(),
  createSupplierListing: vi.fn(),
  deleteBuyerProfile: vi.fn(),
  deleteBrandKit: vi.fn(),
  deleteContact: vi.fn(),
  deleteDeal: vi.fn(),
  deleteLead: vi.fn(),
  deleteProperty: vi.fn(),
  deleteSocialMediaPost: vi.fn(),
  getAllUsers: vi.fn(),
  getAllWorkspaces: vi.fn(),
  getBuyerProfileById: vi.fn(),
  getBuyerProfilesByScope: vi.fn(),
  getBrandKitById: vi.fn(),
  getBrandKitsByScope: vi.fn(),
  getContactById: vi.fn(),
  getContactsByScope: vi.fn(),
  getDealById: vi.fn(),
  getDealsByScope: vi.fn(),
  getDesignById: vi.fn(),
  getDesignsByScope: vi.fn(),
  getEngagementMetricsByScope: vi.fn(),
  getFeatureFlags: vi.fn(),
  getLeadById: vi.fn(),
  getLeadsByScope: vi.fn(),
  getNotificationsByScope: vi.fn(),
  getPropertiesByScope: vi.fn(),
  getPropertyById: vi.fn(),
  getWorkspaceById: vi.fn(),
  getSocialMediaPostById: vi.fn(),
  getSocialMediaPostsByScope: vi.fn(),
  getSupplierListingById: vi.fn(),
  getSupplierListingsByScope: vi.fn(),
  markNotificationRead: vi.fn(),
  upsertFeatureFlag: vi.fn(),
  updateBuyerProfile: vi.fn(),
  updateBrandKit: vi.fn(),
  updateContact: vi.fn(),
  updateDeal: vi.fn(),
  updateLead: vi.fn(),
  updateProperty: vi.fn(),
  updateSocialMediaPost: vi.fn(),
  updateSupplierListing: vi.fn(),
  updateUserProfile: vi.fn(),
  updateWorkspace: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    phone: null,
    companyName: null,
    workspaceId: 10,
    onboardingCompleted: false,
    targetMarket: null,
    selectedPlatforms: null,
    notificationPreferences: null,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("crm routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes contact list queries to the authenticated workspace", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const rows = [{ id: 5, firstName: "Abel" }];
    dbMocks.getContactsByScope.mockResolvedValue(rows);

    const result = await caller.crm.contacts.list();

    expect(dbMocks.getContactsByScope).toHaveBeenCalledWith({
      userId: 1,
      workspaceId: 10,
    });
    expect(result).toEqual(rows);
  });

  it("adds closedAt when a deal is moved to closed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    dbMocks.updateDeal.mockResolvedValue(true);

    await caller.crm.deals.update({
      id: 7,
      data: { stage: "closed" },
    });

    expect(dbMocks.updateDeal).toHaveBeenCalledTimes(1);
    expect(dbMocks.updateDeal.mock.calls[0]?.[0]).toEqual({
      userId: 1,
      workspaceId: 10,
    });
    expect(dbMocks.updateDeal.mock.calls[0]?.[1]).toBe(7);
    expect(dbMocks.updateDeal.mock.calls[0]?.[2]).toMatchObject({
      stage: "closed",
    });
    expect(dbMocks.updateDeal.mock.calls[0]?.[2]?.closedAt).toBeInstanceOf(Date);
  });

  it("returns not found when a property is outside the caller scope", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    dbMocks.getPropertyById.mockResolvedValue(undefined);

    await expect(caller.crm.properties.getById(999)).rejects.toThrow("Property not found");
    expect(dbMocks.getPropertyById).toHaveBeenCalledWith(
      { userId: 1, workspaceId: 10 },
      999
    );
  });

  it("converts a lead into a contact and linked deal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    dbMocks.getLeadById.mockResolvedValue({
      id: 14,
      source: "manual",
      propertyId: 22,
      contactId: null,
      leadData: {
        firstName: "Mahi",
        lastName: "Kebede",
        email: "mahi@example.com",
        phone: "+251911223344",
        notes: "Ready to tour this week",
      },
    });
    dbMocks.createContact.mockResolvedValue(33);
    dbMocks.createDeal.mockResolvedValue(44);
    dbMocks.updateLead.mockResolvedValue(true);

    const result = await caller.crm.leads.convert({
      leadId: 14,
      createDeal: true,
      stage: "lead",
    });

    expect(dbMocks.createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        workspaceId: 10,
        firstName: "Mahi",
        lastName: "Kebede",
      })
    );
    expect(dbMocks.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        workspaceId: 10,
        contactId: 33,
        propertyId: 22,
        leadId: 14,
      })
    );
    expect(dbMocks.updateLead).toHaveBeenCalledWith(
      { userId: 1, workspaceId: 10 },
      14,
      expect.objectContaining({
        contactId: 33,
        propertyId: 22,
        convertedDealId: 44,
        status: "converted",
      })
    );
    expect(result).toEqual({
      success: true,
      contactId: 33,
      dealId: 44,
    });
  });
});
