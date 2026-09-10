import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { contactStatusLabels } from "@/features/contacts/schemas";
import { formatDate } from "@/lib/format";
import { isInactive } from "@/features/automations/inactivity";

export default async function ContactsPage() {
  const session = await requireUser();

  const [contacts, tenant] = await Promise.all([
    prisma.contact.findMany({
      where: contactWhere(session.user),
      include: { advisor: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    session.user.tenantId
      ? prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
      : Promise.resolve(null),
  ]);
  const inactivityThreshold = tenant?.inactivityAlertDays ?? 30;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/contacts/new" className={buttonVariants()}>
          Nouveau contact
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Conseiller</TableHead>
              <TableHead>Prochaine action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                    {contact.firstName} {contact.lastName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Badge variant="outline">{contactStatusLabels[contact.status]}</Badge>
                    {isInactive(contact, inactivityThreshold) && (
                      <Badge variant="destructive">Inactif</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{contact.company ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.phone ?? contact.email ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{contact.advisor?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.nextAction ? `${contact.nextAction} (${formatDate(contact.nextContactAt)})` : "—"}
                </TableCell>
              </TableRow>
            ))}
            {contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Aucun contact pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
