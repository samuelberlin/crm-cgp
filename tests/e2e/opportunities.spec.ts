import { expect, test } from "@playwright/test";
import {
  contactDetailUrlPattern,
  createContact,
  getTenantId,
  login,
  logout,
  moveToTenantAsCgp,
  registerCabinet,
} from "./helpers";

test.describe("opportunities", () => {
  test("create an opportunity from a contact, see it in the pipeline, and change its stage", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Pipeline", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");

    await page.getByRole("link", { name: "Créer opportunité" }).click();
    await expect(page).toHaveURL(/\/opportunities\/new\?contactId=.+/);
    await expect(page.getByText("Pour Marc Petit")).toBeVisible();

    await page.getByLabel("Titre").fill("PER Marc");
    await page.getByLabel("Catégorie").selectOption("RETRAITE");
    await page.getByLabel("Montant potentiel (€)").fill("40000");
    await page.getByLabel("Probabilité (%)").fill("60");
    await page.getByRole("button", { name: "Créer l'opportunité" }).click();

    await expect(page).toHaveURL(contactDetailUrlPattern);
    await expect(page.getByRole("link", { name: "PER Marc" })).toBeVisible();
    await expect(page.getByText(/24.?000.?€/).first()).toBeVisible(); // 40000 * 60%
    await expect(page.getByText("Opportunité créée : PER Marc")).toBeVisible();

    await page.goto("/opportunities");
    await expect(page.getByRole("link", { name: "Marc Petit" })).toBeVisible();
    await expect(page.getByText("PER Marc")).toBeVisible();
    await expect(page.getByText(/40.?000.?€/).first()).toBeVisible();

    await page.getByRole("link", { name: "Modifier" }).click();
    await expect(page).toHaveURL(/\/opportunities\/.+\/edit/);
    await page.getByLabel("Étape").selectOption("QUALIFIE");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page).toHaveURL(contactDetailUrlPattern);
    await expect(page.getByText("Étape : Nouveau → Qualifié")).toBeVisible();
  });

  test("a CGP only sees their own opportunities, an ADMIN sees the whole cabinet", async ({ page }) => {
    const adminEmail = `admin+${Date.now()}@example.fr`;
    const cgpEmail = `cgp+${Date.now()}@example.fr`;

    await registerCabinet(page, { cabinetName: "Cabinet Pipeline Iso", name: "Alice Admin", email: adminEmail });
    const tenantId = await getTenantId(adminEmail);

    await createContact(page, "Client", "DAlice");
    await page.getByRole("link", { name: "Créer opportunité" }).click();
    await page.getByLabel("Titre").fill("Opportunité Alice");
    await page.getByRole("button", { name: "Créer l'opportunité" }).click();
    await expect(page).toHaveURL(contactDetailUrlPattern);

    await logout(page);
    await registerCabinet(page, { cabinetName: "Cabinet Bob Pipeline", name: "Bob CGP", email: cgpEmail });
    await moveToTenantAsCgp(cgpEmail, tenantId);

    await logout(page);
    await login(page, cgpEmail);

    await page.goto("/opportunities");
    await expect(page.getByText("Opportunité Alice")).toHaveCount(0);

    await createContact(page, "Client", "DeBob");
    await page.getByRole("link", { name: "Créer opportunité" }).click();
    await page.getByLabel("Titre").fill("Opportunité Bob");
    await page.getByRole("button", { name: "Créer l'opportunité" }).click();
    await expect(page).toHaveURL(contactDetailUrlPattern);

    await page.goto("/opportunities");
    await expect(page.getByText("Opportunité Bob")).toBeVisible();
    await expect(page.getByText("Opportunité Alice")).toHaveCount(0);

    await logout(page);
    await login(page, adminEmail);

    await page.goto("/opportunities");
    await expect(page.getByText("Opportunité Alice")).toBeVisible();
    await expect(page.getByText("Opportunité Bob")).toBeVisible();
  });
});
