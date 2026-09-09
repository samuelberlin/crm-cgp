import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";

export default async function DashboardPage() {
  const session = await requireUser();
  const contactCount = await prisma.contact.count({ where: contactWhere(session.user) });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bonjour {session.user.name.split(" ")[0]}</h1>
        <Link href="/contacts/new" className={buttonVariants({ size: "sm" })}>
          Nouveau contact
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Opportunités, tâches et agenda arrivent dans les prochaines étapes.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vos contacts</CardTitle>
          <CardDescription>
            {contactCount} contact{contactCount > 1 ? "s" : ""} visible{contactCount > 1 ? "s" : ""} avec votre rôle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/contacts" className="text-sm font-medium text-primary hover:underline">
            Voir tous les contacts →
          </Link>
        </CardContent>
      </Card>

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
