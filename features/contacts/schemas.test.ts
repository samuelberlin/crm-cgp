import { describe, expect, it } from "vitest";
import { createContactSchema, updateContactSchema } from "./schemas";

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

describe("updateContactSchema", () => {
  it("accepts a valid marital status and address", () => {
    const result = updateContactSchema.safeParse({
      firstName: "Jean",
      lastName: "Moreau",
      status: "CLIENT",
      maritalStatus: "MARIE",
      address: "12 rue de la Paix",
      postalCode: "75002",
      city: "Paris",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid marital status", () => {
    const result = updateContactSchema.safeParse({
      firstName: "Jean",
      lastName: "Moreau",
      status: "CLIENT",
      maritalStatus: "AUTRE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty marital status", () => {
    const result = updateContactSchema.safeParse({
      firstName: "Jean",
      lastName: "Moreau",
      status: "CLIENT",
      maritalStatus: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maritalStatus).toBeUndefined();
    }
  });
});
