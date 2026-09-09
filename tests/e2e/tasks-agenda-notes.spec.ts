import { expect, test } from "@playwright/test";
import { createContact, getTenantId, login, logout, moveToTenantAsCgp, registerCabinet } from "./helpers";

test.describe("tasks, agenda, and notes", () => {
  test("create a task, a meeting, and a note from a contact, and track them through their lifecycle", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Suivi", name: "Alice Admin", email });
    await createContact(page, "Marc", "Petit");
    const contactUrl = page.url();

    // --- Task ---
    await page.getByRole("link", { name: "Ajouter une tâche" }).click();
    await expect(page.getByText("Pour Marc Petit")).toBeVisible();
    await page.getByLabel("Titre").fill("Envoyer le DER");
    await page.getByLabel("Priorité").selectOption("HAUTE");
    await page.getByRole("button", { name: "Créer la tâche" }).click();

    await expect(page).toHaveURL(contactUrl);
    await expect(page.getByRole("link", { name: "Envoyer le DER" })).toBeVisible();
    await expect(page.getByText("Tâche créée : Envoyer le DER")).toBeVisible();

    await page.goto("/tasks?view=all");
    await expect(page.getByRole("link", { name: "Envoyer le DER" })).toBeVisible();
    await page.getByLabel("Changer le statut").selectOption("TERMINEE");

    await page.goto(contactUrl);
    await expect(page.getByText("Tâche terminée : Envoyer le DER")).toBeVisible();

    // --- Meeting ---
    await page.getByRole("link", { name: "Planifier rendez-vous" }).click();
    await expect(page.getByText("Pour Marc Petit")).toBeVisible();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await page.getByLabel("Date et heure").fill(future);
    await page.getByLabel("Lieu").fill("Cabinet");
    await page.getByRole("button", { name: "Planifier le rendez-vous" }).click();

    await expect(page).toHaveURL(contactUrl);
    await expect(page.getByText("Rendez-vous planifié")).toBeVisible();

    await page.goto("/agenda");
    const meetingRow = page.locator("li", { hasText: "Marc Petit" }).first();
    await meetingRow.getByLabel("Changer le statut").selectOption("REALISE");
    await expect(meetingRow.getByRole("link", { name: "Ajouter un compte-rendu →" })).toBeVisible();

    await page.goto(contactUrl);
    await expect(page.getByText("Rendez-vous réalisé")).toBeVisible();

    // --- Note ---
    await page.getByPlaceholder("Ajouter une note…").fill("Souhaite investir 50k€ avant décembre.");
    await page.getByRole("button", { name: "Ajouter la note" }).click();
    await expect(page.getByText("Souhaite investir 50k€ avant décembre.").first()).toBeVisible();
    await expect(page.getByText(/Note : Souhaite investir/)).toBeVisible();
  });

  test("a CGP only sees their own tasks, an ADMIN sees the whole cabinet", async ({ page }) => {
    const adminEmail = `admin+${Date.now()}@example.fr`;
    const cgpEmail = `cgp+${Date.now()}@example.fr`;

    await registerCabinet(page, { cabinetName: "Cabinet Tâches Iso", name: "Alice Admin", email: adminEmail });
    const tenantId = await getTenantId(adminEmail);

    await page.goto("/tasks/new");
    await page.getByLabel("Titre").fill("Tâche Alice");
    await page.getByRole("button", { name: "Créer la tâche" }).click();
    await expect(page).toHaveURL("/tasks");

    await logout(page);
    await registerCabinet(page, { cabinetName: "Cabinet Bob Tâches", name: "Bob CGP", email: cgpEmail });
    await moveToTenantAsCgp(cgpEmail, tenantId);

    await logout(page);
    await login(page, cgpEmail);

    await page.goto("/tasks?view=all");
    await expect(page.getByText("Tâche Alice")).toHaveCount(0);

    await page.goto("/tasks/new");
    await page.getByLabel("Titre").fill("Tâche Bob");
    await page.getByRole("button", { name: "Créer la tâche" }).click();
    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Tâche Bob")).toBeVisible();
    await expect(page.getByText("Tâche Alice")).toHaveCount(0);

    await logout(page);
    await login(page, adminEmail);

    await page.goto("/tasks?view=all");
    await expect(page.getByText("Tâche Alice")).toBeVisible();
    await expect(page.getByText("Tâche Bob")).toBeVisible();
  });
});
