import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { contactStatusLabels, maritalStatusLabels } from "@/features/contacts/schemas";
import { pipelineTotals, weightedValue } from "@/features/opportunities/calc";
import { opportunityStageLabels } from "@/features/opportunities/schemas";
import { taskPriorityLabels } from "@/features/tasks/schemas";
import { StatusSelect as TaskStatusSelect } from "@/features/tasks/StatusSelect";
import { StatusSelect as MeetingStatusSelect } from "@/features/agenda/StatusSelect";
import { NoteQuickForm } from "@/features/notes/NoteQuickForm";
import { wealthTotals } from "@/features/wealth/calc";
import { assetCategoryValues, liabilityCategoryValues, wealthCategoryLabels } from "@/features/wealth/schemas";
import { createAsset, createLiability } from "@/features/wealth/actions";
import { AddWealthItemForm } from "@/features/wealth/AddWealthItemForm";
import { DeleteWealthItemButton } from "@/features/wealth/DeleteWealthItemButton";
import { documentCategoryLabels } from "@/features/documents/schemas";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import { DeleteDocumentButton } from "@/features/documents/DeleteDocumentButton";
import {
  generateContactSummary,
  generateFollowUpDraft,
  generateOpportunitySuggestions,
} from "@/features/ai/actions";
import { AiActionButton } from "@/features/ai/AiActionButton";
import { multiEquipementCount, totalEncours } from "@/features/subscriptions/calc";
import { AddSubscriptionForm } from "@/features/subscriptions/AddSubscriptionForm";
import { CancelSubscriptionButton } from "@/features/subscriptions/CancelSubscriptionButton";
import { productCategoryLabels } from "@/features/products/schemas";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const [contact, availableProducts] = await Promise.all([
    prisma.contact.findFirst({
      where: { id, ...contactWhere(session.user) },
      include: {
        advisor: true,
        activities: { orderBy: { createdAt: "desc" }, include: { user: true } },
        opportunities: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueDate: "asc" } },
        meetings: { orderBy: { date: "desc" } },
        contactNotes: { orderBy: { createdAt: "desc" }, include: { user: true } },
        wealthItems: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        subscriptions: { orderBy: { subscribedAt: "desc" }, include: { product: true } },
      },
    }),
    session.user.tenantId
      ? prisma.product.findMany({
          where: { tenantId: session.user.tenantId, active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  if (!contact) notFound();

  const commercialTotals = pipelineTotals(contact.opportunities);
  const patrimonyTotals = wealthTotals(contact.wealthItems);
  const assets = contact.wealthItems.filter((item) => item.kind === "ACTIF");
  const liabilities = contact.wealthItems.filter((item) => item.kind === "PASSIF");
  const equipementCount = multiEquipementCount(contact.subscriptions);
  const encoursTotal = totalEncours(contact.subscriptions);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">
              {contact.firstName} {contact.lastName}
            </h1>
            <Badge variant="outline">{contactStatusLabels[contact.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Conseiller : {contact.advisor?.name ?? "Non assigné"}
          </p>
        </div>
        <div className="flex gap-2">
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Appeler
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Email
            </a>
          )}
          <Link
            href={`/opportunities/new?contactId=${contact.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Créer opportunité
          </Link>
          <Link
            href={`/tasks/new?contactId=${contact.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ajouter une tâche
          </Link>
          <Link
            href={`/agenda/new?contactId=${contact.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Planifier rendez-vous
          </Link>
          <Link href={`/contacts/${contact.id}/edit`} className={buttonVariants({ size: "sm" })}>
            Modifier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Relation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Dernier contact" value={formatDate(contact.lastContactAt)} />
            <Row
              label="Prochaine action"
              value={contact.nextAction ?? "—"}
              sub={contact.nextContactAt ? formatDate(contact.nextContactAt) : undefined}
            />
            <Row label="Interactions" value={String(contact.activities.length)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Potentiel estimé" value={formatCurrency(contact.potential)} />
            <Row label="Source" value={contact.source ?? "—"} />
            <Row label="Opportunités ouvertes" value={String(commercialTotals.count)} />
            <Row label="Valeur du pipeline" value={formatCurrency(commercialTotals.total)} />
            <Row label="Valeur pondérée" value={formatCurrency(commercialTotals.weighted)} />
            {contact.opportunities.length > 0 && (
              <ul className="space-y-1.5 border-t pt-2">
                {contact.opportunities.map((opportunity) => (
                  <li key={opportunity.id} className="flex items-center justify-between gap-2">
                    <Link href={`/opportunities/${opportunity.id}/edit`} className="hover:underline">
                      {opportunity.title}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {opportunityStageLabels[opportunity.stage]} ·{" "}
                      {formatCurrency(weightedValue(opportunity.amount, opportunity.probability))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            <Row label="Société" value={contact.company ?? "—"} />
            <Row label="Profession" value={contact.profession ?? "—"} />
            <Row
              label="Adresse"
              value={[contact.address, contact.postalCode, contact.city].filter(Boolean).join(" ") || "—"}
            />
            <Row label="Date de naissance" value={formatDate(contact.birthDate)} />
            <Row
              label="Situation familiale"
              value={
                contact.maritalStatus && contact.maritalStatus in maritalStatusLabels
                  ? maritalStatusLabels[contact.maritalStatus as keyof typeof maritalStatusLabels]
                  : "—"
              }
            />
            <Row label="Email" value={contact.email ?? "—"} />
            <Row label="Téléphone" value={contact.phone ?? "—"} />
            {contact.notes && (
              <div className="col-span-full pt-2">
                <p className="text-muted-foreground">Notes générales</p>
                <p className="mt-1 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tâches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {contact.tasks.length === 0 ? (
              <p className="text-muted-foreground">Aucune tâche.</p>
            ) : (
              <ul className="space-y-2">
                {contact.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-2">
                    <div>
                      <Link href={`/tasks/${task.id}/edit`} className="hover:underline">
                        {task.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {taskPriorityLabels[task.priority]} · {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <TaskStatusSelect taskId={task.id} status={task.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {contact.meetings.length === 0 ? (
              <p className="text-muted-foreground">Aucun rendez-vous.</p>
            ) : (
              <ul className="space-y-2">
                {contact.meetings.map((meeting) => (
                  <li key={meeting.id} className="flex items-center justify-between gap-2">
                    <div>
                      <Link href={`/agenda/${meeting.id}/edit`} className="hover:underline">
                        {formatDateTime(meeting.date)}
                      </Link>
                      {meeting.location && (
                        <p className="text-xs text-muted-foreground">{meeting.location}</p>
                      )}
                    </div>
                    <MeetingStatusSelect meetingId={meeting.id} status={meeting.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NoteQuickForm contactId={contact.id} />
            {contact.contactNotes.length > 0 && (
              <ul className="space-y-3 border-t pt-3 text-sm">
                {contact.contactNotes.map((note) => (
                  <li key={note.id}>
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {note.user?.name ?? "—"} · {formatDateTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Patrimoine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Row label="Patrimoine brut" value={formatCurrency(patrimonyTotals.gross)} />
              <Row label="Passif" value={formatCurrency(patrimonyTotals.liabilities)} />
              <Row label="Patrimoine net" value={formatCurrency(patrimonyTotals.net)} />
            </div>

            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-medium">Actifs</p>
              {assets.length > 0 && (
                <ul className="mb-3 space-y-1.5 text-sm">
                  {assets.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span>
                        {wealthCategoryLabels[item.category]}
                        {item.label ? ` — ${item.label}` : ""}
                        {item.subscriptionId && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(produit souscrit)</span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {formatCurrency(item.amount)}
                        {!item.subscriptionId && <DeleteWealthItemButton itemId={item.id} />}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <AddWealthItemForm
                contactId={contact.id}
                categories={assetCategoryValues}
                action={createAsset}
                submitLabel="Ajouter un actif"
              />
            </div>

            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-medium">Passif</p>
              {liabilities.length > 0 && (
                <ul className="mb-3 space-y-1.5 text-sm">
                  {liabilities.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span>
                        {wealthCategoryLabels[item.category]}
                        {item.label ? ` — ${item.label}` : ""}
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {formatCurrency(item.amount)}
                        <DeleteWealthItemButton itemId={item.id} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <AddWealthItemForm
                contactId={contact.id}
                categories={liabilityCategoryValues}
                action={createLiability}
                submitLabel="Ajouter un passif"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Produits souscrits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Row label="Multi-équipement" value={`${equipementCount} produit${equipementCount > 1 ? "s" : ""}`} />
              <Row label="Encours total" value={formatCurrency(encoursTotal)} />
            </div>

            {contact.subscriptions.length > 0 && (
              <ul className="space-y-2 border-t pt-3 text-sm">
                {contact.subscriptions.map((subscription) => (
                  <li key={subscription.id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subscription.product.name}</span>
                        <Badge variant="outline">{productCategoryLabels[subscription.product.category]}</Badge>
                        {subscription.status === "ANNULE" && <Badge variant="destructive">Résiliée</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Souscrit le {formatDate(subscription.subscribedAt)}
                        {subscription.note ? ` · ${subscription.note}` : ""}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-3">
                      {formatCurrency(subscription.encours)}
                      {subscription.status === "ACTIVE" && (
                        <CancelSubscriptionButton subscriptionId={subscription.id} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <AddSubscriptionForm contactId={contact.id} products={availableProducts} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadDocumentForm contactId={contact.id} />
            {contact.documents.length > 0 && (
              <ul className="space-y-2 border-t pt-3 text-sm">
                {contact.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {documentCategoryLabels[doc.category]} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-3 text-xs">
                      <a
                        href={`/api/documents/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Aperçu
                      </a>
                      <a href={`/api/documents/${doc.id}?download=1`} className="text-primary hover:underline">
                        Télécharger
                      </a>
                      <DeleteDocumentButton documentId={doc.id} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assistant IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AiActionButton
              label="Résumer ce client"
              pendingLabel="Génération…"
              action={generateContactSummary.bind(null, contact.id)}
            />
            <AiActionButton
              label="Rédiger une relance"
              pendingLabel="Rédaction…"
              action={generateFollowUpDraft.bind(null, contact.id)}
            />
            <AiActionButton
              label="Suggérer des opportunités"
              pendingLabel="Analyse…"
              action={generateOpportunitySuggestions.bind(null, contact.id)}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {contact.activities.map((activity) => (
                  <li key={activity.id} className="flex items-start justify-between text-sm">
                    <div>
                      <p className="font-medium">{activity.label}</p>
                      {activity.user && (
                        <p className="text-xs text-muted-foreground">par {activity.user.name}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">
        {value}
        {sub && <span className="ml-1 font-normal text-muted-foreground">({sub})</span>}
      </span>
    </div>
  );
}
