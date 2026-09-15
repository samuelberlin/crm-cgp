"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { createIncomeItemSchema } from "./schemas";

export type IncomeFormState = { error: string } | null;

export async function createIncomeItem(
  _prevState: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createIncomeItemSchema.safeParse({
    contactId: formData.get("contactId"),
    category: formData.get("category"),
    label: formData.get("label"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, ...contactWhere(session.user) },
  });
  if (!contact) {
    return { error: "Contact introuvable." };
  }

  await prisma.incomeItem.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      category: parsed.data.category,
      label: parsed.data.label,
      amount: parsed.data.amount,
    },
  });

  revalidatePath(`/contacts/${contact.id}`);
  return null;
}

export async function deleteIncomeItem(itemId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.incomeItem.findFirst({
    where: { id: itemId, tenantId: session.user.tenantId, contact: contactWhere(session.user) },
  });
  if (!existing) return;

  await prisma.incomeItem.delete({ where: { id: itemId } });
  revalidatePath(`/contacts/${existing.contactId}`);
}
