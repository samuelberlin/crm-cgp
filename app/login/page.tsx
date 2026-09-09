import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/features/auth/session";
import { LoginForm } from "@/features/auth/LoginForm";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CRM CGP</CardTitle>
          <CardDescription>Connectez-vous à votre cabinet.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
