import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";

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
