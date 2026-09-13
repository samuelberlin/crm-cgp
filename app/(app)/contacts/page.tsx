import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { contactStatusLabels, cspCategoryLabels, cspCategoryValues } from "@/features/contacts/schemas";
import { contactViewLabels, contactViewValues, contactViewWhere, type ContactView } from "@/features/contacts/views";
import { subscriptionWhere } from "@/features/subscriptions/access";
import { formatDate } from "@/lib/format";
import { isInactive } from "@/features/automations/inactivity";
import type { CspCategory } from "@/lib/generated/prisma/enums";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; csp?: string; product?: string }>;
}) {
  const session = await requireUser();
  const { view: rawView, csp: rawCsp, product: rawProduct } = await searchParams;
  const view: ContactView = (contactViewValues as readonly string[]).includes(rawView ?? "")
    ? (rawView as ContactView)
    : "tous";
  const cspCategory = (cspCategoryValues as readonly string[]).includes(rawCsp ?? "")
    ? (rawCsp as CspCategory)
    : undefined;
  const productId = rawProduct ?? "";

  const [contacts, tenant, presentCspCategories, heldProducts] = await Promise.all([
    prisma.contact.findMany({
      where: { ...contactWhere(session.user), ...contactViewWhere(view, { cspCategory, productId }) },
      include: { advisor: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    session.user.tenantId
      ? prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
      : Promise.resolve(null),
    view === "csp"
      ? prisma.contact.findMany({
          where: { ...contactWhere(session.user), cspCategory: { not: null } },
          select: { cspCategory: true },
          distinct: ["cspCategory"],
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

  // Ordre métier fixe (TNS/libéral/dirigeant en tête) plutôt qu'alphabétique.
  const presentCspSet = new Set(presentCspCategories.map((c) => c.cspCategory));
  const cspCategoriesToShow = cspCategoryValues.filter((value) => presentCspSet.has(value));

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
          {cspCategoriesToShow.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune CSP renseignée pour le moment.</p>
          ) : (
            cspCategoriesToShow.map((value) => (
              <Link
                key={value}
                href={`/contacts?view=csp&csp=${value}`}
                className={buttonVariants({ variant: value === cspCategory ? "default" : "outline", size: "sm" })}
              >
                {cspCategoryLabels[value]}
              </Link>
            ))
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
