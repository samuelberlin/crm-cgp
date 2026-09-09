import { z } from "zod";

export const contactStatusValues = ["PROSPECT", "CLIENT", "ANCIEN_CLIENT", "PARTENAIRE"] as const;

export const contactStatusLabels: Record<(typeof contactStatusValues)[number], string> = {
  PROSPECT: "Prospect",
  CLIENT: "Client",
  ANCIEN_CLIENT: "Ancien client",
  PARTENAIRE: "Partenaire",
};

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  email: z.preprocess(emptyToUndefined, z.email("Email invalide.").optional()),
  status: z.enum(contactStatusValues).default("PROSPECT"),
  source: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.extend({
  company: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  potential: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative("Doit être positif.").optional(),
  ),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  nextAction: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  lastContactAt: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  nextContactAt: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  birthDate: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  profession: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  maritalStatus: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  advisorId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
