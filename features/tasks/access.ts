import { advisorScopedWhere, type ScopedUser } from "@/features/auth/permissions";

export type TaskScopeUser = ScopedUser;

/**
 * Server-side query scope for tasks: ADMIN and MANAGER see every task in
 * the cabinet, a CGP only sees the tasks assigned to them.
 */
export function taskWhere(user: TaskScopeUser) {
  return advisorScopedWhere(user);
}
