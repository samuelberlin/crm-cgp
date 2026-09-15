"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { assetCategoryValues, createWealthItemSchema, liabilityCategoryValues } from "./schemas";

export type WealthFormState = { error: string } | null;

async function createWealthItem(
  kind: "ACTIF" | "PASSIF",
  _prevState: WealthFormState,
  formData: FormData,
): Promise<WealthFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createWealthItemSchema.safeParse({
    contactId: formData.get("contactId"),
    category: formData.get("category"),
    label: formData.get("label"),
    amount: formData.get("amount"),
    subscribedAt: formData.get("subscribedAt"),
    beneficiaryIds: formData.getAll("beneficiaryIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const allowedCategories: readonly string[] = kind === "ACTIF" ? assetCategoryValues : liabilityCategoryValues;
  if (!allowedCategories.includes(parsed.data.category)) {
    return { error: "Catégorie invalide." };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, ...contactWhere(session.user) },
  });
  if (!contact) {
    return { error: "Contact introuvable." };
  }

  // Les bénéficiaires doivent appartenir à ce même contact (jamais à un autre
  // client du cabinet, même si son id a été trafiqué côté formulaire).
  const beneficiaries =
    parsed.data.beneficiaryIds.length > 0
      ? await prisma.familyMember.findMany({
          where: { id: { in: parsed.data.beneficiaryIds }, contactId: contact.id },
          select: { id: true },
        })
      : [];

  await prisma.wealthItem.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      kind,
      category: parsed.data.category,
      label: parsed.data.label,
      amount: parsed.data.amount,
      subscribedAt: parsed.data.subscribedAt ? new Date(parsed.data.subscribedAt) : undefined,
      beneficiaries: beneficiaries.length > 0 ? { connect: beneficiaries } : undefined,
    },
  });

  revalidatePath(`/contacts/${contact.id}`);
  return null;
}

export async function createAsset(prevState: WealthFormState, formData: FormData) {
  return createWealthItem("ACTIF", prevState, formData);
}

export async function createLiability(prevState: WealthFormState, formData: FormData) {
  return createWealthItem("PASSIF", prevState, formData);
}

export async function deleteWealthItem(itemId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.wealthItem.findFirst({
    where: { id: itemId, tenantId: session.user.tenantId, contact: contactWhere(session.user) },
  });
  if (!existing) return;

  await prisma.wealthItem.delete({ where: { id: itemId } });
  revalidatePath(`/contacts/${existing.contactId}`);
}
