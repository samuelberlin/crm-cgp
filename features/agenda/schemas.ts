import { z } from "zod";
import { emptyToUndefined } from "@/lib/zod-helpers";

export const meetingStatusValues = ["PLANIFIE", "REALISE", "ANNULE"] as const;

export const meetingStatusLabels: Record<(typeof meetingStatusValues)[number], string> = {
  PLANIFIE: "Planifié",
  REALISE: "Réalisé",
  ANNULE: "Annulé",
};

export const createMeetingSchema = z.object({
  contactId: z.string().trim().min(1, "Le contact est requis."),
  date: z.string().trim().min(1, "La date est requise."),
  location: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const updateMeetingSchema = createMeetingSchema.omit({ contactId: true }).extend({
  status: z.enum(meetingStatusValues).default("PLANIFIE"),
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
