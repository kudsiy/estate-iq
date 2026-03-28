import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleExternalLead } from "./_core/leads";
import { processQueuedPosts } from "./_core/social";
import * as db from "./db";

// Mock the DB
vi.mock("./db", () => ({
  getWorkspaceByApiKey: vi.fn(),
  getLeadsByWorkspaceId: vi.fn(),
  createLead: vi.fn(),
  createContact: vi.fn(),
  createDeal: vi.fn(),
  updateLead: vi.fn(),
  getWorkspaceById: vi.fn(),
  claimNextQueuedPost: vi.fn(),
  updateSocialMediaPostStatus: vi.fn(),
}));

describe("Phase 3: Live Lead Ingestion & Social Media Integrations", () => {
  
  describe("External Lead API", () => {
    it("should return 401 if Authorization header is missing", async () => {
      const req = { headers: {}, body: {} } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      
      await handleExternalLead(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Missing or invalid Authorization header" }));
    });

    it("should return 401 if API key is invalid", async () => {
      const req = { headers: { authorization: "Bearer invalid" }, body: {} } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      
      vi.mocked(db.getWorkspaceByApiKey).mockResolvedValue(undefined);
      
      await handleExternalLead(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 if subscription is inactive", async () => {
      const workspace = { 
        id: 1, 
        apiKey: "valid", 
        subscriptionStatus: "trial", 
        trialEndsAt: new Date("2020-01-01"), // Expired
        plan: "starter" 
      };
      const leadData = {
        firstName: "John",
        lastName: "Doe",
        phone: "0911000000"
      };
      const req = { headers: { authorization: "Bearer valid" }, body: leadData } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      
      vi.mocked(db.getWorkspaceByApiKey).mockResolvedValue(workspace as any);
      
      await handleExternalLead(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Subscription Inactive" }));
    });

    it("should successfully ingest lead with valid API key and split name", async () => {
      const workspace = { 
        id: 1, 
        ownerUserId: 1,
        apiKey: "valid", 
        subscriptionStatus: "active", 
        currentPeriodEndsAt: new Date("2099-01-01"),
        plan: "starter" 
      };
      const leadData = {
        name: "Abebe Kebede",
        phone: "0911000000"
      };
      const req = { headers: { authorization: "Bearer valid" }, body: leadData } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      
      vi.mocked(db.getWorkspaceByApiKey).mockResolvedValue(workspace as any);
      vi.mocked(db.getLeadsByWorkspaceId).mockResolvedValue([]);
      
      await handleExternalLead(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(db.createLead).toHaveBeenCalledWith(expect.objectContaining({
        leadData: expect.objectContaining({
          firstName: "Abebe",
          lastName: "Kebede"
        })
      }));
    });

    it("should handle single word name by defaulting lastName to Prospect", async () => {
      const workspace = { 
        id: 1, 
        ownerUserId: 1,
        apiKey: "valid", 
        subscriptionStatus: "active", 
        currentPeriodEndsAt: new Date("2099-01-01"),
        plan: "starter" 
      };
      const leadData = {
        name: "Madonna",
        phone: "0911000000"
      };
      const req = { headers: { authorization: "Bearer valid" }, body: leadData } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      
      vi.mocked(db.getWorkspaceByApiKey).mockResolvedValue(workspace as any);
      vi.mocked(db.getLeadsByWorkspaceId).mockResolvedValue([]);
      
      await handleExternalLead(req, res);
      
      expect(db.createLead).toHaveBeenCalledWith(expect.objectContaining({
        leadData: expect.objectContaining({
          firstName: "Madonna",
          lastName: "Prospect"
        })
      }));
    });

    it("should handle names with extra spaces", async () => {
      const workspace = { 
        id: 1, 
        ownerUserId: 1,
        apiKey: "valid", 
        subscriptionStatus: "active", 
        currentPeriodEndsAt: new Date("2099-01-01"),
        plan: "starter" 
      };
      const leadData = {
        name: "Abebe  Kebede",
        phone: "0911000000"
      };
      const req = { headers: { authorization: "Bearer valid" }, body: leadData } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      
      vi.mocked(db.getWorkspaceByApiKey).mockResolvedValue(workspace as any);
      vi.mocked(db.getLeadsByWorkspaceId).mockResolvedValue([]);
      
      await handleExternalLead(req, res);
      
      expect(db.createLead).toHaveBeenCalledWith(expect.objectContaining({
        leadData: expect.objectContaining({
          firstName: "Abebe",
          lastName: "Kebede"
        })
      }));
    });
  });

  describe("Social Publisher Worker", () => {
    it("should process and claim queued posts atomically", async () => {
      const post = { id: 101, workspaceId: 1, content: "Hello", platforms: ["telegram"] };
      const workspace = { 
        id: 1, 
        socialConfig: { telegram: { botToken: "tok", chatId: "id" } } 
      };
      
      // First call claims a post, second call returns undefined to break loop
      vi.mocked(db.claimNextQueuedPost)
        .mockResolvedValueOnce(post as any)
        .mockResolvedValueOnce(undefined);
        
      vi.mocked(db.getWorkspaceById).mockResolvedValue(workspace as any);
      
      // Mock global fetch for Telegram API
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ ok: true })
      });
      
      await processQueuedPosts();
      
      expect(db.claimNextQueuedPost).toHaveBeenCalledTimes(2);
      expect(db.updateSocialMediaPostStatus).toHaveBeenCalledWith(
        101, 
        "published", 
        expect.any(Date),
        { telegram: { status: "published" } }
      );
    });
  });
});
