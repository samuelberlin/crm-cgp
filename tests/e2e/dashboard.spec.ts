import { expect, test } from "@playwright/test";
import { createContact, registerCabinet } from "./helpers";

test.describe("dashboard", () => {
  test("shows the real pipeline, an overdue task as the next best action, and reacts to completing it", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Dashboard", name: "Alice Admin", email });

    await expect(page.getByText("Rien d'urgent aujourd'hui.")).toBeVisible();
    await expect(page.getByText("Aucune tâche en cours.")).toBeVisible();
    await expect(page.getByText("Aucune relance planifiée.")).toBeVisible();
    await expect(page.getByText("Aucune opportunité en cours.")).toBeVisible();

    await createContact(page, "Marc", "Petit");
    const contactUrl = page.url();

    // An overdue task.
    await page.getByRole("link", { name: "Ajouter une tâche" }).click();
    await page.getByLabel("Titre").fill("Envoyer le DER");
    await page.getByLabel("Échéance").fill("2020-01-01");
    await page.getByRole("button", { name: "Créer la tâche" }).click();
    await expect(page).toHaveURL(contactUrl);

    // An opportunity for the pipeline widgets.
    await page.getByRole("link", { name: "Créer opportunité" }).click();
    await page.getByLabel("Titre").fill("PER Marc");
    await page.getByLabel("Montant potentiel (€)").fill("40000");
    await page.getByLabel("Probabilité (%)").fill("50");
    await page.getByRole("button", { name: "Créer l'opportunité" }).click();
    await expect(page).toHaveURL(contactUrl);

    await page.goto("/");

    await expect(page.getByText("Envoyer le DER").first()).toBeVisible();
    await expect(page.getByText(/En retard de \d+ jours?/)).toBeVisible();
    await expect(page.getByText("PER Marc")).toBeVisible();
    await expect(page.getByText(/40.?000.?€/).first()).toBeVisible(); // pipeline total
    await expect(page.getByText(/20.?000.?€/).first()).toBeVisible(); // weighted (50%)

    await page.getByRole("button", { name: "Terminer" }).click();
    await expect(page.getByText("Rien d'urgent aujourd'hui.")).toBeVisible();
  });
});
