import { describe, expect, it } from "vitest";
import { createMeetingSchema } from "./schemas";

describe("createMeetingSchema", () => {
  it("accepts a valid meeting", () => {
    const result = createMeetingSchema.safeParse({
      contactId: "c1",
      date: "2026-03-11T10:00",
      location: "Cabinet",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing contact", () => {
    const result = createMeetingSchema.safeParse({ contactId: "", date: "2026-03-11T10:00" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing date", () => {
    const result = createMeetingSchema.safeParse({ contactId: "c1", date: "" });
    expect(result.success).toBe(false);
  });
});
