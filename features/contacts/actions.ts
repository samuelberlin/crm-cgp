"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { scheduleAutomationTask } from "@/features/automations/scheduleTask";
import { canAssignAdvisor, contactWhere } from "./access";
import { createContactSchema, updateContactSchema } from "./schemas";

export type ContactFormState = { error: string } | null;

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createContactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status") || undefined,
    source: formData.get("source"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      tenantId: session.user.tenantId,
      advisorId: session.user.id,
      activities: {
        create: {
          tenantId: session.user.tenantId,
          type: "CONTACT_CREATED",
          label: "Contact créé",
          userId: session.user.id,
        },
      },
    },
  });

  // Automatisation : un nouveau prospect reçoit une tâche de premier contact.
  if (contact.status === "PROSPECT") {
    const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
    await scheduleAutomationTask({
      tenantId: session.user.tenantId,
      contactId: contact.id,
      advisorId: contact.advisorId,
      title: "Premier contact",
      delayDays: tenant?.firstContactDelayDays ?? 1,
      activityType: "TASK_CREATED",
      activityLabel: "Tâche automatique créée : Premier contact",
    });
  }

  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  contactId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, ...contactWhere(session.user) },
  });
  if (!existing) {
    return { error: "Contact introuvable." };
  }

  const parsed = updateContactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status") || undefined,
    source: formData.get("source"),
    company: formData.get("company"),
    potential: formData.get("potential"),
    notes: formData.get("notes"),
    nextAction: formData.get("nextAction"),
    lastContactAt: formData.get("lastContactAt"),
    nextContactAt: formData.get("nextContactAt"),
    birthDate: formData.get("birthDate"),
    profession: formData.get("profession"),
    city: formData.get("city"),
    maritalStatus: formData.get("maritalStatus"),
    advisorId: formData.get("advisorId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { advisorId, ...rest } = parsed.data;

  let nextAdvisorId: string | undefined;
  if (canAssignAdvisor(session.user.role as string) && advisorId) {
    const advisor = await prisma.user.findFirst({
      where: { id: advisorId, tenantId: session.user.tenantId },
    });
    if (!advisor) {
      return { error: "Conseiller invalide." };
    }
    nextAdvisorId = advisor.id;
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      ...rest,
      lastContactAt: rest.lastContactAt ? new Date(rest.lastContactAt) : undefined,
      nextContactAt: rest.nextContactAt ? new Date(rest.nextContactAt) : undefined,
      birthDate: rest.birthDate ? new Date(rest.birthDate) : undefined,
      ...(nextAdvisorId ? { advisorId: nextAdvisorId } : {}),
    },
  });

  redirect(`/contacts/${contactId}`);
}
