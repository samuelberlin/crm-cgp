import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getCurrentSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Redirects to /login if there is no authenticated user. Always verified server-side. */
export async function requireUser(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}

export { hasRole } from "./permissions";
