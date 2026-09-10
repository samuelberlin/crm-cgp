import { z } from "zod";

export const assetCategoryValues = [
  "IMMOBILIER",

  // Patrimoine financier : enveloppes et supports précis plutôt qu'un bucket générique.
  "ASSURANCE_VIE",
  "CONTRAT_CAPITALISATION",
  "PER",
  "PEA",
  "PEA_PME",
  "COMPTE_TITRES",
  "EPARGNE_SALARIALE",
  "FCPI_FIP",
  "SCPI_OPCI",
  "LIVRET_A",
  "LDDS",
  "LEP",
  "PEL_CEL",
  "COMPTE_BANCAIRE",
  "CRYPTO",
  "OR_METAUX",
  "AUTRE_FINANCIER",

  "PROFESSIONNEL",
  "AUTRE",
] as const;

export const liabilityCategoryValues = ["CREDIT", "AUTRE_DETTE"] as const;

export const wealthCategoryLabels: Record<
  | (typeof assetCategoryValues)[number]
  | (typeof liabilityCategoryValues)[number]
  // Anciennes rubriques génériques : retirées du formulaire de saisie au profit des
  // rubriques précises ci-dessus, mais gardées ici pour que les biens déjà enregistrés
  // avec l'une d'elles affichent toujours un libellé correct.
  | "FINANCIER"
  | "LIQUIDITES",
  string
> = {
  IMMOBILIER: "Immobilier",
  ASSURANCE_VIE: "Assurance-vie",
  CONTRAT_CAPITALISATION: "Contrat de capitalisation",
  PER: "PER (Plan d'Épargne Retraite)",
  PEA: "PEA",
  PEA_PME: "PEA-PME",
  COMPTE_TITRES: "Compte-titres",
  EPARGNE_SALARIALE: "Épargne salariale (PEE/PERCO)",
  FCPI_FIP: "FCPI / FIP",
  SCPI_OPCI: "SCPI / OPCI",
  LIVRET_A: "Livret A",
  LDDS: "LDDS",
  LEP: "LEP",
  PEL_CEL: "PEL / CEL",
  COMPTE_BANCAIRE: "Compte courant / épargne bancaire",
  CRYPTO: "Cryptomonnaies",
  OR_METAUX: "Or et métaux précieux",
  AUTRE_FINANCIER: "Autre placement financier",
  PROFESSIONNEL: "Professionnel",
  AUTRE: "Autre",
  CREDIT: "Crédit",
  AUTRE_DETTE: "Autre dette",
  FINANCIER: "Financier",
  LIQUIDITES: "Liquidités",
};

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const createWealthItemSchema = z.object({
  contactId: z.string().trim().min(1),
  category: z.enum([...assetCategoryValues, ...liabilityCategoryValues]),
  label: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  amount: z.coerce.number().positive("Le montant doit être positif."),
});

export type CreateWealthItemInput = z.infer<typeof createWealthItemSchema>;
