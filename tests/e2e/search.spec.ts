import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("recherche globale", () => {
  test("trouve un contact par nom depuis la barre de recherche de la sidebar", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Recherche", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");
    await createContact(page, "Sophie", "Durand");

    await page.goto("/");
    await page.getByPlaceholder("Rechercher…").fill("Petit");
    await page.getByPlaceholder("Rechercher…").press("Enter");

    await expect(page).toHaveURL("/search?q=Petit");
    await expect(page.getByText("Contacts (1)")).toBeVisible();
    await expect(page.getByRole("link", { name: "Marc Petit" })).toBeVisible();
    await expect(page.getByText("Sophie Durand")).toHaveCount(0);
  });
});
