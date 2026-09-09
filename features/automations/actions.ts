"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { updateAutomationSettingsSchema } from "./schemas";

export type AutomationSettingsFormState = { error: string } | { success: true } | null;

export async function updateAutomationSettings(
  _prevState: AutomationSettingsFormState,
  formData: FormData,
): Promise<AutomationSettingsFormState> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) {
    return { error: "Réservé aux administrateurs." };
  }

  const parsed = updateAutomationSettingsSchema.safeParse({
    firstContactDelayDays: formData.get("firstContactDelayDays"),
    meetingReportDelayDays: formData.get("meetingReportDelayDays"),
    proposalFollowUpDelayDays: formData.get("proposalFollowUpDelayDays"),
    inactivityAlertDays: formData.get("inactivityAlertDays"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: parsed.data,
  });

  revalidatePath("/settings");
  return { success: true };
}
