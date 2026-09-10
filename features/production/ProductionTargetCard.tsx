"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { updateProductionTarget, type ProductionTargetFormState } from "./actions";

const initialState: ProductionTargetFormState = null;

export function ProductionTargetCard({
  year,
  totalEncours,
  target,
  progressPercent,
  isAdmin,
}: {
  year: number;
  totalEncours: number;
  target: number | null;
  progressPercent: number | null;
  isAdmin: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateProductionTarget, initialState);

  return (
    <div className="space-y-4">
      {target !== null && progressPercent !== null ? (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{progressPercent.toFixed(0)}% de l&apos;objectif atteint</span>
            <span className="text-muted-foreground">
              {formatCurrency(totalEncours)} / {formatCurrency(target)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun objectif défini pour {year}
          {isAdmin ? "." : " — demandez à un administrateur d'en fixer un."}
        </p>
      )}

      {isAdmin && (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="annualProductionTarget">Objectif {year} (encours, €)</Label>
            <Input
              id="annualProductionTarget"
              name="annualProductionTarget"
              type="number"
              min="0"
              step="1000"
              className="w-40"
              defaultValue={target ?? undefined}
              placeholder="200000"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer l'objectif"}
          </Button>
          {state && "error" in state && <p className="w-full text-sm text-destructive">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
