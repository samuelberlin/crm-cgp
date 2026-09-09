import { expect, test } from "@playwright/test";
import { createContact, registerCabinet, withDb } from "./helpers";

test.describe("automations", () => {
  test("sets custom delays and triggers the three event-based automations", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Auto", name: "Alice Admin", email });

    await page.goto("/settings");
    await page.locator('input[name="firstContactDelayDays"]').fill("0");
    await page.locator('input[name="meetingReportDelayDays"]').fill("0");
    await page.locator('input[name="proposalFollowUpDelayDays"]').fill("0");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Paramètres enregistrés.")).toBeVisible();

    // New prospect → automatic "Premier contact" task.
    await createContact(page, "Marc", "Petit");
    const contactUrl = page.url();
    await expect(page.getByRole("link", { name: "Premier contact" })).toBeVisible();
    await expect(page.getByText("Tâche automatique créée : Premier contact")).toBeVisible();

    // Meeting completed → automatic "Envoyer le compte rendu" task.
    await page.getByRole("link", { name: "Planifier rendez-vous" }).click();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await page.getByLabel("Date et heure").fill(future);
    await page.getByRole("button", { name: "Planifier le rendez-vous" }).click();
    await expect(page).toHaveURL(contactUrl);

    await page.goto("/agenda");
    const meetingRow = page.locator("li", { hasText: "Marc Petit" });
    await meetingRow.getByLabel("Changer le statut").selectOption("REALISE");
    await expect(meetingRow.getByRole("link", { name: "Ajouter un compte-rendu →" })).toBeVisible();
    await page.goto(contactUrl);
    await expect(page.getByRole("link", { name: "Envoyer le compte rendu" })).toBeVisible();
    await expect(page.getByText("Tâche automatique créée : Envoyer le compte rendu")).toBeVisible();

    // Opportunity moved to Proposition → automatic follow-up task.
    await page.getByRole("link", { name: "Créer opportunité" }).click();
    await page.getByLabel("Titre").fill("PER Marc");
    await page.getByRole("button", { name: "Créer l'opportunité" }).click();
    await expect(page).toHaveURL(contactUrl);

    await page.getByRole("link", { name: "PER Marc" }).click();
    await page.getByLabel("Étape").selectOption("PROPOSITION");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page).toHaveURL(contactUrl);

    await expect(page.getByRole("link", { name: "Relancer : PER Marc" })).toBeVisible();
    await expect(page.getByText("Tâche automatique créée : Relancer PER Marc")).toBeVisible();
  });

  test("flags a contact untouched past the inactivity threshold", async ({ page }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Inactif", name: "Alice Admin", email });
    await createContact(page, "Vieux", "Client");

    await withDb((client) =>
      client.query(
        'UPDATE "contact" SET "createdAt" = NOW() - INTERVAL \'40 days\' WHERE "firstName" = $1 AND "lastName" = $2',
        ["Vieux", "Client"],
      ),
    );

    await page.goto("/contacts");
    await expect(
      page.locator("tr", { hasText: "Vieux Client" }).getByText("Inactif"),
    ).toBeVisible();

    await page.goto("/");
    await expect(page.getByText("Clients inactifs")).toBeVisible();
    await expect(page.getByRole("link", { name: "Vieux Client" })).toBeVisible();
  });
});
