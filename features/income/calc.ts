export function totalIncome(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
