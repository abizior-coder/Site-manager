// Drives the real basket -> request -> ordered -> delivered path in jsdom.
//
// This is the flow the office and the roof share, and it is a state machine:
// asked for, ordered, arrived. A half-broken one loses material requests
// silently, which is worse than not having the feature. Run: npm run test:order
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";

const ENTRY = "./.flow-entry.jsx", OUT = "./.flow-bundle.js";
writeFileSync(ENTRY, `
import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { setStubRole } from "./test-stubs/company-store.js";
window.__setRole = setStubRole;
import { loadLang } from "./i18n/index.js";
window.__mount = async () => { await Promise.all([loadLang("en"), loadLang("de")]); createRoot(document.getElementById("root")).render(<SiteManager />); };
`);
await build({
  entryPoints: [ENTRY], outfile: OUT, bundle: true, format: "iife", jsx: "automatic", logLevel: "silent",
  alias: process.env.REACT ? undefined : { react: "preact/compat", "react-dom/client": "preact/compat/client", "react-dom": "preact/compat", "react/jsx-runtime": "preact/jsx-runtime" },
  plugins: [{ name: "stub", setup(b) {
    b.onResolve({ filter: /(firebase-client|company-store)\.js$/ }, (a) => {
      if (a.importer.includes("test-stubs")) return null;
      const n = a.path.includes("firebase-client") ? "firebase-client.js" : "company-store.js";
      return { path: new URL(`./test-stubs/${n}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") };
    });
  }}],
});
const code = readFileSync(OUT, "utf8");
unlinkSync(ENTRY); unlinkSync(OUT);

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, { url: "https://example.test/", pretendToBeVisual: true, runScripts: "outside-only" });
const { window } = dom;
const errors = [];
window.addEventListener("error", (e) => errors.push(String(e.error || e.message)));
window.console.error = (...a) => errors.push(a.map(String).join(" "));
window.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
window.fetch = async () => ({ ok: true, json: async () => ({ current: {} }) });
window.scrollTo = () => {};
window.HTMLCanvasElement.prototype.getContext = () => null;
window.navigator.geolocation = { getCurrentPosition: () => {} };
dom.window.eval(code);
dom.window.__setRole("owner");
dom.window.__mount();
await new Promise((r) => setTimeout(r, 400));

const txt = () => window.document.body.textContent || "";
const btns = () => [...window.document.querySelectorAll("button")];
const click = async (el, ms = 250) => { el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); await new Promise((r) => setTimeout(r, ms)); };
let pass = 0, fail = 0;
const check = (n, ok, d) => { console.log((ok ? "ok   " : "FAIL ") + n + (ok || !d ? "" : ` — ${d}`)); ok ? pass++ : fail++; };

await click(btns().find((b) => (b.textContent || "").trim().toUpperCase() === "MATERIAL"));

// put something in the basket
// The catalog only lists items once a category is open.
await click(btns().find((b) => (b.textContent || "").trim() === "Holz"));
const KNOWN = ["Board", "Übersicht", "Heute", "Projekte", "Kunden", "Kalender", "Material", "Team", "Berichte", "Sicherheit", "Mein Profil", "DE", "de", "Preisliste importieren", "Shop", "Werkzeug", "Transport", "Bibliothek", "Nach Typ", "Nach Lieferant", "Holz", "Membranen", "Spenglerarbeiten", "Dämmung", "Befestigungsmaterial", "Dacheindeckung"];
const item = btns().find((b) => { const x = (b.textContent || "").trim(); return x && x.length < 40 && !KNOWN.includes(x); });
check("a catalog item can be added to the basket", !!item, "no catalog item button found");
if (item) {
  await click(item);
  check("basket shows the item", /Warenkorb|Basket|Korb/i.test(txt()), "no basket");

  const reqBtn = btns().find((b) => (b.textContent || "").trim() === "Anfordern");
  check("basket offers a request button", !!reqBtn, "no Anfordern button");
  if (reqBtn) {
    await click(reqBtn);
    const proj = btns().find((b) => (b.textContent || "").includes("Trockenbau"));
    check("a job can be picked for the request", !!proj, "no project in picker");
    if (proj) {
      await click(proj, 350);
      check("the request appears in the order list", txt().includes("Materialanforderungen"), txt().slice(0, 200));
      check("it starts as requested", txt().includes("Angefordert"), "no requested state");

      const ordered = btns().find((b) => (b.textContent || "").trim() === "Bestellt");
      check("the office can mark it ordered", !!ordered, "no Bestellt button");
      if (ordered) {
        await click(ordered, 350);
        const delivered = btns().find((b) => (b.textContent || "").trim() === "Geliefert");
        check("and then delivered", !!delivered, "no Geliefert button");
        if (delivered) {
          await click(delivered, 400);
          check("delivered requests leave the order list", !txt().includes("Materialanforderungen"), "still listed after delivery");
          // The whole point: delivered stock has to land in the job as
          // material, or it never reaches costing.
          const itemName = (item.textContent || "").trim();
          await click(btns().find((b) => (b.textContent || "").trim().toUpperCase() === "PROJEKTE"));
          await click(btns().find((b) => (b.textContent || "").includes("Trockenbau")), 350);
          check("delivered material lands on the job", txt().includes(itemName), `${itemName} not in the job view`);
        }
      }
    }
  }
}
check("no runtime errors during the whole flow", errors.length === 0, errors.slice(0, 2).join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
