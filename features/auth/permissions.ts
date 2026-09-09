import type { Role } from "@/lib/generated/prisma/enums";

export type SessionUser = { role: string };

export function hasRole(session: { user: SessionUser }, allowed: Role[]): boolean {
  return allowed.includes(session.user.role as Role);
}

export function canAssignAdvisor(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export type ScopedUser = {
  id: string;
  role: string;
  tenantId?: string | null;
};

/**
 * Generic tenant + advisor-ownership scope, reused by every model that has
 * a tenantId and an advisorId (contacts, opportunities, ...): ADMIN and
 * MANAGER see the whole cabinet, a CGP only sees what is assigned to them.
 * There is no "team" grouping yet, so MANAGER is treated like ADMIN for now.
 */
export function advisorScopedWhere(user: ScopedUser) {
  if (!user.tenantId) {
    // Defensive: a user without a tenant should never see any record.
    return { id: "__none__" };
  }
  if (user.role === "CGP") {
    return { tenantId: user.tenantId, advisorId: user.id };
  }
  return { tenantId: user.tenantId };
}
