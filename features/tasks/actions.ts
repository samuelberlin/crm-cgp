"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { opportunityWhere } from "@/features/opportunities/access";
import { taskWhere } from "./access";
import { createTaskSchema, taskStatusValues, updateTaskSchema } from "./schemas";

export type TaskFormState = { error: string } | null;

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    opportunityId: formData.get("opportunityId"),
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  if (parsed.data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: parsed.data.contactId, ...contactWhere(session.user) },
    });
    if (!contact) return { error: "Contact introuvable." };
  }
  if (parsed.data.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: parsed.data.opportunityId, ...opportunityWhere(session.user) },
    });
    if (!opportunity) return { error: "Opportunité introuvable." };
  }

  const { dueDate, contactId, ...rest } = parsed.data;

  await prisma.task.create({
    data: {
      ...rest,
      contactId,
      dueDate: toDate(dueDate),
      tenantId: session.user.tenantId,
      advisorId: session.user.id,
    },
  });

  if (contactId) {
    await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        contactId,
        type: "TASK_CREATED",
        label: `Tâche créée : ${parsed.data.title}`,
        userId: session.user.id,
      },
    });
  }

  redirect(contactId ? `/contacts/${contactId}` : `/tasks`);
}

export async function updateTask(
  taskId: string,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const existing = await prisma.task.findFirst({ where: { id: taskId, ...taskWhere(session.user) } });
  if (!existing) {
    return { error: "Tâche introuvable." };
  }

  const parsed = updateTaskSchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    opportunityId: formData.get("opportunityId"),
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { dueDate, ...rest } = parsed.data;

  await prisma.task.update({
    where: { id: taskId },
    data: { ...rest, dueDate: toDate(dueDate) },
  });

  if (existing.status !== "TERMINEE" && parsed.data.status === "TERMINEE" && existing.contactId) {
    await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        contactId: existing.contactId,
        type: "TASK_COMPLETED",
        label: `Tâche terminée : ${parsed.data.title}`,
        userId: session.user.id,
      },
    });
  }

  redirect("/tasks");
}

export async function updateTaskStatus(
  taskId: string,
  status: (typeof taskStatusValues)[number],
): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.task.findFirst({ where: { id: taskId, ...taskWhere(session.user) } });
  if (!existing || existing.status === status) return;

  await prisma.task.update({ where: { id: taskId }, data: { status } });

  if (status === "TERMINEE" && existing.contactId) {
    await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        contactId: existing.contactId,
        type: "TASK_COMPLETED",
        label: `Tâche terminée : ${existing.title}`,
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/tasks");
}

/** Pushes a task's due date one day forward (from today if it has none, or is already past). */
export async function postponeTask(taskId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.task.findFirst({ where: { id: taskId, ...taskWhere(session.user) } });
  if (!existing) return;

  const now = new Date();
  const base = existing.dueDate && existing.dueDate > now ? existing.dueDate : now;
  const next = new Date(base);
  next.setDate(next.getDate() + 1);

  await prisma.task.update({ where: { id: taskId }, data: { dueDate: next } });

  revalidatePath("/");
  revalidatePath("/tasks");
}
