import { describe, expect, it } from "vitest";
import { distinctValues, matchesContactFilter, presentValuesInOrder } from "./contactsFilter";

function contact(overrides: Partial<{ status: string; cspCategory: string | null; products: string[] }> = {}) {
  return { status: "PROSPECT", cspCategory: null, products: [], ...overrides };
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

  it("matches everyone for 'csp' until a category is chosen", () => {
    const c = contact({ cspCategory: "TNS" });
    expect(matchesContactFilter(c, "csp", null)).toBe(true);
    expect(matchesContactFilter(c, "csp", "TNS")).toBe(true);
    expect(matchesContactFilter(c, "csp", "CADRE")).toBe(false);
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

describe("presentValuesInOrder", () => {
  const ORDER = ["TNS", "PROFESSION_LIBERALE", "CADRE", "AUTRE"] as const;

  it("keeps the fixed order rather than alphabetical or insertion order", () => {
    expect(presentValuesInOrder(["CADRE", "TNS"], ORDER)).toEqual(["TNS", "CADRE"]);
  });

  it("drops values that aren't present, and null/empty entries", () => {
    expect(presentValuesInOrder(["TNS", null], ORDER)).toEqual(["TNS"]);
  });

  it("returns an empty array when nothing is present", () => {
    expect(presentValuesInOrder([null], ORDER)).toEqual([]);
  });
});
