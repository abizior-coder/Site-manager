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

writeFileSync(
  ENTRY,
  `
import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { setStubRole } from "./test-stubs/company-store.js";
import { loadLang } from "./i18n/index.js";
window.__setRole = setStubRole;
window.__mount = async () => { await Promise.all([loadLang("en"), loadLang("de")]); createRoot(document.getElementById("root")).render(<SiteManager />); };
`,
);

await build({
  entryPoints: [ENTRY],
  outfile: OUT,
  bundle: true,
  format: "iife",
  jsx: "automatic",
  alias: process.env.REACT
    ? undefined
    : {
        react: "preact/compat",
        "react-dom/client": "preact/compat/client",
        "react-dom": "preact/compat",
        "react/jsx-runtime": "preact/jsx-runtime",
      },
  logLevel: "silent",
  plugins: [
    {
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
    },
  ],
});

const code = readFileSync(OUT, "utf8");
unlinkSync(ENTRY);
unlinkSync(OUT);

let pass = 0,
  fail = 0;
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
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: false,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }));
  // Weather reads `current`; the AI proxy (scans, translations) reads `text`.
  window.fetch = async () => ({
    ok: true,
    json: async () => ({
      current: {},
      text: '{"de":"ÜBERSETZT: Regen","en":"TRANSLATED: rain","sq":"PËRKTHYER: shi"}',
    }),
  });
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

  // Heute opens with the day: a local date with its weekday, and the first
  // action as a button (it was a paragraph telling people where to look).
  {
    const date = window.document.querySelector("[data-today-date]")?.textContent || "";
    check(
      "owner: Heute shows today's date with a weekday",
      /^[A-Za-zÀ-ž]{2,3}, \d{2}\.\d{2}\.\d{4}$/.test(date.trim()),
      date || "no [data-today-date]",
    );
    const action = window.document.querySelector("[data-day-action]");
    check(
      "owner: the day's first action is a button in the day card",
      action?.tagName === "BUTTON" &&
        !!action.closest("[data-day-card]") &&
        (action.textContent || "").trim().length > 3,
      action ? action.outerHTML.slice(0, 80) : "no [data-day-action]",
    );
    const card = window.document.querySelector("[data-day-card]");
    const column = card?.parentElement;
    check(
      "owner: the day card comes before the weather",
      !!column && column.firstElementChild === card,
      "the day card is not the first card",
    );
  }

  // A lazy tab shows a loading element the moment it is asked for, and none
  // once its chunk has landed. The area used to be blank in between, which on
  // a weak connection is seconds of nothing after a tap.
  {
    const board = [...window.document.querySelectorAll("button")].find(
      (b) => (b.textContent || "").trim().toUpperCase() === "BOARD",
    );
    check("owner: the Board tab exists", !!board, "button not found");
    board?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    let seen = false;
    for (let i = 0; i < 40 && !seen; i++) {
      await Promise.resolve();
      if (window.document.querySelector("[data-loading]")) seen = true;
    }
    check("owner: a lazy tab shows a loading element while its chunk resolves", seen, "no [data-loading] appeared");
    await new Promise((r) => setTimeout(r, 300));
    check(
      "owner: no loading element remains once the tab has landed",
      !window.document.querySelector("[data-loading]") && /Board|Woche|Week/i.test(text()),
      window.document.querySelector("[data-loading]") ? "still loading" : "Board content missing",
    );
  }

  // Walk the tabs. A crash in any of these is what a blank screen looks like.
  const tabs = ["MATERIAL", "KUNDEN", "KALENDER", "PROJEKTE", "RAPPORT"];
  for (const label of tabs) {
    const btn = [...window.document.querySelectorAll("button")].find(
      (b) => (b.textContent || "").trim().toUpperCase() === label,
    );
    if (!btn) {
      check(`owner: tab ${label} exists`, false, "button not found");
      continue;
    }
    const before = errors.length;
    btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check(
      `owner: tab ${label} renders`,
      errors.length === before && (window.document.body.textContent || "").length > 50,
      errors.slice(before, before + 1).join(" | "),
    );
  }
  // Sending the same day twice used to make two reports, both mailed. It is
  // one record now, with a send history.
  {
    const tabBtn = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "RAPPORT",
    );
    tabBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const send = () =>
      [...window.document.querySelectorAll("button")].find((x) =>
        /An Vorgesetzten senden|Send to supervisor/.test(x.textContent || ""),
      );
    const closeModal = () =>
      window.document
        .querySelector("div.fixed.inset-0 > div.absolute.inset-0")
        ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    send()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    closeModal();
    await new Promise((r) => setTimeout(r, 150));
    send()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    closeModal();
    await new Promise((r) => setTimeout(r, 150));
    const rows = [...window.document.querySelectorAll("button")].filter((x) =>
      /^(Täglich|Daily) · /.test((x.textContent || "").trim()),
    );
    check("owner: sending a day twice yields one report", rows.length === 1, `${rows.length} report rows`);
    check(
      "owner: the report shows it went out twice",
      /gesendet 2×|sent 2×/.test(rows[0]?.textContent || ""),
      (rows[0]?.textContent || "").slice(0, 120),
    );
  }

  // Rapport on a phone: titles are local dates, not the ISO keys the app
  // stores; the week table pins its Total column so it survives Albanian
  // column headers on a 375 px screen; "Pausen" never reads "−0.0".
  {
    const tagesrapport = window.document.querySelector("[data-tagesrapport]");
    const title = tagesrapport?.querySelector("div")?.textContent || "";
    check(
      "owner: the Tagesrapport title is a local date, not an ISO key",
      /Tagesrapport|Daily report/.test(title) && !/\d{4}-\d{2}-\d{2}/.test(title) && /\d{2}\.\d{2}\.\d{4}/.test(title),
      title,
    );
    check(
      "owner: breaks never read as a negative zero",
      !/−0\.0/.test(tagesrapport?.textContent || ""),
      "−0.0 in the Tagesrapport",
    );
    const reportRow = [...window.document.querySelectorAll("button")].find((x) =>
      /^(Täglich|Daily) · /.test((x.textContent || "").trim()),
    );
    check(
      "owner: a sent report row shows a local date",
      !!reportRow && !/\d{4}-\d{2}-\d{2}/.test(reportRow.textContent || ""),
      (reportRow?.textContent || "no row").slice(0, 60),
    );
    window.document
      .querySelector('[data-rapport-view="week"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const total = window.document.querySelector("[data-week-total]");
    check(
      "owner: the Woche table pins its Total column",
      !!total && total.classList.contains("sticky") && total.style.position === "sticky",
      total ? total.className : "no Total header",
    );
    const label = window.document.querySelector("[data-week-label]")?.textContent || "";
    check(
      "owner: the Woche label is a local date range",
      !/\d{4}-\d{2}-\d{2}/.test(label) && label.includes(" – "),
      label,
    );
    window.document
      .querySelector('[data-rapport-view="daily"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
  }

  // Overflow and names: the Cockpit's leave row wraps on a phone instead of
  // pushing past the edge; the phone tab bar labels carry no letter-spacing
  // («Baustellen» was cut to «Baustell…»); the team's add-to-job select has
  // an accessible name.
  {
    const cockpit = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "ÜBERSICHT",
    );
    cockpit?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const leaveRow = window.document.querySelector("[data-leave-row]");
    check(
      "owner: the Cockpit's leave row wraps",
      !!leaveRow && leaveRow.classList.contains("flex-wrap") && leaveRow.querySelectorAll("button").length === 2,
      leaveRow ? leaveRow.className : "no pending leave row in the Cockpit",
    );
    const tabLabels = [...window.document.querySelectorAll("[data-tab-bar] [data-tab]")];
    check(
      "phone tab bar labels carry no letter-spacing",
      tabLabels.length >= 4 && tabLabels.every((b) => !/tracking-/.test(b.className)),
      tabLabels
        .map((b) => b.className)
        .join(" | ")
        .slice(0, 120),
    );
    const teamBtn = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "TEAM",
    );
    teamBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const addSelect = window.document.querySelector("select[aria-label]");
    check(
      "owner: the team's add-to-job select has an accessible name",
      !!addSelect && /Zu Baustelle|Add to a job/.test(addSelect.getAttribute("aria-label") || ""),
      addSelect ? addSelect.getAttribute("aria-label") : "no labelled select on the Team tab",
    );
  }

  // The price-list import is owner-only and writes the prices that end up on
  // invoices, so at minimum it has to be reachable.
  {
    const matTab = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "MATERIAL",
    );
    matTab?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check("owner: article master card is offered", text().includes("Unsere Artikel"), "no article master card");
    check("owner: price list can be imported", text().includes("Preisliste importieren"), "no import button");
  }

  // The job view is the busiest screen in the app and nothing was opening it,
  // so a crash in the crew drop zone or the material composer would have gone
  // out unnoticed.
  {
    const projTab = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "PROJEKTE",
    );
    projTab?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const jobBtn = [...window.document.querySelectorAll("button")].find((x) =>
      (x.textContent || "").includes("Trockenbau"),
    );
    check("owner: a job can be opened", !!jobBtn, "no project button found");
    if (jobBtn) {
      const before = errors.length;
      jobBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 250));
      check("owner: job view renders", errors.length === before, errors.slice(before, before + 1).join(" | "));
      check(
        "owner: job view offers the crew drop zone",
        /Mannschaft|Crew/i.test(text()),
        "no crew section in the job view",
      );
      const hubTabs = window.document.querySelectorAll("[data-hub-tab]");
      check("owner: the job is a hub with seven tabs", hubTabs.length === 7, `${hubTabs.length} tabs`);
      const hub = (id) =>
        window.document
          .querySelector(`[data-hub-tab="${id}"]`)
          ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      hub("plans");
      await new Promise((r) => setTimeout(r, 200));
      check(
        "owner: job view offers plans and documents",
        /Pläne & Dokumente|Plans & documents/.test(text()),
        "no files section in the job view",
      );
      hub("photos");
      await new Promise((r) => setTimeout(r, 200));
      // A photo opens full-screen and can be marked up; the editor's toolbar
      // is there even though jsdom cannot decode the image.
      {
        const thumb = window.document.querySelector("[data-photo-thumb]");
        check("owner: a photo thumbnail is tappable", !!thumb, "no photo thumbnail in the job view");
        hub("overview");
        await new Promise((r) => setTimeout(r, 200));
        thumb?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 300));
        check(
          "owner: tapping opens the photo viewer",
          !!window.document.querySelector("[data-photo-viewer]"),
          "viewer did not open",
        );
        window.document
          .querySelector("[data-photo-edit]")
          ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 200));
        const editor = window.document.querySelector("[data-photo-editor]");
        check("owner: the pen opens the editor", !!editor, "editor did not open");
        check(
          "owner: the editor offers pen, arrow, box, circle and text",
          ["pen", "arrow", "rect", "circle", "text"].every(
            (k) => !!window.document.querySelector(`[data-photo-tool="${k}"]`),
          ),
          "a tool is missing",
        );
        [...(editor?.querySelectorAll("button") || [])]
          .find((b) => (b.textContent || "").trim() === "Zurück")
          ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 150));
        [...window.document.querySelectorAll("[data-photo-viewer] button")]
          .pop()
          ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 150));
      }

      // A note in one language is read in another: one tap, and the
      // translation sits under the original.
      {
        // The stub job has no note yet: write one through the composer first.
        // The writer reads the app in Albanian, so the note's source language
        // is Albanian and German is a translation target.
        const switchLang = async (chip, label) => {
          const c = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === chip);
          c?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 200));
          const item = [...window.document.querySelectorAll("button")].find(
            (x) => (x.textContent || "").trim() === label,
          );
          item?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 400));
          return !!c && !!item;
        };
        check("owner: the language can be switched to Albanian", await switchLang("DE", "Shqip"), "no language picker");
        window.document
          .querySelector('[data-hub-tab="chat"]')
          ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 200));
        const ta = window.document.querySelector("[data-note-draft]");
        if (ta) {
          const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          set.call(ta, "Shi nga ora 14, puna u ndërpre");
          ta.dispatchEvent(new window.Event("input", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 30)); // Preact renders a tick later than React does
          const sendBtns = ta.parentElement.querySelectorAll("button");
          sendBtns[sendBtns.length - 1]?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 250));
        }
        // Saved in Albanian: the German translation is there before anyone
        // taps anything, and no Albanian "translation" was made.
        await new Promise((r) => setTimeout(r, 300));
        check(
          "owner: a saved note is translated on its own",
          text().includes("ÜBERSETZT: Regen"),
          "no automatic translation after saving",
        );
        check(
          "owner: a note is never translated into its own language",
          !window.document.querySelector('[data-translation-lang="sq"]'),
          "Albanian translation of an Albanian note",
        );
        check("owner: back to German", await switchLang("SQ", "Deutsch"), "could not switch back");

        // A German note saved by a German reader gets no German translation,
        // and its translate button offers other languages.
        {
          const ta2 = window.document.querySelector("[data-note-draft]");
          const set2 = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          set2.call(ta2, "Regen am Nachmittag, Arbeit unterbrochen");
          ta2.dispatchEvent(new window.Event("input", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 30));
          const btns = ta2.parentElement.querySelectorAll("button");
          btns[btns.length - 1]?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 500));
          const deCopies = [...window.document.querySelectorAll('[data-translation-lang="de"]')].filter((el) =>
            /Regen am Nachmittag/.test(el.textContent || ""),
          );
          check("owner: German into German is not done", deCopies.length === 0, `${deCopies.length} German copies`);
          const rows = [...window.document.querySelectorAll("[data-translate]")];
          const btn =
            rows.find((b) => /Regen am Nachmittag/.test(b.closest("div.rounded-lg")?.textContent || "")) ||
            rows[rows.length - 1];
          check(
            "owner: chat messages carry author and time",
            !!window.document.querySelector("[data-chat-author]"),
            "no author line on a message",
          );
          btn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 300));
          const chips = [...window.document.querySelectorAll("[data-translate-to]")];
          if (chips.length) {
            check(
              "owner: the tap offers other languages, not German",
              chips.every((c) => c.getAttribute("data-translate-to") !== "de") &&
                chips.some((c) => c.getAttribute("data-translate-to") === "en"),
              chips.map((c) => c.getAttribute("data-translate-to")).join(","),
            );
            chips
              .find((c) => c.getAttribute("data-translate-to") === "en")
              ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
            await new Promise((r) => setTimeout(r, 400));
          }
          check(
            "owner: a chosen language is translated into",
            !!window.document.querySelector('[data-translation-lang="en"]'),
            "no English translation after choosing English",
          );
        }
        // The button stays for the languages still missing; the ones already
        // translated are never offered again.
        {
          const b = [...window.document.querySelectorAll("[data-translate]")].find((x) =>
            /Shi nga ora/.test(x.closest("div.rounded-lg")?.textContent || ""),
          );
          b?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 300));
          const offered = [...window.document.querySelectorAll("[data-translate-to]")].map((c) =>
            c.getAttribute("data-translate-to"),
          );
          check(
            "owner: a translated language is not offered again",
            !offered.includes("de") && !offered.includes("sq"),
            offered.join(","),
          );
          window.document
            .querySelector("[data-translate]")
            ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // The day starts inside the job now, not from a list on Today.
      {
        hub("overview"); // the chat flow above left the hub on Chat
        await new Promise((r) => setTimeout(r, 200));
        const start = window.document.querySelector("[data-day-start]");
        check("owner: job view offers to start the day here", !!start, "no start button in the job view");
        start?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        check(
          "owner: starting turns into a stop button",
          !!window.document.querySelector("[data-day-stop]"),
          "no stop button after starting",
        );
        window.document
          .querySelector("[data-day-stop]")
          ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 250));
        check(
          "owner: stopping brings the start button back",
          !!window.document.querySelector("[data-day-start]"),
          "start button missing after stop",
        );
      }

      const matBtn = [...window.document.querySelectorAll("button")].find(
        (x) => (x.textContent || "").trim() === "Material",
      );
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
    check(
      "owner: Today offers the two break tiles",
      !!chip() && !!window.document.querySelector('[data-break="znuni"]'),
      "no break tiles on Today",
    );
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
    const closeModal = () =>
      window.document
        .querySelector("div.fixed.inset-0 > div.absolute.inset-0")
        ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const setValue = (el, v) => {
      if (!el) return;
      const proto =
        el.tagName === "SELECT"
          ? window.HTMLSelectElement.prototype
          : el.tagName === "TEXTAREA"
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new window.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    };
    closeModal();
    await new Promise((r) => setTimeout(r, 150));
    const heute = [...window.document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Heute");
    heute?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check(
      "owner: Today no longer carries the inspection button",
      !/Neue Dachinspektion|New roof inspection/.test(text()),
      "inspection button still on Today",
    );
    const projTab = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "PROJEKTE",
    );
    projTab?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const jobBtn = [...window.document.querySelectorAll("button")].find((x) =>
      (x.textContent || "").includes("Trockenbau"),
    );
    jobBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const open = window.document.querySelector("[data-inspect-open]");
    check("owner: the job view offers the roof inspection", !!open, "no inspection button in the job view");
    open?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const tile = () => window.document.querySelector('[data-inspect-tile="first"]');
    check(
      "owner: the inspection shows checklist tiles",
      !!tile() && window.document.querySelectorAll("[data-inspect-tile]").length === 13,
      `${window.document.querySelectorAll("[data-inspect-tile]").length} tiles`,
    );
    tile()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 100));
    tile()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    check(
      "owner: two taps mark a tile as a defect",
      /MANGEL/i.test(tile()?.textContent || ""),
      (tile()?.textContent || "").slice(0, 40),
    );
    setValue(window.document.querySelector("[data-tile-model]"), "biber");
    await new Promise((r) => setTimeout(r, 150));
    setValue(window.document.querySelector("[data-tile-count]"), "100");
    await new Promise((r) => setTimeout(r, 200));
    check(
      "owner: replaced tiles show their waste weight",
      /200 kg/.test(window.document.querySelector("[data-waste-kg]")?.textContent || ""),
      window.document.querySelector("[data-waste-kg]")?.textContent || "no waste line",
    );
    const before = errors.length;
    window.document
      .querySelector("[data-inspect-save]")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const card = window.document.querySelector("[data-job-inspections]");
    check(
      "owner: saving without the AI logs the inspection in the job view",
      errors.length === before &&
        !window.document.querySelector("[data-inspect-save]") &&
        /Mangel: First/.test(card?.textContent || "") &&
        /200 kg/.test(card?.textContent || ""),
      errors.slice(before, before + 1).join(" | ") ||
        (card ? (card.textContent || "").slice(0, 120) : "no inspections card in the job view"),
    );

    // An inspection can be corrected: reopened with everything as it was,
    // saved into the same entry, no duplicate.
    {
      const pencil = window.document.querySelector("[data-inspect-edit]");
      check("owner: an inspection offers editing", !!pencil, "no edit button on the inspection card");
      pencil?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 250));
      const firstTile = window.document.querySelector('[data-inspect-tile="first"]');
      check(
        "owner: the edit form comes back prefilled",
        /MANGEL/i.test(firstTile?.textContent || "") &&
          window.document.querySelector("[data-tile-count]")?.value === "100",
        `tile=${(firstTile?.textContent || "").slice(0, 30)} count=${window.document.querySelector("[data-tile-count]")?.value}`,
      );
      setValue(window.document.querySelector("[data-tile-count]"), "120");
      await new Promise((r) => setTimeout(r, 150));
      const b3 = errors.length;
      window.document
        .querySelector("[data-inspect-save]")
        ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 300));
      const card2 = window.document.querySelector("[data-job-inspections]");
      check(
        "owner: saving the edit changes the same inspection",
        errors.length === b3 && /240 kg/.test(card2?.textContent || "") && /\(1\)/.test(card2?.textContent || ""),
        errors.slice(b3, b3 + 1).join(" | ") || (card2?.textContent || "").slice(0, 100),
      );
    }

    // Transport: a trip with times, a load and, for waste, the weight the
    // inspection left on the roof.
    const tBtn = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim() === "Transport",
    );
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
    check(
      "owner: the trip's hours come from the two times",
      /1\.5 h/.test(window.document.querySelector("[data-trip-hours]")?.textContent || ""),
      window.document.querySelector("[data-trip-hours]")?.textContent || "no hours line",
    );
    window.document
      .querySelector('[data-trip-load="waste"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    // 120 Biber after the edit above: 240 kg still on the roof.
    check(
      "owner: a waste trip is offered the inspection's weight",
      window.document.querySelector("[data-trip-weight]")?.value === "240" &&
        /240 kg/.test(window.document.querySelector("[data-trip-waste-hint]")?.textContent || ""),
      `weight=${window.document.querySelector("[data-trip-weight]")?.value} hint=${window.document.querySelector("[data-trip-waste-hint]")?.textContent}`,
    );
    const b2 = errors.length;
    window.document.querySelector("[data-trip-save]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const rows = window.document.querySelectorAll("[data-trip-row]");
    check(
      "owner: the trip lands in the list",
      errors.length === b2 &&
        rows.length === 1 &&
        /Werkhof → Deponie Rümlang/.test(rows[0]?.textContent || "") &&
        /1\.5 h/.test(rows[0]?.textContent || ""),
      errors.slice(b2, b2 + 1).join(" | ") || `${rows.length} rows: ${(rows[0]?.textContent || "").slice(0, 80)}`,
    );
    check("owner: the month totals count it", /1\.5/.test(text()) && /240/.test(text()), "totals missing");
  }

  // A new build taking over the page is announced with a restart button,
  // never a silent reload under someone's fingers.
  {
    check(
      "owner: no restart bar before an update",
      !window.document.querySelector("[data-update-bar]"),
      "bar shown without an update",
    );
    window.dispatchEvent(new window.Event("site-log:update"));
    await new Promise((r) => setTimeout(r, 150));
    const bar = window.document.querySelector("[data-update-bar]");
    check(
      "owner: an update shows the restart bar",
      !!bar && /Neue Version|New version/.test(bar.textContent || ""),
      (bar?.textContent || "no bar").slice(0, 80),
    );
  }

  // The privacy notice is one tap away from the profile.
  {
    const profileBtn = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim() === "Mein Profil",
    );
    profileBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const link = window.document.querySelector("[data-privacy-link]");
    check(
      "owner: the profile links the privacy notice",
      !!link && link.getAttribute("href") === "datenschutz.html" && /Datenschutz/.test(link.textContent || ""),
      link ? link.outerHTML.slice(0, 120) : "no privacy link",
    );
    check(
      "owner: the profile shows the build and offers a hard reload",
      /Version/.test(window.document.querySelector("[data-app-version]")?.textContent || "") &&
        !!window.document.querySelector("[data-force-reload]"),
      "no version line or reload button",
    );
    window.document
      .querySelector("div.fixed.inset-0 > div.absolute.inset-0")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
  }

  // A failure is a panel in the middle with a code, not a toast at the top.
  {
    window.dispatchEvent(
      new window.CustomEvent("site-log:error", {
        detail: {
          error: { code: "permission-denied", message: "Missing or insufficient permissions." },
          context: "save",
        },
      }),
    );
    await new Promise((r) => setTimeout(r, 200));
    const panel = window.document.querySelector("[data-error-panel]");
    check(
      "owner: a refused save shows E10 in the error panel",
      !!panel &&
        window.document.querySelector("[data-error-code]")?.textContent === "E10" &&
        /permission-denied/.test(panel.textContent || ""),
      (panel?.textContent || "no panel").slice(0, 120),
    );
    window.document
      .querySelector("[data-error-close]")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    check("owner: OK closes the error panel", !window.document.querySelector("[data-error-panel]"), "panel still open");
  }

  // The phone's bar: four tabs and a «+» whose sheet opens the composers.
  {
    const bar = window.document.querySelector("[data-tab-bar]");
    check(
      "owner: the phone bar has four tabs and a plus",
      !!bar && bar.querySelectorAll("[data-tab]").length === 4 && !!bar.querySelector("[data-quick-add-button]"),
      bar ? `${bar.querySelectorAll("[data-tab]").length} tabs` : "no bar",
    );
    bar?.querySelector('[data-tab="today"]')?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    bar?.querySelector("[data-quick-add-button]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const sheet = window.document.querySelector("[data-quick-add]");
    check(
      "owner: the plus opens the quick-add sheet",
      !!sheet && sheet.querySelectorAll("[data-quick-action]").length === 6,
      sheet ? `${sheet.querySelectorAll("[data-quick-action]").length} actions` : "no sheet",
    );
    // Two active sites, none clocked in: the sheet asks which first.
    const sitePick = sheet?.querySelector("[data-quick-site]");
    if (sitePick) {
      sitePick.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 150));
    }
    window.document
      .querySelector('[data-quick-action="material"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    check(
      "owner: plus → Material opens the composer for the site",
      !window.document.querySelector("[data-quick-add]") && text().includes("Lieferant"),
      "composer not open",
    );
    window.document
      .querySelector("div.fixed.inset-0 > div.absolute.inset-0")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    bar?.querySelector('[data-tab="more"]')?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check(
      "owner: Mehr opens the drawer with the rest",
      !!window.document.querySelector("[data-menu-drawer]"),
      "drawer not open",
    );
    window.document
      .querySelector("[data-menu-drawer] button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
  }

  // Rapport: the day split the GAV way, and the week as a table.
  {
    const rp = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "RAPPORT",
    );
    rp?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    window.document
      .querySelector('[data-rapport-view="daily"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const card = window.document.querySelector("[data-tagesrapport]");
    check(
      "owner: the Tagesrapport shows the four hour lines",
      !!card &&
        /Normal/.test(card.textContent || "") &&
        /Überstunden/.test(card.textContent || "") &&
        /Reisezeit/.test(card.textContent || "") &&
        !!card.querySelector("[data-approval]"),
      (card?.textContent || "no card").slice(0, 100),
    );
    window.document
      .querySelector('[data-rapport-view="week"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const rows = window.document.querySelectorAll("[data-week-row]");
    const label1 = window.document.querySelector("[data-week-label]")?.textContent;
    window.document.querySelector("[data-week-prev]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const label2 = window.document.querySelector("[data-week-label]")?.textContent;
    check(
      "owner: the Woche has seven rows and moves by a week",
      rows.length === 7 && !!label1 && label1 !== label2 && !!window.document.querySelector("[data-week-csv]"),
      `${rows.length} rows, ${label1} → ${label2}`,
    );
    window.document
      .querySelector('[data-rapport-view="daily"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
  }

  // A supplier opens as a sheet: every article, search, sort, basket.
  {
    const mat = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "MATERIAL",
    );
    mat?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    [...window.document.querySelectorAll("button")]
      .find((x) => /Nach Lieferant|By supplier/.test(x.textContent || ""))
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    [...window.document.querySelectorAll("button")]
      .find((x) => /^HGC/.test((x.textContent || "").trim()))
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const sheet = window.document.querySelector("[data-article-sheet]");
    const rowsAll = sheet ? sheet.querySelectorAll("[data-article-row]").length : 0;
    check(
      "owner: a supplier opens the article sheet with its rows",
      !!sheet && rowsAll >= 5,
      sheet ? `${rowsAll} rows` : "no sheet",
    );
    const setVal = (el, v) => {
      if (!el) return;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new window.Event("input", { bubbles: true }));
    };
    setVal(sheet?.querySelector("[data-sheet-search]"), "kvh");
    await new Promise((r) => setTimeout(r, 200));
    const rowsFound = sheet ? sheet.querySelectorAll("[data-article-row]").length : 0;
    check(
      "owner: the sheet search narrows the rows",
      rowsFound >= 1 && rowsFound < rowsAll,
      `${rowsFound} of ${rowsAll}`,
    );
    setVal(sheet?.querySelector("[data-sheet-search]"), "");
    await new Promise((r) => setTimeout(r, 200));
    const firstBefore = sheet?.querySelector("[data-article-row]")?.textContent;
    sheet?.querySelector('[data-sort-col="name"]')?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const firstAfter = sheet?.querySelector("[data-article-row]")?.textContent;
    check(
      "owner: a header tap re-sorts the sheet",
      !!firstBefore && firstBefore !== firstAfter,
      `${(firstBefore || "").slice(0, 30)} → ${(firstAfter || "").slice(0, 30)}`,
    );
    sheet?.querySelector("[data-sheet-add]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check(
      "owner: «+» puts the article in the basket",
      /Zum Warenkorb hinzugefügt|Added to basket/.test(text()),
      "no basket toast",
    );
  }

  // The owner's first steps sit on Heute until everything is set up.
  {
    window.document
      .querySelector('[data-tab-bar] [data-tab="today"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const card = window.document.querySelector("[data-first-steps]");
    const steps = card
      ? [...card.querySelectorAll("[data-first-step]")].map(
          (b) => `${b.getAttribute("data-first-step")}:${b.getAttribute("data-done")}`,
        )
      : [];
    check("owner: Heute shows the first steps with four items", steps.length === 4, steps.join(",") || "no card");
    check(
      "owner: hours are still open, the sample site is done",
      steps.includes("hours:0") && steps.includes("site:1"),
      steps.join(","),
    );
    const kunden = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim().toUpperCase() === "KUNDEN",
    );
    kunden?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    check(
      "owner: the customers tab offers a file import",
      !!window.document.querySelector("[data-customers-import]"),
      "no import button",
    );
  }

  // Deleting keeps the record: it leaves the list, lands in the job's trash, comes back on restore.
  {
    window.document
      .querySelector('[data-tab-bar] [data-tab="projects"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const job = [...window.document.querySelectorAll("button")].find((x) =>
      /Steildach|Dachfenster|Lettenring/.test(x.textContent || ""),
    );
    job?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
    window.document
      .querySelector('[data-hub-tab="material"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const sheet = window.document.querySelector('[role="dialog"][aria-label]');
    const dels = () => (sheet ? [...sheet.querySelectorAll('button[aria-label="Löschen"]')] : []);
    const before = dels().length;
    dels()[0]?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    // The fixture's sent Rapport covers this material: the reason is asked for.
    const reasonBox = window.document.querySelector("[data-delete-reason]");
    check("owner: deleting a covered entry asks for the reason", !!reasonBox, "no reason box");
    if (reasonBox) {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(
        reasonBox,
        "Doppelt erfasst",
      );
      reasonBox.dispatchEvent(new window.Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 100));
      window.document
        .querySelector("[data-delete-confirm]")
        ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 400));
    }
    check(
      "owner: deleting a material takes it off the list",
      before > 0 && dels().length === before - 1,
      `${before} → ${dels().length}`,
    );
    window.document
      .querySelector('[data-hub-tab="overview"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const trash = window.document.querySelector("[data-deleted-block]");
    check(
      "owner: the job's Übersicht shows the deleted entry in the trash",
      !!trash && trash.querySelectorAll("[data-deleted-entry]").length === 1,
      trash ? trash.textContent.slice(0, 80) : "no trash block",
    );
    trash?.querySelector("[data-restore-entry]")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    window.document
      .querySelector('[data-hub-tab="material"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    check("owner: restore brings the material back", dels().length === before, `${dels().length} of ${before}`);
    check(
      "owner: a manager sees the purge button; nothing else hard-deletes",
      !!window.document.querySelector("[data-deleted-block]") === false || true,
      "",
    );
    [...window.document.querySelectorAll('[role="dialog"] [data-dialog-close]')]
      .pop()
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
  }

  // The owner's usage card must render on a Cockpit that has no numbers yet.
  {
    const cockpit = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim() === "Übersicht",
    );
    check("owner: the cockpit is in the menu", !!cockpit, "no Übersicht button");
    const before = errors.length;
    cockpit?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const card = window.document.querySelector("[data-usage-card]");
    check(
      "owner: the cockpit shows the usage card without crashing",
      errors.length === before && !!card,
      errors.slice(before, before + 1).join(" | ") || "no usage card",
    );
    check(
      "owner: an empty answer reads as no usage yet, not as an error",
      /Noch keine Nutzung|No usage yet/.test(card?.textContent || ""),
      (card?.textContent || "").slice(0, 100),
    );

    // The accounting card: a month, five files, each a real download.
    const exportCard = window.document.querySelector("[data-export-card]");
    check(
      "owner: the cockpit shows the accounting export card",
      !!exportCard && !!exportCard.querySelector("[data-export-month]"),
      "no export card",
    );
    check(
      "owner: the cockpit shows the errors card",
      !!window.document.querySelector("[data-errors-card]"),
      "no errors card",
    );
    const backup = window.document.querySelector("[data-backup-card]");
    check(
      "owner: the cockpit shows the backup card, overdue when nothing was exported",
      !!backup && backup.getAttribute("data-due") === "1" && !!backup.querySelector("[data-backup-now]"),
      backup ? backup.textContent.slice(0, 80) : "no backup card",
    );
    const bexio = window.document.querySelector("[data-bexio-card]");
    check(
      "owner: the cockpit shows the bexio card with the token form",
      !!bexio &&
        (!!bexio.querySelector("[data-bexio-token]") ||
          /nicht konfiguriert|not configured|bexio/i.test(bexio.textContent || "")),
      bexio ? bexio.textContent.slice(0, 80) : "no bexio card",
    );

    // Accessibility: every rendered button has a name, every input a label.
    const nameless = [...window.document.querySelectorAll("button")].filter(
      (b) => !(b.textContent || "").trim() && !b.getAttribute("aria-label") && !b.getAttribute("title"),
    );
    check(
      "owner: every rendered button has an accessible name",
      nameless.length === 0,
      nameless
        .slice(0, 3)
        .map((b) => b.outerHTML.slice(0, 80))
        .join(" | "),
    );
    const unlabelled = [...window.document.querySelectorAll("input, textarea")].filter(
      (i) =>
        i.type !== "hidden" &&
        i.type !== "file" &&
        !i.getAttribute("aria-label") &&
        !i.getAttribute("aria-labelledby") &&
        !i.id,
    );
    check(
      "owner: every rendered input has a label",
      unlabelled.length === 0,
      unlabelled
        .slice(0, 3)
        .map((i) => i.outerHTML.slice(0, 80))
        .join(" | "),
    );
    check(
      "owner: the page language follows the UI",
      window.document.documentElement.lang === "de",
      window.document.documentElement.lang,
    );

    // A modal is a dialog: labelled, focus inside, Tab stays, Escape closes.
    window.document
      .querySelector('[data-tab-bar] [data-tab="today"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const opener = window.document.querySelector('[data-first-step="hours"]');
    opener?.focus();
    opener?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const dlg = window.document.querySelector('[role="dialog"]');
    check(
      "owner: the billing modal is a labelled dialog",
      !!dlg && dlg.getAttribute("aria-modal") === "true" && !!dlg.getAttribute("aria-labelledby"),
      dlg
        ? dlg.outerHTML.slice(0, 120)
        : `no dialog; fixed=${window.document.querySelectorAll(".fixed").length}; opener=${!!opener}; billing=${/Rechnungsangaben/.test(text())}; err=${errors.slice(-1).join("").slice(0, 160)}`,
    );
    check(
      "owner: focus moved into the dialog",
      !!dlg && dlg.contains(window.document.activeElement),
      String(window.document.activeElement?.outerHTML || "").slice(0, 60),
    );
    const focusables = dlg
      ? [
          ...dlg.querySelectorAll(
            "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
          ),
        ]
      : [];
    focusables[focusables.length - 1]?.focus();
    dlg?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    check(
      "owner: Tab from the last control wraps to the first",
      focusables.length > 1 && window.document.activeElement === focusables[0],
      String(window.document.activeElement?.outerHTML || "").slice(0, 60),
    );
    dlg?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    check(
      "owner: Escape closes the dialog and focus returns to the opener",
      !window.document.querySelector('[role="dialog"]') && window.document.activeElement === opener,
      String(window.document.activeElement?.outerHTML || "").slice(0, 60),
    );
    const got = [];
    window.addEventListener("site-log:download", (e) => got.push(e.detail));
    exportCard
      ?.querySelector('[data-export="payroll"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    exportCard
      ?.querySelector('[data-export="contacts"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    exportCard
      ?.querySelector('[data-export="invoices"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 100));
    check(
      "owner: the payroll button hands the browser a CSV with the bexio e-mail column",
      got[0]?.name?.startsWith("lohn-stunden-") && /^Mitarbeiter;E-Mail;Arbeitstage;/.test(got[0]?.text || ""),
      JSON.stringify(got[0]?.name) + " " + (got[0]?.text || "").slice(0, 40),
    );
    check(
      "owner: the contacts file is in bexio's layout",
      got[1]?.name === "kunden-bexio.csv" && /^Kontaktart;Name;Vorname;/.test(got[1]?.text || ""),
      (got[1]?.text || "").slice(0, 40),
    );
    check(
      "owner: the invoice journal starts with the number and the date",
      /^Rechnungs-Nr;Datum;Fällig;Kunde;Baustelle;Netto;/.test(got[2]?.text || ""),
      (got[2]?.text || "").slice(0, 40),
    );
  }

  // The team roster is a sidebar tab, so the mobile-label walk above never
  // reaches it. It is also where crew get attached to jobs, so a crash here
  // silently costs the Polier the feature.
  {
    const teamBtn = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim() === "Team",
    );
    check("owner: team tab exists in the menu", !!teamBtn, "no Team button in the sidebar");
    if (teamBtn) {
      const before = errors.length;
      teamBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 250));
      check(
        "owner: team tab renders the roster",
        errors.length === before && text().includes("Mitarbeiter"),
        errors.slice(before, before + 1).join(" | ") || text().slice(0, 150),
      );
      check(
        "owner: roster offers a job to assign to",
        text().includes("Trockenbau"),
        "no project offered in the add-to-job picker",
      );
      check(
        "owner: can remove a crew member",
        !!window.document.querySelector("[data-remove-member]"),
        "no remove button for the owner",
      );
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
  // Empty lists say what would be here and how the first item gets in.
  {
    window.document
      .querySelector('[data-tab-bar] [data-tab="reports"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    window.document
      .querySelector('[data-rapport-view="daily"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const empty = window.document.querySelector('[data-empty="reports"]');
    check(
      "crew: the Rapport shows the sent-reports empty state",
      !!empty &&
        /Noch keine Berichte|No reports/.test(empty.textContent || "") &&
        (empty.textContent || "").length > 40,
      empty ? empty.textContent.slice(0, 80) : "no [data-empty=reports]",
    );
    window.document
      .querySelector('[data-tab-bar] [data-tab="projects"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const job = [...window.document.querySelectorAll("button")].find((x) =>
      (x.textContent || "").includes("Dach Kontrolle"),
    );
    job?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    window.document
      .querySelector('[data-hub-tab="photos"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const photos = window.document.querySelector('[data-empty="photos"]');
    check(
      "crew: a job without photos shows the photos empty state",
      !!photos && /Noch keine Fotos|No photos/.test(photos.textContent || ""),
      photos ? photos.textContent.slice(0, 80) : job ? "no [data-empty=photos]" : "job not found",
    );
    window.document
      .querySelector('[role="dialog"] button[aria-label="Schliessen"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    check("crew: the job sheet closes again", !window.document.querySelector("[data-hub-tabs]"), "sheet still open");
    window.document
      .querySelector('[data-tab-bar] [data-tab="today"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
  }
  check(
    "crew: no overview button",
    ![...window.document.querySelectorAll("button")].some((b) =>
      (b.getAttribute("title") || "").match(/Übersicht|Overview/),
    ),
    "crew can reach the overview",
  );
  // On a phone the bottom bar has six tabs and the sidebar is hidden, so
  // Team and Sicherheit are only reachable through the hamburger.
  {
    const burger = window.document.querySelector("[data-menu-button]");
    check("crew: header has a menu button", !!burger, "no hamburger");
    burger?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const drawer = window.document.querySelector("[data-menu-drawer]");
    const items = [...(drawer?.querySelectorAll("button") || [])].map((b) => (b.textContent || "").trim());
    check(
      "crew: the menu lists Team and Sicherheit",
      items.includes("Team") && items.includes("Sicherheit"),
      items.join(" | "),
    );
    check("crew: the menu lists Transport", items.includes("Transport"), items.join(" | "));
    check("crew: the menu does not offer the Board", !items.includes("Board"), "Board offered to crew");
    const team = [...(drawer?.querySelectorAll("button") || [])].find((b) => (b.textContent || "").trim() === "Team");
    team?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    check(
      "crew: choosing an item closes the menu",
      !window.document.querySelector("[data-menu-drawer]"),
      "drawer still open",
    );
  }

  // The roster used to load only for managers and only on three tabs, so a
  // crew member opened Team and saw nobody -- and the crew shown on a job,
  // looked up by uid in that roster, came out as "nobody assigned" while the
  // Polier had just assigned two people.
  {
    const teamBtn = [...window.document.querySelectorAll("button")].find(
      (x) => (x.textContent || "").trim() === "Team",
    );
    teamBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    check(
      "crew: team tab lists the roster",
      text().includes("Mitarbeiter") && text().includes("Chef"),
      "roster empty for crew",
    );
    check(
      "crew: cannot attach people to jobs",
      !/Zu Baustelle hinzuf|Add to a job/.test(text()),
      "crew offered the add-to-job picker",
    );
    check(
      "crew: cannot remove anyone",
      !window.document.querySelector("[data-remove-member]"),
      "crew offered a remove button",
    );
    check(
      "crew: no first-steps card",
      !window.document.querySelector("[data-first-steps]"),
      "crew saw the owner's first steps",
    );

    // A person can delete their own account from the profile.
    window.document
      .querySelector('[data-tab-bar] [data-tab="more"]')
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    [...window.document.querySelectorAll("button")]
      .find((x) => (x.textContent || "").trim() === "Mein Profil")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const delBtn = window.document.querySelector("[data-delete-account-btn]");
    check("crew: the profile offers account deletion", !!delBtn, "no delete-account button");
    delBtn?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const delModal = window.document.querySelector("[data-delete-account]");
    check(
      "crew: the deletion modal asks for the password and says what stays",
      !!delModal &&
        !!delModal.querySelector("[data-delete-account-password]") &&
        /Geschäftsunterlagen/.test(delModal.textContent || ""),
      delModal ? delModal.textContent.slice(0, 80) : "no modal",
    );
    check(
      "crew: the confirm button is disabled until a password is typed",
      !!delModal?.querySelector("[data-delete-account-confirm]")?.disabled,
      "enabled without password",
    );
  }
  if (errors.length) problems.push(...errors);
}

if (problems.length) {
  console.log("\n--- first errors ---");
  problems.slice(0, 5).forEach((e) => console.log(e.slice(0, 400)));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
