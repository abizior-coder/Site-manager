// Drives the project dock in jsdom: pin a job from its header, then carry a
// catalog item and a person onto its tile with a fake DataTransfer.
//
// The dock is the one place where material and people are moved without a
// form, so a silent failure here books nothing and tells nobody. Run:
// npm run test:dock
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";

const ENTRY = "./.dock-entry.jsx", OUT = "./.dock-bundle.js";
writeFileSync(ENTRY, `
import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { setStubRole } from "./test-stubs/company-store.js";
window.__setRole = setStubRole;
window.__mount = () => createRoot(document.getElementById("root")).render(<SiteManager />);
`);
await build({
  entryPoints: [ENTRY], outfile: OUT, bundle: true, format: "iife", jsx: "automatic", logLevel: "silent",
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
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
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

// jsdom has no DataTransfer. React reads nativeEvent.dataTransfer, so a plain
// object hung on a plain Event is enough to exercise the real handlers.
function fakeDt() {
  const data = {};
  return { data, types: [], setData(k, v) { data[k] = v; if (!this.types.includes(k)) this.types.push(k); }, getData(k) { return data[k] || ""; }, effectAllowed: "" };
}
async function drag(source, target) {
  const dt = fakeDt();
  for (const [type, el] of [["dragstart", source], ["dragover", target], ["drop", target]]) {
    const ev = new window.Event(type, { bubbles: true, cancelable: true });
    ev.dataTransfer = dt;
    el.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 150));
  }
  return dt;
}
const tile = () => window.document.querySelector("[data-dock-project]");

// --- pin a job from its header ---------------------------------------------
// The stub has one job under construction (Trockenbau), one lead (Dach
// Kontrolle) and one finished. Only the active one belongs in the dock
// until somebody pins another.
const dockText = () => (window.document.querySelector("[data-dock]")?.textContent || "");
check("dock shows the active job on its own", dockText().includes("Trockenbau") && !dockText().includes("Dach Kontrolle") && !dockText().includes("Fertig"), dockText().slice(0, 120));
await click(btns().find((b) => (b.textContent || "").trim().toUpperCase() === "PROJEKTE"));
await click(btns().find((b) => (b.textContent || "").includes("Anfrage")) || btns()[0], 200); // show leads if filtered
await click(btns().find((b) => (b.textContent || "").includes("Dach Kontrolle")), 300);
const pinBtn = btns().find((b) => /Unten anheften|Pin to the dock/.test(b.getAttribute("title") || ""));
check("job view offers a pin", !!pinBtn, "no pin button in the job header");
if (pinBtn) await click(pinBtn, 300);
window.document.querySelector("div.fixed.inset-0 > div.absolute.inset-0")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await new Promise((r) => setTimeout(r, 200));
check("pinned job appears as a dock tile, first", !!tile() && (tile().textContent || "").includes("Dach Kontrolle"), "pinned lead is not the first tile: " + dockText().slice(0, 120));
const tileName = "Dach Kontrolle";

// --- carry a catalog item onto it ---------------------------------------------
await click(btns().find((b) => (b.textContent || "").trim().toUpperCase() === "MATERIAL"));
await click(btns().find((b) => (b.textContent || "").trim() === "Holz"));
const chip = btns().find((b) => b.getAttribute("draggable") === "true" && (b.textContent || "").trim().length < 40);
check("catalog chips are draggable", !!chip, "no draggable chip after opening Holz");
const matsBefore = parseInt(((tile()?.textContent || "").match(/(\d+)\s*$/) || [])[1] || "0", 10);
if (chip) await drag(chip, tile());
const matsAfter = parseInt(((tile()?.textContent || "").match(/(\d+)\s*$/) || [])[1] || "0", 10);
check("dropping a chip books material on the job", matsAfter === matsBefore + 1, `tile count ${matsBefore} -> ${matsAfter}`);
check("the drop is confirmed by name", txt().includes(`${(chip?.textContent || "").trim()} → ${tileName}`), "no toast naming the job");

// --- carry a person onto it -----------------------------------------------------
await click(btns().find((b) => (b.textContent || "").trim() === "Team"));
const card = [...window.document.querySelectorAll("[draggable='true']")].find((el) => (el.textContent || "").includes("Mitarbeiter"));
check("team cards are draggable for a manager", !!card, "no draggable member card");
const crewBefore = parseInt(((tile()?.textContent || "").match(/(\d+)\s+\d+\s*$/) || [])[1] || "0", 10);
if (card) await drag(card, tile());
const crewAfter = parseInt(((tile()?.textContent || "").match(/(\d+)\s+\d+\s*$/) || [])[1] || "0", 10);
check("dropping a person adds them to the crew", crewAfter === crewBefore + 1, `crew ${crewBefore} -> ${crewAfter}`);

// --- the tile is also the shortcut ----------------------------------------------
await click(tile(), 300);
check("tapping a tile opens the job", /Mannschaft auf dieser Baustelle/i.test(txt()), "job view did not open");
check("the job now lists the dropped material", txt().includes((chip?.textContent || "").trim()), "dropped item missing from the job view");

check("no runtime errors during the whole flow", errors.length === 0, errors.slice(0, 2).join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
