import Link from "next/link";
import { SignOutButton } from "@/features/auth/SignOutButton";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CGP: "CGP",
};

export function Sidebar({
  userName,
  role,
  tenantName,
}: {
  userName: string;
  role: string;
  tenantName: string;
}) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      <div className="px-5 py-6">
        <p className="text-lg font-semibold">CRM CGP</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{tenantName}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
        >
          Dashboard
        </Link>
        <Link
          href="/contacts"
          className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
        >
          Contacts
        </Link>
        {role === "ADMIN" && (
          <Link
            href="/settings"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Paramètres
          </Link>
        )}
      </nav>
      <div className="space-y-3 border-t px-5 py-4">
        <div>
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role] ?? role}</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
