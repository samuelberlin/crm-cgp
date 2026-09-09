import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "@/lib/format";

function normalizeSpaces(value: string): string {
  return value.replace(/\s/g, " ");
}

describe("formatCurrency", () => {
  it("formats a number as EUR without decimals", () => {
    expect(normalizeSpaces(formatCurrency(1500))).toBe("1 500 €");
  });

  it("returns an em dash for null or undefined", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
  });
});

describe("formatDate", () => {
  it("formats a date in French", () => {
    expect(formatDate("2026-03-01")).toBe("01 mars 2026");
  });

  it("returns an em dash for null or undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});
