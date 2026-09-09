import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("registerSchema", () => {
  const valid = {
    cabinetName: "Cabinet Dupont",
    name: "Jean Dupont",
    email: "jean@example.fr",
    password: "password123",
  };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short cabinet name", () => {
    const result = registerSchema.safeParse({ ...valid, cabinetName: "A" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    expect(loginSchema.safeParse({ email: "jean@example.fr", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "jean@example.fr", password: "" }).success).toBe(false);
  });
});
