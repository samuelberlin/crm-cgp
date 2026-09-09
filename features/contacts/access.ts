export type ContactScopeUser = {
  id: string;
  role: string;
  tenantId?: string | null;
};

/**
 * Server-side query scope for contacts: ADMIN and MANAGER see every contact
 * in the cabinet, a CGP only sees the contacts assigned to them. There is no
 * "team" grouping yet, so MANAGER is treated like ADMIN for now.
 */
export function contactWhere(user: ContactScopeUser) {
  if (!user.tenantId) {
    // Defensive: a user without a tenant should never see any contact.
    return { id: "__none__" };
  }
  if (user.role === "CGP") {
    return { tenantId: user.tenantId, advisorId: user.id };
  }
  return { tenantId: user.tenantId };
}

export function canAssignAdvisor(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
