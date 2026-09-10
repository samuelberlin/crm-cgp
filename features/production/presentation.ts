import { productCategoryLabels } from "@/features/products/schemas";

const CATEGORY_COLORS: Record<string, string> = {
  RETRAITE: "#6366f1",
  EPARGNE: "#10b981",
  PREVOYANCE: "#f59e0b",
  SANTE: "#06b6d4",
  DOMMAGES: "#a855f7",
};

const FALLBACK_COLOR = "#94a3b8";

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}

export function categoryLabel(category: string): string {
  return productCategoryLabels[category as keyof typeof productCategoryLabels] ?? category;
}
