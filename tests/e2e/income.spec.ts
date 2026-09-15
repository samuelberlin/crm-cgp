import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("revenus", () => {
  test("tracks a contact's income items and their total as they are added and removed", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Revenus", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");

    const incomeForm = page.locator("form", { hasText: "Ajouter un revenu" });
    await incomeForm.locator('select[name="category"]').selectOption("SALAIRE");
    await incomeForm.locator('input[name="label"]').fill("Rémunération de gérant");
    await incomeForm.locator('input[name="amount"]').fill("45000");
    await incomeForm.getByRole("button", { name: "Ajouter un revenu" }).click();
    await expect(page.getByText("Rémunération de gérant")).toBeVisible();

    const incomeForm2 = page.locator("form", { hasText: "Ajouter un revenu" });
    await incomeForm2.locator('select[name="category"]').selectOption("DIVIDENDES");
    await incomeForm2.locator('input[name="amount"]').fill("15000");
    await incomeForm2.getByRole("button", { name: "Ajouter un revenu" }).click();
    const dividendRow = page.locator("li", { hasText: "Dividendes" });
    await expect(dividendRow).toBeVisible();

    await expect(page.getByText(/60.?000.?€/)).toBeVisible(); // total des revenus

    // Remove the dividend line: the total drops back to just the salary.
    await dividendRow.getByRole("button", { name: "Supprimer" }).click();
    await expect(dividendRow).toHaveCount(0);
    await expect(page.getByText(/45.?000.?€/).first()).toBeVisible();
  });
});
