import { describe, expect, it } from "vitest";
import { canAssignAdvisor, contactWhere } from "./access";

describe("contactWhere", () => {
  it("scopes a CGP to their own contacts within the tenant", () => {
    expect(contactWhere({ id: "u1", role: "CGP", tenantId: "t1" })).toEqual({
      tenantId: "t1",
      advisorId: "u1",
    });
  });

  it("gives ADMIN visibility over the whole tenant", () => {
    expect(contactWhere({ id: "u1", role: "ADMIN", tenantId: "t1" })).toEqual({ tenantId: "t1" });
  });

  it("gives MANAGER visibility over the whole tenant", () => {
    expect(contactWhere({ id: "u1", role: "MANAGER", tenantId: "t1" })).toEqual({ tenantId: "t1" });
  });

  it("returns an impossible filter when there is no tenant", () => {
    const result = contactWhere({ id: "u1", role: "ADMIN", tenantId: null });
    expect(result).toEqual({ id: "__none__" });
  });
});

describe("canAssignAdvisor", () => {
  it("allows ADMIN and MANAGER", () => {
    expect(canAssignAdvisor("ADMIN")).toBe(true);
    expect(canAssignAdvisor("MANAGER")).toBe(true);
  });

  it("denies CGP", () => {
    expect(canAssignAdvisor("CGP")).toBe(false);
  });
});
