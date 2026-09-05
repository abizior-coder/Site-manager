// The owner's Cockpit in a real browser: the cards that carry the business.
import { test, expect } from "@playwright/test";
import { signIn, signOut } from "./helpers.mjs";

test("owner: the Cockpit shows usage, errors, backup and the accounting export", async ({ page }) => {
  await signIn(page, "chef");
  await expect(page.locator("[data-first-steps]")).toBeVisible();

  await page.locator('[data-tab="more"]').click();
  await page.getByRole("button", { name: "Übersicht" }).click();
  await expect(page.locator("[data-usage-card]")).toBeVisible();
  await expect(page.locator("[data-errors-card]")).toBeVisible();
  await expect(page.locator("[data-backup-card]")).toBeVisible();
  const exportCard = page.locator("[data-export-card]");
  await expect(exportCard).toBeVisible();
  await expect(exportCard.locator("[data-export-month]")).toHaveValue(/^\d{4}-\d{2}$/);
  await expect(exportCard.locator("[data-export]")).toHaveCount(5);

  await signOut(page);
});
