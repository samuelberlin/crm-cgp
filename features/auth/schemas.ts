import { z } from "zod";

export const registerSchema = z.object({
  cabinetName: z.string().trim().min(2, "Le nom du cabinet est trop court."),
  name: z.string().trim().min(2, "Le nom est trop court."),
  email: z.email("Email invalide."),
  password: z.string().min(8, "8 caractères minimum."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export type LoginInput = z.infer<typeof loginSchema>;
