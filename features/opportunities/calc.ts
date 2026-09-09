/** Valeur pondérée = montant × probabilité. */
export function weightedValue(amount: number | null | undefined, probability: number): number {
  if (!amount) return 0;
  return amount * (probability / 100);
}

export function pipelineTotals(
  opportunities: { amount: number | null; probability: number; stage: string }[],
) {
  const open = opportunities.filter((o) => o.stage !== "GAGNE" && o.stage !== "PERDU");
  const total = open.reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const weighted = open.reduce((sum, o) => sum + weightedValue(o.amount, o.probability), 0);
  return { total, weighted, count: open.length };
}
