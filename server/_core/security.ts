import { randomBytes } from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

/**
 * Generate a secure random token for password reset or email verification
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate password reset token with expiration
 */
export function generatePasswordResetToken(): {
  token: string;
  expiresAt: Date;
} {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, expiresAt };
}

/**
 * Generate email verification token with expiration
 */
export function generateEmailVerificationToken(): {
  token: string;
  expiresAt: Date;
} {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return { token, expiresAt };
}

/**
 * Generate 2FA TOTP secret and QR code
 */
export async function generate2FASecret(userEmail: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `Estate IQ (${userEmail})`,
    issuer: "Estate IQ",
    length: 32,
  });

  if (!secret.base32) {
    throw new Error("Failed to generate 2FA secret");
  }

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => generateSecureToken().substring(0, 8).toUpperCase());

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify TOTP token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time windows (±30 seconds)
    });

    return verified;
  } catch (error) {
    console.error("[2FA] Failed to verify token:", error);
    return false;
  }
}

/**
 * Verify backup code
 */
export function verify2FABackupCode(backupCode: string, storedCodes: string): boolean {
  try {
    const codes = JSON.parse(storedCodes) as string[];
    return codes.includes(backupCode.toUpperCase());
  } catch (error) {
    console.error("[2FA] Failed to verify backup code:", error);
    return false;
  }
}

/**
 * Remove used backup code
 */
export function removeUsedBackupCode(backupCode: string, storedCodes: string): string {
  try {
    const codes = JSON.parse(storedCodes) as string[];
    const updatedCodes = codes.filter((code) => code !== backupCode.toUpperCase());
    return JSON.stringify(updatedCodes);
  } catch (error) {
    console.error("[2FA] Failed to remove backup code:", error);
    return storedCodes;
  }
}

/**
 * Validate token expiration
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
