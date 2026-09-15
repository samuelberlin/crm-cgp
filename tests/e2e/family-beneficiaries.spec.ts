import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("famille et bénéficiaires d'assurance-vie", () => {
  test("ajoute des membres de la famille et les désigne bénéficiaires d'une assurance-vie", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Famille", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");

    const familyForm = page
      .locator("form")
      .filter({ has: page.locator('select[name="relationship"]') });
    await familyForm.locator('select[name="relationship"]').selectOption("CONJOINT");
    await familyForm.locator('input[name="firstName"]').fill("Julie");
    await familyForm.locator('input[name="lastName"]').fill("Petit");
    await familyForm.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("Julie Petit")).toBeVisible();
    await expect(page.getByText("(Conjoint(e))")).toBeVisible();

    // Le formulaire d'actif n'affiche la date de souscription et les bénéficiaires
    // que pour une assurance-vie ou un contrat de capitalisation.
    const assetForm = page.locator("form", { hasText: "Ajouter un actif" });
    await expect(page.getByText("Date de souscription")).toHaveCount(0);
    await assetForm.locator('select[name="category"]').selectOption("ASSURANCE_VIE");
    await expect(page.getByText("Date de souscription")).toBeVisible();

    await assetForm.locator('input[name="subscribedAt"]').fill("2019-06-01");
    await assetForm.locator('input[name="amount"]').fill("150000");
    await assetForm.getByLabel(/Julie Petit/).check();
    await assetForm.getByRole("button", { name: "Ajouter un actif" }).click();

    await expect(page.getByText(/Souscrit le .*2019/)).toBeVisible();
    await expect(page.getByText("Bénéficiaires : Julie Petit")).toBeVisible();

    // Retirer un membre de la famille ne supprime pas l'actif déjà créé (le montant
    // et la date de souscription restent), seule la désignation de bénéficiaire
    // disparaît puisqu'elle référence ce membre de la famille.
    await page.locator("li", { hasText: "Julie Petit" }).first().getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText(/150.?000.?€/).first()).toBeVisible();
    await expect(page.getByText("Bénéficiaires : Julie Petit")).toHaveCount(0);
  });
});
