import { describe, expect, it } from "vitest";
import { contactViewWhere } from "./views";

describe("contactViewWhere", () => {
  it("returns no filter for 'tous'", () => {
    expect(contactViewWhere("tous")).toEqual({});
  });

  it("only filters by status once one is chosen for 'statut'", () => {
    expect(contactViewWhere("statut")).toEqual({});
    expect(contactViewWhere("statut", { status: "CLIENT" })).toEqual({ status: "CLIENT" });
    expect(contactViewWhere("statut", { status: "PROSPECT" })).toEqual({ status: "PROSPECT" });
    expect(contactViewWhere("statut", { status: "ANCIEN_CLIENT" })).toEqual({ status: "ANCIEN_CLIENT" });
    expect(contactViewWhere("statut", { status: "PARTENAIRE" })).toEqual({ status: "PARTENAIRE" });
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
