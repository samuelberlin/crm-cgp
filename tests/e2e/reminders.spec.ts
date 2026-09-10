import { expect, test } from "@playwright/test";
import { registerCabinet } from "./helpers";

test.describe("échéances importantes", () => {
  test("les rappels par défaut apparaissent sur le dashboard, et un ADMIN peut en ajouter et en supprimer", async ({
    page,
  }) => {
    const email = `owner+${Date.now()}@example.fr`;
    await registerCabinet(page, { cabinetName: "Cabinet Échéances", name: "Alice Admin", email });

    await expect(page.getByText("Échéances importantes")).toBeVisible();
    await expect(
      page.getByText("Date limite de versement PER (déduction fiscale de l'année)"),
    ).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByText("31 décembre, chaque année")).toBeVisible();

    await page.getByPlaceholder("Libellé du rappel").fill("Renouvellement assurance RC Pro");
    await page.locator('select[name="month"]').selectOption("3");
    await page.getByPlaceholder("Jour").fill("15");
    await page.getByRole("button", { name: "Ajouter le rappel" }).click();

    await expect(page.getByText("Renouvellement assurance RC Pro")).toBeVisible();
    await expect(page.getByText("15 mars, chaque année")).toBeVisible();

    await page
      .locator("li", { hasText: "Renouvellement assurance RC Pro" })
      .getByRole("button", { name: "Supprimer" })
      .click();
    await expect(page.getByText("Renouvellement assurance RC Pro")).toHaveCount(0);
  });
});
