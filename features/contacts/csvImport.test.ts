import { describe, expect, it } from "vitest";
import {
  extractRawContactFields,
  mapCsvHeaders,
  mergeContactsByName,
  parseContactImportRow,
  type RawContactFields,
} from "./csvImport";

function fields(overrides: Partial<RawContactFields> = {}): RawContactFields {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    status: "",
    source: "",
    notes: "",
    address: "",
    postalCode: "",
    city: "",
    ...overrides,
  };
}

describe("mapCsvHeaders", () => {
  it("recognizes the export's own French headers", () => {
    const map = mapCsvHeaders(["Prénom", "Nom", "Statut", "Société", "Email", "Téléphone"]);
    expect(map.get(0)).toBe("firstName");
    expect(map.get(1)).toBe("lastName");
    expect(map.get(2)).toBe("status");
    expect(map.get(3)).toBe("company");
    expect(map.get(4)).toBe("email");
    expect(map.get(5)).toBe("phone");
  });

  it("recognizes common English aliases, case-insensitively", () => {
    const map = mapCsvHeaders(["First Name", "LAST NAME", "E-mail", "Company"]);
    expect(map.get(0)).toBe("firstName");
    expect(map.get(1)).toBe("lastName");
    expect(map.get(2)).toBe("email");
    expect(map.get(3)).toBe("company");
  });

  it("recognizes a SwissLife-style portfolio export's headers", () => {
    const map = mapCsvHeaders(["NUMERO TEL", "ADRESSE POSTALE", "PRODUITS", "ENCOURS", "PARTENAIRE", "POTENTIEL"]);
    expect(map.get(0)).toBe("phone");
    expect(map.get(1)).toBe("address");
    expect(map.get(2)).toBe("products");
    expect(map.get(3)).toBe("encours");
    expect(map.get(5)).toBe("potential");
  });

  it("ignores columns it doesn't recognize", () => {
    const map = mapCsvHeaders(["Prénom", "Nom", "Signe astrologique"]);
    expect(map.size).toBe(2);
    expect(map.has(2)).toBe(false);
  });
});

describe("extractRawContactFields", () => {
  it("splits a full name in the Nom column when Prénom is empty ('NOM Prénom' convention)", () => {
    const headerMap = mapCsvHeaders(["Prénom", "Nom"]);
    const result = extractRawContactFields(headerMap, ["", "CRABIE PHILIPPE"]);
    expect(result.firstName).toBe("PHILIPPE");
    expect(result.lastName).toBe("CRABIE");
  });

  it("duplicates the surname into the first name when no first name can be found at all", () => {
    const headerMap = mapCsvHeaders(["Prénom", "Nom"]);
    const result = extractRawContactFields(headerMap, ["", "FAIFE"]);
    expect(result.firstName).toBe("FAIFE");
    expect(result.lastName).toBe("FAIFE");
  });

  it("leaves a proper Prénom/Nom pair untouched", () => {
    const headerMap = mapCsvHeaders(["Prénom", "Nom"]);
    const result = extractRawContactFields(headerMap, ["Marc", "Petit"]);
    expect(result.firstName).toBe("Marc");
    expect(result.lastName).toBe("Petit");
  });

  it("splits a one-line French address around its postal code", () => {
    const headerMap = mapCsvHeaders(["Nom", "Adresse postale"]);
    const result = extractRawContactFields(headerMap, ["Petit", "64 rue des lilas 78800 Houilles"]);
    expect(result.address).toBe("64 rue des lilas");
    expect(result.postalCode).toBe("78800");
    expect(result.city).toBe("Houilles");
  });

  it("keeps the whole address as-is when no postal code is found", () => {
    const headerMap = mapCsvHeaders(["Nom", "Adresse postale"]);
    const result = extractRawContactFields(headerMap, ["Petit", "5 rue des ormes"]);
    expect(result.address).toBe("5 rue des ormes");
    expect(result.postalCode).toBe("");
    expect(result.city).toBe("");
  });

  it("folds Produits/Encours/Potentiel into notes rather than dropping them", () => {
    const headerMap = mapCsvHeaders(["Nom", "Produits", "Encours", "Potentiel"]);
    const result = extractRawContactFields(headerMap, ["Petit", "ASSURANCE VIE", "310K", "TRESO 200K"]);
    expect(result.notes).toBe("Produits : ASSURANCE VIE\nEncours : 310K\nPotentiel : TRESO 200K");
  });
});

describe("mergeContactsByName", () => {
  it("merges rows sharing the same name, first non-empty field wins", () => {
    const merged = mergeContactsByName([
      { fields: fields({ firstName: "Cyril", lastName: "Galtier", email: "cyril@example.fr", notes: "Produits : SCPI" }), line: 2 },
      { fields: fields({ firstName: "Cyril", lastName: "Galtier", notes: "Produits : PER" }), line: 3 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].fields.email).toBe("cyril@example.fr");
    expect(merged[0].fields.notes).toBe("Produits : SCPI\nProduits : PER");
    expect(merged[0].line).toBe(2);
  });

  it("keeps rows with different names separate, in first-seen order", () => {
    const merged = mergeContactsByName([
      { fields: fields({ firstName: "Marc", lastName: "Petit" }), line: 2 },
      { fields: fields({ firstName: "Julie", lastName: "Martin" }), line: 3 },
    ]);
    expect(merged.map((m) => m.fields.lastName)).toEqual(["Petit", "Martin"]);
  });

  it("never merges rows that both lack a last name", () => {
    const merged = mergeContactsByName([
      { fields: fields({ firstName: "?" }), line: 2 },
      { fields: fields({ firstName: "!" }), line: 3 },
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe("parseContactImportRow", () => {
  it("builds a valid contact from well-formed fields", () => {
    const result = parseContactImportRow(
      fields({ firstName: "Marc", lastName: "Petit", email: "marc@example.fr", status: "CLIENT" }),
    );
    expect(result).toEqual({
      data: expect.objectContaining({
        firstName: "Marc",
        lastName: "Petit",
        email: "marc@example.fr",
        status: "CLIENT",
      }),
    });
  });

  it("defaults to Prospect when no status is set", () => {
    const result = parseContactImportRow(fields({ firstName: "Marc", lastName: "Petit" }));
    expect(result).toEqual({ data: expect.objectContaining({ status: "PROSPECT" }) });
  });

  it("errors when both names are missing", () => {
    const result = parseContactImportRow(fields());
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("errors on a malformed email", () => {
    const result = parseContactImportRow(fields({ firstName: "Marc", lastName: "Petit", email: "pas-un-email" }));
    expect(result).toEqual({ error: expect.any(String) });
  });
});
