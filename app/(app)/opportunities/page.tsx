import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { opportunityWhere } from "@/features/opportunities/access";
import { pipelineTotals, weightedValue } from "@/features/opportunities/calc";
import {
  opportunityCategoryLabels,
  opportunityStageLabels,
  opportunityStageValues,
} from "@/features/opportunities/schemas";
import { StageSelect } from "@/features/opportunities/StageSelect";

export default async function OpportunitiesPage() {
  const session = await requireUser();

  const opportunities = await prisma.opportunity.findMany({
    where: opportunityWhere(session.user),
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  const totals = pipelineTotals(opportunities);

  const byStage = Object.fromEntries(
    opportunityStageValues.map((stage) => [stage, opportunities.filter((o) => o.stage === stage)]),
  ) as Record<(typeof opportunityStageValues)[number], typeof opportunities>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Opportunités</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totals.count} en cours · Pipeline {formatCurrency(totals.total)} · Pondéré{" "}
            {formatCurrency(totals.weighted)}
          </p>
        </div>
        <Link href="/opportunities/new" className={buttonVariants()}>
          Nouvelle opportunité
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {opportunityStageValues.map((stage) => (
          <div key={stage} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{opportunityStageLabels[stage]}</h2>
              <span className="text-xs text-muted-foreground">{byStage[stage].length}</span>
            </div>
            <div className="space-y-2">
              {byStage[stage].map((opportunity) => (
                <div key={opportunity.id} className="rounded-xl border bg-card p-3 text-sm">
                  <Link href={`/contacts/${opportunity.contactId}`} className="font-medium hover:underline">
                    {opportunity.contact.firstName} {opportunity.contact.lastName}
                  </Link>
                  <p className="mt-0.5 text-muted-foreground">{opportunity.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {opportunityCategoryLabels[opportunity.category]}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-medium">{formatCurrency(opportunity.amount)}</span>
                    <span className="text-xs text-muted-foreground">{opportunity.probability}%</span>
                  </div>
                  {opportunity.amount && (
                    <p className="text-xs text-muted-foreground">
                      Pondéré : {formatCurrency(weightedValue(opportunity.amount, opportunity.probability))}
                    </p>
                  )}
                  {opportunity.nextAction && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opportunity.nextAction}
                      {opportunity.estimatedCloseDate && ` (${formatDate(opportunity.estimatedCloseDate)})`}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StageSelect opportunityId={opportunity.id} stage={opportunity.stage} />
                    <Link
                      href={`/opportunities/${opportunity.id}/edit`}
                      className="text-xs text-primary hover:underline"
                    >
                      Modifier
                    </Link>
                  </div>
                </div>
              ))}
              {byStage[stage].length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
