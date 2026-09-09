import { z } from "zod";

export const opportunityCategoryValues = [
  "INVESTISSEMENT",
  "RETRAITE",
  "IMMOBILIER",
  "ASSURANCE",
  "FISCALITE",
  "TRANSMISSION",
  "AUTRE",
] as const;

export const opportunityCategoryLabels: Record<(typeof opportunityCategoryValues)[number], string> = {
  INVESTISSEMENT: "Investissement",
  RETRAITE: "Retraite",
  IMMOBILIER: "Immobilier",
  ASSURANCE: "Assurance",
  FISCALITE: "Fiscalité",
  TRANSMISSION: "Transmission",
  AUTRE: "Autre",
};

export const opportunityStageValues = [
  "NOUVEAU",
  "QUALIFIE",
  "RENDEZ_VOUS",
  "PROPOSITION",
  "NEGOCIATION",
  "GAGNE",
  "PERDU",
] as const;

export const opportunityStageLabels: Record<(typeof opportunityStageValues)[number], string> = {
  NOUVEAU: "Nouveau",
  QUALIFIE: "Qualifié",
  RENDEZ_VOUS: "Rendez-vous",
  PROPOSITION: "Proposition",
  NEGOCIATION: "Négociation",
  GAGNE: "Gagné",
  PERDU: "Perdu",
};

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const createOpportunitySchema = z.object({
  contactId: z.string().trim().min(1, "Le contact est requis."),
  title: z.string().trim().min(1, "Le titre est requis."),
  category: z.enum(opportunityCategoryValues).default("AUTRE"),
  amount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative("Doit être positif.").optional()),
  probability: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).max(100).default(50),
  ),
  estimatedCloseDate: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  note: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  nextAction: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = createOpportunitySchema
  .omit({ contactId: true })
  .extend({
    stage: z.enum(opportunityStageValues).default("NOUVEAU"),
    advisorId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  });

export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
