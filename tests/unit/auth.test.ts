import { describe, it, expect } from "vitest";
import { signAuthToken, verifyAuthToken } from "@/lib/auth/jwt";

describe("LakehouseFit AI Authentication & JWT Security", () => {
  it("generates and verifies a valid signed JWT payload", async () => {
    const userPayload = {
      userId: "usr-test-123",
      email: "decision-maker@enterprise.com",
      name: "Morgan Stanley",
      role: "it_decision_maker",
      company: "Morgan Financial",
    };

    const token = await signAuthToken(userPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // Header.Payload.Signature

    const verified = await verifyAuthToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(userPayload.userId);
    expect(verified?.email).toBe(userPayload.email);
    expect(verified?.role).toBe(userPayload.role);
  });

  it("rejects an invalid or tampered JWT token", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature";
    const verified = await verifyAuthToken(invalidToken);
    expect(verified).toBeNull();
  });
});

