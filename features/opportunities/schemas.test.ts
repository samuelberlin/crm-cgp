import { describe, expect, it } from "vitest";
import { createOpportunitySchema } from "./schemas";

describe("createOpportunitySchema", () => {
  it("accepts the minimal fields and applies defaults", () => {
    const result = createOpportunitySchema.safeParse({
      contactId: "c1",
      title: "PER pour Jean",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("AUTRE");
      expect(result.data.probability).toBe(50);
    }
  });

  it("rejects a missing contact", () => {
    const result = createOpportunitySchema.safeParse({ contactId: "", title: "PER" });
    expect(result.success).toBe(false);
  });

  it("rejects a probability above 100", () => {
    const result = createOpportunitySchema.safeParse({
      contactId: "c1",
      title: "PER",
      probability: "150",
    });
    expect(result.success).toBe(false);
  });
});
