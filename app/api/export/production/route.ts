import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { subscriptionWhere } from "@/features/subscriptions/access";
import { yearsWithSubscriptions } from "@/features/production/calc";
import { categoryLabel } from "@/features/production/presentation";
import { CSV_BOM, toCsv } from "@/features/export/csv";

export async function GET(request: NextRequest) {
  const session = await requireUser();

  const subscriptions = await prisma.subscription.findMany({
    where: subscriptionWhere(session.user),
    include: { product: true, contact: true },
    orderBy: { subscribedAt: "asc" },
  });

  const currentYear = new Date().getFullYear();
  const years = yearsWithSubscriptions(subscriptions);
  const requestedYear = request.nextUrl.searchParams.get("year");
  const selectedYear =
    requestedYear && years.includes(Number(requestedYear)) ? Number(requestedYear) : (years[0] ?? currentYear);

  const yearSubscriptions = subscriptions.filter((s) => s.subscribedAt.getFullYear() === selectedYear);

  const rows = [
    ["Date", "Client", "Produit", "Catégorie", "Statut", "Encours"],
    ...yearSubscriptions.map((s) => [
      formatDate(s.subscribedAt),
      `${s.contact.firstName} ${s.contact.lastName}`,
      s.product.name,
      categoryLabel(s.product.category),
      s.status === "ANNULE" ? "Résiliée" : "Active",
      String(s.encours),
    ]),
  ];

  return new NextResponse(CSV_BOM + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="production-${selectedYear}.csv"`,
    },
  });
}
