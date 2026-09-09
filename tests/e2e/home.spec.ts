import { expect, test } from "@playwright/test";

test("home page loads and shows the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("CRM CGP")).toBeVisible();
  await expect(page.getByRole("button", { name: /prêt pour l'étape 2/i })).toBeVisible();
});
