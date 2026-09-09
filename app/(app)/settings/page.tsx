import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { AutomationSettingsForm } from "@/features/automations/AutomationSettingsForm";

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

  const tenant = session.user.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        include: { users: { orderBy: { createdAt: "asc" } } },
      })
    : null;

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
    </div>
  );
}
