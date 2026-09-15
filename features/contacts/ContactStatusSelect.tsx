"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { updateContactStatus } from "./actions";
import { contactStatusLabels, contactStatusValues } from "./schemas";

export function ContactStatusSelect({
  contactId,
  status,
}: {
  contactId: string;
  status: (typeof contactStatusValues)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as (typeof contactStatusValues)[number];
    startTransition(async () => {
      await updateContactStatus(contactId, value);
      router.refresh();
    });
  }

  return (
    <NativeSelect
      value={status}
      onChange={onChange}
      disabled={isPending}
      className="h-7 px-1.5 text-xs"
      aria-label="Changer le statut"
    >
      {contactStatusValues.map((value) => (
        <option key={value} value={value}>
          {contactStatusLabels[value]}
        </option>
      ))}
    </NativeSelect>
  );
}
