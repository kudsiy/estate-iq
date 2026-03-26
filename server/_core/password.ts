import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error("[Password] Failed to hash password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!password || !hash) {
      return false;
    }

    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error("[Password] Failed to verify password:", error);
    return false;
  }
}

/**
 * Validate password strength
 * @param password - Plain text password
 * @returns object with validation result and error messages
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  }

  if (password && password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password && password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  if (password && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (password && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (password && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
