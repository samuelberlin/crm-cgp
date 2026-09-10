"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AiResult } from "./actions";

// Filet de sécurité côté navigateur : si la connexion au serveur reste
// bloquée sans jamais renvoyer d'erreur exploitable (ex. coupure silencieuse
// sur un timeout Vercel), on arrête d'attendre nous-mêmes plutôt que de
// laisser le bouton tourner indéfiniment sans aucun retour pour l'utilisateur.
const CLIENT_TIMEOUT_MS = 55_000;
const TIMEOUT_RESULT: AiResult = {
  error: "La génération prend trop de temps et a été interrompue. Réessayez dans quelques instants.",
};
const FAILURE_RESULT: AiResult = { error: "La génération a échoué. Réessayez dans quelques instants." };

function withClientTimeout(promise: Promise<AiResult>, ms: number): Promise<AiResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(TIMEOUT_RESULT), ms);
    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      () => {
        clearTimeout(timer);
        resolve(FAILURE_RESULT);
      },
    );
  });
}

export function AiActionButton({
  label,
  pendingLabel,
  action,
}: {
  label: string;
  pendingLabel: string;
  action: () => Promise<AiResult>;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AiResult | null>(null);
  const requestId = useRef(0);

  function onClick() {
    const id = ++requestId.current;
    startTransition(async () => {
      const outcome = await withClientTimeout(action(), CLIENT_TIMEOUT_MS);
      if (id === requestId.current) setResult(outcome);
    });
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
      {result && "error" in result && <p className="mt-2 text-sm text-destructive">{result.error}</p>}
      {result && "text" in result && (
        <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{result.text}</p>
      )}
    </div>
  );
}
