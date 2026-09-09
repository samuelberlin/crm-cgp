import "dotenv/config";
import { expect, test } from "@playwright/test";
import { Client } from "pg";

// Playwright's runner can't load the ESM-only generated Prisma client, so
// test fixtures that need direct DB access use `pg` instead.
async function setUserRole(email: string, role: "ADMIN" | "MANAGER" | "CGP") {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('UPDATE "user" SET role = $1 WHERE email = $2', [role, email]);
  await client.end();
}

test.describe("authentication and roles", () => {
  test("an unauthenticated visitor is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");

    await page.goto("/settings");
    await expect(page).toHaveURL("/login");
  });

  test("register, login, and admin access to settings", async ({ page }) => {
    const email = `admin+${Date.now()}@example.fr`;

    await page.goto("/register");
    await page.getByLabel("Nom du cabinet").fill("Cabinet E2E");
    await page.getByLabel("Votre nom").fill("Alice Admin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Créer le cabinet" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Bonjour Alice" })).toBeVisible();

    await page.getByRole("link", { name: "Paramètres" }).click();
    await expect(page).toHaveURL("/settings");
    const main = page.getByRole("main");
    await expect(main.getByText("Cabinet E2E")).toBeVisible();
    await expect(main.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Bonjour Alice" })).toBeVisible();
  });

  test("a non-admin user is denied access to settings", async ({ page }) => {
    const email = `cgp+${Date.now()}@example.fr`;

    await page.goto("/register");
    await page.getByLabel("Nom du cabinet").fill("Cabinet CGP E2E");
    await page.getByLabel("Votre nom").fill("Bob CGP");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Créer le cabinet" }).click();
    await expect(page).toHaveURL("/");

    // No invite flow yet: downgrade the role directly to simulate a non-admin.
    await setUserRole(email, "CGP");

    // The nav link itself is hidden for non-admins on the next render...
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Paramètres" })).toHaveCount(0);

    // ...and the page itself refuses access even via direct URL.
    await page.goto("/settings");
    await expect(page.getByText("Accès refusé")).toBeVisible();
  });
});
