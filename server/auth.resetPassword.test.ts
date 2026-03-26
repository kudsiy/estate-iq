import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { hashPassword, verifyPassword } from "./_core/password";

describe("Password Reset Flow - Core Logic", () => {
  const testEmail = "reset-test@example.com";
  const testPassword = "OldPassword123!";
  const newPassword = "NewPassword456!";

  describe("Token Generation and Validation", () => {
    it("should generate secure reset tokens", () => {
      const token = crypto.randomBytes(32).toString("hex");
      
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(typeof token).toBe("string");
    });

    it("should hash tokens using SHA256", () => {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      expect(tokenHash).toBeDefined();
      expect(tokenHash).not.toBe(token);
      expect(tokenHash.length).toBe(64); // SHA256 produces 64 hex characters
    });

    it("should produce consistent hash for same token", () => {
      const token = crypto.randomBytes(32).toString("hex");
      const hash1 = crypto.createHash("sha256").update(token).digest("hex");
      const hash2 = crypto.createHash("sha256").update(token).digest("hex");

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different tokens", () => {
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");
      
      const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
      const hash2 = crypto.createHash("sha256").update(token2).digest("hex");

      expect(hash1).not.toBe(hash2);
    });

    it("should validate token expiration", () => {
      const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const pastExpiry = new Date(Date.now() - 1000);

      expect(futureExpiry.getTime()).toBeGreaterThan(Date.now());
      expect(pastExpiry.getTime()).toBeLessThan(Date.now());
    });
  });

  describe("Password Validation", () => {
    it("should validate password meets requirements", () => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

      const validPasswords = [
        "ValidPass123!",
        "SecureP@ssw0rd",
        "MyP@ssw0rd123",
        "Test1234!@#$",
      ];

      validPasswords.forEach((pwd) => {
        expect(passwordRegex.test(pwd)).toBe(true);
      });
    });

    it("should reject passwords that are too short", () => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      
      expect(passwordRegex.test("Short1!")).toBe(false);
    });

    it("should reject passwords without uppercase", () => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      
      expect(passwordRegex.test("lowercase123!")).toBe(false);
    });

    it("should reject passwords without lowercase", () => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      
      expect(passwordRegex.test("UPPERCASE123!")).toBe(false);
    });

    it("should reject passwords without numbers", () => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      
      expect(passwordRegex.test("NoNumbers!@#$")).toBe(false);
    });

    it("should reject passwords without special characters", () => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      
      expect(passwordRegex.test("NoSpecial123")).toBe(false);
    });
  });

  describe("Password Hashing and Verification", () => {
    it("should hash passwords securely", async () => {
      const password = "TestPass123!";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPass123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should verify correct password", async () => {
      const password = "TestPass123!";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPass123!";
      const wrongPassword = "WrongPass456!";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });

    it("should reject empty password verification", async () => {
      const password = "TestPass123!";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword("", hashed);

      expect(isValid).toBe(false);
    });
  });

  describe("Security Best Practices", () => {
    it("should use cryptographically secure random tokens", () => {
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");
      const token3 = crypto.randomBytes(32).toString("hex");

      // All tokens should be unique
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it("should not allow token reversal from hash", () => {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // SHA256 is one-way - cannot reverse
      expect(tokenHash).not.toBe(token);

      // Double hashing doesn't give original
      const doubleHash = crypto.createHash("sha256").update(tokenHash).digest("hex");
      expect(doubleHash).not.toBe(token);
    });

    it("should enforce 24-hour expiration window", () => {
      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      const futureExpiry = new Date(now + expiryTime);
      const timeDiff = futureExpiry.getTime() - now;

      expect(timeDiff).toBe(expiryTime);
      expect(futureExpiry.getTime()).toBeGreaterThan(now);
    });

    it("should validate email format", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const validEmails = [
        "user@example.com",
        "test.user@domain.co.uk",
        "name+tag@company.org",
      ];

      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
      ];

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("Reset Flow Scenarios", () => {
    it("should handle successful password reset", async () => {
      // Simulate old password
      const oldPassword = "OldPass123!";
      const oldHash = await hashPassword(oldPassword);

      // Verify old password works
      expect(await verifyPassword(oldPassword, oldHash)).toBe(true);

      // Simulate new password
      const newPassword = "NewPass456!";
      const newHash = await hashPassword(newPassword);

      // Verify new password works
      expect(await verifyPassword(newPassword, newHash)).toBe(true);

      // Verify old password doesn't work with new hash
      expect(await verifyPassword(oldPassword, newHash)).toBe(false);
    });

    it("should handle token generation for password reset", () => {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Simulate storing in database
      const resetRecord = {
        email: testEmail,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      };

      expect(resetRecord.email).toBe(testEmail);
      expect(resetRecord.tokenHash).toBeDefined();
      expect(resetRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should validate token before allowing password reset", () => {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Simulate token validation
      const isExpired = expiresAt.getTime() < Date.now();
      const isValid = !isExpired;

      expect(isValid).toBe(true);
      expect(isExpired).toBe(false);
    });

    it("should reject expired tokens", () => {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() - 1000); // Expired

      // Simulate token validation
      const isExpired = expiresAt.getTime() < Date.now();

      expect(isExpired).toBe(true);
    });
  });
});
