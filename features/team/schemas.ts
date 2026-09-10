import { z } from "zod";

export const teamRoleValues = ["ADMIN", "MANAGER", "CGP"] as const;

export const teamRoleLabels: Record<(typeof teamRoleValues)[number], string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CGP: "CGP",
};

export const inviteTeamMemberSchema = z.object({
  name: z.string().trim().min(2, "Le nom est trop court."),
  email: z.email("Email invalide."),
  role: z.enum(teamRoleValues),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
