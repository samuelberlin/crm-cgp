"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { inviteTeamMember, type InviteTeamMemberState } from "./actions";
import { teamRoleLabels, teamRoleValues } from "./schemas";

const initialState: InviteTeamMemberState = null;

export function InviteTeamMemberForm() {
  const [state, formAction, isPending] = useActionState(inviteTeamMember, initialState);

  return (
    <div className="space-y-4 border-t pt-4">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="memberName">Nom</Label>
          <Input id="memberName" name="memberName" placeholder="Prénom Nom" className="w-40" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="email@cabinet.fr" className="w-48" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Rôle</Label>
          <NativeSelect id="role" name="role" className="w-36" defaultValue="CGP">
            {teamRoleValues.map((value) => (
              <option key={value} value={value}>
                {teamRoleLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Création…" : "Ajouter un conseiller"}
        </Button>
      </form>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      {state && "success" in state && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <p className="font-medium">Compte créé pour {state.name}.</p>
          <p className="mt-1 text-muted-foreground">
            Communiquez-lui ces identifiants pour sa première connexion — ce mot de passe ne sera plus
            affiché ensuite :
          </p>
          <p className="mt-2 font-mono text-xs">
            {state.email} — {state.password}
          </p>
        </div>
      )}
    </div>
  );
}
