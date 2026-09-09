import type { ScopedUser } from "@/features/auth/permissions";

export type SubscriptionScopeUser = ScopedUser;

/**
 * A subscription has no advisorId of its own — access follows the advisor
 * assigned to the underlying contact, same rule as everywhere else:
 * ADMIN/MANAGER see the whole cabinet, a CGP only their own contacts'.
 */
export function subscriptionWhere(user: SubscriptionScopeUser) {
  if (!user.tenantId) {
    return { id: "__none__" };
  }
  if (user.role === "CGP") {
    return { tenantId: user.tenantId, contact: { advisorId: user.id } };
  }
  return { tenantId: user.tenantId };
}
