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
  if (errors.length) problems.push(...errors);
}

// --- crew ----------------------------------------------------------------
{
  const { window, errors, text } = await renderAs("crew");
  check("crew: app renders something", text().length > 50, `only ${text().length} chars — blank screen`);
  check("crew: no React or runtime errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  check("crew: money is not shown", !text().includes("R-2026-001"), "an invoice number leaked into the crew view");
  if (errors.length) problems.push(...errors);
}

if (problems.length) {
  console.log("\n--- first errors ---");
  problems.slice(0, 5).forEach((e) => console.log(e.slice(0, 400)));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
