import { describe, expect, it } from "vitest";
import {
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generate2FASecret,
  verify2FAToken,
  isTokenExpired,
} from "./_core/security";

describe("Security Features", () => {
  describe("Password Reset", () => {
    it("generates a valid password reset token", () => {
      const { token, expiresAt } = generatePasswordResetToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("generates tokens that expire in 24 hours", () => {
      const { expiresAt } = generatePasswordResetToken();
      const now = Date.now();
      const expirationTime = expiresAt.getTime() - now;

      // Should be approximately 24 hours (86400000 ms)
      expect(expirationTime).toBeGreaterThan(86400000 - 1000); // Allow 1 second margin
      expect(expirationTime).toBeLessThan(86400000 + 1000);
    });

    it("generates unique tokens", () => {
      const token1 = generatePasswordResetToken().token;
      const token2 = generatePasswordResetToken().token;

      expect(token1).not.toBe(token2);
    });
  });

  describe("Email Verification", () => {
    it("generates a valid email verification token", () => {
      const { token, expiresAt } = generateEmailVerificationToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("generates tokens that expire in 7 days", () => {
      const { expiresAt } = generateEmailVerificationToken();
      const now = Date.now();
      const expirationTime = expiresAt.getTime() - now;

      // Should be approximately 7 days (604800000 ms)
      expect(expirationTime).toBeGreaterThan(604800000 - 1000); // Allow 1 second margin
      expect(expirationTime).toBeLessThan(604800000 + 1000);
    });
  });

  describe("Two-Factor Authentication", () => {
    it("generates a valid 2FA secret", async () => {
      const { secret, qrCode, backupCodes } = await generate2FASecret("test@example.com");

      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      expect(qrCode).toContain("data:image/png;base64");
      expect(backupCodes).toHaveLength(10);
      expect(backupCodes[0]).toHaveLength(8);
    });

    it("generates unique backup codes", async () => {
      const { backupCodes } = await generate2FASecret("test@example.com");
      const uniqueCodes = new Set(backupCodes);

      expect(uniqueCodes.size).toBe(backupCodes.length);
    });

    it("verifies valid TOTP tokens", async () => {
      const { secret } = await generate2FASecret("test@example.com");

      // Generate a valid token using speakeasy
      const speakeasy = require("speakeasy");
      const token = speakeasy.totp({
        secret,
        encoding: "base32",
      });

      const isValid = verify2FAToken(secret, token);
      expect(isValid).toBe(true);
    });

    it("rejects invalid TOTP tokens", () => {
      const secret = "JBSWY3DPEBLW64TMMQ======";
      const invalidToken = "000000";

      const isValid = verify2FAToken(secret, invalidToken);
      expect(isValid).toBe(false);
    });
  });

  describe("Token Expiration", () => {
    it("correctly identifies expired tokens", () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      expect(isTokenExpired(expiredDate)).toBe(true);
    });

    it("correctly identifies valid tokens", () => {
      const futureDate = new Date(Date.now() + 1000); // 1 second in future
      expect(isTokenExpired(futureDate)).toBe(false);
    });
  });
});
