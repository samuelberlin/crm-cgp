import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { utils, writeFile } from "xlsx";
import { registerCabinet } from "./helpers";

test.describe("import de contacts depuis un classeur Excel", () => {
  test("découpe le nom complet, l'adresse, fusionne les lignes d'un même client, et garde produits/encours en notes", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet ImportXlsx", name: "Alice Admin", email });

    // Reproduit le format d'un export "portefeuille" réel : un client peut apparaître sur
    // plusieurs lignes (une par produit détenu), sans prénom séparé, avec une adresse en
    // une seule ligne.
    const sheet = utils.aoa_to_sheet([
      ["NOM", "NUMERO TEL", "MAIL", "ADRESSE POSTALE", "ENCOURS", "PRODUITS"],
      ["CRABIE PHILIPPE", "0607033809", "philippe.crabie@example.fr", "64 rue des lilas 78800 Houilles", "310K", "ASSURANCE VIE"],
      ["CRABIE PHILIPPE", "", "", "", "", "PER"],
      ["FAIFE", "", "", "", "", "ASSURANCE VIE"],
    ]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, sheet, "Feuil1");

    const dir = mkdtempSync(join(tmpdir(), "crm-cgp-xlsx-"));
    const filePath = join(dir, "portefeuille.xlsx");
    writeFile(workbook, filePath);

    await page.goto("/contacts/import");
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole("button", { name: "Importer" }).click();

    // 3 lignes -> 2 contacts (Crabie Philippe fusionné sur ses 2 lignes, Faife à part).
    await expect(page.getByText("2 contacts importés.")).toBeVisible();

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "PHILIPPE CRABIE" })).toBeVisible();
    await expect(page.getByRole("link", { name: "FAIFE FAIFE" })).toBeVisible();

    await page.getByRole("link", { name: "PHILIPPE CRABIE" }).click();
    await expect(page.getByText("64 rue des lilas")).toBeVisible();
    await expect(page.getByText("0607033809")).toBeVisible();
    await expect(page.getByText(/Produits : ASSURANCE VIE/)).toBeVisible();
    await expect(page.getByText(/Produits : PER/)).toBeVisible();
    await expect(page.getByText(/Encours : 310K/)).toBeVisible();
  });
});
