"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { updateTaskStatus } from "./actions";
import { taskStatusLabels, taskStatusValues } from "./schemas";

export function StatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: (typeof taskStatusValues)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as (typeof taskStatusValues)[number];
    startTransition(async () => {
      await updateTaskStatus(taskId, value);
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
      {taskStatusValues.map((value) => (
        <option key={value} value={value}>
          {taskStatusLabels[value]}
        </option>
      ))}
    </NativeSelect>
  );
}
