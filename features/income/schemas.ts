import { z } from "zod";

export const incomeCategoryValues = [
  "SALAIRE",
  "REMUNERATION_ART_62",
  "BIC",
  "BNC",
  "DIVIDENDES",
  "AUTRE",
] as const;

export const incomeCategoryLabels: Record<(typeof incomeCategoryValues)[number], string> = {
  SALAIRE: "Salaire / rémunération",
  REMUNERATION_ART_62: "Rémunération art. 62 (gérant majoritaire)",
  BIC: "BIC (bénéfices industriels et commerciaux)",
  BNC: "BNC (bénéfices non commerciaux)",
  DIVIDENDES: "Dividendes",
  AUTRE: "Autre revenu",
};

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const createIncomeItemSchema = z.object({
  contactId: z.string().trim().min(1),
  category: z.enum(incomeCategoryValues),
  label: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  amount: z.coerce.number().positive("Le montant doit être positif."),
});

export type CreateIncomeItemInput = z.infer<typeof createIncomeItemSchema>;
