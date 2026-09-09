import { createAuthClient } from "better-auth/react";

// No explicit baseURL: defaults to same-origin, which works in dev (any port)
// and in production behind a single domain.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
