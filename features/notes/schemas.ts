import { z } from "zod";

export const createNoteSchema = z.object({
  contactId: z.string().trim().min(1),
  content: z.string().trim().min(1, "La note ne peut pas être vide."),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
