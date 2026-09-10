import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("produits et souscriptions", () => {
  test("catalogue pré-rempli à la création du cabinet, suivi du multi-équipement d'un client", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Produits", name: "Alice Admin", email });

    // Le catalogue complet des produits SwissLife est créé automatiquement.
    await page.goto("/settings");
    await expect(page.getByText("SwissLife Retraite")).toBeVisible();
    await expect(page.getByText("SwissLife Stratégic Premium")).toBeVisible();
    await expect(page.getByText("SwissLife Prévoyance TNS")).toBeVisible();
    await expect(page.getByText("SwissLife Prévoyance Indépendants")).toBeVisible();
    await expect(page.getByText("SwissLife Santé Particuliers & Madelin")).toBeVisible();
    await expect(page.getByText("SwissLife PER Individuel")).toBeVisible();
    await expect(page.getByText("SwissLife Corporate Expat")).toBeVisible();
    await expect(page.getByText("Multirisques Commerce")).toBeVisible();

    await createContact(page, "Marc", "Petit");

    await expect(page.getByText("Produits souscrits")).toBeVisible();
    await expect(page.getByText("0 produit", { exact: true })).toBeVisible();

    await page.locator('select[name="productId"]').selectOption({ label: "SwissLife Retraite" });
    await page.locator('input[name="encours"]').fill("30000");
    await page.getByRole("button", { name: "Ajouter la souscription" }).click();

    await expect(page.getByText("1 produit", { exact: true })).toBeVisible();
    await expect(page.getByText(/30.?000.?€/).first()).toBeVisible();

    await page
      .locator('select[name="productId"]')
      .selectOption({ label: "SwissLife Santé Particuliers & Madelin" });
    await page.locator('input[name="encours"]').fill("5000");
    await page.getByRole("button", { name: "Ajouter la souscription" }).click();

    await expect(page.getByText("2 produits", { exact: true })).toBeVisible();
    await expect(page.getByText(/35.?000.?€/).first()).toBeVisible();

    // Seule la souscription Retraite alimente le patrimoine (Épargne/Retraite = capital
    // réellement détenu) ; la souscription Santé (prime d'assurance) ne doit pas y figurer.
    await expect(page.getByText("(produit souscrit)")).toHaveCount(1);
    await expect(page.getByText("Patrimoine net")).toBeVisible();

    await page
      .locator("li", { hasText: "SwissLife Santé Particuliers & Madelin" })
      .getByRole("button", { name: "Résilier" })
      .click();

    await expect(page.getByText("1 produit", { exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="badge"]', { hasText: "Résiliée" })).toBeVisible();
    await expect(page.getByText(/30.?000.?€/).first()).toBeVisible();
    await expect(page.getByText("(produit souscrit)")).toHaveCount(1);

    // Résilier la souscription Retraite retire aussi l'actif patrimoine lié.
    await page
      .locator("li", { hasText: "SwissLife Retraite" })
      .getByRole("button", { name: "Résilier" })
      .click();

    await expect(page.getByText("(produit souscrit)")).toHaveCount(0);
  });

  test("un ADMIN peut ajouter et désactiver un produit du catalogue", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Catalogue", name: "Alice Admin", email });

    await page.goto("/settings");
    await page.locator('input[name="name"]').fill("PER Individuel Maison");
    await page.locator('select[name="category"]').selectOption("RETRAITE");
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();

    await expect(page.getByText("PER Individuel Maison")).toBeVisible();

    await page
      .locator("li", { hasText: "PER Individuel Maison" })
      .getByRole("button", { name: "Désactiver" })
      .click();

    await expect(
      page.locator("li", { hasText: "PER Individuel Maison" }).getByText("Inactif"),
    ).toBeVisible();
  });
});
