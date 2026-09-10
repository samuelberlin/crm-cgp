import { describe, expect, it } from "vitest";
import {
  buildMonthlyProduction,
  categoryBreakdown,
  evolutionPercent,
  monthKey,
  monthLabel,
  monthsOfYear,
  targetProgressPercent,
  yearsWithSubscriptions,
  type ProductionSubscription,
} from "./calc";

function sub(overrides: Partial<ProductionSubscription>): ProductionSubscription {
  return {
    encours: 10000,
    status: "ACTIVE",
    subscribedAt: new Date("2026-03-15"),
    contactId: "contact-1",
    productCategory: "RETRAITE",
    ...overrides,
  };
}

describe("monthKey / monthLabel", () => {
  it("formats a date as YYYY-MM", () => {
    expect(monthKey(new Date("2026-01-05"))).toBe("2026-01");
    expect(monthKey(new Date("2026-11-30"))).toBe("2026-11");
  });

  it("formats a month key as a French short label", () => {
    expect(monthLabel("2026-01")).toMatch(/janv/i);
  });
});

describe("monthsOfYear", () => {
  it("returns the 12 month keys of a year in order", () => {
    expect(monthsOfYear(2026)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
      "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
    ]);
  });
});

describe("yearsWithSubscriptions", () => {
  it("returns distinct years, most recent first", () => {
    const subs = [
      sub({ subscribedAt: new Date("2024-06-01") }),
      sub({ subscribedAt: new Date("2026-01-01") }),
      sub({ subscribedAt: new Date("2025-12-01") }),
    ];
    expect(yearsWithSubscriptions(subs)).toEqual([2026, 2025, 2024]);
  });

  it("returns an empty array when there are no subscriptions", () => {
    expect(yearsWithSubscriptions([])).toEqual([]);
  });
});

describe("categoryBreakdown", () => {
  it("sums count and encours per product category, sorted by encours desc", () => {
    const subs = [
      sub({ productCategory: "SANTE", encours: 1000 }),
      sub({ productCategory: "RETRAITE", encours: 30000 }),
      sub({ productCategory: "SANTE", encours: 500 }),
    ];
    expect(categoryBreakdown(subs)).toEqual([
      { category: "RETRAITE", count: 1, totalEncours: 30000 },
      { category: "SANTE", count: 2, totalEncours: 1500 },
    ]);
  });
});

describe("buildMonthlyProduction", () => {
  it("groups subscriptions by month, including empty months at zero", () => {
    const subs = [
      sub({ subscribedAt: new Date("2026-01-10"), encours: 30000, contactId: "a" }),
      sub({ subscribedAt: new Date("2026-01-20"), encours: 5000, contactId: "a" }),
      sub({ subscribedAt: new Date("2026-03-01"), encours: 10000, contactId: "b" }),
    ];
    const result = buildMonthlyProduction(subs, ["2026-01", "2026-02", "2026-03"]);

    expect(result[0]).toMatchObject({ month: "2026-01", count: 2, totalEncours: 35000, distinctClients: 1 });
    expect(result[1]).toMatchObject({ month: "2026-02", count: 0, totalEncours: 0, distinctClients: 0 });
    expect(result[2]).toMatchObject({ month: "2026-03", count: 1, totalEncours: 10000, distinctClients: 1 });
  });

  it("counts cancelled subscriptions separately without excluding them from production", () => {
    const subs = [
      sub({ subscribedAt: new Date("2026-01-10"), encours: 30000, status: "ACTIVE" }),
      sub({ subscribedAt: new Date("2026-01-15"), encours: 5000, status: "ANNULE" }),
    ];
    const [january] = buildMonthlyProduction(subs, ["2026-01"]);

    expect(january.count).toBe(2);
    expect(january.cancelledCount).toBe(1);
    expect(january.totalEncours).toBe(35000);
  });
});

describe("evolutionPercent", () => {
  it("computes a percentage change", () => {
    expect(evolutionPercent(150, 100)).toBe(50);
    expect(evolutionPercent(50, 100)).toBe(-50);
  });

  it("returns null when the previous value is zero", () => {
    expect(evolutionPercent(100, 0)).toBeNull();
  });
});

describe("targetProgressPercent", () => {
  it("computes the % of the annual target reached", () => {
    expect(targetProgressPercent(50000, 200000)).toBe(25);
    expect(targetProgressPercent(250000, 200000)).toBe(125);
  });

  it("returns null when no target is configured", () => {
    expect(targetProgressPercent(50000, null)).toBeNull();
  });

  it("returns null when the target is zero or negative", () => {
    expect(targetProgressPercent(50000, 0)).toBeNull();
    expect(targetProgressPercent(50000, -1000)).toBeNull();
  });
});
