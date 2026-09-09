"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { updateMeetingStatus } from "./actions";
import { meetingStatusLabels, meetingStatusValues } from "./schemas";

export function StatusSelect({
  meetingId,
  status,
}: {
  meetingId: string;
  status: (typeof meetingStatusValues)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as (typeof meetingStatusValues)[number];
    startTransition(async () => {
      await updateMeetingStatus(meetingId, value);
      router.refresh();
    });
  }

  return (
    <NativeSelect
      value={status}
      onChange={onChange}
      disabled={isPending}
      className="h-6 px-1.5 text-xs"
      aria-label="Changer le statut"
    >
      {meetingStatusValues.map((value) => (
        <option key={value} value={value}>
          {meetingStatusLabels[value]}
        </option>
      ))}
    </NativeSelect>
  );
}
