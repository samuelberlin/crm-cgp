import { describe, expect, it } from "vitest";
import { pipelineTotals, weightedValue } from "./calc";

describe("weightedValue", () => {
  it("multiplies amount by probability", () => {
    expect(weightedValue(10000, 50)).toBe(5000);
    expect(weightedValue(10000, 100)).toBe(10000);
    expect(weightedValue(10000, 0)).toBe(0);
  });

  it("returns 0 when amount is null or undefined", () => {
    expect(weightedValue(null, 50)).toBe(0);
    expect(weightedValue(undefined, 50)).toBe(0);
  });
});

describe("pipelineTotals", () => {
  it("sums only open opportunities (excludes GAGNE and PERDU)", () => {
    const totals = pipelineTotals([
      { amount: 10000, probability: 50, stage: "NOUVEAU" },
      { amount: 20000, probability: 80, stage: "NEGOCIATION" },
      { amount: 5000, probability: 100, stage: "GAGNE" },
      { amount: 8000, probability: 0, stage: "PERDU" },
    ]);

    expect(totals.count).toBe(2);
    expect(totals.total).toBe(30000);
    expect(totals.weighted).toBe(10000 * 0.5 + 20000 * 0.8);
  });

  it("returns zeros for an empty pipeline", () => {
    expect(pipelineTotals([])).toEqual({ total: 0, weighted: 0, count: 0 });
  });
});
