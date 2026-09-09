import "dotenv/config";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Client } from "pg";

export async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function getTenantId(email: string): Promise<string> {
  return withDb(async (client) => {
    const { rows } = await client.query<{ tenantId: string }>(
      'SELECT "tenantId" FROM "user" WHERE email = $1',
      [email],
    );
    return rows[0].tenantId;
  });
}

export async function moveToTenantAsCgp(email: string, tenantId: string): Promise<void> {
  await withDb((client) =>
    client.query('UPDATE "user" SET "tenantId" = $1, role = $2 WHERE email = $3', [
      tenantId,
      "CGP",
      email,
    ]),
  );
}

export async function registerCabinet(
  page: Page,
  { cabinetName, name, email }: { cabinetName: string; name: string; email: string },
) {
  await page.goto("/register");
  await page.getByLabel("Nom du cabinet").fill(cabinetName);
  await page.getByLabel("Votre nom").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Créer le cabinet" }).click();
  await expect(page).toHaveURL("/");
}

export async function login(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/login");
}
