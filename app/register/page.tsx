import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/features/auth/session";
import { RegisterForm } from "@/features/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer votre cabinet</CardTitle>
          <CardDescription>Un compte, un cabinet. Vous en serez l&apos;administrateur.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
