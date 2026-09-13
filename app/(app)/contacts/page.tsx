import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { contactStatusLabels } from "@/features/contacts/schemas";
import { contactViewLabels, contactViewValues, contactViewWhere, type ContactView } from "@/features/contacts/views";
import { subscriptionWhere } from "@/features/subscriptions/access";
import { formatDate } from "@/lib/format";
import { isInactive } from "@/features/automations/inactivity";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; profession?: string; product?: string }>;
}) {
  const session = await requireUser();
  const { view: rawView, profession: rawProfession, product: rawProduct } = await searchParams;
  const view: ContactView = (contactViewValues as readonly string[]).includes(rawView ?? "")
    ? (rawView as ContactView)
    : "tous";
  const profession = rawProfession ?? "";
  const productId = rawProduct ?? "";

  const [contacts, tenant, professions, heldProducts] = await Promise.all([
    prisma.contact.findMany({
      where: { ...contactWhere(session.user), ...contactViewWhere(view, { profession, productId }) },
      include: { advisor: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    session.user.tenantId
      ? prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
      : Promise.resolve(null),
    view === "csp"
      ? prisma.contact.findMany({
          where: { ...contactWhere(session.user), profession: { not: null } },
          select: { profession: true },
          distinct: ["profession"],
          orderBy: { profession: "asc" },
        })
      : Promise.resolve([]),
    view === "produit"
      ? prisma.subscription.findMany({
          where: { ...subscriptionWhere(session.user), status: "ACTIVE" },
          select: { product: { select: { id: true, name: true } } },
          distinct: ["productId"],
          orderBy: { product: { name: "asc" } },
        })
      : Promise.resolve([]),
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
        <div className="flex gap-2">
          <a href="/api/export/contacts" className={buttonVariants({ variant: "outline" })}>
            Exporter CSV
          </a>
          <Link href="/contacts/new" className={buttonVariants()}>
            Nouveau contact
          </Link>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-1 border-b pb-3">
        {contactViewValues.map((value) => (
          <Link
            key={value}
            href={`/contacts?view=${value}`}
            className={buttonVariants({ variant: value === view ? "default" : "outline", size: "sm" })}
          >
            {contactViewLabels[value]}
          </Link>
        ))}
      </div>

      {view === "csp" && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {professions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune profession renseignée pour le moment.</p>
          ) : (
            professions.map(
              (p) =>
                p.profession && (
                  <Link
                    key={p.profession}
                    href={`/contacts?view=csp&profession=${encodeURIComponent(p.profession)}`}
                    className={buttonVariants({
                      variant: p.profession === profession ? "default" : "outline",
                      size: "sm",
                    })}
                  >
                    {p.profession}
                  </Link>
                ),
            )
          )}
        </div>
      )}

      {view === "produit" && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {heldProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun produit souscrit pour le moment.</p>
          ) : (
            heldProducts.map(({ product }) => (
              <Link
                key={product.id}
                href={`/contacts?view=produit&product=${product.id}`}
                className={buttonVariants({ variant: product.id === productId ? "default" : "outline", size: "sm" })}
              >
                {product.name}
              </Link>
            ))
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
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
