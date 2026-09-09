import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CRM CGP</CardTitle>
          <CardDescription>
            Étape 1 : projet configuré (Next.js, Tailwind, shadcn/ui, Prisma, Zod, tests).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Prêt pour l&apos;étape 2</Button>
        </CardContent>
      </Card>
    </div>
  );
}
