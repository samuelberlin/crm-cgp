import { describe, expect, it } from "vitest";
import { totalIncome } from "./calc";

describe("totalIncome", () => {
  it("sums the amount of every income item", () => {
    expect(
      totalIncome([{ amount: 45000 }, { amount: 12000 }, { amount: 3000 }]),
    ).toBe(60000);
  });

  it("returns 0 for an empty list", () => {
    expect(totalIncome([])).toBe(0);
  });
});
