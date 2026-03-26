import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as dbSecurity from "./db-security";
import { hashPassword, verifyPassword, validatePassword } from "./_core/password";
import {
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generate2FASecret,
  verify2FAToken,
  verify2FABackupCode,
  removeUsedBackupCode,
  isTokenExpired,
} from "./_core/security";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
        email: z.string().email("Invalid email address").optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        try {
          await db.updateUserProfile(ctx.user.id, {
            name: input.name,
            email: input.email,
          });

          await db.logActivity(ctx.user.id, "profile_updated", `Updated profile: name=${input.name ? 'yes' : 'no'}, email=${input.email ? 'yes' : 'no'}`);

          return {
            success: true,
            user: {
              ...ctx.user,
              name: input.name ?? ctx.user.name,
              email: input.email ?? ctx.user.email,
            },
          };
        } catch (error) {
          console.error("[Auth] Failed to update profile:", error);
          throw new Error("Failed to update profile");
        }
      }),
    getActivityLogs: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        try {
          const logs = await db.getActivityLogs(ctx.user.id, input.limit);
          return logs;
        } catch (error) {
          console.error("[Auth] Failed to get activity logs:", error);
          return [];
        }
      }),
    uploadProfilePicture: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url("Invalid image URL"),
        imageKey: z.string().min(1, "Image key is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        try {
          await db.updateUserProfilePicture(ctx.user.id, input.imageUrl, input.imageKey);
          await db.logActivity(ctx.user.id, "profile_picture_updated", "Updated profile picture");

          return {
            success: true,
            pictureUrl: input.imageUrl,
          };
        } catch (error) {
          console.error("[Auth] Failed to upload profile picture:", error);
          throw new Error("Failed to upload profile picture");
        }
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        if (input.newPassword !== input.confirmPassword) {
          throw new Error("New passwords do not match");
        }

        const validation = validatePassword(input.newPassword);
        if (!validation.isValid) {
          throw new Error(`Password does not meet requirements: ${validation.errors.join(", ")}`);
        }

        try {
          const user = await db.getUserByOpenId(ctx.user.openId);
          if (!user) {
            throw new Error("User not found");
          }

          if (user.passwordHash) {
            const isCurrentPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
              throw new Error("Current password is incorrect");
            }
          }

          const newPasswordHash = await hashPassword(input.newPassword);
          await db.changePassword(ctx.user.id, newPasswordHash);
          await db.logActivity(ctx.user.id, "password_changed", "User changed their password");

          return {
            success: true,
            message: "Password changed successfully",
          };
        } catch (error) {
          console.error("[Auth] Failed to change password:", error);
          throw error instanceof Error ? error : new Error("Failed to change password");
        }
      }),

    // Password Reset
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
      }))
      .mutation(async ({ input }) => {
        try {
          // In production, verify email exists in database
          const { token, expiresAt } = generatePasswordResetToken();

          // Store token in database (userId would be looked up by email)
          // For now, we'll just return the token
          await dbSecurity.createPasswordResetToken({
            token,
            expiresAt,
            // userId would be fetched from database
          } as any);

          // In production, send email with reset link
          console.log(`[Password Reset] Token for ${input.email}: ${token}`);

          return {
            success: true,
            message: "Password reset email sent if account exists",
          };
        } catch (error) {
          console.error("[Auth] Failed to request password reset:", error);
          throw new Error("Failed to request password reset");
        }
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        if (input.newPassword !== input.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const validation = validatePassword(input.newPassword);
        if (!validation.isValid) {
          throw new Error(`Password does not meet requirements: ${validation.errors.join(", ")}`);
        }

        try {
          const resetToken = await dbSecurity.getPasswordResetToken(input.token);
          if (!resetToken) {
            throw new Error("Invalid or expired reset token");
          }

          if (isTokenExpired(resetToken.expiresAt)) {
            throw new Error("Reset token has expired");
          }

          if (resetToken.usedAt) {
            throw new Error("Reset token has already been used");
          }

          // Update password
          const newPasswordHash = await hashPassword(input.newPassword);
          await db.changePassword(resetToken.userId, newPasswordHash);

          // Mark token as used
          await dbSecurity.markPasswordResetTokenAsUsed(input.token);
          await db.logActivity(resetToken.userId, "password_reset", "User reset their password");

          return {
            success: true,
            message: "Password reset successfully",
          };
        } catch (error) {
          console.error("[Auth] Failed to reset password:", error);
          throw error instanceof Error ? error : new Error("Failed to reset password");
        }
      }),

    // Two-Factor Authentication
    setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      try {
        const { secret, qrCode, backupCodes } = await generate2FASecret(ctx.user.email || "user@example.com");

        // Store temporary 2FA settings (not enabled yet)
        await dbSecurity.create2FASetting({
          userId: ctx.user.id,
          secret,
          backupCodes: JSON.stringify(backupCodes),
          isEnabled: false,
        });

        await db.logActivity(ctx.user.id, "2fa_setup_started", "User started 2FA setup");

        return {
          success: true,
          qrCode,
          backupCodes,
          secret,
        };
      } catch (error) {
        console.error("[Auth] Failed to setup 2FA:", error);
        throw new Error("Failed to setup 2FA");
      }
    }),

    verify2FASetup: protectedProcedure
      .input(z.object({
        token: z.string().min(6, "Token must be 6 digits").max(6, "Token must be 6 digits"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        try {
          const twoFASetting = await dbSecurity.get2FASetting(ctx.user.id);
          if (!twoFASetting) {
            throw new Error("2FA setup not found");
          }

          const isValid = verify2FAToken(twoFASetting.secret, input.token);
          if (!isValid) {
            throw new Error("Invalid 2FA token");
          }

          // Enable 2FA
          await dbSecurity.enable2FA(ctx.user.id);
          await db.logActivity(ctx.user.id, "2fa_enabled", "User enabled 2FA");

          return {
            success: true,
            message: "2FA enabled successfully",
          };
        } catch (error) {
          console.error("[Auth] Failed to verify 2FA setup:", error);
          throw error instanceof Error ? error : new Error("Failed to verify 2FA setup");
        }
      }),

    disable2FA: protectedProcedure
      .input(z.object({
        password: z.string().min(1, "Password is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        try {
          const user = await db.getUserByOpenId(ctx.user.openId);
          if (!user || !user.passwordHash) {
            throw new Error("User not found or password not set");
          }

          const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          await dbSecurity.disable2FA(ctx.user.id);
          await db.logActivity(ctx.user.id, "2fa_disabled", "User disabled 2FA");

          return {
            success: true,
            message: "2FA disabled successfully",
          };
        } catch (error) {
          console.error("[Auth] Failed to disable 2FA:", error);
          throw error instanceof Error ? error : new Error("Failed to disable 2FA");
        }
      }),

    // Email Verification
    requestEmailVerification: protectedProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new Error("User not authenticated");
        }

        try {
          const { token, expiresAt } = generateEmailVerificationToken();

          await dbSecurity.createEmailVerification({
            userId: ctx.user.id,
            email: input.email,
            token,
            expiresAt,
            isVerified: false,
          });

          // In production, send verification email
          console.log(`[Email Verification] Token for ${input.email}: ${token}`);

          await db.logActivity(ctx.user.id, "email_verification_requested", `Requested verification for ${input.email}`);

          return {
            success: true,
            message: "Verification email sent",
          };
        } catch (error) {
          console.error("[Auth] Failed to request email verification:", error);
          throw new Error("Failed to request email verification");
        }
      }),

    verifyEmail: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Verification token is required"),
      }))
      .mutation(async ({ input }) => {
        try {
          const verification = await dbSecurity.getEmailVerification(input.token);
          if (!verification) {
            throw new Error("Invalid or expired verification token");
          }

          if (isTokenExpired(verification.expiresAt)) {
            throw new Error("Verification token has expired");
          }

          if (verification.isVerified) {
            throw new Error("Email already verified");
          }

          await dbSecurity.markEmailAsVerified(input.token);
          await db.logActivity(verification.userId, "email_verified", `Verified email ${verification.email}`);

          return {
            success: true,
            message: "Email verified successfully",
          };
        } catch (error) {
          console.error("[Auth] Failed to verify email:", error);
          throw error instanceof Error ? error : new Error("Failed to verify email");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
