import { describe, expect, it } from "vitest";
import { updateAutomationSettingsSchema } from "./schemas";

describe("updateAutomationSettingsSchema", () => {
  it("accepts valid delays", () => {
    const result = updateAutomationSettingsSchema.safeParse({
      firstContactDelayDays: "1",
      meetingReportDelayDays: "0",
      proposalFollowUpDelayDays: "3",
      inactivityAlertDays: "30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative delay", () => {
    const result = updateAutomationSettingsSchema.safeParse({
      firstContactDelayDays: "-1",
      meetingReportDelayDays: "0",
      proposalFollowUpDelayDays: "3",
      inactivityAlertDays: "30",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an inactivity threshold of 0 (must be at least 1 day)", () => {
    const result = updateAutomationSettingsSchema.safeParse({
      firstContactDelayDays: "1",
      meetingReportDelayDays: "0",
      proposalFollowUpDelayDays: "3",
      inactivityAlertDays: "0",
    });
    expect(result.success).toBe(false);
  });
});
