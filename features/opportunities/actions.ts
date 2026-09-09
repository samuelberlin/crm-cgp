"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { canAssignAdvisor } from "@/features/auth/permissions";
import { contactWhere } from "@/features/contacts/access";
import { scheduleAutomationTask } from "@/features/automations/scheduleTask";
import { opportunityWhere } from "./access";
import {
  createOpportunitySchema,
  opportunityStageLabels,
  opportunityStageValues,
  updateOpportunitySchema,
} from "./schemas";

export type OpportunityFormState = { error: string } | null;

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

/** Automatisation : une opportunité passée en Proposition programme une relance J+N. */
async function scheduleProposalFollowUp(
  tenantId: string,
  opportunity: { id: string; contactId: string; advisorId: string | null; title: string },
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  await scheduleAutomationTask({
    tenantId,
    contactId: opportunity.contactId,
    advisorId: opportunity.advisorId,
    opportunityId: opportunity.id,
    title: `Relancer : ${opportunity.title}`,
    delayDays: tenant?.proposalFollowUpDelayDays ?? 3,
    activityType: "TASK_CREATED",
    activityLabel: `Tâche automatique créée : Relancer ${opportunity.title}`,
  });
}

export async function createOpportunity(
  _prevState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createOpportunitySchema.safeParse({
    contactId: formData.get("contactId"),
    title: formData.get("title"),
    category: formData.get("category") || undefined,
    amount: formData.get("amount"),
    probability: formData.get("probability"),
    estimatedCloseDate: formData.get("estimatedCloseDate"),
    note: formData.get("note"),
    nextAction: formData.get("nextAction"),
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

  const { estimatedCloseDate, ...rest } = parsed.data;

  const opportunity = await prisma.opportunity.create({
    data: {
      ...rest,
      estimatedCloseDate: toDate(estimatedCloseDate),
      tenantId: session.user.tenantId,
      advisorId: session.user.id,
      activities: {
        create: {
          tenantId: session.user.tenantId,
          contactId: contact.id,
          type: "OPPORTUNITY_CREATED",
          label: `Opportunité créée : ${parsed.data.title}`,
          userId: session.user.id,
        },
      },
    },
  });

  redirect(`/contacts/${opportunity.contactId}`);
}

export async function updateOpportunity(
  opportunityId: string,
  _prevState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const existing = await prisma.opportunity.findFirst({
    where: { id: opportunityId, ...opportunityWhere(session.user) },
  });
  if (!existing) {
    return { error: "Opportunité introuvable." };
  }

  const parsed = updateOpportunitySchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category") || undefined,
    amount: formData.get("amount"),
    probability: formData.get("probability"),
    stage: formData.get("stage") || undefined,
    estimatedCloseDate: formData.get("estimatedCloseDate"),
    note: formData.get("note"),
    nextAction: formData.get("nextAction"),
    advisorId: formData.get("advisorId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { estimatedCloseDate, advisorId, ...rest } = parsed.data;

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

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      ...rest,
      estimatedCloseDate: toDate(estimatedCloseDate),
      ...(nextAdvisorId ? { advisorId: nextAdvisorId } : {}),
    },
  });

  if (existing.stage !== parsed.data.stage) {
    await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        contactId: existing.contactId,
        opportunityId,
        type: "OPPORTUNITY_STAGE_CHANGED",
        label: `Étape : ${opportunityStageLabels[existing.stage]} → ${opportunityStageLabels[parsed.data.stage]}`,
        userId: session.user.id,
      },
    });
    if (parsed.data.stage === "PROPOSITION") {
      await scheduleProposalFollowUp(session.user.tenantId, {
        id: existing.id,
        contactId: existing.contactId,
        advisorId: nextAdvisorId ?? existing.advisorId,
        title: existing.title,
      });
    }
  }

  redirect(`/contacts/${existing.contactId}`);
}

export async function updateOpportunityStage(
  opportunityId: string,
  stage: (typeof opportunityStageValues)[number],
): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.opportunity.findFirst({
    where: { id: opportunityId, ...opportunityWhere(session.user) },
  });
  if (!existing || existing.stage === stage) return;

  await prisma.opportunity.update({ where: { id: opportunityId }, data: { stage } });

  await prisma.activity.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: existing.contactId,
      opportunityId,
      type: "OPPORTUNITY_STAGE_CHANGED",
      label: `Étape : ${opportunityStageLabels[existing.stage]} → ${opportunityStageLabels[stage]}`,
      userId: session.user.id,
    },
  });

  if (stage === "PROPOSITION") {
    await scheduleProposalFollowUp(session.user.tenantId, existing);
  }

  revalidatePath("/opportunities");
}
