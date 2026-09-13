import { describe, expect, it } from "vitest";
import { mapCsvHeaders, parseContactImportRow } from "./csvImport";

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

  it("ignores columns it doesn't recognize", () => {
    const map = mapCsvHeaders(["Prénom", "Nom", "Signe astrologique"]);
    expect(map.size).toBe(2);
    expect(map.has(2)).toBe(false);
  });
});

describe("parseContactImportRow", () => {
  const headerMap = mapCsvHeaders(["Prénom", "Nom", "Email", "Statut"]);

  it("builds a valid contact from a well-formed row", () => {
    const result = parseContactImportRow(headerMap, ["Marc", "Petit", "marc@example.fr", "Client"]);
    expect(result).toEqual({
      data: {
        firstName: "Marc",
        lastName: "Petit",
        email: "marc@example.fr",
        phone: undefined,
        company: undefined,
        status: "CLIENT",
        source: undefined,
      },
    });
  });

  it("accepts the raw enum key as well as the French label for status", () => {
    const result = parseContactImportRow(headerMap, ["Marc", "Petit", "", "PROSPECT"]);
    expect(result).toEqual({ data: expect.objectContaining({ status: "PROSPECT" }) });
  });

  it("defaults to Prospect when the status is missing or unrecognized", () => {
    const missing = parseContactImportRow(headerMap, ["Marc", "Petit", "", ""]);
    expect(missing).toEqual({ data: expect.objectContaining({ status: "PROSPECT" }) });

    const unrecognized = parseContactImportRow(headerMap, ["Marc", "Petit", "", "??"]);
    expect(unrecognized).toEqual({ data: expect.objectContaining({ status: "PROSPECT" }) });
  });

  it("errors when the first name is missing", () => {
    const result = parseContactImportRow(headerMap, ["", "Petit", "", ""]);
    expect(result).toEqual({ error: expect.stringContaining("prénom") });
  });

  it("errors on a malformed email", () => {
    const result = parseContactImportRow(headerMap, ["Marc", "Petit", "pas-un-email", ""]);
    expect(result).toEqual({ error: expect.any(String) });
  });
});
