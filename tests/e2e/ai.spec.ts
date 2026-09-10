import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

const NOT_CONFIGURED_TEXT = "Fonctionnalité IA non configurée";

test.describe("assistant IA", () => {
  test("shows a clear message when no API key is configured, on the contact and opportunity pages", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet IA", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");
    const contactUrl = page.url();

    await expect(page.getByText("Assistant IA")).toBeVisible();
    await page.getByRole("button", { name: "Résumer ce client" }).click();
    await expect(page.getByText(NOT_CONFIGURED_TEXT).first()).toBeVisible();

    await page.getByRole("button", { name: "Rédiger une relance" }).click();
    await expect(page.getByText(NOT_CONFIGURED_TEXT).nth(1)).toBeVisible();

    await page.getByRole("button", { name: "Suggérer des opportunités" }).click();
    await expect(page.getByText(NOT_CONFIGURED_TEXT).nth(2)).toBeVisible();

    await page.getByRole("link", { name: "Créer opportunité" }).click();
    await page.getByLabel("Titre").fill("PER Marc");
    await page.getByRole("button", { name: "Créer l'opportunité" }).click();
    await expect(page).toHaveURL(contactUrl);

    await page.getByRole("link", { name: "PER Marc" }).click();
    await page.getByRole("button", { name: "Analyser cette opportunité" }).click();
    await expect(page.getByText(NOT_CONFIGURED_TEXT)).toBeVisible();
  });

  test("shows a clear message when no API key is configured, for the newsletter", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Newsletter", name: "Alice Admin", email });

    await expect(page.getByText("Newsletter IA")).toBeVisible();
    await page.getByRole("button", { name: "Générer la newsletter" }).click();
    await expect(page.getByText(NOT_CONFIGURED_TEXT)).toBeVisible();
  });
});
