import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { canAssignAdvisor, contactWhere } from "@/features/contacts/access";
import { EditContactForm } from "@/features/contacts/EditContactForm";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, ...contactWhere(session.user) },
  });
  if (!contact) notFound();

  const advisors =
    canAssignAdvisor(session.user.role as string) && session.user.tenantId
      ? await prisma.user.findMany({
          where: { tenantId: session.user.tenantId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-semibold">
        Modifier {contact.firstName} {contact.lastName}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <EditContactForm contact={contact} advisors={advisors} />
        </CardContent>
      </Card>
    </div>
  );
}
