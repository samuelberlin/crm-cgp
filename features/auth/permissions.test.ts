import { describe, expect, it } from "vitest";
import { hasRole } from "./permissions";

function mockSession(role: "ADMIN" | "MANAGER" | "CGP") {
  return { user: { role } };
}

describe("hasRole", () => {
  it("allows a role present in the allowed list", () => {
    expect(hasRole(mockSession("ADMIN"), ["ADMIN"])).toBe(true);
  });

  it("denies a role absent from the allowed list", () => {
    expect(hasRole(mockSession("CGP"), ["ADMIN"])).toBe(false);
  });

  it("allows any role in a multi-role list", () => {
    expect(hasRole(mockSession("MANAGER"), ["ADMIN", "MANAGER"])).toBe(true);
  });
});
