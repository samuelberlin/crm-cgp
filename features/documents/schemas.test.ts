import { describe, expect, it } from "vitest";
import { isInlinePreviewable } from "./schemas";

describe("isInlinePreviewable", () => {
  it("allows PDFs and images", () => {
    expect(isInlinePreviewable("application/pdf")).toBe(true);
    expect(isInlinePreviewable("image/png")).toBe(true);
    expect(isInlinePreviewable("image/jpeg")).toBe(true);
  });

  it("refuses anything else, notably HTML (stored XSS risk if served inline)", () => {
    expect(isInlinePreviewable("text/html")).toBe(false);
    expect(isInlinePreviewable("application/javascript")).toBe(false);
    expect(isInlinePreviewable("application/msword")).toBe(false);
  });
});
