import { describe, expect, it } from "vitest";
import { createProductSchema } from "./schemas";

describe("createProductSchema", () => {
  it("accepts a valid product", () => {
    const result = createProductSchema.safeParse({
      name: "SwissLife Retraite",
      category: "RETRAITE",
      provider: "SwissLife",
      description: "Assurance vie retraite",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty provider and description", () => {
    const result = createProductSchema.safeParse({
      name: "SwissLife Retraite",
      category: "RETRAITE",
      provider: "",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createProductSchema.safeParse({
      name: "",
      category: "RETRAITE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = createProductSchema.safeParse({
      name: "SwissLife Retraite",
      category: "INVALIDE",
    });
    expect(result.success).toBe(false);
  });
});
