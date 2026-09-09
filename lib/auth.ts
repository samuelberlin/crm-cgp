import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Set to "CGP" at signup, then patched server-side to the real role/tenant
      // right after account creation (see features/auth/actions.ts). Never
      // trusted from client input (`input: false`).
      role: {
        type: "string",
        required: true,
        defaultValue: "CGP",
        input: false,
      },
      tenantId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // Must stay last: makes auth.api.* calls set session cookies automatically
  // when invoked from Next.js Server Actions.
  plugins: [nextCookies()],
});
