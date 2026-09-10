"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createFiscalReminder, type FiscalReminderFormState } from "./actions";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const initialState: FiscalReminderFormState = null;

export function AddFiscalReminderForm() {
  const [state, formAction, isPending] = useActionState(createFiscalReminder, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
      <Input name="label" placeholder="Libellé du rappel" className="w-64" required />
      <NativeSelect name="month" className="w-32" defaultValue="12">
        {MONTH_LABELS.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </NativeSelect>
      <Input name="day" type="number" min={1} max={31} placeholder="Jour" className="w-20" required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : "Ajouter le rappel"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
