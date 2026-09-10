import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("wealth and documents", () => {
  test("tracks patrimoine brut/net as assets and liabilities are added and removed", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Patrimoine", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");

    // Two assets.
    const assetForm = page.locator("form", { hasText: "Ajouter un actif" });
    await assetForm.locator('select[name="category"]').selectOption("IMMOBILIER");
    await assetForm.locator('input[name="label"]').fill("Résidence principale");
    await assetForm.locator('input[name="amount"]').fill("300000");
    await assetForm.getByRole("button", { name: "Ajouter un actif" }).click();
    await expect(page.getByText("Résidence principale")).toBeVisible();

    const assetForm2 = page.locator("form", { hasText: "Ajouter un actif" });
    await assetForm2.locator('select[name="category"]').selectOption("LIVRET_A");
    await assetForm2.locator('input[name="amount"]').fill("50000");
    await assetForm2.getByRole("button", { name: "Ajouter un actif" }).click();

    // One liability.
    const liabilityForm = page.locator("form", { hasText: "Ajouter un passif" });
    await liabilityForm.locator('select[name="category"]').selectOption("CREDIT");
    await liabilityForm.locator('input[name="label"]').fill("Prêt immobilier");
    await liabilityForm.locator('input[name="amount"]').fill("120000");
    await liabilityForm.getByRole("button", { name: "Ajouter un passif" }).click();
    await expect(page.getByText("Prêt immobilier")).toBeVisible();

    await expect(page.getByText(/350.?000.?€/)).toBeVisible(); // patrimoine brut
    await expect(page.getByText(/120.?000.?€/).first()).toBeVisible(); // passif
    await expect(page.getByText(/230.?000.?€/)).toBeVisible(); // patrimoine net

    // Remove the liability: the liability row disappears.
    await page
      .locator("li", { hasText: "Prêt immobilier" })
      .getByRole("button", { name: "Supprimer" })
      .click();
    await expect(page.getByText("Prêt immobilier")).toHaveCount(0);
  });

  test("uploads, previews, downloads, and deletes a document", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Documents", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");

    const dir = mkdtempSync(join(tmpdir(), "crm-cgp-doc-"));
    const filePath = join(dir, "carte-identite.txt");
    const content = "Contenu de test pour la pièce d'identité.";
    writeFileSync(filePath, content);

    const uploadForm = page.locator("form", { has: page.locator('input[type="file"]') });
    await uploadForm.locator('select[name="category"]').selectOption("IDENTITE");
    await uploadForm.locator('input[type="file"]').setInputFiles(filePath);
    await uploadForm.getByRole("button", { name: "Ajouter" }).click();

    await expect(page.getByText("carte-identite.txt")).toBeVisible();
    await expect(page.getByText(/Identité · /)).toBeVisible();

    const downloadLink = page.getByRole("link", { name: "Télécharger" });
    const href = await downloadLink.getAttribute("href");
    expect(href).toContain("download=1");

    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-disposition"]).toContain("attachment");
    expect(await response.text()).toBe(content);

    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText("carte-identite.txt")).toHaveCount(0);
  });
});
