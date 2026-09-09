import { z } from "zod";

export const updateAutomationSettingsSchema = z.object({
  firstContactDelayDays: z.coerce.number().int().min(0).max(90),
  meetingReportDelayDays: z.coerce.number().int().min(0).max(90),
  proposalFollowUpDelayDays: z.coerce.number().int().min(0).max(90),
  inactivityAlertDays: z.coerce.number().int().min(1).max(365),
});

export type UpdateAutomationSettingsInput = z.infer<typeof updateAutomationSettingsSchema>;
