"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { loginSchema } from "./schemas";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);

    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
      return;
    }

    startTransition(async () => {
      const { error: signInError } = await signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (signInError) {
        setError("Email ou mot de passe incorrect.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de cabinet ?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
