"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  LineChart,
  Calendar,
  CheckSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/features/auth/SignOutButton";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CGP: "CGP",
};

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/opportunities", label: "Opportunités", icon: Target },
  { href: "/production", label: "Suivi de production", icon: LineChart },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/tasks", label: "Tâches", icon: CheckSquare },
  { href: "/settings", label: "Paramètres", icon: Settings, adminOnly: true },
];

export function Sidebar({
  userName,
  role,
  tenantName,
}: {
  userName: string;
  role: string;
  tenantName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
          C
        </div>
        <div className="min-w-0">
          <p className="font-heading text-base font-semibold tracking-tight">CRM CGP</p>
          <p className="truncate text-xs text-muted-foreground">{tenantName}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN").map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-sidebar-border px-5 py-4">
        <div>
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role] ?? role}</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
