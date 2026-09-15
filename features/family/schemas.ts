import { z } from "zod";

export const familyRelationshipValues = ["CONJOINT", "ENFANT", "AUTRE"] as const;

export const familyRelationshipLabels: Record<(typeof familyRelationshipValues)[number], string> = {
  CONJOINT: "Conjoint(e)",
  ENFANT: "Enfant",
  AUTRE: "Autre",
};

export const createFamilyMemberSchema = z.object({
  contactId: z.string().trim().min(1),
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  relationship: z.enum(familyRelationshipValues),
});

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
