import { expect, test } from "@playwright/test";
import { registerCabinet } from "./helpers";

test.describe("équipe du cabinet", () => {
  test("un ADMIN peut ajouter un conseiller, qui peut ensuite se connecter avec le mot de passe généré", async ({
    page,
  }) => {
    const adminEmail = `admin+${Date.now()}@example.fr`;
    const bobEmail = `bob+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Équipe", name: "Alice Admin", email: adminEmail });

    await page.goto("/settings");
    await page.getByLabel("Nom").fill("Bob Conseiller");
    await page.getByLabel("Email").fill(bobEmail);
    await page.getByLabel("Rôle").selectOption("CGP");
    await page.getByRole("button", { name: "Ajouter un conseiller" }).click();

    await expect(page.getByText("Compte créé pour Bob Conseiller.")).toBeVisible();
    const credentials = await page.locator("p.font-mono").textContent();
    const password = credentials?.split("—")[1]?.trim();
    expect(password).toBeTruthy();

    // L'ADMIN qui vient de créer le compte doit rester connecté sous sa propre session.
    await expect(page.getByRole("complementary").getByText("Alice Admin")).toBeVisible();
    await expect(page.getByRole("main").getByText("Bob Conseiller", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/login");

    await page.getByLabel("Email").fill(bobEmail);
    await page.getByLabel("Mot de passe").fill(password!);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Bonjour Bob" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
  });
});
