"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { createProductSchema } from "./schemas";

export type ProductFormState = { error: string } | null;

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) {
    return { error: "Réservé aux administrateurs." };
  }

  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    provider: formData.get("provider"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.product.create({
    data: { ...parsed.data, tenantId: session.user.tenantId },
  });

  revalidatePath("/settings");
  return null;
}

export async function toggleProductActive(productId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) return;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id: productId },
    data: { active: !product.active },
  });

  revalidatePath("/settings");
}
