import { describe, expect, it } from "vitest";
import { createTaskSchema } from "./schemas";

describe("createTaskSchema", () => {
  it("accepts a minimal task with default priority", () => {
    const result = createTaskSchema.safeParse({ title: "Relancer Jean" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("NORMALE");
      expect(result.data.contactId).toBeUndefined();
    }
  });

  it("rejects an empty title", () => {
    expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
