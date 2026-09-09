export const documentCategoryValues = ["IDENTITE", "FISCALITE", "PATRIMOINE", "CONTRATS", "AUTRE"] as const;

export const documentCategoryLabels: Record<(typeof documentCategoryValues)[number], string> = {
  IDENTITE: "Identité",
  FISCALITE: "Fiscalité",
  PATRIMOINE: "Patrimoine",
  CONTRATS: "Contrats",
  AUTRE: "Autre",
};

export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 Mo

/** Only these types are ever served inline; everything else is always a forced download (avoids stored-content being rendered by the browser, e.g. an uploaded HTML file). */
export function isInlinePreviewable(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}
