import type { Role } from "@/lib/generated/prisma/enums";

export type SessionUser = { role: string };

export function hasRole(session: { user: SessionUser }, allowed: Role[]): boolean {
  return allowed.includes(session.user.role as Role);
}
