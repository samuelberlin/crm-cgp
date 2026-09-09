import { z } from "zod";
import { emptyToUndefined } from "@/lib/zod-helpers";

export const productCategoryValues = ["PREVOYANCE", "SANTE", "RETRAITE", "EPARGNE", "DOMMAGES"] as const;

export const productCategoryLabels: Record<(typeof productCategoryValues)[number], string> = {
  PREVOYANCE: "Prévoyance",
  SANTE: "Santé",
  RETRAITE: "Retraite",
  EPARGNE: "Épargne",
  DOMMAGES: "Dommages",
};

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire."),
  category: z.enum(productCategoryValues),
  provider: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  description: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
