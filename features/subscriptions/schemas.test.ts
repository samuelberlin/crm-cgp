import { describe, expect, it } from "vitest";
import { createSubscriptionSchema } from "./schemas";

describe("createSubscriptionSchema", () => {
  it("accepts a valid subscription", () => {
    const result = createSubscriptionSchema.safeParse({
      contactId: "c1",
      productId: "p1",
      encours: "30000",
      subscribedAt: "2026-01-15",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a missing date and note (both optional)", () => {
    const result = createSubscriptionSchema.safeParse({
      contactId: "c1",
      productId: "p1",
      encours: "0",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative encours", () => {
    const result = createSubscriptionSchema.safeParse({
      contactId: "c1",
      productId: "p1",
      encours: "-100",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing product", () => {
    const result = createSubscriptionSchema.safeParse({
      contactId: "c1",
      productId: "",
      encours: "1000",
    });
    expect(result.success).toBe(false);
  });
});
