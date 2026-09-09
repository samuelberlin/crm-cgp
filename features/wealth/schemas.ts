import { z } from "zod";

export const assetCategoryValues = [
  "IMMOBILIER",
  "FINANCIER",
  "LIQUIDITES",
  "PROFESSIONNEL",
  "AUTRE",
] as const;

export const liabilityCategoryValues = ["CREDIT", "AUTRE_DETTE"] as const;

export const wealthCategoryLabels: Record<
  (typeof assetCategoryValues)[number] | (typeof liabilityCategoryValues)[number],
  string
> = {
  IMMOBILIER: "Immobilier",
  FINANCIER: "Financier",
  LIQUIDITES: "Liquidités",
  PROFESSIONNEL: "Professionnel",
  AUTRE: "Autre",
  CREDIT: "Crédit",
  AUTRE_DETTE: "Autre dette",
};

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const createWealthItemSchema = z.object({
  contactId: z.string().trim().min(1),
  category: z.enum([...assetCategoryValues, ...liabilityCategoryValues]),
  label: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  amount: z.coerce.number().positive("Le montant doit être positif."),
});

export type CreateWealthItemInput = z.infer<typeof createWealthItemSchema>;
