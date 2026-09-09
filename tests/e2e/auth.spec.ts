import { expect, test } from "@playwright/test";
import { login, logout, registerCabinet, withDb } from "./helpers";

async function setUserRole(email: string, role: "ADMIN" | "MANAGER" | "CGP") {
  await withDb((client) => client.query('UPDATE "user" SET role = $1 WHERE email = $2', [role, email]));
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
    await registerCabinet(page, { cabinetName: "Cabinet E2E", name: "Alice Admin", email });

    await expect(page.getByRole("heading", { name: "Bonjour Alice" })).toBeVisible();

    await page.getByRole("link", { name: "Paramètres" }).click();
    await expect(page).toHaveURL("/settings");
    const main = page.getByRole("main");
    await expect(main.getByText("Cabinet E2E")).toBeVisible();
    await expect(main.getByText(email)).toBeVisible();

    await logout(page);
    await login(page, email);
    await expect(page.getByRole("heading", { name: "Bonjour Alice" })).toBeVisible();
  });

  test("a non-admin user is denied access to settings", async ({ page }) => {
    const email = `cgp+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet CGP E2E", name: "Bob CGP", email });

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
