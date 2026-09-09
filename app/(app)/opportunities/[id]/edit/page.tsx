import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { canAssignAdvisor } from "@/features/auth/permissions";
import { opportunityWhere } from "@/features/opportunities/access";
import { EditOpportunityForm } from "@/features/opportunities/EditOpportunityForm";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const opportunity = await prisma.opportunity.findFirst({
    where: { id, ...opportunityWhere(session.user) },
    include: { contact: true },
  });
  if (!opportunity) notFound();

  const advisors =
    canAssignAdvisor(session.user.role as string) && session.user.tenantId
      ? await prisma.user.findMany({
          where: { tenantId: session.user.tenantId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Modifier l&apos;opportunité</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {opportunity.contact.firstName} {opportunity.contact.lastName}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <EditOpportunityForm opportunity={opportunity} advisors={advisors} />
        </CardContent>
      </Card>
    </div>
  );
}
