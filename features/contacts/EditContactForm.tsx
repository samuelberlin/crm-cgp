"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { updateContact, type ContactFormState } from "./actions";
import { contactStatusLabels, contactStatusValues } from "./schemas";

const initialState: ContactFormState = null;

function toDateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export function EditContactForm({
  contact,
  advisors,
}: {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    status: string;
    source: string | null;
    company: string | null;
    potential: number | null;
    notes: string | null;
    nextAction: string | null;
    lastContactAt: Date | null;
    nextContactAt: Date | null;
    birthDate: Date | null;
    profession: string | null;
    city: string | null;
    maritalStatus: string | null;
    advisorId: string | null;
  };
  advisors: { id: string; name: string }[] | null;
}) {
  const action = updateContact.bind(null, contact.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" defaultValue={contact.firstName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" defaultValue={contact.lastName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={contact.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={contact.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <NativeSelect id="status" name="status" defaultValue={contact.status}>
            {contactStatusValues.map((value) => (
              <option key={value} value={value}>
                {contactStatusLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" defaultValue={contact.source ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Société</Label>
          <Input id="company" name="company" defaultValue={contact.company ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="potential">Potentiel estimé (€)</Label>
          <Input id="potential" name="potential" type="number" min="0" defaultValue={contact.potential ?? ""} />
        </div>
        {advisors && (
          <div className="space-y-2">
            <Label htmlFor="advisorId">Conseiller</Label>
            <NativeSelect id="advisorId" name="advisorId" defaultValue={contact.advisorId ?? ""}>
              <option value="">Non assigné</option>
              {advisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-medium">Relation</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nextAction">Prochaine action</Label>
            <Input id="nextAction" name="nextAction" defaultValue={contact.nextAction ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextContactAt">Date du prochain contact</Label>
            <Input
              id="nextContactAt"
              name="nextContactAt"
              type="date"
              defaultValue={toDateInputValue(contact.nextContactAt)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastContactAt">Date du dernier contact</Label>
            <Input
              id="lastContactAt"
              name="lastContactAt"
              type="date"
              defaultValue={toDateInputValue(contact.lastContactAt)}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-medium">Informations complémentaires</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profession">Profession</Label>
            <Input id="profession" name="profession" defaultValue={contact.profession ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" name="city" defaultValue={contact.city ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Input id="birthDate" name="birthDate" type="date" defaultValue={toDateInputValue(contact.birthDate)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Situation familiale</Label>
            <Input id="maritalStatus" name="maritalStatus" defaultValue={contact.maritalStatus ?? ""} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={contact.notes ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
