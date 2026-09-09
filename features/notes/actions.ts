"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { createNoteSchema } from "./schemas";

export type NoteFormState = { error: string } | null;

function excerpt(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export async function createNote(
  _prevState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createNoteSchema.safeParse({
    contactId: formData.get("contactId"),
    content: formData.get("content"),
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

  await prisma.note.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      content: parsed.data.content,
      userId: session.user.id,
    },
  });

  await prisma.activity.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      type: "NOTE_ADDED",
      label: `Note : ${excerpt(parsed.data.content)}`,
      userId: session.user.id,
    },
  });

  revalidatePath(`/contacts/${contact.id}`);
  return null;
}
