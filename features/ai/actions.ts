"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { opportunityWhere } from "@/features/opportunities/access";
import { wealthTotals } from "@/features/wealth/calc";
import { generateCompletion, isAiConfigured } from "@/lib/ai";
import { buildContactSummaryPrompt, buildFollowUpPrompt, buildOpportunityAnalysisPrompt } from "./prompts";

export type AiResult = { text: string } | { error: string };

const NOT_CONFIGURED_ERROR =
  "Fonctionnalité IA non configurée : ajoutez ANTHROPIC_API_KEY à votre environnement pour l'activer.";
const GENERATION_ERROR = "La génération a échoué. Réessayez dans quelques instants.";

export async function generateContactSummary(contactId: string): Promise<AiResult> {
  if (!isAiConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const session = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...contactWhere(session.user) },
    include: {
      opportunities: { where: { stage: { notIn: ["GAGNE", "PERDU"] } }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      wealthItems: true,
    },
  });
  if (!contact) return { error: "Contact introuvable." };

  const { prompt, system } = buildContactSummaryPrompt({
    firstName: contact.firstName,
    lastName: contact.lastName,
    status: contact.status,
    company: contact.company,
    potential: contact.potential,
    source: contact.source,
    notes: contact.notes,
    wealthNet: wealthTotals(contact.wealthItems).net,
    openOpportunities: contact.opportunities.map((o) => ({ title: o.title, stage: o.stage, amount: o.amount })),
    recentActivities: contact.activities.map((a) => ({ label: a.label, createdAt: a.createdAt })),
  });

  try {
    const text = await generateCompletion(system, prompt);
    return { text };
  } catch {
    return { error: GENERATION_ERROR };
  }
}

export async function generateFollowUpDraft(contactId: string): Promise<AiResult> {
  if (!isAiConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const session = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...contactWhere(session.user) },
    include: {
      opportunities: { where: { stage: { notIn: ["GAGNE", "PERDU"] } }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!contact) return { error: "Contact introuvable." };

  const { prompt, system } = buildFollowUpPrompt({
    firstName: contact.firstName,
    lastName: contact.lastName,
    status: contact.status,
    nextAction: contact.nextAction,
    nextContactAt: contact.nextContactAt,
    lastActivity: contact.activities[0]
      ? { label: contact.activities[0].label, createdAt: contact.activities[0].createdAt }
      : null,
    openOpportunities: contact.opportunities.map((o) => ({ title: o.title, stage: o.stage })),
  });

  try {
    const text = await generateCompletion(system, prompt);
    return { text };
  } catch {
    return { error: GENERATION_ERROR };
  }
}

export async function generateOpportunityAnalysis(opportunityId: string): Promise<AiResult> {
  if (!isAiConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const session = await requireUser();
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, ...opportunityWhere(session.user) },
    include: { contact: { include: { wealthItems: true } } },
  });
  if (!opportunity) return { error: "Opportunité introuvable." };

  const { prompt, system } = buildOpportunityAnalysisPrompt({
    title: opportunity.title,
    category: opportunity.category,
    stage: opportunity.stage,
    amount: opportunity.amount,
    probability: opportunity.probability,
    note: opportunity.note,
    contactFirstName: opportunity.contact.firstName,
    contactLastName: opportunity.contact.lastName,
    contactPotential: opportunity.contact.potential,
    wealthNet: wealthTotals(opportunity.contact.wealthItems).net,
  });

  try {
    const text = await generateCompletion(system, prompt);
    return { text };
  } catch {
    return { error: GENERATION_ERROR };
  }
}
