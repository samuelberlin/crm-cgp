import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("suivi de production", () => {
  test("une souscription du mois apparaît dans le suivi de production", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Production", name: "Alice Admin", email });

    await createContact(page, "Marc", "Petit");

    await page.locator('select[name="productId"]').selectOption({ label: "SwissLife Retraite" });
    await page.locator('input[name="encours"]').fill("30000");
    await page.getByRole("button", { name: "Ajouter la souscription" }).click();
    await expect(page.getByText("1 produit", { exact: true })).toBeVisible();

    await page.goto("/production");
    await expect(page.getByRole("heading", { name: "Suivi de production" })).toBeVisible();

    // KPI "Production <année>" : une seule souscription à 30 000 €.
    await expect(page.getByText(/30.?000.?€/).first()).toBeVisible();

    // Les libellés de mois apparaissent aussi dans les graphiques : on cible le seul
    // <summary> du détail mensuel qui affiche une souscription plutôt que le texte du mois.
    await page.locator("summary").filter({ hasText: "1 souscription" }).click();

    await expect(page.getByRole("link", { name: "Marc Petit" })).toBeVisible();
    await expect(page.getByText("SwissLife Retraite").first()).toBeVisible();
  });
});
