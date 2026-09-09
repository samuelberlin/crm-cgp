import { describe, expect, it } from "vitest";
import { defaultProductCatalog } from "./defaultCatalog";
import { productCategoryValues } from "./schemas";

describe("defaultProductCatalog", () => {
  it("has no duplicate product names", () => {
    const names = defaultProductCatalog.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("only uses known product categories", () => {
    for (const product of defaultProductCatalog) {
      expect(productCategoryValues).toContain(product.category);
    }
  });

  it("gives every product a non-empty name and description", () => {
    for (const product of defaultProductCatalog) {
      expect(product.name.trim().length).toBeGreaterThan(0);
      expect(product.description.trim().length).toBeGreaterThan(0);
    }
  });
});
