import { z } from "zod";

export const updateProductionTargetSchema = z.object({
  annualProductionTarget: z.coerce.number().min(0).max(1_000_000_000),
});

export type UpdateProductionTargetInput = z.infer<typeof updateProductionTargetSchema>;
