"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerTenant, type RegisterState } from "./actions";

const initialState: RegisterState = null;

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerTenant, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cabinetName">Nom du cabinet</Label>
        <Input id="cabinetName" name="cabinetName" required autoComplete="organization" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Votre nom</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Création…" : "Créer le cabinet"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
