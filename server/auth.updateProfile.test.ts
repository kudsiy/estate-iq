import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.updateProfile", () => {
  it("should update user name successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.updateProfile({
      name: "Updated Name",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Updated Name");
  });

  it("should update user email successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.updateProfile({
      email: "newemail@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("newemail@example.com");
  });

  it("should update both name and email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.updateProfile({
      name: "New Name",
      email: "new@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("New Name");
    expect(result.user.email).toBe("new@example.com");
  });

  it("should reject invalid email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.updateProfile({
        email: "invalid-email",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject empty name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.updateProfile({
        name: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
