import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("export CSV", () => {
  test("télécharge les contacts et la production en CSV avec les bons en-têtes", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Export", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");
    const contactUrl = page.url();

    await page.goto("/contacts");
    const contactsDownload = page.waitForEvent("download");
    await page.getByRole("link", { name: "Exporter CSV" }).click();
    const contactsFile = await contactsDownload;
    expect(contactsFile.suggestedFilename()).toBe("contacts.csv");
    const contactsPath = await contactsFile.path();
    const contactsContent = readFileSync(contactsPath!, "utf-8");
    expect(contactsContent).toContain("Prénom,Nom,Statut");
    expect(contactsContent).toContain("Marc,Petit,Prospect");

    await page.goto(contactUrl);
    await page.locator('select[name="productId"]').selectOption({ label: "SwissLife Retraite" });
    await page.locator('input[name="encours"]').fill("30000");
    await page.getByRole("button", { name: "Ajouter la souscription" }).click();

    await page.goto("/production");
    const productionDownload = page.waitForEvent("download");
    await page.getByRole("link", { name: "Exporter CSV" }).click();
    const productionFile = await productionDownload;
    expect(productionFile.suggestedFilename()).toMatch(/^production-\d{4}\.csv$/);
    const productionPath = await productionFile.path();
    const productionContent = readFileSync(productionPath!, "utf-8");
    expect(productionContent).toContain("Date,Client,Produit,Catégorie,Statut,Encours");
    expect(productionContent).toContain("Marc Petit,SwissLife Retraite");
  });
});
