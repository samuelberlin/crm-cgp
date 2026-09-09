import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";

export default async function DashboardPage() {
  const session = await requireUser();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Bonjour {session.user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Étape 2 : authentification et cabinets en place. Les contacts, opportunités, tâches et
        l&apos;agenda arrivent dans les prochaines étapes.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Votre compte</CardTitle>
          <CardDescription>Informations de session, vérifiées côté serveur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email :</span> {session.user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Rôle :</span> {session.user.role}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
