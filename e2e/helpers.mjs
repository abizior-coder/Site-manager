// The seeded firm (scripts/seed-emulator.mjs): a public localhost fixture.
export const APP = "/index.html?emulator=1";
export const USERS = {
  chef: { email: "chef@test.local", password: "test1234" },
  crew: { email: "crew1@test.local", password: "test1234" },
};

export async function signIn(page, who) {
  await page.goto(APP);
  await page.getByPlaceholder("E-Mail").fill(USERS[who].email);
  await page.getByPlaceholder("Passwort").fill(USERS[who].password);
  await page.getByRole("button", { name: /anmelden/i }).click();
  await page.locator("[data-tab-bar]").waitFor({ timeout: 30_000 });
}

export async function signOut(page) {
  await page.locator('[data-tab="more"]').click();
  await page.getByRole("button", { name: "Mein Profil" }).click();
  await page.getByRole("button", { name: /Abmelden/ }).click();
  await page.getByPlaceholder("Passwort").waitFor();
}
