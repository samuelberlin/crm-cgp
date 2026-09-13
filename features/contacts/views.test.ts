import { describe, expect, it } from "vitest";
import { contactViewWhere } from "./views";

describe("contactViewWhere", () => {
  it("returns no filter for 'tous'", () => {
    expect(contactViewWhere("tous")).toEqual({});
  });

  it("filters by status for 'clients' and 'prospects'", () => {
    expect(contactViewWhere("clients")).toEqual({ status: "CLIENT" });
    expect(contactViewWhere("prospects")).toEqual({ status: "PROSPECT" });
  });

  it("only filters by CSP category once one is chosen for 'csp'", () => {
    expect(contactViewWhere("csp")).toEqual({});
    expect(contactViewWhere("csp", { cspCategory: "TNS" })).toEqual({ cspCategory: "TNS" });
  });

  it("only filters by held product once one is chosen for 'produit'", () => {
    expect(contactViewWhere("produit")).toEqual({});
    expect(contactViewWhere("produit", { productId: "prod-1" })).toEqual({
      subscriptions: { some: { productId: "prod-1", status: "ACTIVE" } },
    });
  });
});
