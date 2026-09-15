"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { createFamilyMemberSchema } from "./schemas";

export type FamilyMemberFormState = { error: string } | null;

export async function createFamilyMember(
  _prevState: FamilyMemberFormState,
  formData: FormData,
): Promise<FamilyMemberFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createFamilyMemberSchema.safeParse({
    contactId: formData.get("contactId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    relationship: formData.get("relationship"),
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

  await prisma.familyMember.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      relationship: parsed.data.relationship,
    },
  });

  revalidatePath(`/contacts/${contact.id}`);
  return null;
}

export async function deleteFamilyMember(memberId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.familyMember.findFirst({
    where: { id: memberId, tenantId: session.user.tenantId, contact: contactWhere(session.user) },
  });
  if (!existing) return;

  await prisma.familyMember.delete({ where: { id: memberId } });
  revalidatePath(`/contacts/${existing.contactId}`);
}
