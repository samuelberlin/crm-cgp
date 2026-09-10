import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { contactStatusLabels } from "@/features/contacts/schemas";
import { opportunityWhere } from "@/features/opportunities/access";
import { opportunityStageLabels } from "@/features/opportunities/schemas";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireUser();
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim() ?? "";

  const [contacts, opportunities] =
    query.length === 0
      ? [[], []]
      : await Promise.all([
          prisma.contact.findMany({
            where: {
              ...contactWhere(session.user),
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
              ],
            },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            take: 20,
          }),
          prisma.opportunity.findMany({
            where: {
              ...opportunityWhere(session.user),
              title: { contains: query, mode: "insensitive" },
            },
            include: { contact: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          }),
        ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Recherche</h1>
        {query && <p className="mt-1 text-sm text-muted-foreground">Résultats pour « {query} »</p>}
      </div>

      {query.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tapez un nom, une société ou un titre d&apos;opportunité dans la barre de recherche.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Contacts ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun contact trouvé.</p>
              ) : (
                <ul className="divide-y">
                  {contacts.map((contact) => (
                    <li key={contact.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <div>
                        <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                          {contact.firstName} {contact.lastName}
                        </Link>
                        {contact.company && (
                          <p className="text-xs text-muted-foreground">{contact.company}</p>
                        )}
                      </div>
                      <Badge variant="outline">{contactStatusLabels[contact.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunités ({opportunities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune opportunité trouvée.</p>
              ) : (
                <ul className="divide-y">
                  {opportunities.map((opportunity) => (
                    <li key={opportunity.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <div>
                        <Link
                          href={`/opportunities/${opportunity.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {opportunity.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {opportunity.contact.firstName} {opportunity.contact.lastName}
                        </p>
                      </div>
                      <Badge variant="outline">{opportunityStageLabels[opportunity.stage]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
