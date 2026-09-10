import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { contactStatusLabels } from "@/features/contacts/schemas";
import { CSV_BOM, toCsv } from "@/features/export/csv";

export async function GET() {
  const session = await requireUser();

  const contacts = await prisma.contact.findMany({
    where: contactWhere(session.user),
    include: { advisor: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows = [
    ["Prénom", "Nom", "Statut", "Société", "Email", "Téléphone", "Conseiller", "Prochaine action", "Date"],
    ...contacts.map((contact) => [
      contact.firstName,
      contact.lastName,
      contactStatusLabels[contact.status],
      contact.company ?? "",
      contact.email ?? "",
      contact.phone ?? "",
      contact.advisor?.name ?? "",
      contact.nextAction ?? "",
      contact.nextContactAt ? formatDate(contact.nextContactAt) : "",
    ]),
  ];

  return new NextResponse(CSV_BOM + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}
