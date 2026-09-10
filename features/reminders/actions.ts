"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { createFiscalReminderSchema } from "./schemas";

export type FiscalReminderFormState = { error: string } | null;

export async function createFiscalReminder(
  _prevState: FiscalReminderFormState,
  formData: FormData,
): Promise<FiscalReminderFormState> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) {
    return { error: "Réservé aux administrateurs." };
  }

  const parsed = createFiscalReminderSchema.safeParse({
    label: formData.get("label"),
    month: formData.get("month"),
    day: formData.get("day"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.fiscalReminder.create({
    data: { ...parsed.data, tenantId: session.user.tenantId },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return null;
}

export async function deleteFiscalReminder(reminderId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) return;

  await prisma.fiscalReminder.deleteMany({
    where: { id: reminderId, tenantId: session.user.tenantId },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}
