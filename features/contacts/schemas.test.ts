import { describe, expect, it } from "vitest";
import { createContactSchema } from "./schemas";

describe("createContactSchema", () => {
  it("accepts the minimal fast-creation fields", () => {
    const result = createContactSchema.safeParse({
      firstName: "Jean",
      lastName: "Moreau",
      phone: "",
      email: "",
      status: "PROSPECT",
      source: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.email).toBeUndefined();
    }
  });

  it("rejects a missing first name", () => {
    const result = createContactSchema.safeParse({
      firstName: "",
      lastName: "Moreau",
      status: "PROSPECT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = createContactSchema.safeParse({
      firstName: "Jean",
      lastName: "Moreau",
      email: "not-an-email",
      status: "PROSPECT",
    });
    expect(result.success).toBe(false);
  });

  it("defaults status to PROSPECT", () => {
    const result = createContactSchema.safeParse({ firstName: "Jean", lastName: "Moreau" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("PROSPECT");
    }
  });
});
