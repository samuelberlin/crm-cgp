"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { updateOpportunityStage } from "./actions";
import { opportunityStageLabels, opportunityStageValues } from "./schemas";

export function StageSelect({
  opportunityId,
  stage,
}: {
  opportunityId: string;
  stage: (typeof opportunityStageValues)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as (typeof opportunityStageValues)[number];
    startTransition(async () => {
      await updateOpportunityStage(opportunityId, value);
      router.refresh();
    });
  }

  return (
    <NativeSelect
      value={stage}
      onChange={onChange}
      disabled={isPending}
      className="h-6 px-1.5 text-xs"
      aria-label="Changer l'étape"
    >
      {opportunityStageValues.map((value) => (
        <option key={value} value={value}>
          {opportunityStageLabels[value]}
        </option>
      ))}
    </NativeSelect>
  );
}
