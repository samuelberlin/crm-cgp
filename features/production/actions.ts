"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { updateProductionTargetSchema } from "./schemas";

export type ProductionTargetFormState = { error: string } | { success: true } | null;

export async function updateProductionTarget(
  _prevState: ProductionTargetFormState,
  formData: FormData,
): Promise<ProductionTargetFormState> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) {
    return { error: "Réservé aux administrateurs." };
  }

  const parsed = updateProductionTargetSchema.safeParse({
    annualProductionTarget: formData.get("annualProductionTarget"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { annualProductionTarget: parsed.data.annualProductionTarget },
  });

  revalidatePath("/production");
  return { success: true };
}
