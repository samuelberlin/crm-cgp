import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

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

describe("parseCsv", () => {
  it("splits plain rows on commas and CRLF", () => {
    expect(parseCsv("Nom,Ville\r\nPetit,Lyon")).toEqual([
      ["Nom", "Ville"],
      ["Petit", "Lyon"],
    ]);
  });

  it("splits rows on a bare LF too", () => {
    expect(parseCsv("Nom,Ville\nPetit,Lyon")).toEqual([
      ["Nom", "Ville"],
      ["Petit", "Lyon"],
    ]);
  });

  it("un-quotes a field containing a comma", () => {
    expect(parseCsv('"Petit, Marc",Lyon')).toEqual([["Petit, Marc", "Lyon"]]);
  });

  it("un-doubles escaped quotes inside a quoted field", () => {
    expect(parseCsv('"Il a dit ""ok"""')).toEqual([['Il a dit "ok"']]);
  });

  it("keeps a newline embedded in a quoted field as part of that field", () => {
    expect(parseCsv('"Ligne 1\nLigne 2",suite')).toEqual([["Ligne 1\nLigne 2", "suite"]]);
  });

  it("strips a leading BOM", () => {
    expect(parseCsv("﻿Nom,Ville\r\nPetit,Lyon")).toEqual([
      ["Nom", "Ville"],
      ["Petit", "Lyon"],
    ]);
  });

  it("ignores a trailing blank line", () => {
    expect(parseCsv("Nom,Ville\r\nPetit,Lyon\r\n")).toEqual([
      ["Nom", "Ville"],
      ["Petit", "Lyon"],
    ]);
  });

  it("round-trips through toCsv", () => {
    const rows = [
      ["Prénom", "Nom", "Notes"],
      ["Marc", "Petit", 'Dit "bonjour", toujours.'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
