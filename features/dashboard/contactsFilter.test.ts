import { describe, expect, it } from "vitest";
import { distinctValues, matchesContactFilter } from "./contactsFilter";

function contact(overrides: Partial<{ status: string; profession: string | null; products: string[] }> = {}) {
  return { status: "PROSPECT", profession: null, products: [], ...overrides };
}

describe("matchesContactFilter", () => {
  it("matches everyone for 'tous'", () => {
    expect(matchesContactFilter(contact({ status: "CLIENT" }), "tous", null)).toBe(true);
    expect(matchesContactFilter(contact({ status: "ANCIEN_CLIENT" }), "tous", null)).toBe(true);
  });

  it("filters by status for 'clients' and 'prospects'", () => {
    expect(matchesContactFilter(contact({ status: "CLIENT" }), "clients", null)).toBe(true);
    expect(matchesContactFilter(contact({ status: "PROSPECT" }), "clients", null)).toBe(false);
    expect(matchesContactFilter(contact({ status: "PROSPECT" }), "prospects", null)).toBe(true);
  });

  it("matches everyone for 'csp' until a profession is chosen", () => {
    const c = contact({ profession: "Artisan" });
    expect(matchesContactFilter(c, "csp", null)).toBe(true);
    expect(matchesContactFilter(c, "csp", "Artisan")).toBe(true);
    expect(matchesContactFilter(c, "csp", "Médecin")).toBe(false);
  });

  it("matches everyone for 'produit' until a product is chosen", () => {
    const c = contact({ products: ["SwissLife Retraite"] });
    expect(matchesContactFilter(c, "produit", null)).toBe(true);
    expect(matchesContactFilter(c, "produit", "SwissLife Retraite")).toBe(true);
    expect(matchesContactFilter(c, "produit", "SwissLife PER")).toBe(false);
  });
});

describe("distinctValues", () => {
  it("dedupes, drops empty values, and sorts alphabetically", () => {
    expect(distinctValues(["Artisan", null, "Médecin", "Artisan", ""])).toEqual(["Artisan", "Médecin"]);
  });

  it("returns an empty array when nothing is set", () => {
    expect(distinctValues([null, null])).toEqual([]);
  });
});
