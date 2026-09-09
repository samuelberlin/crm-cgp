"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { documentCategoryValues, MAX_DOCUMENT_SIZE } from "./schemas";
import type { DocumentCategory } from "@/lib/generated/prisma/enums";

export type DocumentFormState = { error: string } | null;

export async function uploadDocument(
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const contactId = formData.get("contactId");
  const category = formData.get("category");
  const file = formData.get("file");

  if (typeof contactId !== "string" || !contactId) {
    return { error: "Contact invalide." };
  }
  if (typeof category !== "string" || !documentCategoryValues.includes(category as DocumentCategory)) {
    return { error: "Catégorie invalide." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier." };
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { error: `Le fichier dépasse la taille maximale de ${MAX_DOCUMENT_SIZE / (1024 * 1024)} Mo.` };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...contactWhere(session.user) },
  });
  if (!contact) {
    return { error: "Contact introuvable." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.document.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      name: file.name.slice(0, 255) || "document",
      category: category as DocumentCategory,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: buffer,
      uploadedById: session.user.id,
    },
  });

  revalidatePath(`/contacts/${contact.id}`);
  return null;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.document.findFirst({
    where: { id: documentId, tenantId: session.user.tenantId, contact: contactWhere(session.user) },
  });
  if (!existing) return;

  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/contacts/${existing.contactId}`);
}
