import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  const tenant = session.user.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.user.tenantId } })
    : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={session.user.name}
        role={session.user.role as string}
        tenantName={tenant?.name ?? "Cabinet"}
      />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
