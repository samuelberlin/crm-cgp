"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { importContacts, type ImportContactsState } from "./actions";

const initialState: ImportContactsState = null;

export function ImportContactsForm() {
  const [state, formAction, isPending] = useActionState(importContacts, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Colonnes reconnues : Prénom, Nom (obligatoires), Email, Téléphone, Société, Statut, Source. Les
          contacts dont l&apos;email correspond à un contact déjà existant sont ignorés (pas de doublon).
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Import en cours…" : "Importer"}
      </Button>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      {state && "summary" in state && (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">
            {state.summary.created} contact{state.summary.created > 1 ? "s" : ""} importé
            {state.summary.created > 1 ? "s" : ""}
            {state.summary.duplicates > 0 &&
              `, ${state.summary.duplicates} déjà existant${state.summary.duplicates > 1 ? "s" : ""} ignoré${state.summary.duplicates > 1 ? "s" : ""}`}
            .
          </p>
          {state.summary.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-destructive">
                {state.summary.errors.length} ligne{state.summary.errors.length > 1 ? "s" : ""} en erreur :
              </p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {state.summary.errors.map((e) => (
                  <li key={e.line}>
                    Ligne {e.line} : {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
