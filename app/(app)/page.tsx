import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { opportunityWhere } from "@/features/opportunities/access";
import { pipelineTotals } from "@/features/opportunities/calc";

export default async function DashboardPage() {
  const session = await requireUser();
  const [contactCount, opportunities] = await Promise.all([
    prisma.contact.count({ where: contactWhere(session.user) }),
    prisma.opportunity.findMany({
      where: opportunityWhere(session.user),
      select: { amount: true, probability: true, stage: true },
    }),
  ]);
  const totals = pipelineTotals(opportunities);

  return (
    <div className="max-w-2xl">
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
      <p className="mt-1 text-sm text-muted-foreground">Tâches et agenda arrivent dans les prochaines étapes.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Contacts</CardDescription>
            <CardTitle className="text-2xl">{contactCount}</CardTitle>
          </CardHeader>
        </Card>
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
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accès rapide</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          <Link href="/contacts" className="font-medium text-primary hover:underline">
            Voir les contacts →
          </Link>
          <Link href="/opportunities" className="font-medium text-primary hover:underline">
            Voir le pipeline →
          </Link>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Votre compte</CardTitle>
          <CardDescription>Informations de session, vérifiées côté serveur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
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
