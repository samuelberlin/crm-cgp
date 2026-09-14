import { read, utils } from "xlsx";

/** Lit la première feuille d'un classeur Excel et la ramène au même format que parseCsv. */
export function parseXlsx(buffer: ArrayBuffer): string[][] {
  const workbook = read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
  return rows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => row.map((cell) => String(cell)));
}
