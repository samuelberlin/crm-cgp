import { advisorScopedWhere, canAssignAdvisor, type ScopedUser } from "@/features/auth/permissions";

export type OpportunityScopeUser = ScopedUser;

/**
 * Server-side query scope for opportunities: ADMIN and MANAGER see every
 * opportunity in the cabinet, a CGP only sees the ones assigned to them.
 */
export function opportunityWhere(user: OpportunityScopeUser) {
  return advisorScopedWhere(user);
}

export { canAssignAdvisor };
