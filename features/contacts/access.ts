import { advisorScopedWhere, canAssignAdvisor, type ScopedUser } from "@/features/auth/permissions";

export type ContactScopeUser = ScopedUser;

/**
 * Server-side query scope for contacts: ADMIN and MANAGER see every contact
 * in the cabinet, a CGP only sees the contacts assigned to them.
 */
export function contactWhere(user: ContactScopeUser) {
  return advisorScopedWhere(user);
}

export { canAssignAdvisor };
