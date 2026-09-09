import { describe, expect, it } from "vitest";
import { multiEquipementCount, subscriptionFeedsWealth, totalEncours } from "./calc";

describe("totalEncours", () => {
  it("sums only active subscriptions", () => {
    const subscriptions = [
      { encours: 30000, status: "ACTIVE" },
      { encours: 15000, status: "ACTIVE" },
      { encours: 50000, status: "ANNULE" },
    ];
    expect(totalEncours(subscriptions)).toBe(45000);
  });

  it("returns 0 for no subscriptions", () => {
    expect(totalEncours([])).toBe(0);
  });
});

describe("multiEquipementCount", () => {
  it("counts only active subscriptions", () => {
    const subscriptions = [{ status: "ACTIVE" }, { status: "ACTIVE" }, { status: "ANNULE" }];
    expect(multiEquipementCount(subscriptions)).toBe(2);
  });

  it("returns 0 for no subscriptions", () => {
    expect(multiEquipementCount([])).toBe(0);
  });
});

describe("subscriptionFeedsWealth", () => {
  it("counts Retraite and Épargne products as wealth", () => {
    expect(subscriptionFeedsWealth("RETRAITE")).toBe(true);
    expect(subscriptionFeedsWealth("EPARGNE")).toBe(true);
  });

  it("excludes Prévoyance, Santé, and Dommages products", () => {
    expect(subscriptionFeedsWealth("PREVOYANCE")).toBe(false);
    expect(subscriptionFeedsWealth("SANTE")).toBe(false);
    expect(subscriptionFeedsWealth("DOMMAGES")).toBe(false);
  });
});
