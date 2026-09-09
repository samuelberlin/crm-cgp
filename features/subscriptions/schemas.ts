import { z } from "zod";
import { emptyToUndefined } from "@/lib/zod-helpers";

export const createSubscriptionSchema = z.object({
  contactId: z.string().trim().min(1, "Le contact est requis."),
  productId: z.string().trim().min(1, "Le produit est requis."),
  encours: z.coerce.number().min(0, "L'encours doit être positif ou nul."),
  subscribedAt: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  note: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
