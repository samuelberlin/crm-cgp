import { describe, expect, it } from "vitest";
import { createNoteSchema } from "./schemas";

describe("createNoteSchema", () => {
  it("accepts a non-empty note", () => {
    expect(createNoteSchema.safeParse({ contactId: "c1", content: "Souhaite investir 50k€" }).success).toBe(
      true,
    );
  });

  it("rejects an empty note", () => {
    expect(createNoteSchema.safeParse({ contactId: "c1", content: "   " }).success).toBe(false);
  });
});
