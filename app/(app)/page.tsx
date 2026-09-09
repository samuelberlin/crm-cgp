import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { opportunityWhere } from "@/features/opportunities/access";
import { taskWhere } from "@/features/tasks/access";
import { pipelineTotals, weightedValue, wonTotal } from "@/features/opportunities/calc";
import { opportunityStageLabels } from "@/features/opportunities/schemas";
import { taskPriorityLabels } from "@/features/tasks/schemas";
import { pickNextBestAction, type ContactCandidate, type TaskCandidate } from "@/features/dashboard/nextBestAction";
import { NextActionCard } from "@/features/dashboard/NextActionCard";
import { isInactive } from "@/features/automations/inactivity";

const FUNNEL_STAGES = ["NOUVEAU", "QUALIFIE", "PROPOSITION", "GAGNE"] as const;

export default async function DashboardPage() {
  const session = await requireUser();

  const [contactCount, openTasks, relanceContacts, opportunities, allContacts, tenant] = await Promise.all([
    prisma.contact.count({ where: contactWhere(session.user) }),
    prisma.task.findMany({
      where: { ...taskWhere(session.user), status: { not: "TERMINEE" } },
      include: { contact: true },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.contact.findMany({
      where: { ...contactWhere(session.user), nextContactAt: { not: null } },
      orderBy: { nextContactAt: "asc" },
    }),
    prisma.opportunity.findMany({
      where: opportunityWhere(session.user),
      include: { contact: true },
    }),
    prisma.contact.findMany({
      where: contactWhere(session.user),
      select: { id: true, firstName: true, lastName: true, lastContactAt: true, createdAt: true },
    }),
    session.user.tenantId
      ? prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
      : Promise.resolve(null),
  ]);

  const inactiveContacts = allContacts
    .filter((c) => isInactive(c, tenant?.inactivityAlertDays ?? 30))
    .slice(0, 5);

  const taskCandidates: TaskCandidate[] = openTasks
    .filter((t) => t.dueDate !== null)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!,
      priority: t.priority,
      contactId: t.contactId,
      contactName: t.contact ? `${t.contact.firstName} ${t.contact.lastName}` : null,
    }));

  const contactCandidates: ContactCandidate[] = relanceContacts.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    nextContactAt: c.nextContactAt!,
    nextAction: c.nextAction,
    phone: c.phone,
    email: c.email,
    potential: c.potential,
  }));

  const nextAction = pickNextBestAction(taskCandidates, contactCandidates, new Date());

  const totals = pipelineTotals(opportunities);
  const won = wonTotal(opportunities);

  const funnelCounts = Object.fromEntries(
    FUNNEL_STAGES.map((stage) => [stage, opportunities.filter((o) => o.stage === stage).length]),
  ) as Record<(typeof FUNNEL_STAGES)[number], number>;

  const priorityOpportunities = opportunities
    .filter((o) => o.stage !== "GAGNE" && o.stage !== "PERDU")
    .sort(
      (a, b) => weightedValue(b.amount, b.probability) - weightedValue(a.amount, a.probability),
    )
    .slice(0, 5);

  const upcomingTasks = openTasks.slice(0, 5);
  const upcomingRelances = relanceContacts.slice(0, 5);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bonjour {session.user.name.split(" ")[0]}</h1>
        <div className="flex gap-2">
          <Link href="/contacts/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Nouveau contact
          </Link>
          <Link href="/opportunities/new" className={buttonVariants({ size: "sm" })}>
            Nouvelle opportunité
          </Link>
        </div>
      </div>

      <NextActionCard action={nextAction} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Pipeline ({totals.count} en cours)</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totals.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pipeline pondéré</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totals.weighted)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>CA gagné</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(won)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {FUNNEL_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <div className="rounded-lg border px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">{opportunityStageLabels[stage]}</p>
                  <p className="text-lg font-semibold">{funnelCounts[stage]}</p>
                </div>
                {i < FUNNEL_STAGES.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tâches à venir</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune tâche en cours.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-2">
                    <Link href={`/tasks/${task.id}/edit`} className="hover:underline">
                      {task.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={task.priority === "HAUTE" ? "destructive" : "outline"}>
                        {taskPriorityLabels[task.priority]}
                      </Badge>
                      {formatDate(task.dueDate)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/tasks" className="mt-3 inline-block text-sm text-primary hover:underline">
              Voir toutes les tâches →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relances</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRelances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune relance planifiée.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcomingRelances.map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between gap-2">
                    <Link href={`/contacts/${contact.id}`} className="hover:underline">
                      {contact.firstName} {contact.lastName}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(contact.nextContactAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/contacts" className="mt-3 inline-block text-sm text-primary hover:underline">
              Voir tous les contacts →
            </Link>
          </CardContent>
        </Card>
      </div>

      {inactiveContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clients inactifs</CardTitle>
            <CardDescription>
              Aucun contact depuis {tenant?.inactivityAlertDays ?? 30} jours ou plus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {inactiveContacts.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between gap-2">
                  <Link href={`/contacts/${contact.id}`} className="hover:underline">
                    {contact.firstName} {contact.lastName}
                  </Link>
                  <Badge variant="destructive">Inactif</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Opportunités prioritaires</CardTitle>
          <CardDescription>Triées par valeur pondérée (montant × probabilité).</CardDescription>
        </CardHeader>
        <CardContent>
          {priorityOpportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune opportunité en cours.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {priorityOpportunities.map((opportunity) => (
                <li key={opportunity.id} className="flex items-center justify-between gap-2">
                  <div>
                    <Link href={`/opportunities/${opportunity.id}/edit`} className="hover:underline">
                      {opportunity.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {opportunity.contact.firstName} {opportunity.contact.lastName} ·{" "}
                      {opportunityStageLabels[opportunity.stage]}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatCurrency(weightedValue(opportunity.amount, opportunity.probability))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/opportunities" className="mt-3 inline-block text-sm text-primary hover:underline">
            Voir le pipeline →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Votre compte</CardTitle>
          <CardDescription>Informations de session, vérifiées côté serveur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Contacts :</span> {contactCount}
          </p>
          <p>
            <span className="text-muted-foreground">Email :</span> {session.user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Rôle :</span> {session.user.role}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
