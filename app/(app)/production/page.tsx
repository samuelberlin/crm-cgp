import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { subscriptionWhere } from "@/features/subscriptions/access";
import {
  buildMonthlyProduction,
  categoryBreakdown,
  evolutionPercent,
  monthKey,
  monthsOfYear,
  yearsWithSubscriptions,
} from "@/features/production/calc";
import {
  ProductionByCategoryChart,
  ProductionByCategoryDonut,
  ProductionEvolutionChart,
} from "@/features/production/ProductionCharts";
import { categoryColor, categoryLabel } from "@/features/production/presentation";

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireUser();
  const { year: rawYear } = await searchParams;

  const subscriptions = await prisma.subscription.findMany({
    where: subscriptionWhere(session.user),
    include: { product: true, contact: true },
    orderBy: { subscribedAt: "desc" },
  });

  const records = subscriptions.map((s) => ({
    encours: s.encours,
    status: s.status,
    subscribedAt: s.subscribedAt,
    contactId: s.contactId,
    productCategory: s.product.category,
  }));

  const currentYear = new Date().getFullYear();
  const years = yearsWithSubscriptions(records);
  const availableYears = years.includes(currentYear)
    ? years
    : [currentYear, ...years].sort((a, b) => b - a);
  const selectedYear =
    rawYear && availableYears.includes(Number(rawYear)) ? Number(rawYear) : (years[0] ?? currentYear);

  const yearRecords = records.filter((r) => r.subscribedAt.getFullYear() === selectedYear);
  const previousYearRecords = records.filter((r) => r.subscribedAt.getFullYear() === selectedYear - 1);

  const monthly = buildMonthlyProduction(yearRecords, monthsOfYear(selectedYear));
  const categoryTotals = categoryBreakdown(yearRecords);
  const categories = categoryTotals.map((c) => c.category);

  const yearTotalEncours = yearRecords.reduce((sum, r) => sum + r.encours, 0);
  const previousYearTotalEncours = previousYearRecords.reduce((sum, r) => sum + r.encours, 0);
  const evolution = evolutionPercent(yearTotalEncours, previousYearTotalEncours);

  const distinctClientsCount = new Set(yearRecords.map((r) => r.contactId)).size;
  const averageEncours = yearRecords.length > 0 ? yearTotalEncours / yearRecords.length : 0;

  const subscriptionsByMonth = new Map<string, typeof subscriptions>();
  for (const s of subscriptions) {
    if (s.subscribedAt.getFullYear() !== selectedYear) continue;
    const key = monthKey(s.subscribedAt);
    const bucket = subscriptionsByMonth.get(key);
    if (bucket) bucket.push(s);
    else subscriptionsByMonth.set(key, [s]);
  }

  const monthsDesc = monthly.slice().reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Suivi de production</h1>
          <p className="text-sm text-muted-foreground">
            Souscriptions réalisées, mois par mois, tous produits confondus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {availableYears.map((y) => (
              <Link
                key={y}
                href={`/production?year=${y}`}
                className={buttonVariants({ variant: y === selectedYear ? "default" : "outline", size: "sm" })}
              >
                {y}
              </Link>
            ))}
          </div>
          <a
            href={`/api/export/production?year=${selectedYear}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Exporter CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Production {selectedYear}</CardDescription>
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-2xl">{formatCurrency(yearTotalEncours)}</CardTitle>
              {evolution !== null && (
                <span
                  className={`text-xs font-medium ${
                    evolution >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {evolution >= 0 ? "↑" : "↓"} {Math.abs(evolution).toFixed(0)}%
                </span>
              )}
            </div>
            {evolution !== null && (
              <p className="text-xs text-muted-foreground">vs {selectedYear - 1}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Souscriptions</CardDescription>
            <CardTitle className="text-2xl">{yearRecords.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Clients équipés</CardDescription>
            <CardTitle className="text-2xl">{distinctClientsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Encours moyen</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(averageEncours)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {yearRecords.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune souscription enregistrée pour {selectedYear}.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la production</CardTitle>
              <CardDescription>Encours souscrit par mois, {selectedYear}.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionEvolutionChart monthly={monthly} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Production par type de produit</CardTitle>
                <CardDescription>Répartition mensuelle de l&apos;encours par catégorie.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionByCategoryChart monthly={monthly} categories={categories} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Répartition {selectedYear}</CardTitle>
                <CardDescription>Part de chaque type de produit dans la production.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionByCategoryDonut categoryTotals={categoryTotals} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détail mensuel</CardTitle>
              <CardDescription>
                Cliquez sur un mois pour voir les clients et produits souscrits.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {monthsDesc.map((m) => {
                  const monthSubscriptions = subscriptionsByMonth.get(m.month) ?? [];
                  return (
                    <details key={m.month} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="w-28 shrink-0 font-medium capitalize">{m.label}</span>
                          {m.count === 0 ? (
                            <span className="text-xs text-muted-foreground">Aucune souscription</span>
                          ) : (
                            <Badge variant="outline">
                              {m.count} souscription{m.count > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {m.cancelledCount > 0 && (
                            <Badge variant="destructive">
                              {m.cancelledCount} résiliée{m.cancelledCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {m.distinctClients} client{m.distinctClients > 1 ? "s" : ""}
                          </span>
                          <span className="w-28 shrink-0 text-right font-semibold">
                            {formatCurrency(m.totalEncours)}
                          </span>
                          <span className="text-muted-foreground transition-transform group-open:rotate-180">
                            ⌄
                          </span>
                        </div>
                      </summary>
                      {monthSubscriptions.length > 0 && (
                        <div className="border-t bg-muted/20 px-6 py-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Encours</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthSubscriptions.map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell>
                                    <Link href={`/contacts/${s.contactId}`} className="hover:underline">
                                      {s.contact.firstName} {s.contact.lastName}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{s.product.name}</TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center gap-1.5 text-xs">
                                      <span
                                        className="size-2 rounded-full"
                                        style={{ backgroundColor: categoryColor(s.product.category) }}
                                      />
                                      {categoryLabel(s.product.category)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(s.subscribedAt)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={s.status === "ANNULE" ? "destructive" : "outline"}>
                                      {s.status === "ANNULE" ? "Résiliée" : "Active"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(s.encours)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </details>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
