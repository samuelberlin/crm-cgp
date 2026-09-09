import { describe, expect, it } from "vitest";
import { wealthTotals } from "./calc";

describe("wealthTotals", () => {
  it("sums assets and liabilities separately and computes net worth", () => {
    const totals = wealthTotals([
      { kind: "ACTIF", amount: 300000 },
      { kind: "ACTIF", amount: 50000 },
      { kind: "PASSIF", amount: 120000 },
    ]);
    expect(totals.gross).toBe(350000);
    expect(totals.liabilities).toBe(120000);
    expect(totals.net).toBe(230000);
  });

  it("returns zeros for an empty list", () => {
    expect(wealthTotals([])).toEqual({ gross: 0, liabilities: 0, net: 0 });
  });

  it("allows a negative net worth when liabilities exceed assets", () => {
    const totals = wealthTotals([
      { kind: "ACTIF", amount: 10000 },
      { kind: "PASSIF", amount: 25000 },
    ]);
    expect(totals.net).toBe(-15000);
  });
});
