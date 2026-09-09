import { describe, expect, it } from "vitest";
import { daysSince, isInactive, lastTouchDate } from "./inactivity";

const NOW = new Date("2026-03-11T12:00:00.000Z");

describe("lastTouchDate", () => {
  it("prefers lastContactAt when set", () => {
    const lastContactAt = new Date("2026-02-01T00:00:00.000Z");
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    expect(lastTouchDate({ lastContactAt, createdAt })).toBe(lastContactAt);
  });

  it("falls back to createdAt when never contacted", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    expect(lastTouchDate({ lastContactAt: null, createdAt })).toBe(createdAt);
  });
});

describe("daysSince", () => {
  it("computes whole days elapsed", () => {
    expect(daysSince(new Date("2026-03-01T12:00:00.000Z"), NOW)).toBe(10);
  });
});

describe("isInactive", () => {
  it("flags a contact untouched for at least the threshold", () => {
    const contact = { lastContactAt: new Date("2026-02-01T00:00:00.000Z"), createdAt: NOW };
    expect(isInactive(contact, 30, NOW)).toBe(true);
  });

  it("does not flag a recently touched contact", () => {
    const contact = { lastContactAt: new Date("2026-03-05T00:00:00.000Z"), createdAt: NOW };
    expect(isInactive(contact, 30, NOW)).toBe(false);
  });

  it("uses createdAt when a contact was never contacted", () => {
    const oldCreatedAt = new Date("2026-01-01T00:00:00.000Z");
    expect(isInactive({ lastContactAt: null, createdAt: oldCreatedAt }, 30, NOW)).toBe(true);
  });
});
