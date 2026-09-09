import { describe, expect, it } from "vitest";
import { opportunityWhere } from "./access";

describe("opportunityWhere", () => {
  it("scopes a CGP to their own opportunities within the tenant", () => {
    expect(opportunityWhere({ id: "u1", role: "CGP", tenantId: "t1" })).toEqual({
      tenantId: "t1",
      advisorId: "u1",
    });
  });

  it("gives ADMIN visibility over the whole tenant", () => {
    expect(opportunityWhere({ id: "u1", role: "ADMIN", tenantId: "t1" })).toEqual({ tenantId: "t1" });
  });
});
