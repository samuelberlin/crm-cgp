import { describe, expect, it } from "vitest";
import { inviteTeamMemberSchema } from "./schemas";

describe("inviteTeamMemberSchema", () => {
  const valid = { name: "Bob Conseiller", email: "bob@example.fr", role: "CGP" };

  it("accepts valid input", () => {
    expect(inviteTeamMemberSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(inviteTeamMemberSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a too-short name", () => {
    expect(inviteTeamMemberSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects an unknown role", () => {
    expect(inviteTeamMemberSchema.safeParse({ ...valid, role: "SUPERADMIN" }).success).toBe(false);
  });
});
