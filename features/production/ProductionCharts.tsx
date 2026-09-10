"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { categoryColor, categoryLabel } from "./presentation";
import type { CategoryTotal, MonthlyProduction } from "./calc";

const AXIS_STYLE = { fontSize: 12, fill: "var(--muted-foreground)" };
const CURRENCY_TICK = (value: number) =>
  value >= 1000 ? `${Math.round(value / 1000)} k€` : formatCurrency(value);

// recharts type ses props `formatter` avec des génériques internes non exportés ; des
// paramètres `unknown` restent assignables (contravariance) sans les dupliquer ici.
type TooltipFormatter = (value: unknown, name: unknown) => [string, string];

export function ProductionEvolutionChart({ monthly }: { monthly: MonthlyProduction[] }) {
  const data = monthly.map((m) => ({ label: m.label, production: m.totalEncours }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="productionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={CURRENCY_TICK} width={64} />
        <Tooltip
          formatter={((value) => [formatCurrency(Number(value)), "Production"]) as TooltipFormatter}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="production"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#productionFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProductionByCategoryChart({
  monthly,
  categories,
}: {
  monthly: MonthlyProduction[];
  categories: string[];
}) {
  const data = monthly.map((m) => {
    const row: Record<string, string | number> = { label: m.label };
    for (const category of categories) {
      row[category] = m.byCategory.find((c) => c.category === category)?.totalEncours ?? 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={CURRENCY_TICK} width={64} />
        <Tooltip
          formatter={
            ((value, name) => [formatCurrency(Number(value)), categoryLabel(String(name))]) as TooltipFormatter
          }
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value: string) => categoryLabel(value)}
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
        />
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            stackId="production"
            fill={categoryColor(category)}
            radius={i === categories.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProductionByCategoryDonut({ categoryTotals }: { categoryTotals: CategoryTotal[] }) {
  const data = categoryTotals.map((c) => ({ name: c.category, value: c.totalEncours }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={64}
          outerRadius={100}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={categoryColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          formatter={
            ((value, name) => {
              const numeric = Number(value);
              const share = total > 0 ? Math.round((numeric / total) * 100) : 0;
              return [`${formatCurrency(numeric)} (${share}%)`, categoryLabel(String(name))];
            }) as TooltipFormatter
          }
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value: string) => categoryLabel(value)}
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

