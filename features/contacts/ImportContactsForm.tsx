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
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          CSV ou Excel (.xlsx). Colonnes reconnues : Prénom, Nom, Email, Téléphone, Société, Adresse
          postale, Statut, Source, Produits, Encours, Potentiel, Notes. Si Nom contient le nom complet
          (ex. « CRABIE PHILIPPE »), le prénom est déduit automatiquement. Les lignes qui partagent le
          même nom sont regroupées en un seul contact (utile pour un export qui liste un produit détenu
          par ligne). Les contacts dont l&apos;email correspond à un contact déjà existant sont ignorés
          (pas de doublon).
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
