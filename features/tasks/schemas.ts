import { z } from "zod";
import { emptyToUndefined } from "@/lib/zod-helpers";

export const taskPriorityValues = ["HAUTE", "NORMALE", "BASSE"] as const;

export const taskPriorityLabels: Record<(typeof taskPriorityValues)[number], string> = {
  HAUTE: "Haute",
  NORMALE: "Normale",
  BASSE: "Basse",
};

export const taskStatusValues = ["A_FAIRE", "EN_COURS", "TERMINEE"] as const;

export const taskStatusLabels: Record<(typeof taskStatusValues)[number], string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis."),
  contactId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  opportunityId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  priority: z.enum(taskPriorityValues).default("NORMALE"),
  dueDate: z.preprocess(emptyToUndefined, z.iso.date().optional()),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.extend({
  status: z.enum(taskStatusValues).default("A_FAIRE"),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
