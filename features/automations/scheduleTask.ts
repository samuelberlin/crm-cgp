import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@/lib/generated/prisma/enums";

/**
 * Creates a system-generated follow-up task for a contact and logs it on
 * the timeline. Used by the automation hooks (new prospect, meeting
 * completed, proposal sent) — never called directly from a form.
 */
export async function scheduleAutomationTask(params: {
  tenantId: string;
  contactId: string;
  advisorId: string | null;
  title: string;
  delayDays: number;
  opportunityId?: string;
  activityType: ActivityType;
  activityLabel: string;
}): Promise<void> {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + params.delayDays);

  await prisma.task.create({
    data: {
      tenantId: params.tenantId,
      contactId: params.contactId,
      opportunityId: params.opportunityId,
      advisorId: params.advisorId,
      title: params.title,
      dueDate,
      priority: "NORMALE",
    },
  });

  await prisma.activity.create({
    data: {
      tenantId: params.tenantId,
      contactId: params.contactId,
      opportunityId: params.opportunityId,
      type: params.activityType,
      label: params.activityLabel,
    },
  });
}
