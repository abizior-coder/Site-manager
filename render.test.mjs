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
  // Weather reads `current`; the AI proxy (scans, translations) reads `text`.
  window.fetch = async () => ({ ok: true, json: async () => ({ current: {}, text: '{"de":"ÜBERSETZT: Regen","en":"TRANSLATED: rain","sq":"PËRKTHYER: shi"}' }) });
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
      // A photo opens full-screen and can be marked up; the editor's toolbar
      // is there even though jsdom cannot decode the image.
      {
        const thumb = window.document.querySelector("[data-photo-thumb]");
        check("owner: a photo thumbnail is tappable", !!thumb, "no photo thumbnail in the job view");
        thumb?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 300));
        check("owner: tapping opens the photo viewer", !!window.document.querySelector("[data-photo-viewer]"), "viewer did not open");
        window.document.querySelector("[data-photo-edit]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 200));
        const editor = window.document.querySelector("[data-photo-editor]");
        check("owner: the pen opens the editor", !!editor, "editor did not open");
        check("owner: the editor offers pen, arrow, box, circle and text", ["pen", "arrow", "rect", "circle", "text"].every((k) => !!window.document.querySelector(`[data-photo-tool="${k}"]`)), "a tool is missing");
        [...(editor?.querySelectorAll("button") || [])].find((b) => (b.textContent || "").trim() === "Zurück")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 150));
        [...window.document.querySelectorAll("[data-photo-viewer] button")].pop()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 150));
      }

      // A note in one language is read in another: one tap, and the
      // translation sits under the original.
      {
        // The stub job has no note yet: write one through the composer first.
        const ta = window.document.querySelector('textarea[placeholder*="Notiz"], textarea[placeholder*="note"]');
        if (ta) {
          const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          set.call(ta, "Shi nga ora 14, puna u ndërpre");
          ta.dispatchEvent(new window.Event("input", { bubbles: true }));
          const sendBtns = ta.parentElement.querySelectorAll("button");
          sendBtns[sendBtns.length - 1]?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 250));
        }
        // Saved in Albanian, read in German: the translation is there before
        // anyone taps anything.
        await new Promise((r) => setTimeout(r, 300));
        check("owner: a saved note is translated on its own", text().includes("ÜBERSETZT: Regen"), "no automatic translation after saving");
        check("owner: a translated note needs no button", !window.document.querySelector("[data-translate]"), "translate button still offered although translated");
      }

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

  // Two taps mark the two breaks of a site day; the second tap unmarks.
  {
    const heute = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Heute");
    heute?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const chip = () => window.document.querySelector('[data-break="mittag"]');
    check("owner: Today offers the two break tiles", !!chip() && !!window.document.querySelector('[data-break="znuni"]'), "no break tiles on Today");
    chip()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check("owner: marking lunch logs a break", /Pause\s*\(1\)/.test(text()), "no break entry after marking lunch");
    chip()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check("owner: a second tap unmarks it", !/Pause\s*\(1\)/.test(text()), "break still logged after unmarking");
  }

  // The roof inspection starts from the job: tiles to tap, the replaced
  // tiles with a model and a count, and a save that needs no AI.
  {
    const closeModal = () => window.document.querySelector("div.fixed.inset-0 > div.absolute.inset-0")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const setValue = (el, v) => {
      if (!el) return;
      const proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new window.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    };
    closeModal();
    await new Promise((r) => setTimeout(r, 150));
    const heute = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Heute");
    heute?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check("owner: Today no longer carries the inspection button", !/Neue Dachinspektion|New roof inspection/.test(text()), "inspection button still on Today");
    const projTab = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim().toUpperCase() === "PROJEKTE");
    projTab?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const jobBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Trockenbau"));
    jobBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const open = window.document.querySelector("[data-inspect-open]");
    check("owner: the job view offers the roof inspection", !!open, "no inspection button in the job view");
    open?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const tile = () => window.document.querySelector('[data-inspect-tile="first"]');
    check("owner: the inspection shows checklist tiles", !!tile() && window.document.querySelectorAll("[data-inspect-tile]").length === 13, `${window.document.querySelectorAll("[data-inspect-tile]").length} tiles`);
    tile()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 100));
    tile()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    check("owner: two taps mark a tile as a defect", /MANGEL/i.test(tile()?.textContent || ""), (tile()?.textContent || "").slice(0, 40));
    setValue(window.document.querySelector("[data-tile-model]"), "biber");
    await new Promise((r) => setTimeout(r, 150));
    setValue(window.document.querySelector("[data-tile-count]"), "100");
    await new Promise((r) => setTimeout(r, 200));
    check("owner: replaced tiles show their waste weight", /200 kg/.test(window.document.querySelector("[data-waste-kg]")?.textContent || ""), window.document.querySelector("[data-waste-kg]")?.textContent || "no waste line");
    const before = errors.length;
    window.document.querySelector("[data-inspect-save]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const card = window.document.querySelector("[data-job-inspections]");
    check("owner: saving without the AI logs the inspection in the job view", errors.length === before && !window.document.querySelector("[data-inspect-save]") && /Mangel: First/.test(card?.textContent || "") && /200 kg/.test(card?.textContent || ""), errors.slice(before, before + 1).join(" | ") || (card ? (card.textContent || "").slice(0, 120) : "no inspections card in the job view"));

    // Transport: a trip with times, a load and, for waste, the weight the
    // inspection left on the roof.
    const tBtn = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Transport");
    check("owner: Transport is in the menu", !!tBtn, "no Transport button in the sidebar");
    tBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    window.document.querySelector("[data-trip-add]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check("owner: the trip form opens", !!window.document.querySelector("[data-trip-save]"), "no trip form");
    const sel = window.document.querySelector("[data-trip-project]");
    const opt = sel ? [...sel.options].find((o) => o.textContent.includes("Trockenbau")) : null;
    setValue(sel, opt?.value || "");
    await new Promise((r) => setTimeout(r, 150));
    setValue(window.document.querySelector("[data-trip-from]"), "Werkhof");
    setValue(window.document.querySelector("[data-trip-to]"), "Deponie Rümlang");
    setValue(window.document.querySelector("[data-trip-depart]"), "07:00");
    setValue(window.document.querySelector("[data-trip-arrive]"), "08:30");
    await new Promise((r) => setTimeout(r, 200));
    check("owner: the trip's hours come from the two times", /1\.5 h/.test(window.document.querySelector("[data-trip-hours]")?.textContent || ""), window.document.querySelector("[data-trip-hours]")?.textContent || "no hours line");
    window.document.querySelector('[data-trip-load="waste"]')?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check("owner: a waste trip is offered the inspection's weight", window.document.querySelector("[data-trip-weight]")?.value === "200" && /200 kg/.test(window.document.querySelector("[data-trip-waste-hint]")?.textContent || ""), `weight=${window.document.querySelector("[data-trip-weight]")?.value} hint=${window.document.querySelector("[data-trip-waste-hint]")?.textContent}`);
    const b2 = errors.length;
    window.document.querySelector("[data-trip-save]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const rows = window.document.querySelectorAll("[data-trip-row]");
    check("owner: the trip lands in the list", errors.length === b2 && rows.length === 1 && /Werkhof → Deponie Rümlang/.test(rows[0]?.textContent || "") && /1\.5 h/.test(rows[0]?.textContent || ""), errors.slice(b2, b2 + 1).join(" | ") || `${rows.length} rows: ${(rows[0]?.textContent || "").slice(0, 80)}`);
    check("owner: the month totals count it", /1\.5/.test(text()) && /200/.test(text()), "totals missing");
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
      check("owner: can remove a crew member", !!window.document.querySelector("[data-remove-member]"), "no remove button for the owner");
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
    check("crew: the menu lists Transport", items.includes("Transport"), items.join(" | "));
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
    check("crew: cannot remove anyone", !window.document.querySelector("[data-remove-member]"), "crew offered a remove button");
  }
  if (errors.length) problems.push(...errors);
}

if (problems.length) {
  console.log("\n--- first errors ---");
  problems.slice(0, 5).forEach((e) => console.log(e.slice(0, 400)));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
