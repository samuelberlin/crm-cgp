import { z } from "zod";

export const createFiscalReminderSchema = z.object({
  label: z.string().trim().min(2, "Le libellé est trop court."),
  month: z.coerce.number().int().min(1, "Mois invalide.").max(12, "Mois invalide."),
  day: z.coerce.number().int().min(1, "Jour invalide.").max(31, "Jour invalide."),
});

export type CreateFiscalReminderInput = z.infer<typeof createFiscalReminderSchema>;
