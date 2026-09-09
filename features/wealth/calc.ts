export function wealthTotals(items: { kind: string; amount: number }[]) {
  const gross = items.filter((i) => i.kind === "ACTIF").reduce((sum, i) => sum + i.amount, 0);
  const liabilities = items.filter((i) => i.kind === "PASSIF").reduce((sum, i) => sum + i.amount, 0);
  return { gross, liabilities, net: gross - liabilities };
}
