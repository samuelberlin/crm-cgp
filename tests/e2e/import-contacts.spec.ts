import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("import de contacts CSV", () => {
  test("importe les lignes valides, ignore les doublons, et rapporte les erreurs", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Import", name: "Alice Admin", email });

    // Marc existe déjà : son email dans le CSV doit être ignoré comme doublon.
    await createContact(page, "Marc", "Petit");
    await page.getByRole("link", { name: "Modifier" }).click();
    await page.getByLabel("Email").fill("marc.petit@example.fr");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    const dir = mkdtempSync(join(tmpdir(), "crm-cgp-import-"));
    const filePath = join(dir, "portefeuille.csv");
    const csv = [
      "Prénom,Nom,Email,Statut",
      "Marc,Petit,marc.petit@example.fr,Client", // doublon (email déjà présent)
      "Julie,Martin,julie.martin@example.fr,Prospect", // valide
      ",Sans Prénom,x@example.fr,Prospect", // erreur : prénom manquant
    ].join("\r\n");
    writeFileSync(filePath, csv);

    await page.goto("/contacts/import");
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole("button", { name: "Importer" }).click();

    await expect(page.getByText("1 contact importé, 1 déjà existant ignoré.")).toBeVisible();
    await expect(page.getByText("1 ligne en erreur :")).toBeVisible();
    await expect(page.getByText(/Ligne 4 :/)).toBeVisible();

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Julie Martin" })).toBeVisible();
    await expect(page.getByText("2 contacts")).toBeVisible();
  });

  test("shows a clear error when required columns are missing", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Import2", name: "Alice Admin", email });

    const dir = mkdtempSync(join(tmpdir(), "crm-cgp-import2-"));
    const filePath = join(dir, "sans-colonnes.csv");
    writeFileSync(filePath, "Ville,Pays\r\nLyon,France");

    await page.goto("/contacts/import");
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole("button", { name: "Importer" }).click();

    await expect(page.getByText(/Colonnes Prénom et Nom introuvables/)).toBeVisible();
  });
});
