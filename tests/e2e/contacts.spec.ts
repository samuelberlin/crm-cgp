import { expect, test } from "@playwright/test";
import { createContact, getTenantId, login, logout, moveToTenantAsCgp, registerCabinet } from "./helpers";

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

    await expect(page).toHaveURL(/\/contacts\/(?!new(?:$|[/?]))[^/?#]+$/);
    await expect(page.getByRole("heading", { name: "Marc Petit" })).toBeVisible();
    await expect(page.getByText("Client", { exact: true })).toBeVisible();
    await expect(page.getByText("Contact créé")).toBeVisible();

    await page.getByRole("link", { name: "Modifier" }).click();
    await page.getByLabel("Société").fill("Petit & Associés");
    await page.getByLabel("Potentiel estimé (€)").fill("50000");
    await page.getByLabel("Situation familiale").selectOption("MARIE");
    await page.getByLabel("Adresse").fill("12 rue de la Paix");
    await page.getByLabel("Code postal").fill("75002");
    await page.getByLabel("Ville").fill("Paris");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page).toHaveURL(/\/contacts\/(?!new(?:$|[/?]))[^/?#]+$/);
    await expect(page.getByText("Petit & Associés")).toBeVisible();
    await expect(page.getByText(/50.?000.?€/)).toBeVisible();
    await expect(page.getByText("Marié(e)")).toBeVisible();
    await expect(page.getByText("12 rue de la Paix 75002 Paris")).toBeVisible();

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Marc Petit" })).toBeVisible();
  });

  test("a CGP only sees their own contacts, an ADMIN sees the whole cabinet", async ({ page }) => {
    const adminEmail = `admin+${Date.now()}@example.fr`;
    const cgpEmail = `cgp+${Date.now()}@example.fr`;

    await registerCabinet(page, { cabinetName: "Cabinet Isolation", name: "Alice Admin", email: adminEmail });
    const tenantId = await getTenantId(adminEmail);

    await createContact(page, "Client", "DAlice");

    await logout(page);

    await registerCabinet(page, { cabinetName: "Cabinet Bob", name: "Bob CGP", email: cgpEmail });
    await moveToTenantAsCgp(cgpEmail, tenantId);

    // Re-login so the session reflects the updated tenant/role.
    await logout(page);
    await login(page, cgpEmail);

    await page.goto("/contacts");
    await expect(page.getByText("Aucun contact pour le moment.")).toBeVisible();

    await createContact(page, "Client", "DeBob");

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Client DeBob" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Client DAlice" })).toHaveCount(0);

    await logout(page);
    await login(page, adminEmail);

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: "Client DAlice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Client DeBob" })).toBeVisible();
  });
});
