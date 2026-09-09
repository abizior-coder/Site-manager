// A crew member's morning in a real browser: sign in, the phone bar, the «+»
// sheet, a job's hub, sign out.
import { test, expect } from "@playwright/test";
import { APP, signIn, signOut } from "./helpers.mjs";

// The language is a crew member's own choice, before any account exists, and
// the device remembers it across a reload.
test("sign-in screen: the language picker works before signing in and is remembered", async ({ page }) => {
  await page.goto(APP);
  const picker = page.locator("[data-auth-lang]");
  await expect(picker).toBeVisible();
  await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  await picker.selectOption("sq");
  await expect(page.getByRole("button", { name: "Hyr" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "sq");
  await page.reload();
  await expect(page.getByRole("button", { name: "Hyr" })).toBeVisible();
  await page.locator("[data-auth-lang]").selectOption("de");
  await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
});

// docs/specs/2026-09-09_public-demo.md: a visitor can try the app without
// a real account, and the control is gone the moment anyone is signed in
// — real or the demo's own fake user.
test("sign-in screen: the Demo control opens the demo and disappears once signed in", async ({ page }) => {
  await page.goto(APP);
  const demo = page.getByRole("link", { name: "Demo ausprobieren" });
  await expect(demo).toBeVisible();
  // The visible text is smaller than 24 px (text-xs); the actual hit area
  // is the app's established .tap pseudo-element (44x44, tailwind.src.css),
  // the same mechanism every other small text control on this screen uses
  // -- a bounding-box measurement would see only the text, not the target.
  await expect(demo).toHaveClass(/\btap\b/);
  await demo.click();
  await expect(page).toHaveURL(/demo=1/);
  await expect(page.locator('[data-tab-bar] [data-tab="today"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo ausprobieren" })).toHaveCount(0);
});

test("crew: sign in, the «+» sheet, a job's hub, sign out", async ({ page }) => {
  await signIn(page, "crew");
  await expect(page.locator('[data-tab-bar] [data-tab="today"]')).toBeVisible();
  await expect(page.locator("[data-first-steps]")).toHaveCount(0);
  await expect(page.locator("[data-demo-button]")).toHaveCount(0); // gone once a real account is signed in

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
