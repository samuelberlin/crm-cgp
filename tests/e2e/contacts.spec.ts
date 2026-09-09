import "dotenv/config";
import { expect, test } from "@playwright/test";
import { Client } from "pg";

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function getTenantId(email: string): Promise<string> {
  return withDb(async (client) => {
    const { rows } = await client.query<{ tenantId: string }>(
      'SELECT "tenantId" FROM "user" WHERE email = $1',
      [email],
    );
    return rows[0].tenantId;
  });
}

async function moveToTenantAsCgp(email: string, tenantId: string): Promise<void> {
  await withDb((client) =>
    client.query('UPDATE "user" SET "tenantId" = $1, role = $2 WHERE email = $3', [
      tenantId,
      "CGP",
      email,
    ]),
  );
}

async function registerCabinet(
  page: import("@playwright/test").Page,
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

test.describe("contacts", () => {
  test("create, view timeline, and edit a contact", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Contacts", name: "Alice Admin", email });

    await page.goto("/contacts/new");
    await page.getByLabel("Prénom").fill("Marc");
    await page.getByLabel("Nom", { exact: true }).fill("Petit");
    await page.getByLabel("Téléphone").fill("0601020304");
    await page.getByLabel("Email").fill("marc.petit@example.fr");
    await page.getByLabel("Statut").selectOption("CLIENT");
    await page.getByLabel("Source").fill("Recommandation");
    await page.getByRole("button", { name: "Créer le contact" }).click();

    await expect(page).toHaveURL(/\/contacts\/.+/);
    await expect(page.getByRole("heading", { name: "Marc Petit" })).toBeVisible();
    await expect(page.getByText("Client")).toBeVisible();
    await expect(page.getByText("Contact créé")).toBeVisible();

    await page.getByRole("link", { name: "Modifier" }).click();
    await page.getByLabel("Société").fill("Petit & Associés");
    await page.getByLabel("Potentiel estimé (€)").fill("50000");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page).toHaveURL(/\/contacts\/.+/);
    await expect(page.getByText("Petit & Associés")).toBeVisible();
    await expect(page.getByText(/50.?000.?€/)).toBeVisible();

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Marc Petit" })).toBeVisible();
  });

  test("a CGP only sees their own contacts, an ADMIN sees the whole cabinet", async ({ page }) => {
    const adminEmail = `admin+${Date.now()}@example.fr`;
    const cgpEmail = `cgp+${Date.now()}@example.fr`;

    await registerCabinet(page, { cabinetName: "Cabinet Isolation", name: "Alice Admin", email: adminEmail });
    const tenantId = await getTenantId(adminEmail);

    await page.goto("/contacts/new");
    await page.getByLabel("Prénom").fill("Client");
    await page.getByLabel("Nom", { exact: true }).fill("DAlice");
    await page.getByRole("button", { name: "Créer le contact" }).click();
    await expect(page).toHaveURL(/\/contacts\/.+/);

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/login");

    await registerCabinet(page, { cabinetName: "Cabinet Bob", name: "Bob CGP", email: cgpEmail });
    await moveToTenantAsCgp(cgpEmail, tenantId);

    // Re-login so the session reflects the updated tenant/role.
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/login");
    await page.getByLabel("Email").fill(cgpEmail);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/contacts");
    await expect(page.getByText("Aucun contact pour le moment.")).toBeVisible();

    await page.goto("/contacts/new");
    await page.getByLabel("Prénom").fill("Client");
    await page.getByLabel("Nom", { exact: true }).fill("DeBob");
    await page.getByRole("button", { name: "Créer le contact" }).click();
    await expect(page).toHaveURL(/\/contacts\/.+/);

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Client DeBob" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Client DAlice" })).toHaveCount(0);

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Client DAlice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Client DeBob" })).toBeVisible();
  });
});
