// Renders the SIGNED-IN app against stubbed auth and data.
//
// Every crash so far has been in the authenticated path, which cannot be
// reached from a signed-out browser — so it kept reaching the user instead of
// a test. This walks the tabs a person actually uses and fails on any React
// error or uncaught exception.

import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";

const ENTRY = "./.render-entry.jsx";
const OUT = "./.render-bundle.js";

writeFileSync(ENTRY, `
import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { setStubRole } from "./test-stubs/company-store.js";
window.__setRole = setStubRole;
window.__mount = () => createRoot(document.getElementById("root")).render(<SiteManager />);
`);

await build({
  entryPoints: [ENTRY],
  outfile: OUT,
  bundle: true,
  format: "iife",
  jsx: "automatic",
  logLevel: "silent",
  plugins: [{
    // esbuild's `alias` option rejects relative specifiers, so redirect the
    // two modules that talk to Firebase at resolve time instead.
    name: "stub-firebase",
    setup(b) {
      b.onResolve({ filter: /(firebase-client|company-store)\.js$/ }, (args) => {
        if (args.importer.includes("test-stubs")) return null;
        const name = args.path.includes("firebase-client") ? "firebase-client.js" : "company-store.js";
        return { path: new URL(`./test-stubs/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") };
      });
    },
  }],
});

const code = readFileSync(OUT, "utf8");
unlinkSync(ENTRY);
unlinkSync(OUT);

let pass = 0, fail = 0;
const problems = [];

function check(name, ok, detail) {
  console.log((ok ? "ok   " : "FAIL ") + name + (ok || !detail ? "" : ` — ${detail}`));
  ok ? pass++ : fail++;
}

async function renderAs(role) {
  const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
    url: "https://example.test/",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const { window } = dom;

  const errors = [];
  window.addEventListener("error", (e) => errors.push(String(e.error || e.message)));
  window.console.error = (...a) => errors.push(a.map(String).join(" "));
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  window.fetch = async () => ({ ok: true, json: async () => ({ current: {} }) });
  window.scrollTo = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.navigator.geolocation = { getCurrentPosition: () => {} };
  window.open = () => null; // sending a report opens the mail app

  dom.window.eval(code);
  dom.window.__setRole(role);
  dom.window.__mount();

  // let effects and the stubbed async loads settle
  await new Promise((r) => setTimeout(r, 400));
  return { window, errors, text: () => window.document.body.textContent || "" };
}

// --- owner ---------------------------------------------------------------
{
  const { window, errors, text } = await renderAs("owner");
  check("owner: app renders something", text().length > 50, `only ${text().length} chars — blank screen`);
  check("owner: no React or runtime errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  check("owner: shows a project from the store", text().includes("Trockenbau"), text().slice(0, 120));

  // Walk the tabs. A crash in any of these is what a blank screen looks like.
  const tabs = ["MATERIAL", "KUNDEN", "KALENDER", "PROJEKTE", "BERICHTE"];
  for (const label of tabs) {
    const btn = [...window.document.querySelectorAll("button")].find((b) => (b.textContent || "").trim().toUpperCase() === label);
    if (!btn) { check(`owner: tab ${label} exists`, false, "button not found"); continue; }
    const before = errors.length;
    btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check(`owner: tab ${label} renders`, errors.length === before && (window.document.body.textContent || "").length > 50,
      errors.slice(before, before + 1).join(" | "));
  }
  // Sending the same day twice used to make two reports, both mailed. It is
  // one record now, with a send history.
  {
    const tabBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim().toUpperCase() === "BERICHTE");
    tabBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const send = () => [...window.document.querySelectorAll("button")].find((x) => /An Vorgesetzten senden|Send to supervisor/.test(x.textContent || ""));
    const closeModal = () => window.document.querySelector("div.fixed.inset-0 > div.absolute.inset-0")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    send()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    closeModal();
    await new Promise((r) => setTimeout(r, 150));
    send()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    closeModal();
    await new Promise((r) => setTimeout(r, 150));
    const rows = [...window.document.querySelectorAll("button")].filter((x) => /^(Täglich|Daily) · /.test((x.textContent || "").trim()));
    check("owner: sending a day twice yields one report", rows.length === 1, `${rows.length} report rows`);
    check("owner: the report shows it went out twice", /gesendet 2×|sent 2×/.test(rows[0]?.textContent || ""), (rows[0]?.textContent || "").slice(0, 120));
  }

  // The price-list import is owner-only and writes the prices that end up on
  // invoices, so at minimum it has to be reachable.
  {
    const matTab = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim().toUpperCase() === "MATERIAL");
    matTab?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check("owner: article master card is offered", text().includes("Unsere Artikel"), "no article master card");
    check("owner: price list can be imported", text().includes("Preisliste importieren"), "no import button");
  }

  // The job view is the busiest screen in the app and nothing was opening it,
  // so a crash in the crew drop zone or the material composer would have gone
  // out unnoticed.
  {
    const projTab = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim().toUpperCase() === "PROJEKTE");
    projTab?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const jobBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Trockenbau"));
    check("owner: a job can be opened", !!jobBtn, "no project button found");
    if (jobBtn) {
      const before = errors.length;
      jobBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 250));
      check("owner: job view renders", errors.length === before, errors.slice(before, before + 1).join(" | "));
      check("owner: job view offers the crew drop zone", /Mannschaft|Crew/i.test(text()), "no crew section in the job view");
      check("owner: job view offers plans and documents", /Pläne & Dokumente|Plans & documents/.test(text()), "no files section in the job view");
      // The day starts inside the job now, not from a list on Today.
      {
        const start = window.document.querySelector("[data-day-start]");
        check("owner: job view offers to start the day here", !!start, "no start button in the job view");
        start?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        check("owner: starting turns into a stop button", !!window.document.querySelector("[data-day-stop]"), "no stop button after starting");
        window.document.querySelector("[data-day-stop]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        check("owner: stopping brings the start button back", !!window.document.querySelector("[data-day-start]"), "start button missing after stop");
      }

      const matBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Material");
      if (matBtn) {
        const b2 = errors.length;
        matBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        check("owner: material composer opens", errors.length === b2, errors.slice(b2, b2 + 1).join(" | "));
        check("owner: composer asks for a supplier", text().includes("Lieferant"), "no supplier field");
        check("owner: composer asks for a trade", text().includes("Spengler"), "no trade picker");
      } else {
        check("owner: material button exists in the job view", false, "not found");
      }
    }
  }

  // The team roster is a sidebar tab, so the mobile-label walk above never
  // reaches it. It is also where crew get attached to jobs, so a crash here
  // silently costs the Polier the feature.
  {
    const teamBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Team");
    check("owner: team tab exists in the menu", !!teamBtn, "no Team button in the sidebar");
    if (teamBtn) {
      const before = errors.length;
      teamBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 250));
      check("owner: team tab renders the roster", errors.length === before && text().includes("Mitarbeiter"),
        errors.slice(before, before + 1).join(" | ") || text().slice(0, 150));
      check("owner: roster offers a job to assign to", text().includes("Trockenbau"), "no project offered in the add-to-job picker");
    }
  }

  if (errors.length) problems.push(...errors);
}

// --- supervisor ----------------------------------------------------------
{
  const { window, errors, text } = await renderAs("supervisor");
  check("supervisor: app renders something", text().length > 50, `only ${text().length} chars — blank screen`);
  check("supervisor: no React or runtime errors", errors.length === 0, errors.slice(0, 2).join(" | "));

  // The overview must open for them, and must not carry the money.
  const btn = [...window.document.querySelectorAll("button")].find((b) => b.getAttribute("title"));
  if (btn) {
    btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
  }
  const t = text();
  check("supervisor: no invoice numbers", !t.includes("R-2026-001"), "invoice number visible");
  check("supervisor: no labour rate", !t.includes("85.00") && !t.includes("CHF 85"), "labour rate visible");
  check("supervisor: no margin figures", !t.includes("Marge") && !t.includes("Margin"), "margin visible");
  if (errors.length) problems.push(...errors);
}

// --- crew ----------------------------------------------------------------
{
  const { window, errors, text } = await renderAs("crew");
  check("crew: app renders something", text().length > 50, `only ${text().length} chars — blank screen`);
  check("crew: no React or runtime errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  check("crew: money is not shown", !text().includes("R-2026-001"), "an invoice number leaked into the crew view");
  check("crew: no overview button", ![...window.document.querySelectorAll("button")].some((b) => (b.getAttribute("title") || "").match(/Übersicht|Overview/)), "crew can reach the overview");
  // On a phone the bottom bar has six tabs and the sidebar is hidden, so
  // Team and Sicherheit are only reachable through the hamburger.
  {
    const burger = window.document.querySelector("[data-menu-button]");
    check("crew: header has a menu button", !!burger, "no hamburger");
    burger?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const drawer = window.document.querySelector("[data-menu-drawer]");
    const items = [...(drawer?.querySelectorAll("button") || [])].map((b) => (b.textContent || "").trim());
    check("crew: the menu lists Team and Sicherheit", items.includes("Team") && items.includes("Sicherheit"), items.join(" | "));
    check("crew: the menu does not offer the Board", !items.includes("Board"), "Board offered to crew");
    const team = [...(drawer?.querySelectorAll("button") || [])].find((b) => (b.textContent || "").trim() === "Team");
    team?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check("crew: choosing an item closes the menu", !window.document.querySelector("[data-menu-drawer]"), "drawer still open");
  }

  // The roster used to load only for managers and only on three tabs, so a
  // crew member opened Team and saw nobody -- and the crew shown on a job,
  // looked up by uid in that roster, came out as "nobody assigned" while the
  // Polier had just assigned two people.
  {
    const teamBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Team");
    teamBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check("crew: team tab lists the roster", text().includes("Mitarbeiter") && text().includes("Chef"), "roster empty for crew");
    check("crew: cannot attach people to jobs", !/Zu Baustelle hinzuf|Add to a job/.test(text()), "crew offered the add-to-job picker");
  }
  if (errors.length) problems.push(...errors);
}

if (problems.length) {
  console.log("\n--- first errors ---");
  problems.slice(0, 5).forEach((e) => console.log(e.slice(0, 400)));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
