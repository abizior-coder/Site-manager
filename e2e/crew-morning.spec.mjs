// A crew member's morning in a real browser: sign in, the phone bar, the «+»
// sheet, a job's hub, sign out.
import { test, expect } from "@playwright/test";
import { signIn, signOut } from "./helpers.mjs";

test("crew: sign in, the «+» sheet, a job's hub, sign out", async ({ page }) => {
  await signIn(page, "crew");
  await expect(page.locator('[data-tab-bar] [data-tab="today"]')).toBeVisible();
  await expect(page.locator("[data-first-steps]")).toHaveCount(0);

  await page.locator("[data-quick-add-button]").click();
  const sheet = page.locator("[data-quick-add]");
  await expect(sheet).toHaveAttribute("role", "dialog");
  await expect(sheet.locator("[data-quick-action]")).toHaveCount(6);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);

  await page.locator('[data-tab="projects"]').click();
  await page
    .getByRole("button", { name: /Steildach Lettenring/ })
    .first()
    .click();
  const hub = page.locator("[data-hub-tabs]");
  await expect(hub).toBeVisible();
  await expect(page.locator('[data-hub-tab="chat"]')).toBeVisible();
  await page.locator('[data-hub-tab="material"]').click();
  await expect(page.locator('[role="dialog"] button[aria-label="Löschen"]').first()).toBeVisible();
  await page.keyboard.press("Escape");

  await signOut(page);
});
