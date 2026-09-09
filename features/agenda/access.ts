import { advisorScopedWhere, type ScopedUser } from "@/features/auth/permissions";

export type MeetingScopeUser = ScopedUser;

/**
 * Server-side query scope for meetings: ADMIN and MANAGER see every meeting
 * in the cabinet, a CGP only sees the meetings assigned to them.
 */
export function meetingWhere(user: MeetingScopeUser) {
  return advisorScopedWhere(user);
}
