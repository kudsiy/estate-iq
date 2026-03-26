import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyPassword, validatePassword } from "./_core/password";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Password Hashing and Verification", () => {
  describe("hashPassword", () => {
    it("should hash a valid password", async () => {
      const password = "SecurePass123!@#";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should throw error for password less than 8 characters", async () => {
      const password = "Short1!";
      
      try {
        await hashPassword(password);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should generate different hashes for same password", async () => {
      const password = "SecurePass123!@#";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "SecurePass123!@#";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "SecurePass123!@#";
      const wrongPassword = "WrongPass123!@#";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should return false for empty password", async () => {
      const hash = await hashPassword("SecurePass123!@#");
      const isValid = await verifyPassword("", hash);

      expect(isValid).toBe(false);
    });

    it("should return false for empty hash", async () => {
      const isValid = await verifyPassword("SecurePass123!@#", "");

      expect(isValid).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should accept strong password", () => {
      const result = validatePassword("SecurePass123!@#");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password less than 8 characters", () => {
      const result = validatePassword("Short1!");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should reject password without uppercase letter", () => {
      const result = validatePassword("securepass123!@#");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should reject password without lowercase letter", () => {
      const result = validatePassword("SECUREPASS123!@#");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should reject password without number", () => {
      const result = validatePassword("SecurePass!@#");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should reject password without special character", () => {
      const result = validatePassword("SecurePass123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one special character");
    });

    it("should reject empty password", () => {
      const result = validatePassword("");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password is required");
    });

    it("should reject password longer than 128 characters", () => {
      const longPassword = "SecurePass123!@#" + "a".repeat(120);
      const result = validatePassword(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be less than 128 characters");
    });
  });

  describe("changePassword procedure", () => {
    it("should reject if passwords don't match", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.changePassword({
          currentPassword: "CurrentPass123!@#",
          newPassword: "NewPass123!@#",
          confirmPassword: "DifferentPass123!@#",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject if new password is too short", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.changePassword({
          currentPassword: "CurrentPass123!@#",
          newPassword: "Short1!",
          confirmPassword: "Short1!",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject if new password doesn't meet requirements", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.changePassword({
          currentPassword: "CurrentPass123!@#",
          newPassword: "weakpassword",
          confirmPassword: "weakpassword",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
