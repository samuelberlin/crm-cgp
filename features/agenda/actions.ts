"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { scheduleAutomationTask } from "@/features/automations/scheduleTask";
import { meetingWhere } from "./access";
import { createMeetingSchema, meetingStatusValues, updateMeetingSchema } from "./schemas";

export type MeetingFormState = { error: string } | null;

/** Automatisation : un rendez-vous réalisé crée une tâche "Envoyer le compte rendu". */
async function scheduleMeetingReportTask(
  tenantId: string,
  meeting: { contactId: string; advisorId: string | null },
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  await scheduleAutomationTask({
    tenantId,
    contactId: meeting.contactId,
    advisorId: meeting.advisorId,
    title: "Envoyer le compte rendu",
    delayDays: tenant?.meetingReportDelayDays ?? 1,
    activityType: "TASK_CREATED",
    activityLabel: "Tâche automatique créée : Envoyer le compte rendu",
  });
}

export async function createMeeting(
  _prevState: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createMeetingSchema.safeParse({
    contactId: formData.get("contactId"),
    date: formData.get("date"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    objectives: formData.get("objectives"),
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

  const { date, ...rest } = parsed.data;

  await prisma.meeting.create({
    data: {
      ...rest,
      date: new Date(date),
      tenantId: session.user.tenantId,
      advisorId: session.user.id,
    },
  });

  await prisma.activity.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      type: "MEETING_SCHEDULED",
      label: "Rendez-vous planifié",
      userId: session.user.id,
    },
  });

  redirect(`/contacts/${contact.id}`);
}

export async function updateMeeting(
  meetingId: string,
  _prevState: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, ...meetingWhere(session.user) },
  });
  if (!existing) {
    return { error: "Rendez-vous introuvable." };
  }

  const parsed = updateMeetingSchema.safeParse({
    date: formData.get("date"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    objectives: formData.get("objectives"),
    recommendations: formData.get("recommendations"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { date, ...rest } = parsed.data;

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { ...rest, date: new Date(date) },
  });

  if (existing.status !== "REALISE" && parsed.data.status === "REALISE") {
    await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        contactId: existing.contactId,
        type: "MEETING_COMPLETED",
        label: "Rendez-vous réalisé",
        userId: session.user.id,
      },
    });
    await scheduleMeetingReportTask(session.user.tenantId, existing);
  }

  redirect("/agenda");
}

export async function updateMeetingStatus(
  meetingId: string,
  status: (typeof meetingStatusValues)[number],
): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, ...meetingWhere(session.user) },
  });
  if (!existing || existing.status === status) return;

  await prisma.meeting.update({ where: { id: meetingId }, data: { status } });

  if (status === "REALISE") {
    await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        contactId: existing.contactId,
        type: "MEETING_COMPLETED",
        label: "Rendez-vous réalisé",
        userId: session.user.id,
      },
    });
    await scheduleMeetingReportTask(session.user.tenantId, existing);
  }

  revalidatePath("/agenda");
}
