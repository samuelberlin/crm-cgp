export type ProductionSubscription = {
  encours: number;
  status: string;
  subscribedAt: Date;
  contactId: string;
  productCategory: string;
};

export type CategoryTotal = {
  category: string;
  count: number;
  totalEncours: number;
};

export type MonthlyProduction = {
  month: string; // "2026-01"
  label: string; // "Janv. 2026"
  count: number;
  cancelledCount: number;
  totalEncours: number;
  distinctClients: number;
  byCategory: CategoryTotal[];
};

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" });

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return MONTH_LABEL_FORMATTER.format(new Date(year, month - 1, 1));
}

/** Les 12 clés de mois (ordre chronologique) d'une année civile donnée. */
export function monthsOfYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

/** Années couvertes par au moins une souscription, les plus récentes en premier. */
export function yearsWithSubscriptions(subscriptions: { subscribedAt: Date }[]): number[] {
  const years = new Set(subscriptions.map((s) => s.subscribedAt.getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Regroupe les souscriptions par mois (production brute : toutes statuts confondus, une
 * résiliation ne doit pas effacer rétroactivement une vente réalisée). `months` fixe la liste
 * et l'ordre des mois à produire, pour que les mois sans vente apparaissent à 0 sur le graphique.
 */
export function buildMonthlyProduction(
  subscriptions: ProductionSubscription[],
  months: string[],
): MonthlyProduction[] {
  const byMonth = new Map<string, ProductionSubscription[]>();
  for (const sub of subscriptions) {
    const key = monthKey(sub.subscribedAt);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(sub);
    else byMonth.set(key, [sub]);
  }

  return months.map((month) => {
    const subs = byMonth.get(month) ?? [];
    return {
      month,
      label: monthLabel(month),
      count: subs.length,
      cancelledCount: subs.filter((s) => s.status === "ANNULE").length,
      totalEncours: subs.reduce((sum, s) => sum + s.encours, 0),
      distinctClients: new Set(subs.map((s) => s.contactId)).size,
      byCategory: categoryBreakdown(subs),
    };
  });
}

/** Répartition par type de produit, triée par encours décroissant. */
export function categoryBreakdown(subscriptions: ProductionSubscription[]): CategoryTotal[] {
  const byCategory = new Map<string, CategoryTotal>();
  for (const sub of subscriptions) {
    const existing = byCategory.get(sub.productCategory);
    if (existing) {
      existing.count += 1;
      existing.totalEncours += sub.encours;
    } else {
      byCategory.set(sub.productCategory, { category: sub.productCategory, count: 1, totalEncours: sub.encours });
    }
  }
  return Array.from(byCategory.values()).sort((a, b) => b.totalEncours - a.totalEncours);
}

/** Variation en % entre deux totaux (null si la base de comparaison est nulle : pas de sens). */
export function evolutionPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
