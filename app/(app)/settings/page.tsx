import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { AutomationSettingsForm } from "@/features/automations/AutomationSettingsForm";
import { AddProductForm } from "@/features/products/AddProductForm";
import { ToggleProductActiveButton } from "@/features/products/ToggleProductActiveButton";
import { productCategoryLabels } from "@/features/products/schemas";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CGP: "CGP",
};

export default async function SettingsPage() {
  const session = await requireUser();

  if (!hasRole(session, ["ADMIN"])) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
          <CardDescription>
            Cette page est réservée aux administrateurs du cabinet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [tenant, products] = await Promise.all([
    session.user.tenantId
      ? prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          include: { users: { orderBy: { createdAt: "asc" } } },
        })
      : Promise.resolve(null),
    session.user.tenantId
      ? prisma.product.findMany({ where: { tenantId: session.user.tenantId }, orderBy: { createdAt: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cabinet et utilisateurs.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tenant?.name ?? "Cabinet"}</CardTitle>
          <CardDescription>
            {tenant?.users.length ?? 0} utilisateur{(tenant?.users.length ?? 0) > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {tenant?.users.map((user) => (
              <li key={user.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{roleLabels[user.role] ?? user.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Automatisations</CardTitle>
          <CardDescription>
            Délais avant qu&apos;une tâche automatique ou une alerte ne soit créée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutomationSettingsForm
            values={{
              firstContactDelayDays: tenant?.firstContactDelayDays ?? 1,
              meetingReportDelayDays: tenant?.meetingReportDelayDays ?? 1,
              proposalFollowUpDelayDays: tenant?.proposalFollowUpDelayDays ?? 3,
              inactivityAlertDays: tenant?.inactivityAlertDays ?? 30,
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Catalogue produits</CardTitle>
          <CardDescription>
            Produits commercialisés par le cabinet, utilisés pour suivre les souscriptions clients et le
            multi-équipement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun produit pour le moment.</p>
          ) : (
            <ul className="divide-y">
              {products.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="outline">{productCategoryLabels[product.category]}</Badge>
                      {!product.active && <Badge variant="destructive">Inactif</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.provider ?? "—"}
                      {product.description ? ` · ${product.description}` : ""}
                    </p>
                  </div>
                  <ToggleProductActiveButton productId={product.id} active={product.active} />
                </li>
              ))}
            </ul>
          )}
          <AddProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
