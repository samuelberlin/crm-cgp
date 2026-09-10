import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins plain fields with commas and rows with CRLF", () => {
    expect(toCsv([["Nom", "Ville"], ["Petit", "Lyon"]])).toBe("Nom,Ville\r\nPetit,Lyon");
  });

  it("quotes fields containing a comma", () => {
    expect(toCsv([["Petit, Marc"]])).toBe('"Petit, Marc"');
  });

  it("quotes and doubles internal quotes", () => {
    expect(toCsv([['Il a dit "ok"']])).toBe('"Il a dit ""ok"""');
  });

  it("quotes fields containing a newline", () => {
    expect(toCsv([["Ligne 1\nLigne 2"]])).toBe('"Ligne 1\nLigne 2"');
  });
});
