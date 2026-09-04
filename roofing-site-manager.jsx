import { useState, useEffect, useRef, useMemo, Fragment, lazy, Suspense } from "react";
import { Clock, Package, Wrench, Camera, MessageSquare, MapPin, FileText, Plus, X, Check, ChevronRight, ChevronLeft, Play, Square, Send, Siren, Phone, ShieldAlert, ScanLine, Loader2, ExternalLink, ImagePlus, QrCode, Barcode, ClipboardCheck, Globe, Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, RefreshCw, Mountain, User, Flame, HardHat, Shovel, Copy, Pencil, CalendarDays, Mail, CreditCard, Award, Trash2, Share2, ClipboardPaste, Printer, Mic, ShoppingCart, Truck, BookOpen, Minus, Hammer, Ruler, GripVertical, LogOut, Lock, Users, Pin, Search, Building2, Layers, ArrowUpDown, Menu, Coffee, Utensils, Languages, ZoomIn, ZoomOut, Undo2, MoveUpRight, Circle, Type, Paintbrush, RotateCcw, Download } from "lucide-react";
import { onAuthChange, signIn, signUp, signOutUser, sendReset, authErrorKey, legacyScan, importLegacy, getIdToken } from "./firebase-client.js";
import { T, LANGS, loadLang, isLang } from "./i18n/index.js";
import { parsePriceList, mergeIntoCatalog } from "./price-list.js";
import { reportId, reportRows, reportTotals, entryLabels, unsentMonthEntries, withSend, rapportChanged, splitDayHours, weekOf, weekRows, weekCsv } from "./reports.js";
import { buildQrPayload, qrDataUrl, validateBillingProfile, normaliseIban, creditorReference, isSwissIban, SWISS_CROSS_SVG } from "./swiss-qr.js";
import {
  loadMembership, createCompany, joinCompanyWithCode, listMembers, createInvite, listInvites, revokeInvite,
  syncCollection, loadCollection, subscribeCollection, companyStorage, isOwner, getRole,
  loadFinance, saveFinance, migrateFromPersonal, personalDataSummary, resetCompanyState, canManage, isSupervisor, getCompanyId, setMemberActive,
} from "./company-store.js";
import { MAX_FILE_BYTES, FILE_KINDS, isImage, isPdf, guessKind, fmtSize, sortFiles, normaliseLink } from "./files.js";
import { BREAKS, breakMeta, breakHours, netHours, breakTaken } from "./breaks.js";
import { sanitiseBackup, sanitiseProjectCode } from "./import-guard.js";
import { ROOF_TILES, tileMeta, tileWaste, tilesWaste, summariseInspection, tripHours } from "./roof-tiles.js";
import { COLORS } from "./ui/theme.js";
import { todayKey, monthKey, uid, fmtHM } from "./ui/format.js";
import { photoCache, loadPhoto, StoredImage, typeMeta, Stat, EntryRow, ENTRY_TYPE_ORDER, EntryGroups } from "./ui/entries.jsx";
import { BreakChips } from "./ui/break-chips.jsx";
import { TodayTab } from "./tabs/TodayTab.jsx";
export { fmtHM };
import { createTracker } from "./metrics-client.js";
import { ERROR_CODES, classifyError, errorReport } from "./errors.js";

// Which build this page is: the shell names it, and a phone that shows an
// old number is a phone that has not restarted since the last deploy.
const SHELL_BUILD = (typeof document !== "undefined" && document.querySelector('meta[name="site-log-build"]')?.content) || "dev";

// The hard way out of a stale app: forget every worker and cache, then load
// afresh from the server. For the profile's "App neu laden" button.
async function forceReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) { console.warn("force reload:", e); }
  window.location.reload();
}

// The job view and the photo tools are a chunk of their own, fetched the
// first time a job or a photo is opened.
const jobChunk = () => import("./tabs/ProjectDetail.jsx");
const ProjectDetail = lazy(() => jobChunk().then((m) => ({ default: m.ProjectDetail })));
const PhotoViewer = lazy(() => jobChunk().then((m) => ({ default: m.PhotoViewer })));
const PhotoEditor = lazy(() => jobChunk().then((m) => ({ default: m.PhotoEditor })));

const MaterialsTab = lazy(() => import("./tabs/MaterialsTab.jsx").then((m) => ({ default: m.MaterialsTab })));

const BoardTab = lazy(() => import("./tabs/BoardTab.jsx").then((m) => ({ default: m.BoardTab })));

const CockpitTab = lazy(() => import("./tabs/CockpitTab.jsx").then((m) => ({ default: m.CockpitTab })));

// Cloudflare Worker that holds the Anthropic API key server-side.
// Kept in the bundle (not only in index.html) so a cached HTML file can't
// leave the app without a way to reach the proxy.
const CLAUDE_PROXY_URL = "https://site-log-claude-proxy.abizior.workers.dev";

// Usage counts, batched and sent to the Worker: event names and how often,
// per company. Never a description, a name or a site. A failed send keeps
// the batch; the page going to the background flushes it.
const tracker = createTracker({
  send: async (events) => {
    const cid = getCompanyId();
    if (!cid) return false;
    const token = await getIdToken();
    if (!token) return false;
    const res = await fetch(`${CLAUDE_PROXY_URL}/metrics/${cid}`, {
      method: "POST", keepalive: true,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    return res.ok;
  },
});
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") tracker.flush(); });
}




function cprSteps(t) {
  return [1, 2, 3, 4, 5, 6, 7].map((n) => ({ title: t[`cpr${n}t`], text: t[`cpr${n}x`] }));
}

// Each entry is an i18n key stem; the title lives under <stem>T and the body
// under <stem>X. SUVA publishes in German and the Polier reads German, so the
// German text is the primary one, English the fallback for the other languages.
const SAFETY_RULES_ROOF = ["safety_roof_1", "safety_roof_2", "safety_roof_3", "safety_roof_4", "safety_roof_5"];
const SAFETY_RULES_METAL = ["safety_metal_1", "safety_metal_2", "safety_metal_3", "safety_metal_4", "safety_metal_5"];
const SAFETY_RULES_FORMWORK = ["safety_formwork_1", "safety_formwork_2", "safety_formwork_3", "safety_formwork_4"];
const SAFETY_RULES_GROUND = ["safety_ground_1", "safety_ground_2", "safety_ground_3", "safety_ground_4", "safety_ground_5"];

const SAFETY_CATEGORIES = [
  { key: "roof", labelKey: "safetyCatRoof", icon: Mountain, rules: SAFETY_RULES_ROOF, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/baustellen-sicher-machen/dacharbeiten-absturzsicherung" },
  { key: "metal", labelKey: "safetyCatMetal", icon: Flame, rules: SAFETY_RULES_METAL, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/arbeitssicherheit-in-gewerbe-und-industrie/metallbearbeitung" },
  { key: "formwork", labelKey: "safetyCatFormwork", icon: HardHat, rules: SAFETY_RULES_FORMWORK, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/baustellen-sicher-machen/absturzsicherung-deckenschalung" },
  { key: "ground", labelKey: "safetyCatGround", icon: Shovel, rules: SAFETY_RULES_GROUND, url: "https://www.suva.ch/de-ch/praevention/nach-branchen/baustellen-sicher-machen/unternehmer-und-kader-baustelle/graeben-schaechte-baugruben" },
];

// Until the catalogue chunk lands, every group is empty and the shop just
// has nothing to show for a moment.
const EMPTY_CATALOG = { cats: {}, links: {}, items: new Proxy({}, { get: () => [] }) };

// The logo is a 12 KB PNG nobody needs before a document is printed; it is
// fetched a few seconds after start.
let COMPANY_LOGO_DATA_URI = "";
if (typeof window !== "undefined") {
  setTimeout(() => import("./data/logo.js").then((m) => { COMPANY_LOGO_DATA_URI = m.COMPANY_LOGO_DATA_URI; }).catch(() => {}), 3000);
}

const SWISS_EMERGENCY_NUMS = ["144", "117", "118", "112"];
const UNIT_SUGGESTIONS = ["pcs", "bags", "m", "m²", "m³", "kg", "l", "rolls", "pallets", "boxes", "pairs", "sets", "tubes"];

// A Swiss roofing job is really several trades sharing one address. The
// Spengler's sheet metal and the carpenter's timber land on the same site but
// they are costed, ordered and argued about separately, so every material,
// tool and hour carries the trade it belongs to.
export const TRADES = [
  { key: "steildach", labelKey: "tradeSteildach", color: "#DA291C" },
  { key: "flachdach", labelKey: "tradeFlachdach", color: "#6FB3D9" },
  { key: "spengler", labelKey: "tradeSpengler", color: "#B0B7BE" },
  { key: "holz", labelKey: "tradeHolz", color: "#C68B4F" },
  { key: "geruest", labelKey: "tradeGeruest", color: "#E0B341" },
  { key: "unterhalt", labelKey: "tradeUnterhalt", color: "#8FBF7F" },
  { key: "other", labelKey: "tradeOther", color: "#8A8F98" },
];
export const DEFAULT_TRADE = "other";

// What a Polier looks at on a roof, in the order they walk it. Tapped, not
// typed: none → OK → Mangel → none.
// Transport: what drives, what it carries, which skip. Plain keys; the
// labels live in i18n.
const VEHICLES = ["lieferwagen", "pritsche", "anhaenger", "lkw_kran", "mulden_service", "pw"];
const LOAD_KINDS = ["material", "waste", "tools", "scaffold", "other"];
const MULDE_SIZES = ["", "3", "7", "10", "15", "20"];

const INSPECTION_ITEMS = ["eindeckung", "first", "kehle", "anschluesse", "fenster", "rinne", "unterdach", "lattung", "daemmung", "schneefang", "blitzschutz", "kamin", "moos"];

// How each UI language is named to the translator. Swiss German gets a hint,
// because "German" alone comes back as Hochdeutsch.
const LANG_NAMES = {
  de: "German", gsw: "Swiss German (Schwiizerdütsch, written the way it is spoken in Zürich)", fr: "French", it: "Italian",
  en: "English", sq: "Albanian", ro: "Romanian", bg: "Bulgarian", hu: "Hungarian", pl: "Polish", pt: "Portuguese",
  es: "Spanish", sk: "Slovak", cs: "Czech",
};

// A material request is not a delivery. It is asked for on the roof, ordered
// in the office, and only becomes consumed material when it actually turns up
// -- which is the point where it may count towards the job's cost.
export const ORDER_STATES = [
  { key: "requested", labelKey: "orderRequested", color: "#E0B341" },
  { key: "ordered", labelKey: "orderOrdered", color: "#6FB3D9" },
  { key: "delivered", labelKey: "orderDelivered", color: "#8FBF7F" },
];

// The merchants this trade actually buys from in this region. One tap covers
// most deliveries; the field stays free text for everyone else.
const KNOWN_SUPPLIERS = ["HGC", "GABS", "Soprema", "Velux", "Glaromat", "Gyso", "SFS", "Hasler"];

function tradeMeta(key) {
  return TRADES.find((x) => x.key === key) || TRADES[TRADES.length - 1];
}

// Each category carries an icon so a job is recognisable at tile size, where
// there is no room for the word.
export const PROJECT_CATEGORIES = [
  { key: "flat", labelKey: "projectCatFlat", icon: Layers },
  { key: "pitched", labelKey: "projectCatPitched", icon: Mountain },
  { key: "facade", labelKey: "projectCatFacade", icon: Building2 },
  { key: "other", labelKey: "projectCatOther", icon: HardHat },
];
// A job is recognisable by its shape before its name: a gable, a flat slab
// with a parapet, a window grid, a hard hat. Drawn here rather than taken
// from an icon set so all four read as one family and take the project's
// colour.
function ProjectIcon({ category, size = 40, color = "currentColor" }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (category) {
    case "pitched":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 25 L24 7 L43 25" />
          <path d="M31 13 V8 h5 v10" />
          <path d="M11 21 V41 H37 V21" />
          <path d="M16 27 H32 M16 33 H32" strokeWidth="2" />
          <path d="M21 41 V32 h6 v9" />
        </svg>
      );
    case "flat":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 17 H44" strokeWidth="4" />
          <path d="M9 12 H39 M9 17 V41 H39 V17" />
          <path d="M13 12 V17 M35 12 V17" strokeWidth="2" />
          <rect x="14" y="24" width="7" height="7" strokeWidth="2" />
          <rect x="27" y="24" width="7" height="7" strokeWidth="2" />
          <path d="M40 22 v6" strokeWidth="2" />
        </svg>
      );
    case "facade":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="9" y="6" width="30" height="36" rx="2" />
          <path d="M15 12 h6 v6 h-6z M27 12 h6 v6 h-6z M15 22 h6 v6 h-6z M27 22 h6 v6 h-6z" strokeWidth="2" />
          <path d="M21 42 V33 h6 v9" />
          <path d="M4 42 H44" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 31 a14 14 0 0 1 28 0" />
          <path d="M24 17 v9" strokeWidth="2.5" />
          <path d="M6 31 H42" strokeWidth="4" />
          <path d="M9 36 q15 6 30 0" strokeWidth="2.5" />
        </svg>
      );
  }
}

function categoryIcon(key) {
  return (PROJECT_CATEGORIES.find((c) => c.key === key) || PROJECT_CATEGORIES[PROJECT_CATEGORIES.length - 1]).icon;
}
const DOCK_SORTS = ["pinned", "name", "status", "recent"];

// Pipeline, in funnel order: an enquiry becomes a quote, a quote becomes work,
// work finishes — or it is lost. `waiting` predates the pipeline and means
// "won, not started yet", so it sits between quoted and construction.
const PROJECT_STATUSES = [
  { key: "lead", labelKey: "projStatusLead", color: "#B48EAD" },
  { key: "quoted", labelKey: "projStatusQuoted", color: "#D08770" },
  { key: "waiting", labelKey: "projStatusWaiting", color: "#6B7280" },
  { key: "construction", labelKey: "projStatusConstruction", color: "#6FB3D9" },
  { key: "hold", labelKey: "projStatusHold", color: "#E8B923" },
  { key: "completed", labelKey: "projStatusCompleted", color: "#7FA65C" },
  { key: "lost", labelKey: "projStatusLost", color: "#E5484D" },
];
// Swiss VAT (MWST) rates as of 1 January 2024. These are set by federal law
// and have changed before — verify against estv.admin.ch rather than trusting
// this list if a rate looks wrong.
const VAT_RATES = [
  { key: "standard", rate: 8.1, labelKey: "vatStandard" },
  { key: "reduced", rate: 2.6, labelKey: "vatReduced" },
  { key: "lodging", rate: 3.8, labelKey: "vatLodging" },
  { key: "none", rate: 0, labelKey: "vatNone" },
];

export const DEFAULT_PROJECT_STATUS = "waiting";
// A project keeps the same colour everywhere it appears, so a glance at the
// calendar tells you which site a block belongs to without reading it.
const PROJECT_COLOURS = ["#6FB3D9", "#7FA65C", "#D08770", "#B48EAD", "#E8B923", "#5E9E93", "#C77B7B", "#8C9EC7"];
export function projectColour(id) {
  let hash = 0;
  const key = String(id || "");
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PROJECT_COLOURS[hash % PROJECT_COLOURS.length];
}

export function statusMeta(status) {
  return PROJECT_STATUSES.find((s) => s.key === status) || PROJECT_STATUSES.find((s) => s.key === DEFAULT_PROJECT_STATUS);
}

// Contact history types — what actually happens between a trade business and
// its customers, in the order they tend to occur.
const CONTACT_KINDS = [
  { key: "call", labelKey: "contactCall", icon: Phone, color: "#6FB3D9" },
  { key: "visit", labelKey: "contactVisit", icon: MapPin, color: "#7FA65C" },
  { key: "email", labelKey: "contactEmail", icon: Mail, color: "#B48EAD" },
  { key: "note", labelKey: "contactNote", icon: FileText, color: "#9C9791" },
];
function contactKindMeta(kind) {
  return CONTACT_KINDS.find((k) => k.key === kind) || CONTACT_KINDS[3];
}

// One-time promotion of `project.client` strings into customer records.
// Matches case-insensitively on name so two projects for the same client
// collapse into one customer rather than duplicating them.
export function migrateClientsToCustomers(projects, customers) {
  const next = customers.slice();
  const byName = new Map(next.map((c) => [c.name.trim().toLowerCase(), c]));
  let changed = false;
  const migrated = projects.map((p) => {
    if (p.customerId || !p.client || !p.client.trim()) return p;
    const key = p.client.trim().toLowerCase();
    let customer = byName.get(key);
    if (!customer) {
      customer = { id: uid(), name: p.client.trim(), company: "", phone: "", email: "", address: p.address || "", notes: "", contacts: [], createdAt: Date.now() };
      next.push(customer);
      byName.set(key, customer);
    }
    changed = true;
    return { ...p, customerId: customer.id };
  });
  return { projects: migrated, customers: next, changed };
}

const DOC_STATUSES = {
  quote: [
    { key: "draft", labelKey: "docStatusDraft", color: "#6B7280" },
    { key: "sent", labelKey: "docStatusSent", color: "#6FB3D9" },
    { key: "accepted", labelKey: "docStatusAccepted", color: "#7FA65C" },
    { key: "declined", labelKey: "docStatusDeclined", color: "#E5484D" },
  ],
  invoice: [
    { key: "draft", labelKey: "docStatusDraft", color: "#6B7280" },
    { key: "open", labelKey: "docStatusOpen", color: "#E8B923" },
    { key: "partial", labelKey: "docStatusPartial", color: "#D08770" },
    { key: "paid", labelKey: "docStatusPaid", color: "#7FA65C" },
  ],
};

// Quote and invoice totals. Money is computed in one place so the printed
// document, the on-screen summary and the QR-bill amount can never disagree.
export function documentTotals(doc) {
  const net = (doc.lineItems || []).reduce((sum, li) => {
    const qty = parseFloat(li.qty || 0) || 0;
    const price = parseFloat(li.unitPrice || 0) || 0;
    return sum + qty * price;
  }, 0);
  const rate = parseFloat(doc.vatRate ?? 0) || 0;
  const vat = net * (rate / 100);
  // Swiss invoices are rounded to 0.05 at the total.
  const gross = Math.round((net + vat) * 20) / 20;
  return { net, vat, gross, rate };
}

// Paid / partly paid / overdue is derived from the amount recorded against
// the invoice rather than stored separately, so a status can never drift out
// of step with the money actually received.
export function documentState(doc, today) {
  const totals = documentTotals(doc);
  const paid = parseFloat(doc.paidAmount || 0) || 0;
  const outstanding = Math.max(0, Math.round((totals.gross - paid) * 100) / 100);
  let key = doc.status || "draft";
  if (doc.type === "invoice" && key !== "draft") {
    if (totals.gross > 0 && paid >= totals.gross) key = "paid";
    else if (paid > 0) key = "partial";
    else key = "open";
  }
  const overdue =
    doc.type === "invoice" && key !== "paid" && key !== "draft" &&
    !!doc.dueDate && doc.dueDate < today;
  const set = DOC_STATUSES[doc.type] || DOC_STATUSES.invoice;
  const meta = set.find((s) => s.key === key) || set[0];
  return { key, meta, totals, paid, outstanding, overdue };
}

export function nextDocNumber(documents, type, year) {
  const prefix = `${type === "invoice" ? "R" : "O"}-${year}-`;
  const used = (documents || [])
    .filter((d) => d.type === type && String(d.number || "").startsWith(prefix))
    .map((d) => parseInt(String(d.number).slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function telHref(v) { return `tel:${String(v).replace(/[^\d+]/g, "")}`; }
function waHref(v) { return `https://wa.me/${String(v).replace(/[^\d]/g, "")}`; }

// Photos live in their own Firestore document (`photo-<id>`), never inside the
// site-data / site-docs / site-tech-library blobs. Firestore allows 1 MB per
// document and a scaled photo is 200-500 KB, so a couple of inline photos used
// to push those blobs over the limit and make every later save fail silently.
// Uses the existing window.storage shim, so index.html needs no change.
export function mapsUrl(address) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`; }
export function encodeProjectCode(project, entries) {
  const items = (entries || [])
    .filter((e) => e.type !== "photo") // keep the code a manageable size — photos aren't included
    .map((e) => ({ type: e.type, description: e.description, qty: e.qty || "", unit: e.unit || "", date: e.date }));
  const payload = { name: project.name, client: project.client || "", address: project.address || "", category: project.category || "flat", entries: items };
  try {
    return "SITE1-" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch (e) {
    return "";
  }
}
export function extractCode(text, prefix) {
  if (!text) return null;
  const stripped = text.replace(/\s+/g, ""); // strip all whitespace/newlines, e.g. from email line-wrapping
  const re = new RegExp(prefix + "[A-Za-z0-9+/=]+");
  const m = stripped.match(re);
  return m ? m[0] : null;
}

// Base64 uses ordinary letters, so a code pasted with text after it -- a
// signature, a closing greeting -- has that text swallowed by the match and
// fails to decode. Try the longest prefix that actually parses, stepping in
// fours because valid base64 comes in four-character groups.
function decodePayload(raw) {
  for (let len = raw.length - (raw.length % 4); len >= 8; len -= 4) {
    try {
      const obj = JSON.parse(decodeURIComponent(escape(atob(raw.slice(0, len)))));
      if (obj && typeof obj === "object") return obj;
    } catch (e) { /* keep trimming */ }
  }
  return null;
}
export function decodeProjectCode(code) {
  try {
    const found = extractCode(code, "SITE1-");
    if (!found) return null;
    const raw = found.replace(/^SITE1-/, "");
    const obj = decodePayload(raw);
    if (!obj || !obj.name) return null;
    if (!Array.isArray(obj.entries)) obj.entries = [];
    return obj;
  } catch (e) {
    return null;
  }
}
export function encodeBackup(obj) {
  try {
    return "BACKUP1-" + btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch (e) {
    return "";
  }
}
export function decodeBackup(code) {
  try {
    const found = extractCode(code, "BACKUP1-");
    if (!found) return null;
    const raw = found.replace(/^BACKUP1-/, "");
    return decodePayload(raw);
  } catch (e) {
    return null;
  }
}

export function classifyNote(text) {
  const t = text.toLowerCase();
  if (/(kg|bag|bags|m2|m²|sq m|pallet|szt|piece|pieces|tile|tiles|nail|shingle|membrane|insulation|felt|beam|plank|sack|zement|ciment|cemento|worki|vrec|pytl)/.test(t)) return "material";
  if (/(drill|saw|ladder|nail gun|hammer|scaffold|harness|tool|grinder|compressor|leiter|échelle|scala|escalera|escada|drabina|rebrík|žebřík)/.test(t)) return "tool";
  if (/(hour|hrs|clock|overtime|start|finish|break|off site|stunde|heure|ora|hora|godzin|hodin)/.test(t)) return "time";
  return "note";
}

function weatherFromCode(code, t) {
  if (code === 0) return { label: t.condClear, Icon: Sun };
  if (code === 1 || code === 2) return { label: t.condPartly, Icon: CloudSun };
  if (code === 3) return { label: t.condCloudy, Icon: Cloud };
  if (code === 45 || code === 48) return { label: t.condFog, Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: t.condDrizzle, Icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: t.condRain, Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: t.condSnow, Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { label: t.condStorm, Icon: CloudLightning };
  return { label: t.condCloudy, Icon: Cloud };
}

export default function SiteManager() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authForm, setAuthForm] = useState({ mode: "signin", email: "", password: "", error: null, busy: false, notice: null });
  const [legacyImport, setLegacyImport] = useState(null); // { docs, busy } when old public data is found
  const [membership, setMembership] = useState(null);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [onboarding, setOnboarding] = useState({ mode: "choose", companyName: "", displayName: "", code: "", busy: false, error: null });
  const [companyMigration, setCompanyMigration] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [team, setTeam] = useState({ members: [], invites: [], busy: false });
  const [clocks, setClocks] = useState([]); // each crew member's own clock
  const customersRef = useRef([]);
  const [lang, setLang] = useState("de");
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  // A language whose file has not arrived yet reads as German, then English,
  // until its chunk lands and the tick re-renders.
  const [, setLangTick] = useState(0);
  useEffect(() => {
    if (T[lang]) return;
    let alive = true;
    loadLang(lang).then(() => { if (alive) setLangTick((x) => x + 1); }).catch(() => {});
    return () => { alive = false; };
  }, [lang]);
  const t = T[lang] || T.de || T.en;

  const [tab, setTab] = useState("today");
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [openBranch, setOpenBranch] = useState(null); // { projectId, branch } in the tree
  const [boardView, setBoardView] = useState("week");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [dragProject, setDragProject] = useState(null);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [showFinishedJobs, setShowFinishedJobs] = useState(false);
  const [siteReports, setSiteReports] = useState([]);
  const [rapportModal, setRapportModal] = useState(null); // { projectId, date, ... } while signing
  const [syncState, setSyncState] = useState({ error: null, fromCache: false });
  const [assignModal, setAssignModal] = useState(null); // { date } while planning a day
  const [docEditor, setDocEditor] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingDraft, setBillingDraft] = useState(null);
  const [billing, setBilling] = useState({ companyName: "", street: "", buildingNumber: "", postalCode: "", town: "", country: "CH", iban: "", vatNumber: "", defaultVatKey: "standard", paymentDays: "30" });
  const [customerForm, setCustomerForm] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [contactForm, setContactForm] = useState(null);
  const [pipelineFilter, setPipelineFilter] = useState("all");
  const [entries, setEntries] = useState([]);
  const [activeClock, setActiveClock] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState(null);
  const [projectNote, setProjectNote] = useState("");
  const recognitionRef = useRef(null);
  const [materialsSubTab, setMaterialsSubTab] = useState("shop");
  const [techLibrary, setTechLibrary] = useState([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryScanModal, setLibraryScanModal] = useState(null);
  const [libraryEditModal, setLibraryEditModal] = useState(null);
  const [sortMode, setSortMode] = useState("type");
  const [shopCat, setShopCat] = useState(null);
  const [basket, setBasket] = useState([]);
  const [basketProjectModalOpen, setBasketProjectModalOpen] = useState(false);
  const [basketMode, setBasketMode] = useState("use");
  const [reportProjectPickerOpen, setReportProjectPickerOpen] = useState(false);
  const [reportProjectSelection, setReportProjectSelection] = useState([]);
  const [toast, setToast] = useState(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [newProjectCat, setNewProjectCat] = useState("flat");
  const [newProjectStatus, setNewProjectStatus] = useState(DEFAULT_PROJECT_STATUS);
  const [newProjectCustomerId, setNewProjectCustomerId] = useState("");
  const [shareProjectModal, setShareProjectModal] = useState(null); // project object
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState("");
  const [importError, setImportError] = useState(null);
  const [sentReports, setSentReports] = useState([]);
  // Plans and documents: metadata here, bytes in R2 behind the Worker.
  const [projectFiles, setProjectFiles] = useState([]);
  const projectFilesRef = useRef([]);
  const [fileViewer, setFileViewer] = useState(null); // { file, url }
  const [fileBusy, setFileBusy] = useState(0);
  const [linkForm, setLinkForm] = useState(null); // { projectId, url, name, kind }
  const [reportViewModal, setReportViewModal] = useState(null); // report object being viewed/edited
  const [rapportExists, setRapportExists] = useState(null); // { existing, projectId, date } when a signed Rapport already covers that day
  const [editTimeModal, setEditTimeModal] = useState(null); // the time entry being adjusted
  const [editHoursInput, setEditHoursInput] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  // The article master. Units and prices used to live in two separate maps;
  // suppliers and article numbers would have made four. Everything a material
  // name knows about itself now lives in one record, keyed by the lowercased
  // name, which is also what a price-list import will write into.
  const [articleMaster, setArticleMaster] = useState({});
  const [unitSuggestFocused, setUnitSuggestFocused] = useState(false);
  const [backupModal, setBackupModal] = useState(null); // 'export' | 'import' | null
  const [backupCodeOutput, setBackupCodeOutput] = useState("");
  const [backupCodeInput, setBackupCodeInput] = useState("");
  const [backupError, setBackupError] = useState(null);
  const [newProjectAddr, setNewProjectAddr] = useState("");
  const [addModal, setAddModal] = useState(null);
  const [lastTrade, setLastTrade] = useState(DEFAULT_TRADE);
  // The dock: active jobs plus whatever this person pinned, as a tray of
  // tiles at the bottom of every screen. Pins are personal -- the Polier and
  // the Chef care about different jobs in a given week.
  const [pinnedIds, setPinnedIds] = useState([]);
  const [dockOver, setDockOver] = useState(null);
  const [dockDragOver, setDockDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Translations of site notes, per project: { [entryId]: { [lang]: text } }.
  // Shared through kv so a note is translated once for the whole crew.
  const [noteTranslations, setNoteTranslations] = useState({});
  const [translatingIds, setTranslatingIds] = useState([]);
  // The UI languages in use across the company, read from each member's
  // stored preference. A note is translated into these on save -- not into
  // all fourteen the app speaks.
  const [memberLangs, setMemberLangs] = useState([]);
  // A photo opened full-screen, and the same photo under the pen.
  const [photoView, setPhotoView] = useState(null); // { entry, src }
  // More than one photo picked at once: the first is the preview, the rest
  // wait here and each becomes its own entry on save.
  const [photoExtra, setPhotoExtra] = useState([]);
  const [photoEdit, setPhotoEdit] = useState(null); // { entry, src }
  const [materialSearch, setMaterialSearch] = useState("");
  const [dockSort, setDockSort] = useState(() => {
    try { const v = localStorage.getItem("site-dock-sort"); return DOCK_SORTS.includes(v) ? v : "pinned"; } catch (e) { return "pinned"; }
  });
  const [dockOpen, setDockOpen] = useState(() => {
    try { return localStorage.getItem("site-dock-open") !== "0"; } catch (e) { return true; }
  });
  const [priceImport, setPriceImport] = useState(null);
  const priceFileRef = useRef(null);
  const [suggestCat, setSuggestCat] = useState(null);
  const [pendingSuggestion, setPendingSuggestion] = useState(null);
  const [sizeInput, setSizeInput] = useState("");
  const [form, setForm] = useState({ description: "", qty: "", unit: "" });
  const fileRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoPreviewId, setPhotoPreviewId] = useState(null);
  const [reportView, setReportView] = useState("daily");
  const [rapportWeekAnchor, setRapportWeekAnchor] = useState(() => todayKey());
  const [rapportPerson, setRapportPerson] = useState(null);
  const [tick, setTick] = useState(0);
  const [sosOpen, setSosOpen] = useState(false);
  const [cprStep, setCprStep] = useState(0);
  const [scanModal, setScanModal] = useState(null);
  const scanFileRef = useRef(null);
  const libraryScanFileRef = useRef(null);
  const [pickupModal, setPickupModal] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [inspectionModal, setInspectionModal] = useState(null);
  const [tripModal, setTripModal] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSite, setQuickAddSite] = useState(null);
  // The one place a failure is shown: a panel in the middle with a code.
  const [errorBox, setErrorBox] = useState(null);
  function showError(e, context) {
    const c = classifyError(e, context);
    console.error(`[${c.code} ${c.tag}]`, context, e);
    setErrorBox(c);
  }
  useEffect(() => {
    const onErr = (ev) => { const d = ev.detail || {}; setErrorBox(d.code && ERROR_CODES[d.code] ? { code: d.code, tag: ERROR_CODES[d.code].tag, group: ERROR_CODES[d.code].group, detail: String(d.detail || "") } : classifyError(d.error || d, d.context || "other")); };
    window.addEventListener("site-log:error", onErr);
    return () => window.removeEventListener("site-log:error", onErr);
  }, []);

  // A new build has taken over the page (service worker); offer a restart.
  const [updateReady, setUpdateReady] = useState(() => typeof window !== "undefined" && !!window.__siteLogUpdateReady);
  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener("site-log:update", onUpdate);
    // The announcement can land between the first render and this effect;
    // the flag catches what the event missed.
    if (window.__siteLogUpdateReady) setUpdateReady(true);
    return () => window.removeEventListener("site-log:update", onUpdate);
  }, []);
  const [transportFilter, setTransportFilter] = useState("");
  const inspectionFileRef = useRef(null);
  const [weather, setWeather] = useState({ loading: false, error: null, data: null });
  const [weatherLoc, setWeatherLoc] = useState({ name: "Zürich", lat: 47.3769, lon: 8.5417 });
  const [weatherEditOpen, setWeatherEditOpen] = useState(false);
  const [weatherCityInput, setWeatherCityInput] = useState("");
  const [safetyCat, setSafetyCat] = useState("roof");
  const [profile, setProfile] = useState({ name: "", phone: "", contactName: "", contactRelationship: "", contactPhone: "", supervisorName: "", supervisorEmail: "", supervisorPhone: "", webhookUrl: "", labourRate: "", currency: "CHF" });
  // Kept as derived views so the costing call sites read the same as before.
  const materialUnits = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(articleMaster)) if (v.unit) out[k] = v.unit;
    return out;
  }, [articleMaster]);
  const materialPrices = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(articleMaster)) if (v.price) out[k] = v.price;
    return out;
  }, [articleMaster]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: "vacation", note: "" });
  const [rangeLeaveModalOpen, setRangeLeaveModalOpen] = useState(false);
  const [rangeLeaveForm, setRangeLeaveForm] = useState({ from: "", to: "", type: "vacation", note: "" });
  const [insuranceCards, setInsuranceCards] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [insuranceForm, setInsuranceForm] = useState(null); // {id?, label, provider, policyNumber, phone, photo}
  const [certForm, setCertForm] = useState(null); // {id?, title, issuer, issueDate, expiryDate, photo}
  const docFileRef = useRef(null);
  const certFileRef = useRef(null);
  const backupTextareaRef = useRef(null);
  const [profileDraft, setProfileDraft] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  // Auth gate. Nothing is read until Firebase reports a signed-in user, since
  // every document path is scoped to that account.
  useEffect(() => {
    let unsub;
    onAuthChange((u) => {
      setUser(u || null);
      setAuthChecked(true);
      if (!u) {
        setReady(false);
        // Clear everything the previous account had loaded. Site phones are
        // shared: signing out and back in as someone else left the last
        // person's invoices, labour rate and IBAN in memory, and they appeared
        // on screen for a role that must never see them.
        setProjects([]); setEntries([]); setCustomers([]);
        setLeaveRequests([]); setSentReports([]); setActiveClock(null);
        setDocuments([]); setAssignments([]); setClocks([]); setSiteReports([]); setProjectFiles([]); projectFilesRef.current = [];
        setBilling({ companyName: "", street: "", buildingNumber: "", postalCode: "", town: "", country: "CH", iban: "", vatNumber: "", defaultVatKey: "standard", paymentDays: "30" });
        setProfile({ name: "", phone: "", contactName: "", contactRelationship: "", contactPhone: "", supervisorName: "", supervisorEmail: "", supervisorPhone: "", webhookUrl: "" });
        setInsuranceCards([]); setCertificates([]); setTechLibrary([]);
        setTeam({ members: [], invites: [], busy: false });
        setArticleMaster({});
        setPinnedIds([]);
        setSyncState({ error: null, fromCache: false });
      }
    }).then((fn) => { unsub = fn; }).catch(() => setAuthChecked(true));
    return () => { if (unsub) unsub(); };
  }, []);

  // Resolve which company this account belongs to before touching any data:
  // every document path is company-scoped, and a crew member has no personal
  // store to fall back on.
  useEffect(() => {
    if (!user) { setMembership(null); setMembershipChecked(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const m = await loadMembership(user.uid);
        if (cancelled) return;
        if (m) {
          window.storage = companyStorage; // company-scoped from here on
          setMembership(m);
        } else {
          setMembership(null);
        }
      } catch (e) {
        if (!cancelled) setMembership(null);
      }
      if (!cancelled) setMembershipChecked(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Live collection subscriptions. Two devices editing different records now
  // both keep their work, and the owner sees crew activity without reloading.
  useEffect(() => {
    if (!user || !membership) return;
    const unsubs = [];
    // A failed listener used to look exactly like an empty account. Report it.
    const onErr = (err, name) => setSyncState({ error: name + ": " + ((err && (err.code || err.message)) || err), fromCache: false });
    const track = (meta) => setSyncState((st) => (st.error ? st : { error: null, fromCache: !!(meta && meta.fromCache) }));

    unsubs.push(subscribeCollection("projects", (rows, meta) => {
      track(meta);
      const { projects: mp, customers: mc, changed } = migrateClientsToCustomers(rows, customersRef.current || []);
      setProjects(mp);
      if (changed && isOwner()) {
        syncCollection("projects", mp).catch(() => {});
        syncCollection("customers", mc).catch(() => {});
      }
    }, onErr));
    unsubs.push(subscribeCollection("entries", (rows, meta) => { track(meta); setEntries(rows); }, onErr));
    unsubs.push(subscribeCollection("customers", setCustomers, onErr));
    unsubs.push(subscribeCollection("assignments", setAssignments, onErr));
    unsubs.push(subscribeCollection("leave", setLeaveRequests, onErr));
    unsubs.push(subscribeCollection("reports", setSiteReports, onErr));
    unsubs.push(subscribeCollection("sentReports", setSentReports, onErr));
    unsubs.push(subscribeCollection("files", setProjectFiles, onErr));
    // Crew have no access to quotes and invoices — subscribing would simply
    // be denied, so don't ask.
    if (isOwner()) unsubs.push(subscribeCollection("documents", setDocuments, onErr));
    return () => unsubs.forEach((u) => { try { u(); } catch {} });
  }, [user, membership]);

  useEffect(() => {
    if (!user || !membership) return;
    (async () => {
      try {
        const metaRes = await window.storage.get("site-meta");
        if (metaRes && metaRes.value) {
          const meta = JSON.parse(metaRes.value);
          // Sent reports used to live in this blob too. Move them across once.
          if (Array.isArray(meta.sentReports) && meta.sentReports.length && canManage()) {
            try {
              const already = await loadCollection("sentReports");
              if (already.length === 0) {
                await syncCollection("sentReports", meta.sentReports.map((r) => ({
                  ...r, id: r.id || uid(), userId: r.userId || user.uid,
                })));
              }
            } catch (e) {}
          }
          // Absences used to live in this blob. Move them to their own
          // documents once, so approval can be a permission.
          if (Array.isArray(meta.leaveRequests) && meta.leaveRequests.length && canManage()) {
            try {
              const already = await loadCollection("leave");
              if (already.length === 0) {
                const stamped = meta.leaveRequests.map((r) => ({ ...r, id: r.id || uid(), userId: r.userId || user.uid }));
                await syncCollection("leave", stamped);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
      try {
        // The clock is personal: each crew member has their own.
        const clockRes = await window.storage.get(`clock-${user.uid}`);
        if (clockRes && clockRes.value) setActiveClock(JSON.parse(clockRes.value).activeClock || null);
      } catch (e) {}
      try {
        const langRes = await getPersonal("site-lang");
        if (langRes && langRes.value && isLang(langRes.value)) setLang(langRes.value);
      } catch (e) {}
      try {
        const profRes = await getPersonal("site-profile");
        if (profRes && profRes.value) setProfile(JSON.parse(profRes.value));
      } catch (e) {}
      let loc = { name: "Zürich", lat: 47.3769, lon: 8.5417 };
      try {
        const locRes = await getPersonal("site-weather-loc");
        if (locRes && locRes.value) loc = JSON.parse(locRes.value);
      } catch (e) {}
      setWeatherLoc(loc);
      try {
        const docsRes = await getPersonal("site-docs");
        if (docsRes && docsRes.value) {
          const docs = JSON.parse(docsRes.value);
          setInsuranceCards(docs.insurance || []);
          setCertificates(docs.certificates || []);
        }
      } catch (e) {}
      try {
        const pinsRes = await window.storage.get(personalKey("site-dock-pins"));
        if (pinsRes && pinsRes.value) setPinnedIds(JSON.parse(pinsRes.value));
      } catch (e) {}
      try {
        const catRes = await window.storage.get("site-material-catalog");
        if (catRes && catRes.value) {
          setArticleMaster(JSON.parse(catRes.value));
        } else {
          // First run after the split: fold the two old maps into one record
          // each, so nobody loses the units and prices the app already learnt.
          const merged = {};
          const unitsRes = await window.storage.get("site-material-units");
          const pricesRes = await window.storage.get("site-material-prices");
          const units = unitsRes && unitsRes.value ? JSON.parse(unitsRes.value) : {};
          const prices = pricesRes && pricesRes.value ? JSON.parse(pricesRes.value) : {};
          for (const k of new Set([...Object.keys(units), ...Object.keys(prices)])) {
            merged[k] = { name: k, unit: units[k] || "", price: prices[k] || "", supplier: "", artNo: "" };
          }
          if (Object.keys(merged).length) {
            setArticleMaster(merged);
            window.storage.set("site-material-catalog", JSON.stringify(merged)).catch(() => {});
          }
        }
      } catch (e) {}
      // Billing, the labour rate and margins live in an owner-only document.
      // Crew genuinely cannot read it — the rules deny it, not just the UI.
      if (isOwner()) {
        try {
          const fin = await loadFinance();
          if (fin) setBilling((b) => ({ ...b, ...fin }));
        } catch (e) {}
      }
      try {
        const libRes = await window.storage.get("site-tech-library");
        if (libRes && libRes.value) setTechLibrary(JSON.parse(libRes.value));
      } catch (e) {}
      setReady(true);

      // Offer to bring across data from before the company existed. Owner
      // only, and never automatic.
      if (isOwner()) {
        try {
          const existing = await loadCollection("projects");
          if (existing.length === 0) {
            const summary = await personalDataSummary(user.uid);
            if (summary.hasData) setCompanyMigration({ summary, busy: false, result: null });
          }
        } catch (e) {}
      }
    })();
  }, [user, membership]);

  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => { projectFilesRef.current = projectFiles; }, [projectFiles]);

  // The languages the crew reads live in one shared document, one line per
  // member, kept up to date by each member for themselves. (Scanning the
  // personal keys would need a collection query the rules rightly refuse.)
  useEffect(() => {
    if (!membership || !user) return;
    let alive = true;
    (async () => {
      try {
        const res = await companyStorage.get("site-langs");
        const map = res && res.value ? JSON.parse(res.value) : {};
        if (map[user.uid] !== lang) {
          map[user.uid] = lang;
          companyStorage.set("site-langs", JSON.stringify(map)).catch(() => {});
        }
        if (alive) setMemberLangs([...new Set(Object.values(map).filter((v) => v && isLang(v)))]);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [membership, lang]);

  // One "open" per company per session; the Worker turns it into "people
  // active today".
  useEffect(() => {
    if (membership) tracker.track("open");
  }, [membership?.companyId]);

  const [usage, setUsage] = useState(null);
  async function loadUsage() {
    try {
      const cid = getCompanyId();
      const token = await getIdToken();
      const res = await fetch(`${CLAUDE_PROXY_URL}/metrics/${cid}?days=30`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.ok ? await res.json() : null;
      setUsage(data && Array.isArray(data.days) ? data : { days: [], totals: {}, activePeople: 0 });
    } catch {
      setUsage({ days: [], totals: {}, activePeople: 0 });
    }
  }

  useEffect(() => {
    if (!selectedProject || !membership) return;
    let alive = true;
    companyStorage.get(`xl-${selectedProject}`)
      .then((res) => {
        if (!alive || !res || !res.value) return;
        try { const map = JSON.parse(res.value); setNoteTranslations((m) => ({ ...m, [selectedProject]: { ...(m[selectedProject] || {}), ...map } })); } catch (e) {}
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [selectedProject, membership]);

  // Everyone needs the roster once: the Team tab lists it, and the crew shown
  // on a job are looked up by uid in it. It used to load only for managers and
  // only on three tabs, so crew saw an empty team and "nobody on this job"
  // while the Polier had just assigned two people. The rules already let every
  // member read the list.
  useEffect(() => {
    if (!membership) return;
    let alive = true;
    listMembers()
      .then((all) => { if (alive) setTeam((s) => ({ ...s, members: all.filter((m) => m.active !== false), former: all.filter((m) => m.active === false) })); })
      .catch(() => {});
    return () => { alive = false; };
  }, [membership]);

  // The dashboard needs names and each person's clock. Refreshed on entry and
  // then periodically, since "who is on site right now" goes stale quickly.
  useEffect(() => {
    // The calendar planner needs the member list too, not just the dashboard.
    if (!["cockpit", "calendar", "board"].includes(tab) || !membership || !canManage()) return;
    let alive = true;
    async function refresh() {
      // Declared outside the try: the clock loop below needs it, and a
      // block-scoped const would leave it undefined there.
      let members = [];
      try {
        const all = await listMembers();
        members = all.filter((m) => m.active !== false);
        if (alive) setTeam((s) => ({ ...s, members, former: all.filter((m) => m.active === false) }));
      } catch (e) {}
      try {
        // One read per member rather than a listing: the rules let a manager
        // read every clock but never list the bucket.
        const rows = [];
        for (const m of members || []) {
          const res = await companyStorage.get(`clock-${m.uid}`).catch(() => null);
          if (!res || !res.value) continue;
          try { rows.push({ uid: m.uid, ...JSON.parse(res.value) }); } catch {}
        }
        if (alive) setClocks(rows);
      } catch (e) {}
    }
    refresh();
    const iv = setInterval(refresh, 60000);
    return () => { alive = false; clearInterval(iv); };
  }, [tab, membership]);

  async function submitOnboarding(mode) {
    setOnboarding((s) => ({ ...s, busy: true, error: null }));
    try {
      if (mode === "create") {
        if (!onboarding.companyName.trim()) throw new Error("company-name");
        await createCompany(user.uid, {
          companyName: onboarding.companyName.trim(),
          displayName: onboarding.displayName.trim(),
          email: user.email,
        });
      } else {
        if (!onboarding.code.trim()) throw new Error("invite-invalid");
        await joinCompanyWithCode(user.uid, onboarding.code, {
          displayName: onboarding.displayName.trim(),
          email: user.email,
        });
      }
      const m = await loadMembership(user.uid);
      window.storage = companyStorage;
      setMembership(m);
      setOnboarding((s) => ({ ...s, busy: false }));
    } catch (err) {
      const key = {
        "company-name": "onbErrCompanyName",
        "invite-invalid": "onbErrInvalidCode",
        "invite-used": "onbErrCodeUsed",
        "invite-expired": "onbErrCodeExpired",
        "company-not-confirmed": "onbErrNotConfirmed",
      }[err.message] || "onbErrGeneric";
      // Keep the real reason visible: a generic message here once hid a
      // rules bug that blocked company creation entirely.
      console.error("onboarding failed:", err);
      setOnboarding((s) => ({ ...s, busy: false, error: key, detail: String(err && (err.code || err.message) || err) }));
    }
  }

  async function openTeam() {
    setTeamModalOpen(true);
    setTeam((s) => ({ ...s, busy: true }));
    try {
      const [all, invites] = await Promise.all([listMembers(), listInvites()]);
      setTeam({ members: all.filter((m) => m.active !== false), former: all.filter((m) => m.active === false), invites, busy: false });
    } catch (e) {
      setTeam((s) => ({ ...s, busy: false }));
    }
  }

  async function makeInvite(inviteRole = "crew") {
    try {
      await createInvite(inviteRole);
      const invites = await listInvites();
      setTeam((s) => ({ ...s, invites }));
    } catch (e) { saveFailed(e, "makeInvite"); }
  }

  async function dropInvite(code) {
    try {
      await revokeInvite(code);
      setTeam((s) => ({ ...s, invites: s.invites.filter((i) => i.code !== code) }));
    } catch (e) { saveFailed(e, "dropInvite"); }
  }

  async function runCompanyMigration() {
    if (!companyMigration) return;
    setCompanyMigration((s) => ({ ...s, busy: true }));
    try {
      const counts = await migrateFromPersonal(user.uid);
      // Show what actually landed rather than asserting success: the originals
      // are untouched, so a mismatch is recoverable.
      setCompanyMigration((s) => ({ ...s, busy: false, result: counts }));
    } catch (err) {
      setCompanyMigration((s) => ({ ...s, busy: false }));
      saveFailed(err, "runCompanyMigration");
    }
  }

  async function runLegacyImport() {
    if (!legacyImport) return;
    setLegacyImport((s) => ({ ...s, busy: true }));
    try {
      await importLegacy(legacyImport.docs);
      setLegacyImport(null);
      window.location.reload();
    } catch (err) {
      setLegacyImport((s) => ({ ...s, busy: false }));
      saveFailed(err, "runLegacyImport");
    }
  }

  useEffect(() => {
    if (ready) fetchWeather(weatherLoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, weatherLoc.lat, weatherLoc.lon]);

  function openProfile() {
    setProfileDraft({ ...profile });
    setProfileModalOpen(true);
  }

  async function saveProfileInfo() {
    // Report payloads go wherever this points. https only, and a bad value is
    // dropped rather than kept around to fire later.
    const badHook = profileDraft.webhookUrl && !/^https:\/\/[^\s/]+/.test(String(profileDraft.webhookUrl).trim());
    const cleanedProfile = badHook ? { ...profileDraft, webhookUrl: "" } : profileDraft;
    if (badHook) { showToast(t.webhookHttpsOnly); setProfileDraft(cleanedProfile); }
    setProfile(cleanedProfile);
    setProfileModalOpen(false);
    try { await window.storage.set(personalKey("site-profile"), JSON.stringify(cleanedProfile)); } catch (e) {}
  }

  async function saveDocs(next) {
    const data = { insurance: next.insurance ?? insuranceCards, certificates: next.certificates ?? certificates };
    if (next.insurance) setInsuranceCards(next.insurance);
    if (next.certificates) setCertificates(next.certificates);
    try { await window.storage.set(personalKey("site-docs"), JSON.stringify(data)); } catch (e) {}
  }

  async function saveTechLibrary(next) {
    setTechLibrary(next);
    try { await window.storage.set("site-tech-library", JSON.stringify(next)); } catch (e) { saveFailed(e, "saveTechLibrary"); }
  }

  // Moves a freshly picked image out of the record and into its own document,
  // so site-docs / site-tech-library stay far below Firestore's 1 MB limit. On
  // failure the image is kept inline rather than lost.
  async function externalizePhoto(record) {
    if (!record.photo || record.photoId) return record;
    try {
      const photoId = await savePhoto(record.photo);
      return { ...record, photoId, photo: null };
    } catch {
      return record;
    }
  }

  function openInsuranceForm(existing) {
    setInsuranceForm(existing ? { ...existing } : { id: null, label: "", provider: "", policyNumber: "", phone: "", photo: null, photoId: null });
    if (existing && !existing.photo && existing.photoId) {
      loadPhoto(existing.photoId).then((v) => setInsuranceForm((s) => (s ? { ...s, photo: v } : s)));
    }
  }

  async function submitInsurance() {
    if (!insuranceForm) return;
    const record = await externalizePhoto(insuranceForm);
    if (record.id) {
      saveDocs({ insurance: insuranceCards.map((c) => (c.id === record.id ? record : c)) });
    } else {
      saveDocs({ insurance: [...insuranceCards, { ...record, id: uid() }] });
    }
    setInsuranceForm(null);
  }

  function deleteInsurance(id) {
    const card = insuranceCards.find((c) => c.id === id);
    saveDocs({ insurance: insuranceCards.filter((c) => c.id !== id) });
    if (card && card.photoId) deletePhoto(card.photoId);
    setInsuranceForm(null);
  }

  function openCertForm(existing) {
    setCertForm(existing ? { ...existing } : { id: null, title: "", issuer: "", issueDate: "", expiryDate: "", photo: null, photoId: null });
    if (existing && !existing.photo && existing.photoId) {
      loadPhoto(existing.photoId).then((v) => setCertForm((s) => (s ? { ...s, photo: v } : s)));
    }
  }

  async function submitCert() {
    if (!certForm) return;
    const record = await externalizePhoto(certForm);
    if (record.id) {
      saveDocs({ certificates: certificates.map((c) => (c.id === record.id ? record : c)) });
    } else {
      saveDocs({ certificates: [...certificates, { ...record, id: uid() }] });
    }
    setCertForm(null);
  }

  function deleteCert(id) {
    const cert = certificates.find((c) => c.id === id);
    saveDocs({ certificates: certificates.filter((c) => c.id !== id) });
    if (cert && cert.photoId) deletePhoto(cert.photoId);
    setCertForm(null);
  }

  async function handleDocPhoto(e, setter) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl } = await fileToScaledImage(file);
      setter((s) => ({ ...s, photo: dataUrl }));
    } catch (err) {}
  }

  // Leave used to be matched on date alone, which was fine for one person and
  // wrong the moment a crew existed: opening a day would edit whichever
  // request happened to fall on it, including someone else’s. Requests made
  // before crew accounts have no userId and are treated as the owner’s.
  function myLeaveFor(date) {
    return leaveRequests.find((r) => r.date === date && (r.userId ? r.userId === user?.uid : isOwner()));
  }

  function openDay(dateStr) {
    setSelectedDay(dateStr);
    const existing = myLeaveFor(dateStr);
    setLeaveForm({ type: existing?.type || "vacation", note: existing?.note || "" });
  }

  function submitLeaveRequest() {
    if (!selectedDay) return;
    const existing = myLeaveFor(selectedDay);
    let updated;
    if (existing) {
      updated = leaveRequests.map((r) => (r.id === existing.id ? { ...r, type: leaveForm.type, note: leaveForm.note } : r));
    } else {
      updated = [...leaveRequests, { id: uid(), date: selectedDay, userId: user?.uid || null, type: leaveForm.type, note: leaveForm.note, status: "pending", createdAt: Date.now() }];
    }
    persist({ leaveRequests: updated });
  }

  function submitRangeLeave() {
    if (!rangeLeaveForm.from || !rangeLeaveForm.to) return;
    const start = new Date(rangeLeaveForm.from + "T00:00:00");
    const end = new Date(rangeLeaveForm.to + "T00:00:00");
    if (end < start) return;
    const pad = (n) => String(n).padStart(2, "0");
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    let updated = [...leaveRequests];
    dates.forEach((dateStr) => {
      const existing = updated.find((r) => r.date === dateStr && (r.userId ? r.userId === user?.uid : isOwner()));
      if (existing) {
        updated = updated.map((r) => (r.id === existing.id ? { ...r, type: rangeLeaveForm.type, note: rangeLeaveForm.note } : r));
      } else {
        updated.push({ id: uid(), date: dateStr, userId: user?.uid || null, type: rangeLeaveForm.type, note: rangeLeaveForm.note, status: "pending", createdAt: Date.now() });
      }
    });
    persist({ leaveRequests: updated });
    setRangeLeaveModalOpen(false);
    setRangeLeaveForm({ from: "", to: "", type: "vacation", note: "" });
    showToast(t.projectAdded);
  }

  function setLeaveStatus(id, status) {
    persist({ leaveRequests: leaveRequests.map((r) => (r.id === id ? { ...r, status } : r)) });
  }

  function sendLeaveToSupervisor(request) {
    const typeLabel = request.type === "vacation" ? t.leaveVacation : request.type === "sick" ? t.leaveSick : t.leaveOther;
    const subject = `${t.requestLeave}: ${request.date}`;
    const body = `${profile.name || ""}\n${typeLabel} — ${request.date}\n${request.note || ""}`;
    if (profile.supervisorEmail) {
      window.open(`mailto:${profile.supervisorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    } else if (profile.supervisorPhone) {
      window.open(`https://wa.me/${profile.supervisorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`${subject}\n${body}`)}`, "_blank");
    } else {
      setProfileModalOpen(true);
      setProfileDraft({ ...profile });
    }
  }

  // What a report says right now. Reports carry entry ids and are joined
  // against the live log, so a corrected quantity reaches the supervisor on
  // the next send. Old reports still carry copies and read from those.
  function reportFigures(report) {
    const rows = reportRows(report, entries);
    const totals = reportTotals(rows);
    const live = Array.isArray(report.entryIds);
    return {
      rows,
      hours: live ? totals.hours : (report.hours ?? totals.hours),
      transportHours: live ? totals.transportHours : (report.transportHours ?? totals.transportHours),
      materialsCount: live ? totals.materialsCount : (report.materialsCount ?? totals.materialsCount),
      toolsCount: live ? totals.toolsCount : (report.toolsCount ?? totals.toolsCount),
      sites: live ? totals.projIds.map(projectName).filter(Boolean) : (report.sitesVisited || []),
    };
  }

  function reportSendText(report) {
    const periodLabel = report.period === "daily" ? t.daily : t.monthly;
    const f = reportFigures(report);
    const subject = `${periodLabel} ${t.sendToSupervisor}: ${report.periodLabel}`;
    const body = `${profile.name || ""}\n${t.hoursFieldLabel}: ${f.hours}${f.transportHours > 0 ? `\n${t.reportTransportHours}: ${f.transportHours}` : ""}\n${t.materialsLogged}: ${f.materialsCount}\n${t.toolsLogged}: ${f.toolsCount}\n${t.sitesLabel}: ${f.sites.join(", ")}${report.notes ? `\n${t.notesLabel}: ${report.notes}` : ""}`;
    return { subject, body };
  }

  function sendReportVia(report) {
    const { subject, body } = reportSendText(report);
    if (profile.supervisorEmail) {
      window.open(`mailto:${profile.supervisorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    } else if (profile.supervisorPhone) {
      window.open(`https://wa.me/${profile.supervisorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`${subject}\n${body}`)}`, "_blank");
    } else {
      setProfileModalOpen(true);
      setProfileDraft({ ...profile });
    }
  }

  function sendVia() {
    return profile.supervisorEmail ? "mail" : profile.supervisorPhone ? "whatsapp" : "none";
  }

  // The same report for the same day is one record. Tapping send again
  // refreshes its scope (entries logged since), keeps the notes and the
  // exclusions, and adds one more line to its send history -- it never makes
  // a second report. userId is required by the rules; without it the create
  // was refused and nothing was stored.
  function sendReportToSupervisor(view, summary, list, periodLabelOverride) {
    tracker.track("report.sent");
    const periodLabel = periodLabelOverride || (view === "daily" ? todayKey() : monthKey());
    const id = reportId(user?.uid, view, periodLabel);
    const existing = sentReports.find((r) => r.id === id);
    const excludedIds = existing?.excludedIds || [];
    const scoped = list.filter((e) => !excludedIds.includes(e.id));
    const totals = reportTotals(scoped);
    const base = {
      id,
      period: view,
      periodLabel,
      userId: user?.uid || null,
      entryIds: scoped.map((e) => e.id),
      entryLabels: entryLabels(scoped),
      excludedIds,
      // Kept as a summary of the moment it went out, for the record; the
      // modal and the mail read the live rows.
      hours: totals.hours,
      materialsCount: totals.materialsCount,
      toolsCount: totals.toolsCount,
      sitesVisited: totals.projIds.map(projectName).filter(Boolean),
      notes: existing?.notes || "",
      editedAt: existing?.editedAt || null,
      createdAt: existing?.createdAt || Date.now(),
      sends: existing?.sends,
      sentAt: existing?.sentAt,
    };
    const report = withSend(base, sendVia());
    persist({ sentReports: existing ? sentReports.map((r) => (r.id === id ? report : r)) : [report, ...sentReports] });
    setReportViewModal(report);
    sendReportVia(report);
    sendWebhook("report", {
      reportId: id, sendIndex: report.sends.length,
      period: report.period, periodLabel: report.periodLabel, hours: report.hours,
      materialsCount: report.materialsCount, toolsCount: report.toolsCount, sitesVisited: report.sitesVisited,
      entries: scoped.map((e) => ({ id: e.id, type: e.type, description: e.description, qty: e.qty || "", unit: e.unit || "", projectName: e.projectId ? projectName(e.projectId) : "" })),
    });
  }

  // Sending an existing report again: same record, one more line of history.
  function resendReport(report) {
    const updated = withSend(report, sendVia());
    persist({ sentReports: sentReports.map((r) => (r.id === updated.id ? updated : r)) });
    setReportViewModal(updated);
    sendReportVia(updated);
    const f = reportFigures(updated);
    sendWebhook("report", { reportId: updated.id, sendIndex: updated.sends.length, period: updated.period, periodLabel: updated.periodLabel, hours: f.hours, materialsCount: f.materialsCount, toolsCount: f.toolsCount, sitesVisited: f.sites });
  }

  function toggleReportEntry(id) {
    setReportViewModal((r) => {
      if (!r) return r;
      const ex = r.excludedIds || [];
      return { ...r, excludedIds: ex.includes(id) ? ex.filter((x) => x !== id) : [...ex, id] };
    });
  }

  function generateDayReport(dateStr) {
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const summary = dailySummary(dayEntries);
    sendReportToSupervisor("daily", summary, dayEntries, dateStr);
  }

  function saveReportEdits() {
    if (!reportViewModal) return;
    const updated = { ...reportViewModal, editedAt: Date.now() };
    persist({ sentReports: sentReports.map((r) => (r.id === updated.id ? updated : r)) });
    setReportViewModal(updated);
    showToast(t.saveProfile);
  }

  function renderReportDocument(subtitle, sections, remark) {
    // Notes are free text typed on a roof; the print must not become HTML
    // because someone wrote "<3" in a comment.
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const rowsHtml = (items) =>
      items
        .map((i) => `<tr><td>${esc(i.description)}</td><td>${esc(i.qty)}</td><td>${esc(i.unit)}</td></tr>`)
        .join("");

    // What was said on site belongs on the record next to what was used.
    const notesHtml = (notes) =>
      notes && notes.length
        ? `<div class="tablabel">${t.notesLabel}</div>
           <ul class="notes">${notes.map((n) => `<li><span class="when">${esc(n.date)}</span>${esc(n.description)}</li>`).join("")}</ul>`
        : "";

    const tableHtml = (label, items) =>
      items.length
        ? `<div class="tablabel">${label}</div>
           <table><thead><tr><th>${t.entriesTitle}</th><th>${t.qtyPlaceholder}</th><th>${t.unitPlaceholder}</th></tr></thead>
           <tbody>${rowsHtml(items)}</tbody></table>`
        : "";

    const sectionsHtml = sections
      .map(
        (s) => `
      <div class="section">
        <h2>${esc(s.title)}</h2>
        ${s.client ? `<div class="meta">${esc(s.client)}</div>` : ""}
        ${s.address ? `<div class="meta">${esc(s.address)}</div>` : ""}
        <div class="totalhours">${t.totalHoursLabel}: ${s.hours.toFixed(1)} h</div>
        ${tableHtml(t.materialsLogged, s.materials)}
        ${tableHtml(t.machinesToolsLabel, s.machines)}
        ${notesHtml(s.notes)}
      </div>`
      )
      .join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.appLabel}</title>
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #DA291C; padding-bottom: 12px; margin-bottom: 20px; }
        .header .sub { color: #666; font-size: 12px; margin-top: 2px; }
        .header h1 { font-size: 20px; margin: 0; }
        .header img { opacity: 0.9; max-width: 160px; max-height: 70px; object-fit: contain; }
        .section { margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #ddd; border-radius: 6px; padding: 16px; }
        .section h2 { font-size: 16px; margin: 0 0 4px 0; color: #DA291C; }
        .meta { color: #666; font-size: 12px; }
        .totalhours { font-weight: 700; font-size: 14px; margin: 10px 0; background: #f5f5f5; padding: 8px 10px; border-radius: 4px; display: inline-block; }
        .tablabel { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 12px 0 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; margin-bottom: 8px; }
        th { text-align: left; background: #fafafa; border-bottom: 2px solid #333; padding: 6px 8px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; word-wrap: break-word; }
        th:nth-child(1), td:nth-child(1) { width: 60%; }
        th:nth-child(2), td:nth-child(2) { width: 20%; }
        th:nth-child(3), td:nth-child(3) { width: 20%; }
        .notes { list-style: none; padding: 0; margin: 0 0 8px; font-size: 12px; }
        .notes li { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .notes .when { color: #888; margin-right: 10px; font-variant-numeric: tabular-nums; }
        .remark { font-size: 12px; margin: 0 0 16px; padding: 10px 12px; background: #fff7e6; border-left: 3px solid #E0B341; white-space: pre-wrap; }
        .footer { margin-top: 24px; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } .section { page-break-inside: avoid; } }
      </style>
      </head><body>
        <div class="header">
          <div>
            <h1>${t.appLabel}</h1>
            <div class="sub">${esc(subtitle)}</div>
          </div>
          <img src="${COMPANY_LOGO_DATA_URI}" alt="logo" />
        </div>
        ${remark ? `<div class="remark">${esc(remark)}</div>` : ""}
        ${sectionsHtml || `<div class="meta">${t.noProjectsYet}</div>`}
        <div class="footer">${t.generatedOnLabel}: ${new Date().toLocaleString()}</div>
      </body></html>`;
  }

  // Projects created since customers became records carry a customerId and an
  // empty client string, so reading project.client alone left the client blank
  // on their reports.
  function clientNameFor(project) {
    if (!project) return "";
    const c = project.customerId ? customers.find((x) => x.id === project.customerId) : null;
    return (c && c.name) || project.client || "";
  }

  function buildReportHtml(report) {
    const periodLabel = report.period === "daily" ? t.daily : t.monthly;
    const bySite = {};
    reportRows(report, entries).forEach((e) => {
      if (e.deleted) return;
      const key = e.projectName || (e.projectId ? projectName(e.projectId) : "") || t.sitesLabel;
      (bySite[key] = bySite[key] || []).push(e);
    });
    const sections = Object.entries(bySite).map(([siteName, ents]) => {
      const proj = projects.find((p) => p.name === siteName);
      const hours = ents.filter((e) => e.type === "time").reduce((s, e) => s + parseFloat(e.qty || 0), 0);
      const materials = ents.filter((e) => e.type === "material");
      const machines = ents.filter((e) => e.type === "tool");
      const notes = ents.filter((e) => e.type === "note");
      return { title: siteName, client: clientNameFor(proj), address: proj?.address || "", hours, materials, machines, notes };
    });
    const subtitle = `${periodLabel} · ${report.periodLabel}${profile.name ? " · " + profile.name : ""}`;
    // The author's own remark on the report goes on top, before the sites.
    return renderReportDocument(subtitle, sections, report.notes);
  }

  function buildProjectsReportHtml(projectIds) {
    const orderedProjects = projectIds && projectIds.length ? projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) : projects;
    const sections = orderedProjects
      .map((p) => {
        const pEntries = entries.filter((e) => e.projectId === p.id);
        const hours = pEntries.filter((e) => e.type === "time").reduce((s, e) => s + parseFloat(e.qty || 0), 0);
        const materials = pEntries.filter((e) => e.type === "material");
        const machines = pEntries.filter((e) => e.type === "tool");
        const notes = pEntries.filter((e) => e.type === "note").sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt || 0) - (b.createdAt || 0));
        return { title: p.name, client: clientNameFor(p), address: p.address || "", hours, materials, machines, notes };
      })
      .filter((s) => s.hours > 0 || s.materials.length > 0 || s.machines.length > 0 || s.notes.length > 0);
    const subtitle = `${profile.name || ""}${profile.name ? " · " : ""}${new Date().toLocaleDateString()}`;
    return renderReportDocument(subtitle, sections);
  }

  async function printDocument(doc) {
    const customer = customers.find((c) => c.id === doc.customerId);
    const project = projects.find((p) => p.id === doc.projectId);
    const totals = documentTotals(doc);
    const cur = billing.currency || "CHF";
    const isInvoice = doc.type === "invoice";
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fmt = (n) => n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // The payment part is only produced when the billing details are actually
    // valid. A QR-bill with a wrong IBAN scans fine and sends money to the
    // wrong place, so a missing slip is far better than a plausible one.
    let paymentPart = "";
    if (isInvoice) {
      const problems = validateBillingProfile(billing);
      if (problems.length === 0) {
        const payload = buildQrPayload({
          iban: billing.iban,
          creditor: {
            name: billing.companyName, street: billing.street, buildingNumber: billing.buildingNumber,
            postalCode: billing.postalCode, town: billing.town, country: billing.country || "CH",
          },
          debtor: customer && customer.name
            ? { name: customer.name, street: customer.address || "", buildingNumber: "", postalCode: "", town: "", country: "CH" }
            : null,
          amount: totals.gross,
          currency: cur,
          reference: doc.number,
          message: `${isInvoice ? t.invoiceLabel : t.quoteLabel} ${doc.number}`,
        });
        const qr = await qrDataUrl(payload);
        const crossSvg = `data:image/svg+xml;base64,${btoa(SWISS_CROSS_SVG)}`;
        paymentPart = `
        <div class="pp">
          <div class="pp-receipt">
            <div class="pp-h">${esc(t.qrReceipt)}</div>
            <div class="pp-lbl">${esc(t.qrPayableTo)}</div>
            <div class="pp-val">${esc(normaliseIban(billing.iban))}<br>${esc(billing.companyName)}<br>${esc(billing.street)} ${esc(billing.buildingNumber)}<br>${esc(billing.postalCode)} ${esc(billing.town)}</div>
            ${customer ? `<div class="pp-lbl">${esc(t.qrPayableBy)}</div><div class="pp-val">${esc(customer.name)}<br>${esc(customer.address || "")}</div>` : ""}
            <div class="pp-lbl">${esc(t.qrCurrency)} / ${esc(t.qrAmount)}</div>
            <div class="pp-val">${esc(cur)} ${fmt(totals.gross)}</div>
          </div>
          <div class="pp-pay">
            <div class="pp-h">${esc(t.qrPaymentPart)}</div>
            <div class="pp-qrwrap">
              <img class="pp-qr" src="${qr}" alt="Swiss QR">
              <img class="pp-cross" src="${crossSvg}" alt="">
            </div>
            <div class="pp-lbl">${esc(t.qrCurrency)} / ${esc(t.qrAmount)}</div>
            <div class="pp-val">${esc(cur)} ${fmt(totals.gross)}</div>
            <div class="pp-lbl">${esc(t.qrPayableTo)}</div>
            <div class="pp-val">${esc(normaliseIban(billing.iban))}<br>${esc(billing.companyName)}<br>${esc(billing.street)} ${esc(billing.buildingNumber)}<br>${esc(billing.postalCode)} ${esc(billing.town)}</div>
            <div class="pp-lbl">${esc(t.qrReference)}</div>
            <div class="pp-val">${esc(creditorReference(doc.number))}</div>
            ${customer ? `<div class="pp-lbl">${esc(t.qrPayableBy)}</div><div class="pp-val">${esc(customer.name)}<br>${esc(customer.address || "")}</div>` : ""}
          </div>
        </div>`;
      } else {
        paymentPart = `<div class="warn">${esc(t.qrMissingBilling)}</div>`;
      }
    }

    const rows = (doc.lineItems || []).map((li) => {
      const qty = parseFloat(li.qty || 0) || 0;
      const price = parseFloat(li.unitPrice || 0) || 0;
      return `<tr><td>${esc(li.description)}</td><td class="r">${fmt(qty)} ${esc(li.unit || "")}</td><td class="r">${fmt(price)}</td><td class="r">${fmt(qty * price)}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(doc.number)}</title>
    <style>
      @page { size: A4; margin: 18mm 18mm 0 18mm; }
      body { font-family: Helvetica, Arial, sans-serif; color:#111; font-size:11pt; }
      .head { display:flex; justify-content:space-between; margin-bottom:14mm; }
      .from { font-size:9pt; line-height:1.45; }
      .to { font-size:10pt; line-height:1.45; }
      h1 { font-size:15pt; margin:0 0 2mm; }
      .meta { font-size:9pt; color:#444; margin-bottom:8mm; }
      table { width:100%; border-collapse:collapse; margin-bottom:6mm; }
      th { text-align:left; font-size:8.5pt; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #333; padding:2mm 1mm; }
      td { padding:2mm 1mm; border-bottom:1px solid #e5e5e5; font-size:10pt; }
      td.r, th.r { text-align:right; }
      .tot { width:62mm; margin-left:auto; font-size:10pt; }
      .tot div { display:flex; justify-content:space-between; padding:1.2mm 0; }
      .tot .g { font-weight:bold; border-top:1px solid #333; margin-top:1mm; padding-top:2mm; }
      .notes { font-size:9pt; color:#333; margin-top:6mm; white-space:pre-wrap; }
      .warn { border:1px solid #b00; color:#b00; padding:3mm; font-size:9pt; margin-top:8mm; }
      .pp { position:fixed; bottom:0; left:0; right:0; height:105mm; border-top:1px dashed #666; display:flex; font-size:8pt; }
      .pp-receipt { width:62mm; padding:5mm; border-right:1px dashed #666; }
      .pp-pay { flex:1; padding:5mm; }
      .pp-h { font-size:11pt; font-weight:bold; margin-bottom:3mm; }
      .pp-lbl { font-weight:bold; font-size:6.5pt; margin-top:2mm; }
      .pp-val { font-size:8pt; line-height:1.3; }
      .pp-qrwrap { position:relative; width:46mm; height:46mm; margin:2mm 0; }
      .pp-qr { width:46mm; height:46mm; display:block; }
      .pp-cross { position:absolute; width:7mm; height:7mm; left:19.5mm; top:19.5mm; }
      @media print { .pp { position:fixed; } }
    </style></head><body>
      <div class="head">
        <div class="from"><strong>${esc(billing.companyName || profile.name)}</strong><br>${esc(billing.street)} ${esc(billing.buildingNumber)}<br>${esc(billing.postalCode)} ${esc(billing.town)}${billing.vatNumber ? `<br>${esc(t.vatNumberLabel)}: ${esc(billing.vatNumber)}` : ""}${profile.phone ? `<br>${esc(profile.phone)}` : ""}</div>
        <div class="to">${customer ? `${esc(customer.name)}<br>${esc(customer.company || "")}${customer.company ? "<br>" : ""}${esc(customer.address || "")}` : ""}</div>
      </div>
      <h1>${esc(isInvoice ? t.invoiceLabel : t.quoteLabel)} ${esc(doc.number)}</h1>
      <div class="meta">
        ${esc(t.docDate)}: ${esc(doc.date)}${isInvoice ? ` &nbsp;·&nbsp; ${esc(t.docDue)}: ${esc(doc.dueDate)}` : ""}
        ${project ? ` &nbsp;·&nbsp; ${esc(project.name)}` : ""}${project && project.address ? `, ${esc(project.address)}` : ""}
      </div>
      <table>
        <thead><tr><th>${esc(t.docDescription)}</th><th class="r">${esc(t.qtyPlaceholder)}</th><th class="r">${esc(t.unitPriceLabel)}</th><th class="r">${esc(t.docLineTotal)}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="tot">
        <div><span>${esc(t.docNet)}</span><span>${fmt(totals.net)}</span></div>
        <div><span>${esc(t.docVat)} ${fmt(totals.rate)}%</span><span>${fmt(totals.vat)}</span></div>
        <div class="g"><span>${esc(t.docTotal)} ${esc(cur)}</span><span>${fmt(totals.gross)}</span></div>
      </div>
      ${doc.notes ? `<div class="notes">${esc(doc.notes)}</div>` : ""}
      ${paymentPart}
    </body></html>`;

    try {
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      saveFailed(e, "printDocument");
    }
  }

  // The signed Rapport as a printable document. Shows what was signed, by
  // whom and when — that combination is the whole point, so it is rendered
  // from the snapshot stored on the report rather than from live records.
  async function printRapport(report) {
    const pr = projects.find((x) => x.id === report.projectId);
    const cust = pr ? customers.find((c) => c.id === pr.customerId) : null;
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    let signature = "";
    try { signature = (await loadPhoto(report.signatureId)) || ""; } catch (e) {}

    const rows = (report.lines || []).map((li) =>
      `<tr><td>${li.regie ? `<span class="reg">${esc(t.regieShort)}</span> ` : ""}${esc(li.description)}</td><td class="r">${esc(li.qty)} ${esc(li.unit)}</td></tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(t.rapportTitle)} ${esc(report.date)}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: Helvetica, Arial, sans-serif; color:#111; font-size:11pt; }
      .head { display:flex; justify-content:space-between; margin-bottom:10mm; }
      .from { font-size:9pt; line-height:1.45; }
      h1 { font-size:15pt; margin:0 0 2mm; }
      .meta { font-size:9pt; color:#444; margin-bottom:8mm; }
      table { width:100%; border-collapse:collapse; margin-bottom:6mm; }
      th { text-align:left; font-size:8.5pt; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #333; padding:2mm 1mm; }
      td { padding:2mm 1mm; border-bottom:1px solid #e5e5e5; font-size:10pt; }
      td.r, th.r { text-align:right; }
      .hours { font-size:12pt; font-weight:bold; margin-bottom:2mm; }
      .regie { font-size:11pt; font-weight:bold; color:#8a5a00; margin-bottom:6mm; }
      .reg { font-size:7.5pt; font-weight:bold; color:#8a5a00; border:1px solid #8a5a00; padding:0 1mm; border-radius:1mm; }
      .note { font-size:9pt; white-space:pre-wrap; margin-bottom:10mm; }
      .sig { margin-top:14mm; border-top:1px solid #333; padding-top:3mm; width:80mm; }
      .sig img { max-width:70mm; max-height:28mm; display:block; margin-bottom:2mm; }
      .sig .who { font-size:9pt; }
      .sig .when { font-size:8pt; color:#555; }
    </style></head><body>
      <div class="head">
        <div class="from"><strong>${esc(billing.companyName || profile.name)}</strong><br>${esc(billing.street)} ${esc(billing.buildingNumber)}<br>${esc(billing.postalCode)} ${esc(billing.town)}</div>
        <div class="from">${cust ? esc(cust.name) + "<br>" + esc(cust.address || "") : ""}</div>
      </div>
      <h1>${esc(t.rapportTitle)}</h1>
      <div class="meta">${esc(report.date)}${pr ? " &nbsp;·&nbsp; " + esc(pr.name) : ""}${pr && pr.address ? ", " + esc(pr.address) : ""}</div>
      <div class="hours">${esc(t.hoursWorked)}: ${esc(report.hours)} h</div>
      ${Number(report.regieHours) > 0 ? `<div class="regie">${esc(t.regieTitle)}: ${esc(report.regieHours)} h</div>` : ""}
      ${rows ? `<table><thead><tr><th>${esc(t.docDescription)}</th><th class="r">${esc(t.qtyPlaceholder)}</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      ${report.note ? `<div class="note">${esc(report.note)}</div>` : ""}
      <div class="sig">
        ${signature ? `<img src="${signature}" alt="">` : ""}
        <div class="who">${esc(report.signerName)}</div>
        <div class="when">${esc(t.sigSignedAt)} ${new Date(report.signedAt).toLocaleString()}</div>
      </div>
    </body></html>`;

    try {
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      saveFailed(e, "printRapport");
    }
  }

  function toggleReportProject(id) {
    setReportProjectSelection((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  }

  function generateProjectsReport(projectIds) {
    try {
      const html = buildProjectsReportHtml(projectIds);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      saveFailed(e, "generateProjectsReport");
    }
  }

  function saveReportAsPdf(report) {
    try {
      const html = buildReportHtml(report);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      saveFailed(e, "saveReportAsPdf");
    }
  }

  // A full backup as a downloadable file. The pasteable code has to stay small
  // enough to survive a messaging app, which is why it never carried photos —
  // so a "restore everything" quietly lost every picture. A file has no such
  // limit, so this one is actually complete.
  async function downloadFullBackup() {
    showToast(t.backupBuilding);
    try {
      const photoIds = new Set();
      entries.forEach((e) => e.photoId && photoIds.add(e.photoId));
      insuranceCards.forEach((c) => c.photoId && photoIds.add(c.photoId));
      certificates.forEach((c) => c.photoId && photoIds.add(c.photoId));
      techLibrary.forEach((it) => it.photoId && photoIds.add(it.photoId));
      siteReports.forEach((r) => r.signatureId && photoIds.add(r.signatureId));

      const photos = {};
      for (const id of photoIds) {
        const value = await loadPhoto(id);
        if (value) photos[id] = value;
      }

      const payload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        projects, entries, customers, documents, assignments,
        leaveRequests, sentReports, siteReports,
        profile, billing, techLibrary,
        insurance: insuranceCards, certificates, lang,
        photos,
      };

      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `site-log-backup-${todayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      showToast(t.backupSaved);
    } catch (err) {
      saveFailed(err, "downloadFullBackup");
    }
  }

  async function restoreFullBackup(file) {
    try {
      const text = await file.text();
      // Checked and cut to shape before anything lands: known fields, capped
      // sizes, fresh ids, photos re-keyed and only if they are images. A file
      // from a stranger cannot plant a record or overwrite a signature.
      const data = sanitiseBackup(JSON.parse(text), { makeId: uid, userId: user?.uid || null });
      if (!data) { showToast(t.invalidBackupCode); return; }

      // Photos first: records reference them, and a half-restored backup with
      // missing pictures is worse than a slow one.
      for (const [id, value] of Object.entries(data.photos)) {
        try { await window.storage.set(`photo-${id}`, value); } catch (e) {}
      }
      await persist({
        projects: data.projects,
        entries: data.entries,
        customers: data.customers,
        documents: data.documents,
        assignments: data.assignments,
        leaveRequests: data.leaveRequests,
        sentReports: data.sentReports,
        siteReports: data.siteReports,
      });
      if (data.profile) {
        setProfile(data.profile);
        try { await window.storage.set(personalKey("site-profile"), JSON.stringify(data.profile)); } catch (e) {}
      }
      if (data.insurance || data.certificates) {
        setInsuranceCards(data.insurance || []);
        setCertificates(data.certificates || []);
        try { await window.storage.set(personalKey("site-docs"), JSON.stringify({ insurance: data.insurance || [], certificates: data.certificates || [] })); } catch (e) {}
      }
      if (data.techLibrary) saveTechLibrary(data.techLibrary);
      setBackupModal(null);
      showToast(t.backupRestored);
    } catch (err) {
      showToast(t.invalidBackupCode);
    }
  }

  function openBackupExport() {
    // Photos (base64 images) are left out — they'd make the code far too long to
    // reliably copy/paste through Notes, email, or messaging apps without truncation.
    const lightEntries = entries.map(({ photo, ...rest }) => rest);
    const lightInsurance = insuranceCards.map(({ photo, ...rest }) => rest);
    const lightCertificates = certificates.map(({ photo, ...rest }) => rest);
    // Customers and invoices belong in a backup too — they were missing, so a
    // restore would have quietly dropped the entire CRM and billing history.
    const payload = {
      projects, entries: lightEntries, customers, documents,
      leaveRequests, sentReports, profile,
      insurance: lightInsurance, certificates: lightCertificates, lang,
    };
    const code = encodeBackup(payload);
    setBackupCodeOutput(code);
    setBackupModal("export");
  }

  function openBackupImport() {
    setBackupCodeInput("");
    setBackupError(null);
    setBackupModal("import");
  }

  async function submitBackupImport() {
    // Same rule as the file restore: checked, cut to shape, fresh ids. A
    // pasted photo id can never land on a signature's key.
    const data = sanitiseBackup(decodeBackup(backupCodeInput), { makeId: uid, userId: user?.uid || null });
    if (!data) {
      setBackupError(t.invalidBackupCode);
      return;
    }
    // Must go through persist(): writing the old site-data blob restored the
    // screen but nothing else, so a "restored" backup vanished on reload.
    await persist({
      projects: data.projects,
      entries: data.entries,
      customers: data.customers,
      documents: data.documents,
      leaveRequests: data.leaveRequests,
      sentReports: data.sentReports,
      activeClock: null,
    });
    if (data.profile) {
      setProfile(data.profile);
      try { await window.storage.set(personalKey("site-profile"), JSON.stringify(data.profile)); } catch (e) {}
    }
    if (data.insurance || data.certificates) {
      const newInsurance = data.insurance || [];
      const newCerts = data.certificates || [];
      setInsuranceCards(newInsurance);
      setCertificates(newCerts);
      try { await window.storage.set(personalKey("site-docs"), JSON.stringify({ insurance: newInsurance, certificates: newCerts })); } catch (e) {}
    }
    setBackupModal(null);
    showToast(t.backupRestored);
  }

  function copyBackupCode() {
    const el = backupTextareaRef.current;
    if (el) {
      el.focus();
      el.select();
      try { el.setSelectionRange(0, backupCodeOutput.length); } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(backupCodeOutput).then(() => showToast(t.copyBtn)).catch(() => showToast(t.copyBtn));
    } else {
      showToast(t.copyBtn);
    }
  }

  async function fetchWeather(loc) {
    setWeather({ loading: true, error: null, data: null });
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto&models=meteoswiss_icon_ch1`);
      const data = await res.json();
      if (!data.current) throw new Error("no data");
      setWeather({ loading: false, error: null, data: data.current });
    } catch (e) {
      try {
        const res2 = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
        const data2 = await res2.json();
        setWeather({ loading: false, error: null, data: data2.current });
      } catch (e2) {
        setWeather({ loading: false, error: t.weatherError, data: null });
      }
    }
  }

  async function submitWeatherCity() {
    if (!weatherCityInput.trim()) return;
    setWeather({ loading: true, error: null, data: null });
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCityInput.trim())}&count=1`);
      const data = await res.json();
      const hit = data.results && data.results[0];
      if (!hit) {
        setWeather({ loading: false, error: t.locationNotFound, data: null });
        return;
      }
      const loc = { name: hit.name, lat: hit.latitude, lon: hit.longitude };
      setWeatherLoc(loc);
      setWeatherEditOpen(false);
      setWeatherCityInput("");
      try { await window.storage.set(personalKey("site-weather-loc"), JSON.stringify(loc)); } catch (e) {}
    } catch (e) {
      setWeather({ loading: false, error: t.locationNotFound, data: null });
    }
  }

  async function changeLang(code) {
    // The language file is a chunk of its own; offline it cannot come, and
    // then the current language stays rather than the app going English.
    try { await loadLang(code); } catch (e) { showError(e, "lang"); return; }
    setLang(code);
    setLangPickerOpen(false);
    try { await window.storage.set(personalKey("site-lang"), code); } catch (e) {}
  }

  // Writes only the records that actually changed, rather than rewriting one
  // shared blob. That is what lets two people work at once without silently
  // overwriting each other.
  async function persist(next) {
    // Never write before the first load has landed: the arrays would be
    // empty or partial, and a diff against a populated baseline deletes.
    if (!membership || !ready) return;
    if (next.customers) setCustomers(next.customers);
    if (next.documents) setDocuments(next.documents);
    if (next.assignments) setAssignments(next.assignments);
    if (next.siteReports) setSiteReports(next.siteReports);
    if (next.projectFiles) { setProjectFiles(next.projectFiles); projectFilesRef.current = next.projectFiles; }
    if (next.projects) setProjects(next.projects);
    if (next.entries) setEntries(next.entries);
    if (next.activeClock !== undefined) setActiveClock(next.activeClock);
    if (next.leaveRequests) setLeaveRequests(next.leaveRequests);
    if (next.sentReports) setSentReports(next.sentReports);

    try {
      if (next.projects) await syncCollection("projects", next.projects);
      if (next.entries) await syncCollection("entries", next.entries);
      if (next.customers) await syncCollection("customers", next.customers);
      if (next.documents) await syncCollection("documents", next.documents);
      if (next.assignments) await syncCollection("assignments", next.assignments);
      if (next.siteReports) await syncCollection("reports", next.siteReports);
      if (next.projectFiles) await syncCollection("files", next.projectFiles);
      if (next.sentReports) await syncCollection("sentReports", next.sentReports);

      // The clock is personal — each crew member has their own.
      if (next.activeClock !== undefined) {
        await window.storage.set(`clock-${user.uid}`, JSON.stringify({ activeClock: next.activeClock }));
      }
      if (next.leaveRequests) await syncCollection("leave", next.leaveRequests);
    } catch (e) {
      saveFailed(e, "persist");
    }
  }

  // A failed save names its reason -- the Firestore code, the error text or
  // at least where it happened -- so a toast read off a phone can be acted on.
  function saveFailed(e, where) {
    showError(e || new Error(where || "save"), where && /photo|Photo|image/i.test(where) && e && /decode|encode/i.test(String(e.message)) ? "photo" : "save");
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // Every entry must be stamped with who created it: the security rules reject
  // a create whose userId is not the signed-in user, so any code path building
  // an entry by hand would be silently refused. Build them all through here.
  // A supervisor verifying hours is the point of the role, so approval is a
  // state on the entry rather than a note somewhere else.
  function approveEntry(entry) {
    persist({
      entries: entries.map((e) => (e.id === entry.id
        ? { ...e, approvedBy: user?.uid || null, approvedAt: Date.now() }
        : e)),
    });
  }

  function unapproveEntry(entry) {
    persist({
      entries: entries.map((e) => (e.id === entry.id ? { ...e, approvedBy: null, approvedAt: null } : e)),
    });
  }

  function pendingApproval() {
    return entries.filter((e) => e.type === "time" && !e.approvedBy);
  }

  // A Rapport turns a day's logged work into something the customer signs for.
  // It is the piece that stops "we never agreed to that" arguments later, so
  // it snapshots the hours and materials rather than referring to records that
  // could change afterwards.
  function openRapport(projectId, date, force = false) {
    const d = date || todayKey();
    // A signed Rapport already covers this day: open it rather than quietly
    // making a second one. The signed record itself is never touched.
    const existing = !force && siteReports.find((r) => r.projectId === projectId && r.date === d);
    if (existing) { setRapportExists({ existing, projectId, date: d }); return; }
    const list = entries.filter((e) => e.projectId === projectId && e.date === d);
    const hours = list.filter((e) => e.type === "time").reduce((sum, e) => sum + (parseFloat(e.qty || 0) || 0), 0);
    setRapportModal({
      projectId,
      date: d,
      hours,
      lines: list
        .filter((e) => e.type === "material" || e.type === "tool")
        .map((e) => ({ description: e.description, qty: e.qty || "", unit: e.unit || "", regie: !!e.regie })),
      regieHours: list.filter((e) => e.type === "time" && e.regie).reduce((sum, e) => sum + (parseFloat(e.qty || 0) || 0), 0),
      note: "",
      signerName: "",
      signature: null,
      busy: false,
    });
  }

  async function saveRapport() {
    tracker.track("rapport.sign");
    if (!rapportModal) return;
    if (!rapportModal.signature || !rapportModal.signerName.trim()) {
      showToast(t.sigNeeded);
      return;
    }
    setRapportModal((r) => ({ ...r, busy: true }));
    try {
      // The signature is stored like any other photo: its own document, so a
      // report never bloats the record it belongs to.
      const signatureId = await savePhoto(rapportModal.signature, { kind: "signature" });
      const record = {
        id: uid(),
        projectId: rapportModal.projectId,
        date: rapportModal.date,
        userId: user?.uid || null,
        hours: String(Math.round(rapportModal.hours * 100) / 100),
        lines: rapportModal.lines,
        note: rapportModal.note.trim(),
        signerName: rapportModal.signerName.trim(),
        signatureId,
        signedAt: Date.now(),
        createdAt: Date.now(),
      };
      await persist({ siteReports: [record, ...siteReports] });
      setRapportModal(null);
      showToast(t.sigSaved);
    } catch (err) {
      setRapportModal((r) => ({ ...r, busy: false }));
      saveFailed(err, "saveRapport");
    }
  }

  // Regie is work beyond what was quoted — the rot found under the tiles, the
  // extra day nobody agreed to in writing. It is the most commonly lost money
  // in this trade, so it is tracked separately and billed on its own.
  function regieEntries(projectId, { unbilledOnly = false } = {}) {
    return entries.filter((e) =>
      e.projectId === projectId && e.regie && (!unbilledOnly || !e.billedIn));
  }

  function regieSummary(projectId, opts) {
    const list = regieEntries(projectId, opts);
    const hours = list.filter((e) => e.type === "time").reduce((sum, e) => sum + (parseFloat(e.qty || 0) || 0), 0);
    const rate = parseFloat(billing.labourRate || 0) || 0;
    let materials = 0;
    let unpriced = 0;
    list.filter((e) => e.type === "material" || e.type === "tool").forEach((e) => {
      const price = parseFloat(e.unitPrice ?? materialPrices[(e.description || "").trim().toLowerCase()] ?? "");
      const qty = parseFloat(e.qty || 0) || 0;
      if (!isNaN(price) && price > 0) materials += price * (qty || 1);
      else unpriced++;
    });
    return { list, count: list.length, hours, labour: hours * rate, materials, total: hours * rate + materials, unpriced };
  }

  // Turns unbilled Regie into its own document, and marks those entries as
  // billed so the same extra work cannot be charged twice.
  function createRegieDocument(project, type) {
    const { list } = regieSummary(project.id, { unbilledOnly: true });
    if (list.length === 0) { showToast(t.regieNothing); return; }

    const rate = parseFloat(billing.labourRate || 0) || 0;
    const hours = list.filter((e) => e.type === "time").reduce((sum, e) => sum + (parseFloat(e.qty || 0) || 0), 0);
    const lineItems = [];
    if (hours > 0 && rate > 0) {
      lineItems.push({ id: uid(), description: t.regieLabour, qty: String(Math.round(hours * 100) / 100), unit: "h", unitPrice: String(rate) });
    }
    list.filter((e) => e.type === "material" || e.type === "tool").forEach((e) => {
      const price = e.unitPrice ?? materialPrices[(e.description || "").trim().toLowerCase()];
      if (price) lineItems.push({ id: uid(), description: e.description, qty: String(e.qty || 1), unit: e.unit || "", unitPrice: String(price) });
    });
    if (lineItems.length === 0) { showToast(t.regieNoPrices); return; }

    const vatKey = billing.defaultVatKey || "standard";
    const due = new Date();
    due.setDate(due.getDate() + (parseInt(billing.paymentDays, 10) || 30));
    const docId = uid();
    const record = {
      id: docId,
      type,
      projectId: project.id,
      customerId: project.customerId || null,
      number: nextDocNumber(documents, type, new Date().getFullYear()),
      date: todayKey(),
      dueDate: due.toISOString().slice(0, 10),
      lineItems,
      vatRate: (VAT_RATES.find((v) => v.key === vatKey) || VAT_RATES[0]).rate,
      notes: t.regieDocNote,
      status: "draft",
      isRegie: true,
      createdAt: Date.now(),
    };
    const billedIds = new Set(list.map((e) => e.id));
    persist({
      documents: [record, ...documents],
      entries: entries.map((e) => (billedIds.has(e.id) ? { ...e, billedIn: docId } : e)),
    });
    setDocEditor(record);
    showToast(t.regieCreated);
  }

  // Monday-first week, because that is how a construction week is planned.
  // Hours balances. Swiss construction runs on a weekly contract figure (the
  // GAV standard is 40–42 h depending on the month), and the difference against
  // what was actually worked is what people argue about at the end of a year.
  // Both figures are company settings rather than assumptions: a wrong default
  // here would quietly misstate everyone's overtime.
  function hoursBalance(uidKey, { from, to } = {}) {
    const weekly = parseFloat(billing.weeklyHours || 0) || 0;
    const holidayDays = parseFloat(billing.holidayDays || 0) || 0;
    const contractDaily = weekly > 0 ? weekly / 5 : 0;

    const mine = entries.filter((e) =>
      (e.type === "time" || e.type === "break") && e.userId === uidKey &&
      (!from || e.date >= from) && (!to || e.date <= to));
    const worked = mine.filter((e) => e.type === "time");
    // Net of the breaks marked in the period: Znüni and Mittag are not work.
    const workedHours = netHours(mine);

    // Days that were actually worked, so a week off does not read as a deficit.
    const workedDays = new Set(worked.map((e) => e.date)).size;
    const expected = contractDaily * workedDays;

    const year = String(new Date().getFullYear());
    const leaveTaken = leaveRequests.filter((r) =>
      r.userId === uidKey && r.status === "approved" && r.type === "vacation" && (r.date || "").startsWith(year)).length;

    return {
      workedHours,
      workedDays,
      expected,
      overtime: contractDaily > 0 ? workedHours - expected : null,
      holidayDays,
      leaveTaken,
      holidayLeft: holidayDays > 0 ? holidayDays - leaveTaken : null,
      configured: contractDaily > 0,
    };
  }

  function weekDays(anchor) {
    const start = new Date(anchor);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const pad = (n) => String(n).padStart(2, "0");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, dayOfMonth: d.getDate(), js: d };
    });
  }

  // A day assignment says where someone is on Tuesday. A project crew says
  // who is on the job at all — which is what decides who sees its photos,
  // notes and materials. The two are deliberately separate.
  function projectCrew(project) {
    return Array.isArray(project?.crew) ? project.crew : [];
  }

  function toggleProjectCrew(projectId, memberUid) {
    if (!canManage()) return;
    const pr = projects.find((x) => x.id === projectId);
    if (!pr) return;
    const crew = projectCrew(pr);
    const next = crew.includes(memberUid) ? crew.filter((u) => u !== memberUid) : [...crew, memberUid];
    persist({ projects: projects.map((x) => (x.id === projectId ? { ...x, crew: next } : x)) });
  }

  function togglePin(projectId) {
    const next = pinnedIds.includes(projectId) ? pinnedIds.filter((x) => x !== projectId) : [...pinnedIds, projectId];
    setPinnedIds(next);
    window.storage.set(personalKey("site-dock-pins"), JSON.stringify(next)).catch(() => {});
  }

  // One tap cycles the order of the tray. Remembered per device, like open/closed.
  function cycleDockSort() {
    const next = DOCK_SORTS[(DOCK_SORTS.indexOf(dockSort) + 1) % DOCK_SORTS.length];
    setDockSort(next);
    try { localStorage.setItem("site-dock-sort", next); } catch (e) {}
  }

  // A project dropped anywhere on the tray gets pinned. Never unpinned that
  // way: dropping is an "add" gesture, and a slip should not remove a job.
  function pinFromDrop(dt) {
    const id = dt && dt.getData("text/project-id");
    if (!id || !projects.some((x) => x.id === id)) return false;
    if (!pinnedIds.includes(id)) {
      togglePin(id);
      showToast(`${projectName(id)} · ${t.dockPinnedToast}`);
    }
    return true;
  }

  function setDockOpenRemembered(open) {
    setDockOpen(open);
    try { localStorage.setItem("site-dock-open", open ? "1" : "0"); } catch (e) {}
  }

  // What can be picked up and carried to a job tile. The payload is the
  // name, never an index: the basket re-renders between dragstart and drop.
  function materialDragProps(name, kind, extra = {}) {
    return {
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData("text/material", JSON.stringify({ name, kind, ...extra }));
        e.dataTransfer.effectAllowed = "copyMove";
      },
    };
  }

  // The trade a job is mostly about, so a drop files itself where the rest
  // of that job's material already is. Falls back to whatever was used last.
  function dominantTrade(projectId) {
    const counts = {};
    entries.forEach((e) => {
      if (e.projectId !== projectId || !["material", "tool", "time"].includes(e.type)) return;
      const tr = e.trade || DEFAULT_TRADE;
      counts[tr] = (counts[tr] || 0) + 1;
    });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : lastTrade;
  }

  function dockAccepts(dt) {
    const types = Array.from((dt && dt.types) || []);
    return types.includes("Files") || types.includes("text/material") || types.includes("text/project-id") || (types.includes("text/member-uid") && canManage());
  }

  function dropOnProject(projectId, dt) {
    const pr = projects.find((x) => x.id === projectId);
    if (!pr || !dt) return;
    // A file from the desk dropped on a job tile: same tray, same gesture.
    if (dt.files && dt.files.length) { uploadFiles(projectId, dt.files); return; }
    const memberUid = dt.getData("text/member-uid");
    if (memberUid) {
      if (!canManage()) return;
      if (!projectCrew(pr).includes(memberUid)) toggleProjectCrew(projectId, memberUid);
      showToast(`${memberName(memberUid)} → ${pr.name}`);
      return;
    }
    let payload = null;
    try { payload = JSON.parse(dt.getData("text/material") || "null"); } catch (e) { payload = null; }
    const name = payload && String(payload.name || "").trim();
    if (!name) return;
    const known = articleMaster[name.toLowerCase()] || {};
    const price = known.price ? parseFloat(known.price) : "";
    addEntry({
      type: payload.kind === "tool" ? "tool" : "material",
      projectId,
      description: name,
      qty: String(payload.qty || "1"),
      unit: payload.unit || known.unit || "",
      unitPrice: Number.isFinite(price) ? price : "",
      supplier: known.supplier || "",
      artNo: known.artNo || "",
      trade: dominantTrade(projectId),
    });
    if (payload.basketId) setBasket((b) => b.filter((i) => i.id !== payload.basketId));
    showToast(`${name} → ${pr.name}`);
  }

  // --- plans and documents ---------------------------------------------------
  // The bytes go to R2 through the Worker, which checks membership as the
  // caller; the app only keeps the metadata. Several files in one drop are
  // uploaded one after another, each with its own outcome, so one bad file
  // never takes the others down with it.
  async function uploadFiles(projectId, fileList, kind) {
    tracker.track("file.upload");
    const files = Array.from(fileList || []);
    const cid = getCompanyId();
    if (!files.length || !cid || !projectId) return;
    let current = projectFilesRef.current;
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) { showToast(`${file.name}: ${t.filesTooLarge}`); continue; }
      setFileBusy((n) => n + 1);
      try {
        const token = await getIdToken();
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("kind", kind || guessKind(file.name, file.type));
        const res = await fetch(`${CLAUDE_PROXY_URL}/files/${cid}/${projectId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (res.status === 413) { showToast(`${file.name}: ${t.filesTooLarge}`); continue; }
        if (res.status === 415) { showToast(`${file.name}: ${t.filesTypeRefused}`); continue; }
        if (res.status === 503) { showToast(t.filesNotConfigured); continue; }
        if (!res.ok) { showError({ status: res.status, message: `upload ${res.status}` }, "file"); continue; }
        const meta = await res.json();
        const record = { id: meta.id, name: meta.name, size: meta.size, type: meta.type, kind: meta.kind, projectId, uploadedBy: user?.uid || null, createdAt: Date.now() };
        current = [record, ...current];
        projectFilesRef.current = current;
        await persist({ projectFiles: current });
        showToast(`${meta.name} ${t.filesUploaded}`);
      } catch (e) {
        showError(new Error("upload"), "file");
      } finally {
        setFileBusy((n) => Math.max(0, n - 1));
      }
    }
  }

  async function fetchFileBlob(f) {
    const cid = getCompanyId();
    const token = await getIdToken();
    const res = await fetch(`${CLAUDE_PROXY_URL}/files/${cid}/${f.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(String(res.status));
    return await res.blob();
  }

  // Shown from a blob: URL, so nothing is ever public and nothing is cached
  // by a proxy. Images and PDFs open in the app; anything else downloads.
  async function openFile(f) {
    // A stored link is re-checked every time: metadata is member-writable, and
    // a javascript: url planted there must never reach window.open.
    if (f.url) { const safe = normaliseLink(f.url); if (safe) window.open(safe, "_blank", "noopener"); return; }
    setFileBusy((n) => n + 1);
    try {
      const raw = await fetchFileBlob(f);
      // Route by what the Worker sent back, not by the filename, and pin the
      // blob to that type: bytes that are secretly a page fail to parse as a
      // PDF instead of running as the app.
      const served = String(raw.type || "").toLowerCase();
      const inline = /^(application\/pdf|image\/(jpeg|png|gif|webp|heic|heif|bmp))$/.test(served) ? served : "";
      const blob = new Blob([raw], { type: inline || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      if (inline) {
        setFileViewer({ file: { ...f, type: inline }, url });
      } else {
        const a = document.createElement("a");
        a.href = url; a.download = f.name || "file"; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (e) {
      showError(new Error("upload"), "file");
    } finally {
      setFileBusy((n) => Math.max(0, n - 1));
    }
  }

  function closeFileViewer() {
    if (fileViewer && fileViewer.url) { try { URL.revokeObjectURL(fileViewer.url); } catch (e) {} }
    setFileViewer(null);
  }

  function canDeleteFile(f) {
    return canManage() || (!!f && f.uploadedBy === user?.uid);
  }

  async function deleteFile(f) {
    if (!f) return;
    if (!f.url) {
      try {
        const cid = getCompanyId();
        const token = await getIdToken();
        const res = await fetch(`${CLAUDE_PROXY_URL}/files/${cid}/${f.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok && res.status !== 404) { showError({ status: res.status, message: `file ${res.status}` }, "file"); return; }
      } catch (e) { showError(e, "file"); return; }
    }
    persist({ projectFiles: projectFilesRef.current.filter((x) => x.id !== f.id) });
    showToast(t.filesDeleted);
  }

  // A plan that already lives in the architect's Dropbox needs no upload.
  function addFileLink() {
    if (!linkForm) return;
    const url = normaliseLink(linkForm.url);
    if (!url) return;
    const name = (linkForm.name || "").trim() || url.replace(/^https?:\/\//, "").slice(0, 80);
    const record = { id: uid(), name, url, kind: linkForm.kind || "plan", projectId: linkForm.projectId, uploadedBy: user?.uid || null, createdAt: Date.now(), size: 0, type: "text/uri-list" };
    persist({ projectFiles: [record, ...projectFilesRef.current] });
    setLinkForm(null);
  }

  function memberName(memberUid) {
    const m = team.members.find((x) => x.uid === memberUid) || (team.former || []).find((x) => x.uid === memberUid);
    return m?.name || m?.email || memberUid;
  }

  // Offboarding from the Team tab. The document stays with active:false so
  // the person's entries keep a name; the rules and the Worker shut the door.
  const [removeConfirm, setRemoveConfirm] = useState(null);
  async function removeMember(memberUid) {
    try {
      await setMemberActive(memberUid, false);
      setRemoveConfirm(null);
      await openTeamRefresh();
      showToast(t.teamRemoved);
    } catch (e) {
      saveFailed(e, "removeMember");
    }
  }
  async function openTeamRefresh() {
    const all = await listMembers();
    setTeam((s) => ({ ...s, members: all.filter((m) => m.active !== false), former: all.filter((m) => m.active === false) }));
  }

  function assignmentsFor(date) {
    return assignments.filter((a) => a.date === date);
  }

  function myAssignments(date) {
    return assignments.filter((a) => a.date === date && a.userId === user?.uid);
  }

  // One person is planned onto one job per day. Tapping the same job again
  // clears the plan rather than needing a separate delete.
  // Several jobs on one day for one person is normal: the morning on one
  // roof, the afternoon on another. Dropping adds one; clicking a chip
  // removes that chip only. It used to replace, so the second drop silently
  // threw the first job away.
  function toggleAssignment(date, userId, projectId) {
    const existing = assignments.find((a) => a.date === date && a.userId === userId && a.projectId === projectId);
    if (existing) {
      persist({ assignments: assignments.filter((a) => a.id !== existing.id) });
      return;
    }
    persist({ assignments: [{ id: uid(), date, userId, projectId, createdAt: Date.now() }, ...assignments] });
  }

  // The day starts on the job, not on a list. If the clock is running on
  // another job, that day is closed first so the hours land where they were
  // worked.
  // A tap marks the break taken; a second tap unmarks it. Stored as an entry
  // so it syncs and is owned like everything else.
  function toggleBreak(key, date = todayKey()) {
    const existing = entries.find((e) => e.type === "break" && e.breakKey === key && e.date === date && e.userId === user?.uid);
    if (existing) { persist({ entries: entries.filter((e) => e.id !== existing.id) }); return; }
    const meta = breakMeta(key);
    if (!meta) return;
    persist({ entries: [newEntry({ type: "break", breakKey: key, date, qty: String(meta.minutes / 60), unit: "h", description: `${t[`break_${key}`]} ${meta.start}` }), ...entries] });
  }

  function startDayOn(projectId) {
    if (activeClock) {
      if (activeClock.projectId === projectId) return;
      clockOut();
    }
    persist({ activeClock: { projectId, startedAt: Date.now() } });
    showToast(t.clockedIn);
  }

  // These are personal, not the company's: a name, a private phone, an
  // emergency contact, insurance cards, certificates. The move to company
  // storage put them all under one shared key, so every crew member
  // overwrote the previous one's — and could read their colleagues'
  // insurance details. Key them by account instead.
  function personalKey(base) {
    return user ? `${base}-${user.uid}` : base;
  }

  // Falls back to the shared key once, so values written before this fix are
  // not lost. Only the owner inherits them: they are the only person whose
  // data can have been in there before crew accounts existed.
  async function getPersonal(base) {
    try {
      const own = await window.storage.get(personalKey(base));
      if (own && own.value) return own;
      if (isOwner()) {
        const legacy = await window.storage.get(base);
        if (legacy && legacy.value) return legacy;
      }
    } catch (e) {}
    return null;
  }

  // The catalogues are a chunk of their own, fetched when the shop or the
  // material composer first needs them.
  const [catalogs, setCatalogs] = useState(null);
  useEffect(() => {
    if (catalogs) return;
    if (tab !== "materials" && !(addModal && addModal.type === "material")) return;
    let alive = true;
    import("./data/catalog.js").then((m) => { if (alive) setCatalogs(m); }).catch(() => {});
    return () => { alive = false; };
  }, [tab, addModal, catalogs]);
  const materialsCatalogFor = (code) => (catalogs && (catalogs.MATERIALS_CATALOG[code] || catalogs.MATERIALS_CATALOG.en)) || EMPTY_CATALOG;
  const toolsCatalogFor = (code) => (catalogs && (catalogs.TOOLS_CATALOG[code] || catalogs.TOOLS_CATALOG.en)) || EMPTY_CATALOG;

  function newEntry(partial) {
    tracker.track(`entry.${(partial && partial.type) || "note"}`);
    // srcLang: the language the author was using; a note is never translated back into it.
    return { id: uid(), date: todayKey(), createdAt: Date.now(), userId: user?.uid || null, srcLang: lang, ...partial };
  }

  function addEntry(entry) {
    persist({ entries: [newEntry(entry), ...entries] });
  }

  function addProject() {
    if (!newProjectName.trim()) return;
    const p = { id: uid(), name: newProjectName.trim(), client: newProjectClient.trim(), customerId: newProjectCustomerId || null, address: newProjectAddr.trim(), category: newProjectCat, status: newProjectStatus, createdAt: Date.now() };
    persist({ projects: [p, ...projects] });
    setNewProjectCustomerId("");
    setNewProjectName("");
    setNewProjectClient("");
    setNewProjectAddr("");
    setNewProjectCat("flat");
    setNewProjectStatus(DEFAULT_PROJECT_STATUS);
    setNewProjectOpen(false);
    showToast(t.projectAdded);
  }

  function saveProjectEdit() {
    if (!editProject) return;
    const updated = projects.map((p) => (p.id === editProject.id ? { ...p, name: editProject.name.trim() || p.name, client: editProject.client.trim(), customerId: editProject.customerId || null, address: editProject.address.trim(), category: editProject.category, status: editProject.status, quotedAmount: editProject.quotedAmount || "" } : p));
    persist({ projects: updated });
    setEditProject(null);
    showToast(t.projectUpdated);
  }

  async function submitAuth() {
    const { mode, email, password } = authForm;
    if (!email.trim() || !password) {
      setAuthForm((s) => ({ ...s, error: "authErrMissing" }));
      return;
    }
    setAuthForm((s) => ({ ...s, busy: true, error: null, notice: null }));
    try {
      if (mode === "signup") await signUp(email, password);
      else await signIn(email, password);
      setAuthForm({ mode: "signin", email: "", password: "", error: null, busy: false, notice: null });
    } catch (err) {
      setAuthForm((s) => ({ ...s, busy: false, error: authErrorKey(err) }));
    }
  }

  async function submitReset() {
    if (!authForm.email.trim()) {
      setAuthForm((s) => ({ ...s, error: "authErrMissingEmail" }));
      return;
    }
    try {
      await sendReset(authForm.email);
      setAuthForm((s) => ({ ...s, notice: "authResetSent", error: null }));
    } catch (err) {
      setAuthForm((s) => ({ ...s, error: authErrorKey(err) }));
    }
  }

  async function doSignOut() {
    try { await signOutUser(); } catch {}
    // Clear company state too, or the next person to sign in on this phone
    // would briefly see the previous account data.
    resetCompanyState();
    setMembership(null);
    setMembershipChecked(false);
    setTeamModalOpen(false);
    setProfileModalOpen(false);
    setTab("today");
  }

  // Saved to the owner-only finance document, not the shared key/value store:
  // this holds the labour rate and IBAN, which crew must not be able to read.
  async function saveBilling() {
    setBilling(billingDraft);
    setBillingModalOpen(false);
    try { await saveFinance(billingDraft); } catch (e) { saveFailed(e, "saveBilling"); }
  }

  // A quote starts from what was actually logged on site — hours at the
  // profile rate, plus every priced material — so the office does not retype
  // work the crew already recorded.
  function newDocumentFor(project, type) {
    const list = entries.filter((e) => e.projectId === project.id);
    const hours = list.filter((e) => e.type === "time").reduce((s, e) => s + parseFloat(e.qty || 0), 0);
    const rate = parseFloat(billing.labourRate || 0) || 0;
    const lineItems = [];

    if (hours > 0 && rate > 0) {
      lineItems.push({ id: uid(), description: t.labourCost, qty: String(Math.round(hours * 100) / 100), unit: "h", unitPrice: String(rate) });
    }
    list.filter((e) => e.type === "material" || e.type === "tool").forEach((e) => {
      const price = e.unitPrice ?? materialPrices[(e.description || "").trim().toLowerCase()];
      if (price) {
        lineItems.push({ id: uid(), description: e.description, qty: String(e.qty || 1), unit: e.unit || "", unitPrice: String(price) });
      }
    });
    if (lineItems.length === 0) lineItems.push({ id: uid(), description: "", qty: "1", unit: "", unitPrice: "" });

    const vatKey = billing.defaultVatKey || "standard";
    const vatRate = (VAT_RATES.find((v) => v.key === vatKey) || VAT_RATES[0]).rate;
    const today = todayKey();
    const due = new Date();
    due.setDate(due.getDate() + (parseInt(billing.paymentDays, 10) || 30));

    setDocEditor({
      id: null,
      type,
      projectId: project.id,
      customerId: project.customerId || null,
      number: nextDocNumber(documents, type, new Date().getFullYear()),
      date: today,
      dueDate: due.toISOString().slice(0, 10),
      lineItems,
      vatRate,
      notes: "",
      status: "draft",
    });
  }

  function saveDocument() {
    if (!docEditor) return;
    const clean = {
      ...docEditor,
      lineItems: (docEditor.lineItems || []).filter((li) => String(li.description || "").trim()),
    };
    if (clean.lineItems.length === 0) { showToast(t.docNeedsLine); return; }
    if (clean.id) {
      persist({ documents: documents.map((d) => (d.id === clean.id ? clean : d)) });
    } else {
      persist({ documents: [{ ...clean, id: uid(), createdAt: Date.now() }, ...documents] });
    }
    setDocEditor(null);
    showToast(t.docSaved);
  }

  function deleteDocument(id) {
    persist({ documents: documents.filter((d) => d.id !== id) });
    setDocEditor(null);
  }

  // Converting keeps the quote intact: the two are separate records, because
  // an accepted quote and the invoice raised against it are both documents a
  // business has to be able to show later.
  function convertQuoteToInvoice(quote) {
    const due = new Date();
    due.setDate(due.getDate() + (parseInt(billing.paymentDays, 10) || 30));
    const invoice = {
      ...quote,
      id: uid(),
      type: "invoice",
      number: nextDocNumber(documents, "invoice", new Date().getFullYear()),
      date: todayKey(),
      dueDate: due.toISOString().slice(0, 10),
      status: "open",
      fromQuote: quote.number,
      createdAt: Date.now(),
    };
    persist({
      documents: [invoice, ...documents.map((d) => (d.id === quote.id ? { ...d, status: "accepted" } : d))],
    });
    showToast(t.invoiceCreated);
    setDocEditor(invoice);
  }

  function openCustomerForm(existing) {
    setCustomerForm(existing
      ? { ...existing }
      : { id: null, name: "", company: "", phone: "", email: "", address: "", notes: "" });
  }

  function submitCustomer() {
    if (!customerForm || !customerForm.name.trim()) return;
    const record = { ...customerForm, name: customerForm.name.trim() };
    if (record.id) {
      persist({ customers: customers.map((c) => (c.id === record.id ? { ...c, ...record } : c)) });
    } else {
      persist({ customers: [{ ...record, id: uid(), contacts: [], createdAt: Date.now() }, ...customers] });
    }
    setCustomerForm(null);
    showToast(t.customerSaved);
  }

  function deleteCustomer(id) {
    // Keep the customer's projects; just unlink them, so deleting a contact
    // never destroys job history.
    persist({
      customers: customers.filter((c) => c.id !== id),
      projects: projects.map((p) => (p.customerId === id ? { ...p, customerId: null } : p)),
    });
    setSelectedCustomer(null);
    setCustomerForm(null);
    showToast(t.customerDeleted);
  }

  function openContactForm(customerId) {
    setContactForm({ customerId, kind: "call", note: "", followUp: "" });
  }

  function submitContact() {
    if (!contactForm || !contactForm.note.trim()) return;
    const entry = { id: uid(), kind: contactForm.kind, note: contactForm.note.trim(), followUp: contactForm.followUp || null, at: Date.now() };
    persist({
      customers: customers.map((c) => (c.id === contactForm.customerId ? { ...c, contacts: [entry, ...(c.contacts || [])] } : c)),
    });
    setContactForm(null);
    showToast(t.contactLogged);
  }

  function deleteContact(customerId, contactId) {
    persist({
      customers: customers.map((c) => (c.id === customerId ? { ...c, contacts: (c.contacts || []).filter((x) => x.id !== contactId) } : c)),
    });
  }

  // A follow-up dated today or earlier is due — surfaced so promised
  // callbacks don't quietly disappear.
  function dueFollowUps() {
    const today = todayKey();
    const out = [];
    customers.forEach((c) => {
      (c.contacts || []).forEach((k) => {
        if (k.followUp && k.followUp <= today) out.push({ customer: c, contact: k });
      });
    });
    return out.sort((a, b) => (a.contact.followUp < b.contact.followUp ? -1 : 1));
  }

  function customerFor(project) {
    return project && project.customerId ? customers.find((c) => c.id === project.customerId) : null;
  }

  // The list may be filtered by pipeline stage, so write the new order back
  // into only the slots those projects occupy — mapping the whole array from
  // the visible ids would silently drop every filtered-out project.
  function reorderProjects(idsInOrder) {
    const idSet = new Set(idsInOrder);
    const slots = [];
    projects.forEach((p, i) => { if (idSet.has(p.id)) slots.push(i); });
    const byId = new Map(projects.map((p) => [p.id, p]));
    const next = projects.slice();
    idsInOrder.forEach((id, k) => {
      const project = byId.get(id);
      if (project && slots[k] !== undefined) next[slots[k]] = project;
    });
    persist({ projects: next });
  }

  // Materials and tools are shown as filtered slices of one flat `entries`
  // array, so reordering a slice has to write the new order back into just the
  // positions that slice occupies, leaving every other entry where it was.
  function reorderEntries(idsInOrder) {
    const idSet = new Set(idsInOrder);
    const slots = [];
    entries.forEach((e, i) => { if (idSet.has(e.id)) slots.push(i); });
    const byId = new Map(entries.map((e) => [e.id, e]));
    const next = entries.slice();
    idsInOrder.forEach((id, k) => {
      const entry = byId.get(id);
      if (entry && slots[k] !== undefined) next[slots[k]] = entry;
    });
    persist({ entries: next });
  }

  function shareProjectVia(project, entriesForProject, channel) {
    const code = encodeProjectCode(project, entriesForProject);
    const text = `${t.shareProject}: ${project.name}${project.address ? " — " + project.address : ""}\n\n${code}`;
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`mailto:?subject=${encodeURIComponent(t.shareProject + ": " + project.name)}&body=${encodeURIComponent(text)}`, "_blank");
    }
  }

  function submitImportProject() {
    // A code is JSON somebody else made. It is checked and cut to shape
    // before anything of it lands: known fields only, fresh ids, entries
    // attributed to the importer.
    const clean = sanitiseProjectCode(decodeProjectCode(importCodeInput), { makeId: uid, userId: user?.uid || null });
    if (!clean) {
      setImportError(t.invalidCode);
      return;
    }
    const { entries: imported, ...p } = clean;
    const newEntries = imported.map((e) => ({ ...e, projectId: p.id }));
    persist({ projects: [p, ...projects], entries: [...newEntries, ...entries] });
    setImportModalOpen(false);
    setImportCodeInput("");
    setImportError(null);
    showToast(t.projectAdded);
  }

  function clockIn(projectId) {
    if (activeClock) return;
    persist({ activeClock: { projectId, startedAt: Date.now() } });
    showToast(t.clockedIn);
  }

  function sendWebhook(eventType, payload) {
    if (!profile.webhookUrl) return;
    try {
      fetch(profile.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventType, employee: profile.name || "", sentAt: new Date().toISOString(), ...payload }),
      }).catch(() => {});
    } catch (e) {}
  }

  function clockOut() {
    if (!activeClock) return;
    const durationMs = Date.now() - activeClock.startedAt;
    const pad = (n) => String(n).padStart(2, "0");
    const startD = new Date(activeClock.startedAt);
    const endD = new Date();
    const e = newEntry({
      type: "time",
      projectId: activeClock.projectId, description: `${fmtHM(durationMs)}`,
      qty: (durationMs / 3600000).toFixed(2), unit: "h",
      startTime: `${pad(startD.getHours())}:${pad(startD.getMinutes())}`,
      endTime: `${pad(endD.getHours())}:${pad(endD.getMinutes())}`,
    });
    persist({ entries: [e, ...entries], activeClock: null });
    showToast(t.clockedOutLogged);
    sendWebhook("time_entry", { project: projectName(activeClock.projectId), date: e.date, hours: e.qty, startTime: e.startTime, endTime: e.endTime });
  }

  function submitNote() {
    if (!noteText.trim()) return;
    const type = classifyNote(noteText);
    const quick = newEntry({ type, projectId: activeClock?.projectId || null, description: noteText.trim() });
    persist({ entries: [quick, ...entries] });
    autoTranslateNote(quick);
    showToast(typeMeta(type, t).label);
    setNoteText("");
  }

  // Dictation is how a note actually gets written on a roof — gloves on, one
  // hand free. It was wired to a single field; any field can use it now, and
  // voiceTarget keeps the right microphone lit.
  function toggleVoiceInput(setter = setNoteText, targetKey = "today") {
    if (voiceListening && voiceTarget === targetKey) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
      setVoiceTarget(null);
      return;
    }
    if (voiceListening) { try { recognitionRef.current?.stop(); } catch (e) {} }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(t.voiceNotSupported);
      return;
    }
    const localeMap = { en: "en-US", de: "de-CH", fr: "fr-CH", it: "it-CH", es: "es-ES", pt: "pt-PT", pl: "pl-PL", sk: "sk-SK", cs: "cs-CZ" };
    const recog = new SpeechRecognition();
    recog.lang = localeMap[lang] || "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setter((prev) => (String(prev || "").trim() ? `${String(prev).trim()} ${transcript}` : transcript));
    };
    recog.onerror = () => { setVoiceListening(false); setVoiceTarget(null); };
    recog.onend = () => { setVoiceListening(false); setVoiceTarget(null); };
    recognitionRef.current = recog;
    setVoiceListening(true);
    setVoiceTarget(targetKey);
    try {
      recog.start();
    } catch (e) {
      setVoiceListening(false);
      setVoiceTarget(null);
    }
  }

  function addToBasket(name, kind) {
    setBasket((b) => {
      const existing = b.find((i) => i.name === name && i.kind === kind);
      if (existing) {
        return b.map((i) => (i === existing ? { ...i, qty: (parseFloat(i.qty) || 0) + 1 } : i));
      }
      return [...b, { id: uid(), name, kind, qty: 1, unit: materialUnits[name.trim().toLowerCase()] || "" }];
    });
    showToast(t.addedToBasketToast);
  }

  function updateBasketItem(id, field, value) {
    setBasket((b) => b.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function removeBasketItem(id) {
    setBasket((b) => b.filter((i) => i.id !== id));
  }

  function transferBasketToProject(projectId) {
    const newEntries = basket.map((i) => newEntry({
      type: i.kind, projectId, description: i.name, qty: i.qty, unit: i.unit,
    }));
    persist({ entries: [...newEntries, ...entries] });
    setBasket([]);
    setBasketProjectModalOpen(false);
    showToast(t.projectAdded);
  }

  // The same basket that books material onto a job can ask for it instead.
  // On site those are the same gesture; what differs is whether the stuff is
  // already on the roof.
  function requestBasketForProject(projectId) {
    const requests = basket.map((i) => newEntry({
      type: "order",
      projectId,
      description: i.name,
      qty: i.qty,
      unit: i.unit,
      trade: lastTrade,
      supplier: (articleMaster[i.name.trim().toLowerCase()] || {}).supplier || "",
      artNo: (articleMaster[i.name.trim().toLowerCase()] || {}).artNo || "",
      orderStatus: "requested",
    }));
    persist({ entries: [...requests, ...entries] });
    setBasket([]);
    setBasketProjectModalOpen(false);
    showToast(t.orderRequestedToast);
  }

  function setOrderStatus(entry, status) {
    if (status === "delivered") {
      // Delivered material is just material. Turning it into a normal entry
      // here is what puts it into costing instead of leaving it in a list
      // nobody reconciles.
      persist({
        entries: entries.map((e) => (e.id === entry.id
          ? { ...e, type: "material", orderStatus: "delivered", deliveredAt: Date.now(), date: todayKey() }
          : e)),
      });
      showToast(t.orderDeliveredToast);
      return;
    }
    persist({ entries: entries.map((e) => (e.id === entry.id ? { ...e, orderStatus: status } : e)) });
  }

  function openAdd(type, projectId) {
    // The trade sticks between entries: someone logging Spengler work logs
    // several pieces in a row, and re-picking it each time is how it ends up
    // filed wrong.
    setForm({ description: "", qty: "", unit: "", unitPrice: "", regie: false, trade: lastTrade, supplier: "", artNo: "" });
    setPhotoPreview(null);
    setPhotoExtra([]);
    setPhotoPreviewId(null);
    setSuggestCat(null);
    setPendingSuggestion(null);
    setSizeInput("");
    setAddModal({ type, projectId, editingId: null });
  }

  function openEditEntry(entry) {
    setForm({ description: entry.description || "", qty: entry.qty || "", unit: entry.unit || "", unitPrice: entry.unitPrice ?? "", regie: !!entry.regie, trade: entry.trade || DEFAULT_TRADE, supplier: entry.supplier || "", artNo: entry.artNo || "" });
    // Keep the existing photo's id so re-saving without picking a new image
    // reuses that document instead of writing a duplicate.
    setPhotoPreviewId(entry.photoId || null);
    setPhotoPreview(entry.photo || null);
    setPhotoExtra([]);
    if (!entry.photo && entry.photoId) loadPhoto(entry.photoId).then((v) => setPhotoPreview(v));
    setSuggestCat(null);
    setPendingSuggestion(null);
    setSizeInput("");
    setAddModal({ type: entry.type, projectId: entry.projectId, editingId: entry.id });
  }

  function openEditTime(entry) {
    setEditHoursInput(entry.qty || "");
    setEditStartTime(entry.startTime || "");
    setEditEndTime(entry.endTime || "");
    setEditTimeModal(entry);
  }

  function saveEditTime() {
    if (!editTimeModal) return;
    if (editStartTime && editEndTime) {
      const [sh, sm] = editStartTime.split(":").map(Number);
      const [eh, em] = editEndTime.split(":").map(Number);
      let startMinutes = sh * 60 + sm;
      let endMinutes = eh * 60 + em;
      if (endMinutes < startMinutes) endMinutes += 24 * 60; // crossed midnight
      const hours = (endMinutes - startMinutes) / 60;
      if (hours <= 0) return;
      const updated = entries.map((e) =>
        e.id === editTimeModal.id
          ? { ...e, qty: hours.toFixed(2), description: fmtHM(hours * 3600000), startTime: editStartTime, endTime: editEndTime }
          : e
      );
      persist({ entries: updated });
    } else {
      const hours = parseFloat(editHoursInput);
      if (isNaN(hours) || hours < 0) return;
      const updated = entries.map((e) =>
        e.id === editTimeModal.id ? { ...e, qty: hours.toFixed(2), description: fmtHM(hours * 3600000) } : e
      );
      persist({ entries: updated });
    }
    setEditTimeModal(null);
  }

  function confirmSuggestion() {
    if (!pendingSuggestion) return;
    const size = sizeInput.trim();
    setForm((f) => ({ ...f, description: size ? `${pendingSuggestion.name} ${size}` : pendingSuggestion.name }));
    setPendingSuggestion(null);
    setSizeInput("");
    setSuggestCat(null);
  }

  function copyEntryFn(entry) {
    addEntry({ type: entry.type, projectId: entry.projectId, description: entry.description, qty: entry.qty, unit: entry.unit });
    showToast(t.projectAdded);
  }

  function deleteEntryFn(entry) {
    persist({ entries: entries.filter((e) => e.id !== entry.id) });
    if (entry.photoId) deletePhoto(entry.photoId); // don't leave orphan photo docs
  }

  // Only ever fills blanks. Overwriting what somebody typed on site to match
  // an older record is how the wrong price ends up on an invoice.
  function setDescriptionWithUnitMemory(name) {
    const known = articleMaster[name.trim().toLowerCase()] || {};
    setForm((f) => ({
      ...f,
      description: name,
      unit: !f.unit && known.unit ? known.unit : f.unit,
      unitPrice: !f.unitPrice && known.price ? known.price : f.unitPrice,
      supplier: !f.supplier && known.supplier ? known.supplier : f.supplier,
      artNo: !f.artNo && known.artNo ? known.artNo : f.artNo,
    }));
  }

  // A price list rewrites numbers that end up on invoices, so it is staged
  // and shown first. Nothing is written until the boss looks at the counts.
  async function stagePriceList(file, supplier) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parsePriceList(text);
      const preview = mergeIntoCatalog(articleMaster, parsed.rows, supplier || "");
      setPriceImport({
        fileName: file.name,
        supplier: supplier || "",
        rows: parsed.rows,
        format: parsed.format,
        warnings: parsed.warnings,
        added: preview.added,
        updated: preview.updated,
        repriced: preview.repriced,
      });
    } catch (err) {
      showToast(t.importFailed);
    }
  }

  function applyPriceList() {
    if (!priceImport || !priceImport.rows.length) return;
    const merged = mergeIntoCatalog(articleMaster, priceImport.rows, priceImport.supplier);
    setArticleMaster(merged.catalog);
    window.storage.set("site-material-catalog", JSON.stringify(merged.catalog)).catch(() => {});
    setPriceImport(null);
    showToast(`${merged.added + merged.updated} ${t.articlesImported}`);
  }

  function rememberMaterial(name, patch) {
    const key = (name || "").trim().toLowerCase();
    if (!key) return;
    // A blank field means "I did not say", not "clear what you knew".
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== "" && v != null));
    if (!Object.keys(clean).length && articleMaster[key]) return;
    const next = { ...articleMaster, [key]: { name: name.trim(), ...(articleMaster[key] || {}), ...clean } };
    setArticleMaster(next);
    window.storage.set("site-material-catalog", JSON.stringify(next)).catch(() => {});
  }

  async function submitAdd() {
    if (addModal.type === "photo") {
      if (!photoPreview) return;
      // Store the image as its own document and keep only the reference, so
      // photos can never grow the site-data blob past Firestore's 1 MB limit.
      let photoId;
      try {
        photoId = photoPreviewId || (await savePhoto(photoPreview));
      } catch (err) {
        console.error("photo save:", err);
        showToast(`${t.couldntSave} (${(err && (err.code || err.message)) || "save"})`);
        return;
      }
      if (addModal.editingId) {
        const previous = entries.find((e) => e.id === addModal.editingId);
        persist({ entries: entries.map((e) => (e.id === addModal.editingId ? { ...e, description: form.description || t.photoLabel, photoId, photo: null } : e)) });
        if (previous && previous.photoId && previous.photoId !== photoId) deletePhoto(previous.photoId);
      } else {
        // One entry per photo, the caption on each; stored one document at a
        // time so a slow connection loses at most the last one, not all.
        const extraIds = [];
        for (const dataUrl of photoExtra) {
          try { extraIds.push(await savePhoto(dataUrl)); } catch (err) { console.error("photo save:", err); showToast(`${t.couldntSave} (${(err && (err.code || err.message)) || "save"})`); }
        }
        const caption = form.description || t.photoLabel;
        const made = [photoId, ...extraIds].map((id) => newEntry({ type: "photo", projectId: addModal.projectId, description: caption, photoId: id }));
        persist({ entries: [...made, ...entries] });
        if (made.length > 1) showToast(`${made.length} ${t.photosAdded}`);
      }
    } else {
      if (!form.description.trim()) return;
      const unitPrice = form.unitPrice === "" || form.unitPrice === undefined ? undefined : form.unitPrice;
      if (addModal.editingId) {
        persist({ entries: entries.map((e) => (e.id === addModal.editingId ? { ...e, description: form.description.trim(), qty: form.qty, unit: form.unit, unitPrice, regie: !!form.regie, trade: form.trade || DEFAULT_TRADE, supplier: (form.supplier || "").trim(), artNo: (form.artNo || "").trim() } : e)) });
        // An edited note gets fresh translations; the old ones would lie.
        if (addModal.type === "note" && addModal.projectId) {
          const edited = { ...(entries.find((e) => e.id === addModal.editingId) || {}), id: addModal.editingId, type: "note", projectId: addModal.projectId, description: form.description.trim() };
          setNoteTranslations((m) => {
            const forProject = { ...(m[addModal.projectId] || {}) };
            delete forProject[addModal.editingId];
            companyStorage.set(`xl-${addModal.projectId}`, JSON.stringify(forProject)).catch(() => {});
            return { ...m, [addModal.projectId]: forProject };
          });
          setTimeout(() => autoTranslateNote(edited), 0);
        }
      } else {
        addEntry({ type: addModal.type, projectId: addModal.projectId, description: form.description.trim(), qty: form.qty, unit: form.unit, unitPrice, regie: !!form.regie, trade: form.trade || DEFAULT_TRADE, supplier: (form.supplier || "").trim(), artNo: (form.artNo || "").trim() });
        setLastTrade(form.trade || DEFAULT_TRADE);
      }
      // Everything the entry taught us about this article goes back into the
      // master, so the next person to log it gets the unit, the price, the
      // supplier and the article number filled in for them.
      if (addModal.type === "material" || addModal.type === "tool") {
        rememberMaterial(form.description, {
          unit: form.unit.trim(),
          price: unitPrice,
          supplier: (form.supplier || "").trim(),
          artNo: (form.artNo || "").trim(),
        });
      }
    }
    setAddModal(null);
  }

  async function handleFile(e) {
    const files = Array.from(e.target.files || []).filter((f) => f && (!f.type || /^image\//.test(f.type)));
    e.target.value = "";
    if (!files.length) return;
    // Editing an existing photo replaces that one photo; adding takes as
    // many as were picked. Twelve is plenty for one tap and keeps a slow
    // phone from chewing through a whole camera roll.
    const editing = !!(addModal && addModal.editingId);
    const list = editing ? files.slice(0, 1) : files.slice(0, 12);
    // Must be a data URL, not URL.createObjectURL: a blob: URL dies with the
    // page session, so a persisted entry would show a broken image on reload
    // and never render on another device.
    const scaled = [];
    for (const file of list) {
      try { scaled.push((await fileToScaledImage(file)).dataUrl); } catch (err) { showError(err, "photo"); }
    }
    if (!scaled.length) return;
    if (editing || !photoPreview) {
      setPhotoPreview(scaled[0]);
      setPhotoPreviewId(null); // a new image needs its own document
      if (!editing) setPhotoExtra((x) => [...x, ...scaled.slice(1)]);
    } else {
      setPhotoExtra((x) => [...x, ...scaled]);
    }
  }

  function logIncident() {
    addEntry({ type: "note", projectId: activeClock?.projectId || null, description: "SOS" });
  }

  // Phone photos are far too big to send as-is: the vision API rejects images
  // over ~5MB of base64, and a full-size photo also blows past Firestore's 1MB
  // document limit. Re-encoding through a canvas also converts HEIC (iPhone) to
  // JPEG, which the API does accept.
  const MAX_IMAGE_EDGE = 1568;
  // What one photo may weigh as a data URL: Firestore keeps a kv document
  // under 1 MB and the rules refuse anything larger, so the encoder steps
  // down in quality and size until it fits. A phone photo of a roof at
  // 1568 px and 0.85 easily lands above that; on a desk, never.
  const MAX_PHOTO_DATA_URL = 900000;

  // Decode a picked file into a bitmap. createImageBitmap honours the EXIF
  // orientation where supported; older phones and some files (HEIC on iOS
  // before it is converted) throw, and then an <img> does the decoding --
  // browsers auto-orient those since 2020.
  async function decodePicked(file) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.decoding = "async";
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error("decode")); img.src = url; });
        return img;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }

  async function fileToScaledImage(file) {
    const source = await decodePicked(file);
    const sw = source.naturalWidth || source.width;
    const sh = source.naturalHeight || source.height;
    if (!sw || !sh) throw new Error("decode");
    let edge = MAX_IMAGE_EDGE;
    let quality = 0.85;
    let dataUrl = "";
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = Math.min(1, edge / Math.max(sw, sh));
      const w = Math.max(1, Math.round(sw * scale));
      const h = Math.max(1, Math.round(sh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(source, 0, 0, w, h);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_PHOTO_DATA_URL) break;
      // Quality first (cheap to lose), then size.
      if (quality > 0.65) quality -= 0.1; else edge = Math.round(edge * 0.8);
    }
    source.close?.();
    if (!dataUrl.startsWith("data:image/jpeg")) throw new Error("encode");
    return { b64: dataUrl.split(",")[1], mediaType: "image/jpeg", dataUrl };
  }

  function openScan(mode, projectId) {
    setScanModal({ mode, images: [], items: null, loading: false, error: null, projectId: projectId || activeClock?.projectId || projects[0]?.id || null });
  }

  async function addScanImage(e) {
    const file = e.target.files?.[0];
    if (!file || !scanModal) return;
    try {
      const { b64, mediaType } = await fileToScaledImage(file);
      setScanModal((s) => ({ ...s, images: [...s.images, { b64, mediaType }], items: null, error: null }));
    } catch {
      setScanModal((s) => ({ ...s, error: t.scanErrorHint }));
    }
  }

  async function callClaude(content) {
    try {
      // Call the proxy directly rather than relying on window.callClaude from
      // index.html: browsers cache index.html and bundle.js independently, so a
      // stale HTML file either leaves the global undefined or, worse, points it
      // at an abandoned endpoint. Owning the call here keeps it deterministic.
      const token = await getIdToken();
      const res = await fetch(CLAUDE_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, companyId: getCompanyId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `proxy error ${res.status}`);
      return data.text;
    } catch (err) {
      // The generic "couldn't read that" toasts hide why a scan failed
      // (billing, oversized image, proxy down) — keep the real reason visible.
      console.error("callClaude failed:", err);
      throw err;
    }
  }

  // A note written in Albanian on the roof, read in German at the desk -- or
  // the other way round. Goes through the same proxy as the scans (signed in,
  // rate-limited, key stays on the Worker). The result is only ever shown as
  // text, never parsed into anything.
  // One call returns every target language as JSON, so a note costs one
  // request however many languages the crew reads. The result is only ever
  // shown as text, never parsed into anything but this map.
  async function translateEntry(entry, projectId, targets, { quiet = false } = {}) {
    tracker.track("translate");
    const text = String(entry.description || "").trim();
    const wanted = [...new Set((targets || []).filter((c) => LANG_NAMES[c]))];
    if (!text || !projectId || !wanted.length || translatingIds.includes(entry.id)) return;
    setTranslatingIds((ids) => [...ids, entry.id]);
    try {
      const list = wanted.map((c) => `"${c}": ${LANG_NAMES[c]}`).join(", ");
      const prompt = `Translate the following note from a construction site into each of these languages: ${list}. Answer with a single JSON object whose keys are exactly the language codes given and whose values are the translations, and nothing else. If the note is already in one of the languages, return it unchanged for that code. Keep names, numbers and units as they are.\n\n<note>\n${text}\n</note>`;
      const raw = String((await callClaude([{ type: "text", text: prompt }])) || "");
      const parsed = parseJsonSafe(raw, null);
      const got = {};
      if (parsed && typeof parsed === "object") {
        for (const c of wanted) if (typeof parsed[c] === "string" && parsed[c].trim()) got[c] = parsed[c].trim();
      } else if (wanted.length === 1 && raw.trim()) {
        got[wanted[0]] = raw.trim().replace(/^["«»„“”']+|["«»„“”']+$/g, "");
      }
      if (!Object.keys(got).length) throw new Error("empty");
      setNoteTranslations((m) => {
        const forProject = { ...(m[projectId] || {}), [entry.id]: { ...((m[projectId] || {})[entry.id] || {}), ...got } };
        companyStorage.set(`xl-${projectId}`, JSON.stringify(forProject)).catch(() => {});
        return { ...m, [projectId]: forProject };
      });
    } catch (e) {
      // The reason travels with the toast: "proxy error 502", "not a member",
      // "empty" -- a person can report it, and it names the side that failed.
      if (!quiet) showError(e, "ai");
    } finally {
      setTranslatingIds((ids) => ids.filter((x) => x !== entry.id));
    }
  }

  // The tap on one note: only the reader's language.
  // The tap on one note: into the language asked for (the reader's by
  // default), never into the one it was written in, never twice.
  function translateNote(entry, projectId, target) {
    const to = target || lang;
    if (!LANG_NAMES[to] || to === entry.srcLang) return;
    if (noteTranslations[projectId]?.[entry.id]?.[to]) return;
    return translateEntry(entry, projectId, [to]);
  }

  // On save: every language the crew reads, plus German, the company's own.
  // Quiet on failure -- the note is saved either way, and a reader can still
  // tap. A note with no job has nowhere to keep a translation and is skipped.
  function autoTranslateNote(entry) {
    if (!entry || entry.type !== "note" || !entry.projectId) return;
    const targets = [...memberLangs, lang, "de"].filter((c) => c !== entry.srcLang);
    if (!targets.length) return;
    return translateEntry(entry, entry.projectId, targets, { quiet: true });
  }

  async function translateAllNotes(projectId) {
    const list = entries.filter((e) => e.projectId === projectId && e.type === "note");
    for (const n of list) await translateNote(n, projectId);
  }

  // --- photos: look, zoom, mark up ----------------------------------------------
  async function openPhoto(entry) {
    const src = entry.photo || (await loadPhoto(entry.photoId));
    if (!src) { saveFailed(null, "openPhoto"); return; }
    setPhotoView({ entry, src });
  }

  // A marked-up photo is a new photo. The original stays under the entry so
  // an arrow drawn in the wrong place can be undone tomorrow, not just now.
  async function savePhotoEdit(entry, dataUrl) {
    try {
      const id = await savePhoto(dataUrl);
      const updated = { ...entry, photoId: id, photo: null, originalPhotoId: entry.originalPhotoId || entry.photoId || null, editedAt: Date.now() };
      persist({ entries: entries.map((e) => (e.id === entry.id ? updated : e)) });
      setPhotoEdit(null);
      setPhotoView({ entry: updated, src: dataUrl });
      showToast(t.photoSaved);
    } catch (e) {
      saveFailed(e, "savePhotoEdit");
    }
  }

  async function restorePhotoOriginal(entry) {
    if (!entry.originalPhotoId) return;
    const src = await loadPhoto(entry.originalPhotoId);
    if (!src) { saveFailed(null, "restorePhotoOriginal"); return; }
    const edited = entry.photoId;
    const updated = { ...entry, photoId: entry.originalPhotoId, originalPhotoId: null, editedAt: null };
    persist({ entries: entries.map((e) => (e.id === entry.id ? updated : e)) });
    if (edited && edited !== entry.originalPhotoId) deletePhoto(edited);
    setPhotoView({ entry: updated, src });
    showToast(t.photoRestored);
  }

  function parseJsonSafe(text, fallback) {
    try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { return fallback; }
  }

  // The friendly "couldn't read that" message hides why a scan actually failed,
  // which makes issues on someone else's phone impossible to diagnose. Keep a
  // short technical line alongside it.
  function errDetail(err, images) {
    const msg = String((err && err.message) || err || "unknown error");
    const kb = (images || []).reduce((n, i) => n + (i.b64 ? i.b64.length : 0), 0) / 1024;
    // Include the loaded bundle version so a stale cached build is obvious.
    let build = "?";
    try {
      const src = document.querySelector('script[src^="bundle.js"]')?.getAttribute("src") || "";
      build = src.split("?v=")[1] || "unstamped";
    } catch {}
    return `${msg} · ${images ? images.length : 0} img · ${Math.round(kb)}KB · build ${build}`;
  }

  async function runScan() {
    if (!scanModal || scanModal.images.length === 0) return;
    setScanModal((s) => ({ ...s, loading: true, error: null }));
    const isCompare = scanModal.mode === "compare";
    const prompt = isCompare
      ? "The first image is a stack/pallet of construction materials BEFORE work, the second is the SAME stack AFTER work. Estimate how much material was consumed. Respond ONLY with JSON, no markdown, no prose: {\"items\":[{\"name\":string,\"qty\":number,\"unit\":string}]}. Use whole, practical units. If unsure, make a reasonable best guess and keep the list short."
      : "Identify the construction materials visible in this photo (delivery note, pallet, or stacked materials) and estimate quantities. Respond ONLY with JSON: {\"items\":[{\"name\":string,\"qty\":number,\"unit\":string}]}. Keep the list short and practical.";
    try {
      const content = [
        ...scanModal.images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.b64 } })),
        { type: "text", text: prompt },
      ];
      const text = await callClaude(content);
      const parsed = parseJsonSafe(text, { items: [] });
      const items = (parsed.items || []).map((it) => ({ ...it, id: uid(), checked: true }));
      setScanModal((s) => ({ ...s, loading: false, items, detail: null }));
    } catch (err) {
      setScanModal((s) => ({ ...s, loading: false, error: t.scanErrorHint, detail: errDetail(err, scanModal.images) }));
    }
  }

  function confirmScan() {
    if (!scanModal || !scanModal.items) return;
    const chosen = scanModal.items.filter((i) => i.checked);
    const newEntries = chosen.map((i) => newEntry({ type: "material", projectId: scanModal.projectId, description: i.name, qty: i.qty, unit: i.unit }));
    persist({ entries: [...newEntries, ...entries] });
    setScanModal(null);
  }

  function openLibraryScan() {
    setLibraryScanModal({ image: null, keepPhoto: false, loading: false, error: null, result: null });
  }

  async function addLibraryScanImage(e) {
    const file = e.target.files?.[0];
    if (!file || !libraryScanModal) return;
    try {
      const { b64, mediaType } = await fileToScaledImage(file);
      setLibraryScanModal((s) => ({ ...s, image: { b64, mediaType }, result: null, error: null }));
    } catch {
      setLibraryScanModal((s) => ({ ...s, error: t.specScanErrorHint }));
    }
  }

  async function runLibraryScan() {
    if (!libraryScanModal || !libraryScanModal.image) return;
    setLibraryScanModal((s) => ({ ...s, loading: true, error: null }));
    const prompt = "This photo shows a product label, datasheet, or technical spec sheet for a construction material or tool. Extract what's legible. Respond ONLY with JSON, no markdown, no prose: {\"name\":string,\"supplier\":string,\"articleNumber\":string,\"category\":string,\"specs\":[{\"key\":string,\"value\":string}]}. Use empty string for anything not legible or not present. Keep \"specs\" to the technical properties only (dimensions, ratings, performance values, materials, etc.), not marketing text.";
    try {
      const content = [
        { type: "image", source: { type: "base64", media_type: libraryScanModal.image.mediaType, data: libraryScanModal.image.b64 } },
        { type: "text", text: prompt },
      ];
      const text = await callClaude(content);
      const parsed = parseJsonSafe(text, { name: "", supplier: "", articleNumber: "", category: "", specs: [] });
      const result = {
        name: parsed.name || "", supplier: parsed.supplier || "", articleNumber: parsed.articleNumber || "", category: parsed.category || "",
        specs: (parsed.specs || []).map((s) => ({ id: uid(), key: s.key || "", value: s.value || "" })),
      };
      setLibraryScanModal((s) => ({ ...s, loading: false, result, detail: null }));
    } catch (err) {
      setLibraryScanModal((s) => ({ ...s, loading: false, error: t.specScanErrorHint, detail: errDetail(err, libraryScanModal.image ? [libraryScanModal.image] : []) }));
    }
  }

  async function confirmLibraryScan() {
    if (!libraryScanModal || !libraryScanModal.result) return;
    const r = libraryScanModal.result;
    const entry = {
      id: uid(), createdAt: Date.now(), name: r.name, supplier: r.supplier, articleNumber: r.articleNumber, category: r.category,
      specs: r.specs.filter((s) => s.key.trim() || s.value.trim()),
      photo: libraryScanModal.keepPhoto && libraryScanModal.image ? `data:${libraryScanModal.image.mediaType};base64,${libraryScanModal.image.b64}` : null,
      photoId: null,
    };
    saveTechLibrary([await externalizePhoto(entry), ...techLibrary]);
    showToast(t.addedToLibraryToast);
    setLibraryScanModal(null);
  }

  function openLibraryEdit(existing) {
    setLibraryEditModal(existing
      ? { ...existing, specs: existing.specs.map((s) => ({ ...s })) }
      : { id: null, name: "", supplier: "", articleNumber: "", category: "", specs: [], photo: null, photoId: null });
    if (existing && !existing.photo && existing.photoId) {
      loadPhoto(existing.photoId).then((v) => setLibraryEditModal((m) => (m ? { ...m, photo: v } : m)));
    }
  }

  function updateLibraryEditField(field, value) {
    setLibraryEditModal((m) => ({ ...m, [field]: value }));
  }

  function addLibrarySpecRow() {
    setLibraryEditModal((m) => ({ ...m, specs: [...m.specs, { id: uid(), key: "", value: "" }] }));
  }

  function updateLibrarySpecRow(id, field, value) {
    setLibraryEditModal((m) => ({ ...m, specs: m.specs.map((s) => (s.id === id ? { ...s, [field]: value } : s)) }));
  }

  function removeLibrarySpecRow(id) {
    setLibraryEditModal((m) => ({ ...m, specs: m.specs.filter((s) => s.id !== id) }));
  }

  async function submitLibraryEdit() {
    if (!libraryEditModal || !libraryEditModal.name.trim()) return;
    const cleanSpecs = libraryEditModal.specs.filter((s) => s.key.trim() || s.value.trim());
    const record = await externalizePhoto({ ...libraryEditModal, specs: cleanSpecs });
    if (record.id) {
      saveTechLibrary(techLibrary.map((it) => (it.id === record.id ? record : it)));
    } else {
      saveTechLibrary([{ ...record, id: uid(), createdAt: Date.now() }, ...techLibrary]);
    }
    showToast(t.addedToLibraryToast);
    setLibraryEditModal(null);
  }

  function deleteLibraryItem(id) {
    const item = techLibrary.find((it) => it.id === id);
    saveTechLibrary(techLibrary.filter((it) => it.id !== id));
    if (item && item.photoId) deletePhoto(item.photoId);
    showToast(t.libraryItemDeleted);
  }

  function openPickup() {
    setPickupModal({ step: "form", orderRef: "", supplier: "", projectId: activeClock?.projectId || projects[0]?.id || null, codeType: "qr" });
  }

  function generatePickupCode() {
    if (!pickupModal || !pickupModal.orderRef.trim()) return;
    addEntry({ type: "pickup", projectId: pickupModal.projectId, description: `${pickupModal.orderRef.trim()}${pickupModal.supplier ? " — " + pickupModal.supplier.trim() : ""}` });
    setPickupModal((s) => ({ ...s, step: "code" }));
  }

  function openInspection(projectId, entry) {
    if (entry) {
      // Editing: the note comes back as typed; an old entry without a stored
      // note (an AI report, say) offers its text so nothing is lost on save.
      setInspectionModal({
        step: "form", editingId: entry.id,
        text: entry.note != null ? entry.note : (entry.checklist ? "" : String(entry.description || "")),
        startTime: entry.startTime || "", ladderLength: entry.ladderLength || "", psaCount: entry.psaCount || "",
        images: [], projectId: entry.projectId || projectId, progress: 0, agentNote: "",
        report: null, materials: null, error: null,
        checklist: { ...(entry.checklist || {}) },
        tiles: (entry.tiles && entry.tiles.length ? entry.tiles.map((r) => ({ model: r.model || "", count: String(r.count || "") })) : [{ model: "", count: "" }]),
      });
      return;
    }
    setInspectionModal({
      step: "form", text: "", startTime: new Date().toTimeString().slice(0, 5), ladderLength: "", psaCount: "",
      images: [], projectId: projectId || activeClock?.projectId || projects[0]?.id || null, progress: 0, agentNote: "",
      report: null, materials: null, error: null,
      checklist: {}, tiles: [{ model: "", count: "" }],
    });
  }

  // Who may change an inspection: its author, or anyone who manages.
  function canEditInspection(entry) {
    return !!entry && (canManage() || entry.userId === user?.uid);
  }

  // Waste this job's inspections produced that no trip has carried yet --
  // the number offered when a waste trip is logged for the job.
  function openWasteKg(projectId) {
    if (!projectId) return 0;
    const produced = entries.filter((e) => e.type === "inspection" && e.projectId === projectId).reduce((s, e) => s + (parseFloat(e.wasteKg) || 0), 0);
    const carried = entries.filter((e) => e.type === "transport" && e.projectId === projectId && e.loadKind === "waste").reduce((s, e) => s + (parseFloat(e.weightKg) || 0), 0);
    return Math.max(0, Math.round(produced - carried));
  }

  function openTrip(projectId) {
    const pid = projectId || activeClock?.projectId || "";
    const pr = projects.find((p) => p.id === pid);
    setTripModal({
      projectId: pid, vehicle: VEHICLES[0], from: "", to: pr ? (pr.address || pr.name) : "", departTime: new Date().toTimeString().slice(0, 5), arriveTime: "",
      km: "", loadKind: "material", weightKg: "", mulde: "", disposalSite: "", notes: "", date: todayKey(),
    });
  }

  function setTripField(k, v) {
    setTripModal((s) => {
      const n = { ...s, [k]: v };
      if (k === "projectId") { const pr = projects.find((p) => p.id === v); if (pr && !s.to) n.to = pr.address || pr.name; }
      if ((k === "loadKind" || k === "projectId") && n.loadKind === "waste" && !n.weightKg) { const w = openWasteKg(n.projectId); if (w) n.weightKg = String(w); }
      return n;
    });
  }

  function saveTrip() {
    const m = tripModal;
    if (!m) return;
    if (!m.from.trim() && !m.to.trim()) { showToast(t.tripNeedsRoute); return; }
    const hours = tripHours(m.departTime, m.arriveTime);
    persist({ entries: [newEntry({
      type: "transport", projectId: m.projectId || null, date: m.date || todayKey(),
      description: `${m.from.trim() || "?"} → ${m.to.trim() || "?"}`,
      vehicle: m.vehicle, from: m.from.trim(), to: m.to.trim(), departTime: m.departTime, arriveTime: m.arriveTime, hours,
      km: parseFloat(m.km) || 0, loadKind: m.loadKind, weightKg: parseFloat(m.weightKg) || 0, mulde: m.mulde || "", disposalSite: m.disposalSite.trim(), notes: m.notes.trim(),
      qty: hours ? String(hours) : "", unit: hours ? "h" : "",
    }), ...entries] });
    showToast(t.tripSaved);
    setTripModal(null);
  }

  function cycleInspectionItem(key) {
    setInspectionModal((s) => {
      const cur = (s.checklist || {})[key];
      const next = cur === "ok" ? "mangel" : cur === "mangel" ? undefined : "ok";
      const checklist = { ...(s.checklist || {}) };
      if (next) checklist[key] = next; else delete checklist[key];
      return { ...s, checklist };
    });
  }

  function inspectionLabels() {
    const labels = { __mangel: t.inspectMangel, __ok: t.inspectOk, __replaced: t.inspectReplaced };
    INSPECTION_ITEMS.forEach((k) => { labels[k] = t[`inspect_${k}`]; });
    return labels;
  }

  // Save without the advisers: the entry's text is the checklist, the
  // replaced tiles and the note, and the structured fields ride along so
  // Transport can pick up the waste weight.
  function saveInspectionPlain() {
    const m = inspectionModal;
    if (!m || !m.projectId) return;
    const tiles = (m.tiles || []).filter((r) => r.model && parseFloat(r.count) > 0);
    const waste = tilesWaste(tiles);
    const summary = summariseInspection({ checklist: m.checklist, tiles, note: m.text, labels: inspectionLabels() });
    if (!summary) { showToast(t.inspectNothing); return; }
    const fields = {
      description: summary, note: m.text || "",
      checklist: m.checklist || {}, tiles, wasteKg: waste.wasteKg, areaM2: waste.areaM2,
      startTime: m.startTime || "", ladderLength: m.ladderLength || "", psaCount: m.psaCount || "",
    };
    if (m.editingId) {
      // The same entry, changed: the rules keep userId as it was.
      persist({ entries: entries.map((e) => (e.id === m.editingId ? { ...e, ...fields, updatedAt: Date.now() } : e)) });
      showToast(t.inspectionUpdated);
    } else {
      persist({ entries: [newEntry({ type: "inspection", projectId: m.projectId, ...fields }), ...entries] });
      showToast(t.inspectionLogged);
    }
    setInspectionModal(null);
  }

  async function addInspectionImage(e) {
    const file = e.target.files?.[0];
    if (!file || !inspectionModal) return;
    try {
      const { b64, mediaType } = await fileToScaledImage(file);
      setInspectionModal((s) => ({ ...s, images: [...s.images, { b64, mediaType }] }));
    } catch {
      setInspectionModal((s) => ({ ...s, error: t.scanErrorHint }));
    }
  }

  async function runInspection() {
    if (!inspectionModal || !inspectionModal.text.trim()) return;
    const m = inspectionModal;
    const imageBlocks = m.images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.b64 } }));
    const contextLine = `Roof inspection note: "${m.text.trim()}". Start time: ${m.startTime || "not given"}. Ladder length: ${m.ladderLength || "not given"} m. PSA (fall-arrest) harnesses used: ${m.psaCount || "not given"}.`;
    try {
      setInspectionModal((s) => ({ ...s, step: "running", progress: 1, agentNote: t.agent1Note }));
      const safetyText = await callClaude([{ type: "text", text: `You are a Swiss construction site safety advisor familiar with SUVA and BauAV fall-protection rules. ${contextLine} List 2-5 short, concrete safety observations or compliance notes. Respond ONLY with JSON: {"safety":["...", "..."]}` }]);
      const safety = parseJsonSafe(safetyText, { safety: [] }).safety || [];

      setInspectionModal((s) => ({ ...s, progress: 2, agentNote: t.agent2Note }));
      const materialsText = await callClaude([
        ...imageBlocks,
        { type: "text", text: `You are a materials/tools estimator for a Swiss roofing crew. ${contextLine} Based on the note${imageBlocks.length ? " and attached photo(s)" : ""}, list materials or tools implied or visible. Respond ONLY with JSON: {"materials":[{"name":string,"qty":number,"unit":string}]}. Keep it short and practical.` },
      ]);
      const materials = (parseJsonSafe(materialsText, { materials: [] }).materials || []).map((it) => ({ ...it, id: uid(), checked: true }));

      setInspectionModal((s) => ({ ...s, progress: 3, agentNote: t.agent3Note }));
      const langNames = { en: "English", de: "German", fr: "French", it: "Italian", es: "Spanish", pt: "Portuguese", pl: "Polish", sk: "Slovak", cs: "Czech" };
      const reportText = await callClaude([{ type: "text", text: `Compile a concise roof inspection report for a Swiss roofing company, in ${langNames[lang] || "English"}, plain text, no markdown symbols, under 180 words, with sections: Summary, Safety Notes, Materials, Recommendations. ${contextLine} Safety advisor findings: ${JSON.stringify(safety)}. Materials estimator findings: ${JSON.stringify(materials.map(({ name, qty, unit }) => ({ name, qty, unit })))}.` }]);

      setInspectionModal((s) => ({ ...s, step: "result", report: reportText.trim(), materials, safety }));
    } catch (err) {
      setInspectionModal((s) => ({ ...s, step: "form", error: t.couldntReach, detail: errDetail(err, inspectionModal.images) }));
    }
  }

  function confirmInspection() {
    if (!inspectionModal || !inspectionModal.report) return;
    const chosenMaterials = (inspectionModal.materials || []).filter((i) => i.checked);
    const tiles = (inspectionModal.tiles || []).filter((r) => r.model && parseFloat(r.count) > 0);
    const waste = tilesWaste(tiles);
    const newEntries = [
      newEntry({
        type: "inspection", projectId: inspectionModal.projectId, description: inspectionModal.report,
        checklist: inspectionModal.checklist || {}, tiles, wasteKg: waste.wasteKg, areaM2: waste.areaM2,
        startTime: inspectionModal.startTime || "", ladderLength: inspectionModal.ladderLength || "", psaCount: inspectionModal.psaCount || "",
      }),
      ...chosenMaterials.map((i) => newEntry({ type: "material", projectId: inspectionModal.projectId, description: i.name, qty: i.qty, unit: i.unit })),
    ];
    persist({ entries: [...newEntries, ...entries] });
    showToast(t.inspectionLogged);
    setInspectionModal(null);
  }

  function projectName(id) { return projects.find((p) => p.id === id)?.name || ""; }

  const todayEntries = entries.filter((e) => e.date === todayKey());
  const monthEntries = entries.filter((e) => e.date.slice(0, 7) === monthKey());

  // Job costing. Hours and materials are already captured per project; the
  // only missing inputs were a labour rate and unit prices, so this turns
  // existing data into cost and margin rather than asking for new work.
  function projectCosting(projectId, quotedAmount) {
    const list = entries.filter((e) => e.projectId === projectId);
    const hours = list.filter((e) => e.type === "time").reduce((s, e) => s + parseFloat(e.qty || 0), 0);
    const rate = parseFloat(billing.labourRate || 0) || 0;
    const labour = hours * rate;

    let materials = 0;
    let pricedCount = 0;
    let unpricedCount = 0;
    list.filter((e) => e.type === "material" || e.type === "tool").forEach((e) => {
      const price = parseFloat(e.unitPrice ?? materialPrices[(e.description || "").trim().toLowerCase()] ?? "");
      const qty = parseFloat(e.qty || 0) || 0;
      if (!isNaN(price) && price > 0) { materials += price * (qty || 1); pricedCount++; }
      else unpricedCount++;
    });

    const cost = labour + materials;
    const quoted = parseFloat(quotedAmount || 0) || 0;
    return {
      hours, rate, labour, materials, cost, quoted,
      margin: quoted ? quoted - cost : null,
      marginPct: quoted > 0 ? ((quoted - cost) / quoted) * 100 : null,
      pricedCount, unpricedCount,
      hasRate: rate > 0,
    };
  }

  function money(n) {
    const cur = billing.currency || "CHF";
    return `${cur} ${(Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // The owner's overview. Everything here is derived from records the crew
  // already produce — nothing asks anyone to enter data twice.
  function commandCentre() {
    const today = todayKey();
    const month = monthKey();

    const invoices = documents.filter((d) => d.type === "invoice");
    const quotes = documents.filter((d) => d.type === "quote");

    let outstanding = 0, overdue = 0, paidThisMonth = 0, overdueCount = 0;
    const overdueList = [];
    invoices.forEach((inv) => {
      const st = documentState(inv, today);
      if (st.key !== "draft") outstanding += st.outstanding;
      if (st.overdue) { overdue += st.outstanding; overdueCount++; overdueList.push({ doc: inv, st }); }
      if (st.paid > 0 && inv.paidDate && inv.paidDate.startsWith(month)) paidThisMonth += st.paid;
    });

    // Pipeline value counts quotes that are still live — a declined quote is
    // not future revenue, and an accepted one has become an invoice.
    const pipelineValue = quotes
      .filter((q) => ["draft", "sent"].includes(q.status || "draft"))
      .reduce((s, q) => s + documentTotals(q).gross, 0);

    // Who is on site right now, from the personal clocks.
    const onSite = clocks
      .filter((c) => c.activeClock && c.activeClock.startedAt)
      .map((c) => ({
        uid: c.uid,
        name: (team.members.find((m) => m.uid === c.uid) || {}).name || c.uid,
        project: projects.find((p) => p.id === c.activeClock.projectId),
        since: c.activeClock.startedAt,
      }));

    // Hours this month per person.
    // Net of the breaks each person marked: Znüni and Mittag are not work.
    const hoursByUser = {};
    entries.filter((e) => (e.type === "time" || e.type === "break") && (e.date || "").startsWith(month)).forEach((e) => {
      const k = e.userId || "—";
      const h = parseFloat(e.qty || 0) || 0;
      hoursByUser[k] = (hoursByUser[k] || 0) + (e.type === "break" ? -h : h);
    });
    Object.keys(hoursByUser).forEach((k) => { hoursByUser[k] = Math.max(0, Math.round(hoursByUser[k] * 100) / 100); });

    const activeJobs = projects.filter((p) => (p.status || DEFAULT_PROJECT_STATUS) === "construction").length;
    const leads = projects.filter((p) => ["lead", "quoted"].includes(p.status || "")).length;

    const dueFollow = dueFollowUps();
    const expiringCerts = certificates.filter((c) => {
      if (!c.expiryDate) return false;
      const soon = new Date(); soon.setMonth(soon.getMonth() + 2);
      return c.expiryDate <= soon.toISOString().slice(0, 10);
    });

    return {
      outstanding, overdue, overdueCount, overdueList, paidThisMonth, pipelineValue,
      onSite, hoursByUser, activeJobs, leads, dueFollow, expiringCerts,
      plannedToday: assignments.filter((a) => a.date === today),
      pendingHours: pendingApproval(),
      pendingLeave: leaveRequests.filter((r) => (r.status || "pending") === "pending"),
      unpaidCount: invoices.filter((i) => { const s = documentState(i, today); return s.key !== "paid" && s.key !== "draft"; }).length,
    };
  }

  function dailySummary(list) {
    const hours = netHours(list);
    const breaks = breakHours(list);
    const materials = list.filter((e) => e.type === "material");
    const tools = list.filter((e) => e.type === "tool");
    const projIds = [...new Set(list.map((e) => e.projectId).filter(Boolean))];
    return { hours, breaks, materials, tools, projIds };
  }

  // A newer build is live: offer a restart, on the sign-in screen as much as
  // inside the app, and never reload on our own.
  const updateBar = updateReady ? (
    <div data-update-bar style={{ background: COLORS.card, border: `1px solid ${COLORS.accent}`, color: COLORS.text }} className="fixed left-3 right-3 bottom-3 lg:left-auto lg:right-6 lg:bottom-6 lg:w-96 z-50 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
      <span className="text-sm font-semibold flex-1">{t.updateReady}</span>
      <button onClick={() => window.location.reload()} style={{ background: COLORS.accent }} className="px-3 py-2 rounded-lg text-xs font-bold uppercase">{t.reloadBtn}</button>
    </div>
  ) : null;

  if (!authChecked) {
    return (
      <div style={{ background: COLORS.shell, color: COLORS.muted, height: "100dvh" }} className="w-full h-screen flex items-center justify-center text-sm">
        …
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ background: COLORS.shell, color: COLORS.text, minHeight: "100dvh" }} className="w-full flex flex-col items-center justify-center px-6 py-10">
        <MountainBackground />
        {updateBar}
        <div className="relative w-full max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <SwissCross size={18} />
            <div className="font-black text-xl uppercase tracking-wide">{t.appLabel}</div>
          </div>
          <div style={{ color: COLORS.muted }} className="text-xs mb-6">{t.authIntro}</div>

          <input
            type="email" inputMode="email" autoComplete="email"
            value={authForm.email}
            onChange={(e) => setAuthForm((s) => ({ ...s, email: e.target.value, error: null }))}
            placeholder={t.authEmail}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-3 text-sm mb-2 outline-none"
          />
          <input
            type="password" autoComplete={authForm.mode === "signup" ? "new-password" : "current-password"}
            value={authForm.password}
            onChange={(e) => setAuthForm((s) => ({ ...s, password: e.target.value, error: null }))}
            onKeyDown={(e) => { if (e.key === "Enter") submitAuth(); }}
            placeholder={t.authPassword}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-3 text-sm mb-3 outline-none"
          />

          {authForm.error && <div style={{ color: COLORS.danger }} className="text-xs mb-3">{t[authForm.error] || t.authErrGeneric}</div>}
          {authForm.notice && <div style={{ color: COLORS.success }} className="text-xs mb-3">{t[authForm.notice]}</div>}

          <button
            onClick={submitAuth}
            disabled={authForm.busy}
            style={{ background: COLORS.accent, opacity: authForm.busy ? 0.6 : 1 }}
            className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
          >
            {authForm.busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            {authForm.mode === "signup" ? t.authSignUp : t.authSignIn}
          </button>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setAuthForm((s) => ({ ...s, mode: s.mode === "signup" ? "signin" : "signup", error: null, notice: null }))}
              style={{ color: COLORS.accent }}
              className="text-xs font-bold"
            >
              {authForm.mode === "signup" ? t.authHaveAccount : t.authNeedAccount}
            </button>
            <button onClick={submitReset} style={{ color: COLORS.muted }} className="text-xs">{t.authForgot}</button>
          </div>

          <div style={{ color: COLORS.muted }} className="text-[10px] mt-8 leading-relaxed">
            {t.authPrivacyNote}{" "}
            <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.amber }} className="underline">{t.privacyLink}</a>
            {" · "}<span data-app-version>{SHELL_BUILD}</span>
          </div>
        </div>
      </div>
    );
  }

  // Signed in but not yet part of a company: either start one, or join an
  // existing one with the code the owner sent.
  if (membershipChecked && !membership) {
    const inp = "w-full rounded-lg px-3 py-3 text-sm mb-2 outline-none";
    const inpStyle = { background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text };
    return (
      <div style={{ background: COLORS.shell, color: COLORS.text, minHeight: "100dvh" }} className="w-full flex flex-col items-center justify-center px-6 py-10">
        <MountainBackground />
        {updateBar}
        <div className="relative w-full max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <SwissCross size={18} />
            <div className="font-black text-xl uppercase tracking-wide">{t.appLabel}</div>
          </div>
          <div style={{ color: COLORS.muted }} className="text-xs mb-6">{t.onbIntro}</div>

          <input value={onboarding.displayName} onChange={(e) => setOnboarding((s) => ({ ...s, displayName: e.target.value }))} placeholder={t.yourName} style={inpStyle} className={inp} />

          {onboarding.mode === "join" ? (
            <input value={onboarding.code} onChange={(e) => setOnboarding((s) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder={t.onbCodePlaceholder} style={inpStyle} className={`${inp} font-mono tracking-widest`} />
          ) : (
            <input value={onboarding.companyName} onChange={(e) => setOnboarding((s) => ({ ...s, companyName: e.target.value }))} placeholder={t.onbCompanyName} style={inpStyle} className={inp} />
          )}

          {onboarding.error && <div style={{ color: COLORS.danger }} className="text-xs mb-3">{t[onboarding.error] || t.onbErrGeneric}</div>}
          {onboarding.detail && <div style={{ color: COLORS.muted }} className="text-[10px] mb-3 break-all">{onboarding.detail}</div>}

          <button
            onClick={() => submitOnboarding(onboarding.mode === "join" ? "join" : "create")}
            disabled={onboarding.busy}
            style={{ background: COLORS.accent, opacity: onboarding.busy ? 0.6 : 1 }}
            className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
          >
            {onboarding.busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {onboarding.mode === "join" ? t.onbJoinBtn : t.onbCreateBtn}
          </button>

          <button
            onClick={() => setOnboarding((s) => ({ ...s, mode: s.mode === "join" ? "choose" : "join", error: null }))}
            style={{ color: COLORS.accent }}
            className="w-full mt-4 text-xs font-bold"
          >
            {onboarding.mode === "join" ? t.onbSwitchCreate : t.onbSwitchJoin}
          </button>

          <button onClick={doSignOut} style={{ color: COLORS.muted }} className="w-full mt-6 text-xs">{t.signOut}</button>
          <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.muted }} className="block w-full mt-3 text-center text-[10px] underline">{t.privacyLink}</a>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ background: COLORS.shell, color: COLORS.muted, height: "100dvh" }} className="w-full h-screen flex items-center justify-center text-sm">
        …
      </div>
    );
  }

  const daily = dailySummary(todayEntries);
  const monthly = dailySummary(monthEntries);
  // Owner's decision: the monthly report carries only what no daily report
  // of this person has sent yet, so the supervisor gets nothing twice.
  const monthUnsent = unsentMonthEntries(monthEntries, sentReports, user?.uid, monthKey());
  const monthlyUnsent = dailySummary(monthUnsent.entries);
  const CPR_STEPS = cprSteps(t);
  const wCond = weather.data ? weatherFromCode(weather.data.weather_code, t) : null;

  // Active jobs plus this person's pins: what the dock shows, pinned first.
  const lastTouched = {};
  if (dockSort === "recent") entries.forEach((e) => { if (e.projectId) lastTouched[e.projectId] = Math.max(lastTouched[e.projectId] || 0, e.createdAt || 0); });
  const dockProjects = projects
    .filter((pr) => !["completed", "lost"].includes(pr.status || DEFAULT_PROJECT_STATUS))
    .filter((pr) => pinnedIds.includes(pr.id) || (pr.status || DEFAULT_PROJECT_STATUS) === "construction")
    .sort((a, b) => {
      const byName = String(a.name).localeCompare(String(b.name));
      if (dockSort === "name") return byName;
      if (dockSort === "status") return PROJECT_STATUSES.findIndex((x) => x.key === (a.status || DEFAULT_PROJECT_STATUS)) - PROJECT_STATUSES.findIndex((x) => x.key === (b.status || DEFAULT_PROJECT_STATUS)) || byName;
      if (dockSort === "recent") return (lastTouched[b.id] || 0) - (lastTouched[a.id] || 0) || byName;
      return (pinnedIds.includes(b.id) ? 1 : 0) - (pinnedIds.includes(a.id) ? 1 : 0) || byName;
    });
  const dockShown = !!membership && dockProjects.length > 0 && dockOpen;

  return (
    <div style={{ background: COLORS.shell, color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif", height: "100dvh" }} className="w-full h-screen max-w-md md:max-w-2xl lg:max-w-none mx-auto flex flex-col lg:flex-row relative overflow-hidden">
      <MountainBackground />

      {/* Office sidebar. The phone layout is right for a roof and wrong for a
          desk: a team leader planning a week needs everything at once, not a
          column with a thumb-sized nav at the bottom. Same app, same data —
          only the arrangement changes above 1024px. */}
      <aside style={{ background: COLORS.card, borderRight: `1px solid ${COLORS.border}` }} className="hidden lg:flex lg:flex-col w-56 shrink-0 relative z-10">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-1.5">
            <SwissCross size={13} />
            <div style={{ color: COLORS.accent, letterSpacing: "0.15em" }} className="text-xs font-bold uppercase">{t.appLabel}</div>
          </div>
          {membership && (
            <div style={{ color: COLORS.muted }} className="text-[10px] mt-1 truncate">
              {getRole() === "owner" ? t.roleOwner : getRole() === "supervisor" ? t.roleSupervisor : t.roleCrew}
            </div>
          )}
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {[
            ...(canManage() ? [{ id: "board", label: t.navBoard, icon: Ruler }, { id: "cockpit", label: t.navCockpit, icon: ClipboardCheck }] : []),
            { id: "today", label: t.navToday, icon: Clock },
            { id: "projects", label: t.navProjects, icon: MapPin },
            { id: "customers", label: t.navCustomers, icon: User },
            { id: "calendar", label: t.navCalendar, icon: CalendarDays },
            { id: "materials", label: t.navMaterials, icon: Package },
            { id: "team", label: t.navTeam, icon: Users },
            { id: "transport", label: t.navTransport, icon: Truck },
            { id: "reports", label: t.navReports, icon: FileText },
            { id: "safety", label: t.navSafety, icon: ShieldAlert },
          ].map((it) => {
            const Icon = it.icon;
            const active = tab === it.id;
            const accent = it.id === "safety" ? COLORS.danger : COLORS.accent;
            return (
              <button
                key={it.id}
                onClick={() => { setTab(it.id); setSelectedProject(null); }}
                style={{ background: active ? `${accent}1F` : "transparent", color: active ? accent : COLORS.text }}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 text-left"
              >
                <Icon size={16} color={active ? accent : COLORS.muted} /> {it.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4 flex flex-col gap-0.5">
          <button onClick={openProfile} style={{ color: COLORS.muted }} className="w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5">
            <User size={14} /> {t.profileTitle}
          </button>
          <button onClick={() => setLangPickerOpen(true)} style={{ color: COLORS.muted }} className="w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5">
            <Globe size={14} /> {lang.toUpperCase()}
          </button>
        </div>
      </aside>

      {/* min-h-0 is load-bearing: a flex item will not shrink below its
          content without it, so the scrolling area never gets a bounded
          height, the page grows past the viewport and scrolling breaks. */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
      <div style={{ borderBottom: `1px solid ${COLORS.border}` }} className="relative px-4 lg:px-5 pt-6 pb-4 flex items-center justify-between gap-2">
        {/* min-w-0 so the title gives way on a narrow phone; without it the
            icon cluster was pushed past the right edge and the menu button
            lost its last 13 px. */}
        <div className="relative min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <SwissCross size={13} />
            <div style={{ color: COLORS.accent, letterSpacing: "0.15em" }} className="text-xs font-bold uppercase truncate">{t.appLabel}</div>
          </div>
          <div className="text-xl font-black uppercase tracking-tight truncate">
            {{
              today: t.navToday, materials: t.navMaterials, calendar: t.navCalendar,
              projects: t.navProjects, reports: t.navReports, customers: t.navCustomers,
              board: t.navBoard, cockpit: t.navCockpit, safety: t.navSafety, team: t.navTeam, transport: t.navTransport,
            }[tab] || t.appLabel}
          </div>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          {activeClock ? (
            <div style={{ background: "#2E2620", color: COLORS.amber, border: `1px solid ${COLORS.amber}` }} className="text-xs font-bold px-2 py-1 rounded uppercase">{t.onSite}</div>
          ) : null}
          {canManage() && (
            <button onClick={() => setTab(tab === "cockpit" ? "today" : "cockpit")} title={t.navCockpit} style={{ background: tab === "cockpit" ? COLORS.accent : COLORS.card, border: `1px solid ${tab === "cockpit" ? COLORS.accent : COLORS.border}` }} className="flex items-center justify-center w-7 h-7 rounded-full">
              <ClipboardCheck size={14} color={tab === "cockpit" ? "#fff" : COLORS.muted} />
            </button>
          )}
          <button onClick={() => setTab("safety")} style={{ background: tab === "safety" ? COLORS.danger : COLORS.card, border: `1px solid ${tab === "safety" ? COLORS.danger : COLORS.border}` }} className="flex items-center justify-center w-7 h-7 rounded-full">
            <ShieldAlert size={13} color={tab === "safety" ? "#fff" : COLORS.muted} />
          </button>
          <button onClick={openProfile} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex items-center justify-center w-7 h-7 rounded-full lg:hidden">
            <User size={13} color={COLORS.muted} />
          </button>
          <button onClick={() => setLangPickerOpen(true)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex items-center gap-1 px-2 py-1 rounded-full">
            <Globe size={13} color={COLORS.muted} />
            <span style={{ color: COLORS.muted }} className="text-xs font-bold uppercase">{lang}</span>
          </button>
        </div>
      </div>

      {(syncState.error || syncState.fromCache) && (
        <div
          style={{
            background: syncState.error ? `${COLORS.danger}18` : `${COLORS.amber}18`,
            borderBottom: `1px solid ${syncState.error ? COLORS.danger : COLORS.amber}55`,
            color: syncState.error ? COLORS.danger : COLORS.amber,
          }}
          className="px-4 py-1.5 text-[10px] font-bold text-center break-all"
        >
          {syncState.error ? `${t.syncFailed} ${syncState.error}` : t.syncOffline}
        </div>
      )}

      {errorBox && (() => {
          const meta = ERROR_CODES[errorBox.code] || ERROR_CODES.E90;
          const groupTitle = { save: t.errGroupSave, photo: t.errGroupPhoto, ai: t.errGroupAi, lang: t.errGroupLang, file: t.errGroupFile, other: t.errGroupOther }[meta.group] || t.errGroupOther;
          const meaning = lang === "de" || lang === "gsw" ? meta.de : meta.en;
          const report = errorReport(errorBox, SHELL_BUILD);
          return (
            <div data-error-panel className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }}>
              <div style={{ background: COLORS.card, border: `2px solid ${COLORS.danger}`, color: COLORS.text }} className="w-full max-w-md rounded-2xl p-5 shadow-2xl">
                <div className="flex items-baseline gap-3">
                  <div data-error-code style={{ color: COLORS.danger }} className="text-4xl font-black tracking-tight">{errorBox.code}</div>
                  <div style={{ color: COLORS.muted }} className="font-mono text-xs">{errorBox.tag}</div>
                </div>
                <div className="text-lg font-bold mt-2">{groupTitle}</div>
                <div className="text-sm mt-1 leading-relaxed">{meaning}</div>
                {errorBox.detail && <div style={{ background: COLORS.shell, color: COLORS.muted }} className="font-mono text-[11px] mt-3 p-2 rounded-lg break-all">{errorBox.detail}</div>}
                <div style={{ color: COLORS.muted }} className="text-[10px] mt-2">{t.errReportHint} · {t.versionLabel} {SHELL_BUILD}</div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { try { navigator.clipboard.writeText(report); showToast(t.copyBtn); } catch (e) {} }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="flex-1 py-3 rounded-lg text-xs font-bold uppercase">{t.errCopy}</button>
                  <button data-error-close onClick={() => setErrorBox(null)} style={{ background: COLORS.accent }} className="flex-1 py-3 rounded-lg text-xs font-bold uppercase">{t.errClose}</button>
                </div>
              </div>
            </div>
          );
      })()}
      {updateBar}
      {toast && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.accent}`, color: COLORS.text }} className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto px-5 pb-6 pt-4 lg:px-8 lg:pb-8 lg:pt-6" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
        {tab === "today" && <TodayTab t={t} projects={projects} entries={entries} user={user} activeClock={activeClock} todayEntries={todayEntries} myAssignments={myAssignments} projectName={projectName} setTab={setTab} setSelectedProject={setSelectedProject} weather={weather} weatherLoc={weatherLoc} wCond={wCond} weatherEditOpen={weatherEditOpen} setWeatherEditOpen={setWeatherEditOpen} weatherCityInput={weatherCityInput} setWeatherCityInput={setWeatherCityInput} submitWeatherCity={submitWeatherCity} fetchWeather={fetchWeather} toggleBreak={toggleBreak} clockOut={clockOut} noteText={noteText} setNoteText={setNoteText} submitNote={submitNote} toggleVoiceInput={toggleVoiceInput} voiceListening={voiceListening} voiceTarget={voiceTarget} openEditTime={openEditTime} openEditEntry={openEditEntry} deleteEntryFn={deleteEntryFn} />}
        {tab === "materials" && <Suspense fallback={null}><MaterialsTab materialDragProps={materialDragProps} addToBasket={addToBasket} articleMaster={articleMaster} basket={basket} catalogs={catalogs} deleteEntryFn={deleteEntryFn} deleteLibraryItem={deleteLibraryItem} entries={entries} lang={lang} librarySearch={librarySearch} materialSearch={materialSearch} materialsCatalogFor={materialsCatalogFor} materialsSubTab={materialsSubTab} openLibraryEdit={openLibraryEdit} openLibraryScan={openLibraryScan} openPickup={openPickup} openScan={openScan} priceFileRef={priceFileRef} projectName={projectName} projects={projects} removeBasketItem={removeBasketItem} setBasket={setBasket} setBasketMode={setBasketMode} setBasketProjectModalOpen={setBasketProjectModalOpen} setLibrarySearch={setLibrarySearch} setMaterialSearch={setMaterialSearch} setMaterialsSubTab={setMaterialsSubTab} setOrderStatus={setOrderStatus} setShopCat={setShopCat} setSortMode={setSortMode} shopCat={shopCat} sortMode={sortMode} stagePriceList={stagePriceList} t={t} techLibrary={techLibrary} toolsCatalogFor={toolsCatalogFor} updateBasketItem={updateBasketItem} user={user} /></Suspense>}
        {tab === "calendar" && (() => {
          const localeMap = { en: "en-US", de: "de-CH", fr: "fr-CH", it: "it-CH", es: "es-ES", pt: "pt-PT", pl: "pl-PL", sk: "sk-SK", cs: "cs-CZ" };
          const locale = localeMap[lang] || "en-US";
          const year = calMonth.getFullYear();
          const month = calMonth.getMonth();
          const monthLabel = calMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
          const firstOfMonth = new Date(year, month, 1);
          const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const weekdayLabels = [0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = new Date(2024, 0, 1 + i); // a known Monday
            return d.toLocaleDateString(locale, { weekday: "short" }).slice(0, 2);
          });
          const pad = (n) => String(n).padStart(2, "0");
          const cells = [];
          for (let i = 0; i < startOffset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          return (
            <div className="flex flex-col gap-4">
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setCalMonth(new Date(year, month - 1, 1))}><ChevronLeft size={18} color={COLORS.muted} /></button>
                  <div className="font-bold text-sm capitalize">{monthLabel}</div>
                  <button onClick={() => setCalMonth(new Date(year, month + 1, 1))}><ChevronRight size={18} color={COLORS.muted} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekdayLabels.map((w, i) => (
                    <div key={i} style={{ color: COLORS.muted }} className="text-center text-[10px] font-bold uppercase">{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((d, i) => {
                    if (d === null) return <div key={i} />;
                    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                    const hasEntries = entries.some((e) => e.date === dateStr);
                    const leave = canManage() ? leaveRequests.find((r) => r.date === dateStr) : myLeaveFor(dateStr);
                    const isToday = dateStr === todayKey();
                    // The owner plans for everyone; a crew member only needs to
                    // see the days they are themselves expected somewhere.
                    const planned = canManage() ? assignmentsFor(dateStr) : myAssignments(dateStr);
                    const leaveColor = leave ? (leave.status === "approved" ? COLORS.success : leave.status === "declined" ? COLORS.danger : COLORS.amber) : null;
                    return (
                      <button
                        key={i}
                        onClick={() => (canManage() ? setAssignModal({ date: dateStr }) : openDay(dateStr))}
                        style={{
                          background: leaveColor ? `${leaveColor}22` : COLORS.cardAlt,
                          border: `1px solid ${isToday ? COLORS.accent : leaveColor || COLORS.border}`,
                        }}
                        className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                      >
                        <span style={{ color: isToday ? COLORS.accent : COLORS.text }} className="text-xs font-semibold">{d}</span>
                        {planned.length > 0 && (
                          <span style={{ color: "#6FB3D9" }} className="text-[9px] font-bold leading-none absolute top-0.5 right-1">{planned.length}</span>
                        )}
                        {hasEntries && <div style={{ background: COLORS.success }} className="w-1 h-1 rounded-full absolute bottom-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 px-1 text-[10px]" style={{ color: COLORS.muted }}>
                <div className="flex items-center gap-1"><div style={{ background: COLORS.success }} className="w-2 h-2 rounded-full" /> {t.dayJournalHeading}</div>
                <div className="flex items-center gap-1"><div style={{ background: COLORS.amber }} className="w-2 h-2 rounded-full" /> {t.statusPending}</div>
                <div className="flex items-center gap-1"><div style={{ background: COLORS.success }} className="w-2 h-2 rounded-full" /> {t.statusApproved}</div>
              </div>
              {canManage() && (
                <div style={{ color: COLORS.muted }} className="text-[10px] px-1 -mt-2">{t.schedHintOwner}</div>
              )}
              <button onClick={() => setRangeLeaveModalOpen(true)} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <CalendarDays size={16} /> {t.rangeLeaveBtn}
              </button>
            </div>
          );
        })()}

        {tab === "board" && canManage() && <Suspense fallback={null}><BoardTab assignments={assignments} boardView={boardView} calMonth={calMonth} customers={customers} dragProject={dragProject} entries={entries} lang={lang} leaveRequests={leaveRequests} openBranch={openBranch} printRapport={printRapport} projects={projects} setAssignModal={setAssignModal} setBoardView={setBoardView} setCalMonth={setCalMonth} setDragProject={setDragProject} setOpenBranch={setOpenBranch} setSelectedProject={setSelectedProject} setShowFinishedJobs={setShowFinishedJobs} setTab={setTab} setWeekAnchor={setWeekAnchor} showFinishedJobs={showFinishedJobs} siteReports={siteReports} t={t} team={team} toggleAssignment={toggleAssignment} weekAnchor={weekAnchor} weekDays={weekDays} /></Suspense>}
        {tab === "cockpit" && canManage() && <Suspense fallback={null}><CockpitTab approveEntry={approveEntry} commandCentre={commandCentre} customers={customers} hoursBalance={hoursBalance} loadUsage={loadUsage} money={money} projects={projects} setDocEditor={setDocEditor} setHoursModalOpen={setHoursModalOpen} setLeaveStatus={setLeaveStatus} setSelectedCustomer={setSelectedCustomer} setTab={setTab} t={t} team={team} usage={usage} /></Suspense>}
        {tab === "customers" && (() => {
          const due = dueFollowUps();
          const q = customerSearch.trim().toLowerCase();
          const shown = q
            ? customers.filter((c) => [c.name, c.company, c.phone, c.email, c.address].some((v) => (v || "").toLowerCase().includes(q)))
            : customers;
          return (
            <div className="flex flex-col gap-3">
              <button onClick={() => openCustomerForm(null)} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Plus size={16} /> {t.newCustomer}
              </button>

              {due.length > 0 && (
                <div style={{ background: `${COLORS.amber}18`, border: `1px solid ${COLORS.amber}66` }} className="rounded-xl p-3">
                  <div style={{ color: COLORS.amber }} className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <CalendarDays size={13} /> {t.followUpsDue} ({due.length})
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {due.slice(0, 5).map(({ customer, contact }) => (
                      <button key={contact.id} onClick={() => setSelectedCustomer(customer.id)} style={{ background: COLORS.card }} className="w-full text-left rounded-lg px-3 py-2">
                        <div className="text-sm font-semibold">{customer.name}</div>
                        <div style={{ color: COLORS.muted }} className="text-xs truncate">{contact.followUp} · {contact.note}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {customers.length > 3 && (
                <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder={t.searchCustomers} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              )}

              {customers.length === 0 ? (
                <div style={{ color: COLORS.muted }} className="text-sm text-center mt-8">{t.noCustomersYet}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {shown.map((c) => {
                    const jobs = projects.filter((p) => p.customerId === c.id);
                    const open = jobs.filter((p) => !["completed", "lost"].includes(p.status || DEFAULT_PROJECT_STATUS)).length;
                    return (
                      <button key={c.id} onClick={() => setSelectedCustomer(c.id)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="w-full text-left rounded-xl p-4 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold truncate">{c.name}</div>
                          {c.company && <div style={{ color: COLORS.muted }} className="text-xs truncate">{c.company}</div>}
                          <div style={{ color: COLORS.muted }} className="text-xs mt-1">
                            {jobs.length} {t.jobsLabel}{open > 0 ? ` · ${open} ${t.openLabel}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.phone && (
                            <a href={telHref(c.phone)} onClick={(e) => e.stopPropagation()} style={{ background: COLORS.cardAlt, color: COLORS.success }} className="w-8 h-8 rounded-full flex items-center justify-center">
                              <Phone size={14} />
                            </a>
                          )}
                          <ChevronRight size={18} color={COLORS.muted} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {tab === "projects" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setNewProjectOpen(true)} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Plus size={16} /> {t.newProjectSite}
              </button>
              <button onClick={() => { setImportModalOpen(true); setImportCodeInput(""); setImportError(null); }} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <ClipboardPaste size={16} /> {t.importProject}
              </button>
            </div>
            <button onClick={() => { setReportProjectSelection([]); setReportProjectPickerOpen(true); }} style={{ background: COLORS.accentDim }} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <FileText size={16} /> {t.generateReportBtn}
            </button>
            {projects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[{ key: "all", label: t.pipelineAll, color: COLORS.muted }, ...PROJECT_STATUSES.map((s) => ({ key: s.key, label: t[s.labelKey], color: s.color }))].map((f) => {
                  const count = f.key === "all" ? projects.length : projects.filter((p) => (p.status || DEFAULT_PROJECT_STATUS) === f.key).length;
                  if (f.key !== "all" && count === 0) return null;
                  const active = pipelineFilter === f.key;
                  return (
                    <button key={f.key} onClick={() => setPipelineFilter(f.key)} style={{ background: active ? `${f.color}33` : COLORS.card, border: `1px solid ${active ? f.color : COLORS.border}`, color: active ? f.color : COLORS.muted }} className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap">
                      {f.label} {count}
                    </button>
                  );
                })}
              </div>
            )}
            <ReorderList
              items={pipelineFilter === "all" ? projects : projects.filter((p) => (p.status || DEFAULT_PROJECT_STATUS) === pipelineFilter)}
              gapClass="gap-2"
              onReorder={reorderProjects}
              renderItem={(p, handle) => {
                const pEntries = entries.filter((e) => e.projectId === p.id);
                const sm = statusMeta(p.status || DEFAULT_PROJECT_STATUS);
                return (
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="w-full rounded-xl pl-1 pr-4 py-4 flex items-center justify-between gap-1">
                    {handle}
                    <span style={{ background: `${projectColour(p.id)}26`, color: projectColour(p.id) }} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mr-2">
                      <ProjectIcon category={p.category} size={24} color={projectColour(p.id)} />
                    </span>
                    <button onClick={() => setSelectedProject(p.id)} className="flex-1 min-w-0 text-left flex items-center justify-between gap-2">
                      <div
                        className="min-w-0 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/project-id", p.id); e.dataTransfer.effectAllowed = "copy"; }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="font-bold">{p.name}</div>
                          {p.category && (
                            <span style={{ background: COLORS.cardAlt, color: COLORS.muted, border: `1px solid ${COLORS.border}` }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {t[PROJECT_CATEGORIES.find((c) => c.key === p.category)?.labelKey] || p.category}
                            </span>
                          )}
                          <span style={{ background: `${sm.color}22`, color: sm.color, border: `1px solid ${sm.color}66` }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            {t[sm.labelKey]}
                          </span>
                        </div>
                        {(customerFor(p) || p.client) && (
                          <div style={{ color: COLORS.muted }} className="text-xs mt-0.5 flex items-center gap-1">
                            <User size={10} /> {customerFor(p)?.name || p.client}
                          </div>
                        )}
                        {p.address && (
                          <a href={mapsUrl(p.address)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: COLORS.accent }} className="text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={11} /> {p.address}
                          </a>
                        )}
                        <div style={{ color: COLORS.muted }} className="text-xs mt-1">{pEntries.length} {t.entriesLabelFmt}</div>
                      </div>
                      <ChevronRight size={18} color={COLORS.muted} />
                    </button>
                  </div>
                );
              }}
            />
            {projects.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm text-center mt-8">{t.noProjectsYet}</div>}
          </div>
        )}

        {tab === "reports" && (() => {
          // The day as the GAV reads it: the person's own entries, split into
          // Normal / Überstunden / Reisezeit against the contract day.
          const weekly = parseFloat(billing.weeklyHours || 0) || 0;
          const contractDaily = weekly > 0 ? weekly / 5 : 0;
          const todayMine = entries.filter((e) => e.date === todayKey() && e.userId === user?.uid);
          const split = splitDayHours(todayMine, contractDaily);
          const timeToday = todayMine.filter((e) => e.type === "time");
          const approved = timeToday.length > 0 && timeToday.every((e) => e.approvedBy);
          const personId = (canManage() && rapportPerson) || user?.uid;
          const personName = (team.members.find((m) => m.uid === personId) || {}).name || (personId === user?.uid ? profile.name : "") || "";
          const weekDates = weekOf(rapportWeekAnchor);
          const week = weekRows(entries, personId, weekDates, weekly);
          const shiftWeek = (n) => { const d = new Date(`${rapportWeekAnchor}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 7 * n); setRapportWeekAnchor(d.toISOString().slice(0, 10)); };
          const downloadCsv = () => {
            const csv = weekCsv(week, personName, { date: t.docDate, normal: t.hoursNormal, overtime: t.overtimeLabel, travel: t.hoursTravel, breaks: t.hoursBreaks, net: t.hoursTotal, total: t.hoursSum, target: t.hoursTarget, diff: t.hoursDiff });
            const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `woche-${(personName || "rapport").replace(/[^\w-]+/g, "_")}-${weekDates[0]}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          };
          const fmt = (x) => (Math.round(x * 100) / 100).toFixed(1);
          const HourLine = ({ label, value, strong }) => (
            <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ color: strong ? COLORS.text : COLORS.muted }} className={strong ? "text-sm font-bold" : "text-sm"}>{label}</span>
              <span style={{ color: strong ? COLORS.accent : COLORS.text }} className={strong ? "font-black text-lg" : "font-bold"}>{value}</span>
            </div>
          );
          const dayNames = [t.dayMon, t.dayTue, t.dayWed, t.dayThu, t.dayFri, t.daySat, t.daySun];
          return (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {[["daily", t.rapportDay], ["week", t.rapportWeek], ["monthly", t.rapportMonth]].map(([v, l]) => (
                <button key={v} data-rapport-view={v} onClick={() => setReportView(v)} style={{ background: reportView === v ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase">{l}</button>
              ))}
            </div>

            {reportView === "daily" && (
              <div data-tagesrapport style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.rapportTitleDay} · {todayKey()}</div>
                  <span data-approval style={{ color: approved ? COLORS.success : COLORS.muted, border: `1px solid ${approved ? COLORS.success : COLORS.border}` }} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0">{approved ? t.approvedAll : t.notApproved}</span>
                </div>
                {daily.projIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {daily.projIds.map((id) => <span key={id} style={{ background: COLORS.cardAlt, border: `1px solid ${projectColour(id)}66` }} className="px-2 py-0.5 rounded-full text-[11px] font-semibold">{projectName(id)}</span>)}
                  </div>
                )}
                <HourLine label={t.hoursNormal} value={fmt(split.normal)} />
                <HourLine label={t.overtimeLabel} value={fmt(split.overtime)} />
                <HourLine label={t.hoursTravel} value={fmt(split.travel)} />
                <HourLine label={t.hoursBreaks} value={`−${fmt(split.breaks)}`} />
                <HourLine label={`${t.hoursTotal}${split.target != null ? ` · ${t.hoursTarget} ${fmt(split.target)}` : ""}`} value={fmt(split.net)} strong />
                <div className="mt-2">
                  <Stat label={t.materialsLogged} value={daily.materials.length} color={COLORS.success} />
                  <Stat label={t.tripTrips} value={todayMine.filter((e) => e.type === "transport").length} color="#C68B4F" />
                  <Stat label={t.typePhoto} value={todayEntries.filter((e) => e.type === "photo").length} color="#7FA0C7" />
                  <Stat label={t.typeNote} value={todayEntries.filter((e) => e.type === "note").length} color={COLORS.muted} />
                </div>
                <button onClick={() => sendReportToSupervisor("daily", daily, todayEntries)} style={{ background: COLORS.accentDim }} className="w-full mt-3 py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                  <FileText size={15} /> {t.sendToSupervisor}
                </button>
              </div>
            )}

            {reportView === "week" && (
              <div data-woche style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button data-week-prev onClick={() => shiftWeek(-1)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-8 h-8 rounded-lg flex items-center justify-center"><ChevronLeft size={16} color={COLORS.muted} /></button>
                  <div data-week-label style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide text-center">{weekDates[0]} – {weekDates[6]}</div>
                  <button data-week-next onClick={() => shiftWeek(1)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-8 h-8 rounded-lg flex items-center justify-center"><ChevronRight size={16} color={COLORS.muted} /></button>
                </div>
                {canManage() && team.members.length > 1 && (
                  <select data-week-person value={personId || ""} onChange={(e) => setRapportPerson(e.target.value)} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-2 py-2 text-sm outline-none mb-2">
                    {team.members.map((m) => <option key={m.uid} value={m.uid}>{m.name || m.email || m.uid}</option>)}
                  </select>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">
                        <th className="text-left py-1">{t.docDate}</th><th className="text-right py-1">{t.hoursNormal}</th><th className="text-right py-1">{t.overtimeShort}</th><th className="text-right py-1">{t.hoursTravel}</th><th className="text-right py-1">{t.hoursBreaks}</th><th className="text-right py-1">{t.hoursTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.rows.map((r, i) => (
                        <tr key={r.date} data-week-row style={{ borderTop: `1px solid ${COLORS.border}`, color: r.net > 0 ? COLORS.text : COLORS.muted }}>
                          <td className="py-1.5"><span className="font-bold">{dayNames[i]}</span> <span style={{ color: COLORS.muted }}>{r.date.slice(8)}.{r.date.slice(5, 7)}.</span></td>
                          <td className="text-right tabular-nums">{fmt(r.normal)}</td><td className="text-right tabular-nums">{fmt(r.overtime)}</td><td className="text-right tabular-nums">{fmt(r.travel)}</td><td className="text-right tabular-nums">{fmt(r.breaks)}</td><td className="text-right tabular-nums font-bold">{fmt(r.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${COLORS.border}` }} className="font-bold">
                        <td className="py-1.5">{t.hoursSum}</td><td className="text-right tabular-nums">{fmt(week.total.normal)}</td><td className="text-right tabular-nums">{fmt(week.total.overtime)}</td><td className="text-right tabular-nums">{fmt(week.total.travel)}</td><td className="text-right tabular-nums">{fmt(week.total.breaks)}</td><td className="text-right tabular-nums" style={{ color: COLORS.accent }}>{fmt(week.total.net)}</td>
                      </tr>
                      {week.target != null && (
                        <tr style={{ color: COLORS.muted }}>
                          <td className="py-1">{t.hoursTarget} / {t.hoursDiff}</td><td colSpan={4}></td><td className="text-right tabular-nums" style={{ color: week.diff >= 0 ? COLORS.success : COLORS.amber }}>{fmt(week.target)} / {week.diff >= 0 ? "+" : ""}{fmt(week.diff)}</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
                {week.target == null && <div style={{ color: COLORS.muted }} className="text-[11px] mt-2">{t.hoursNotConfigured}</div>}
                <button data-week-csv onClick={downloadCsv} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full mt-3 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2"><Download size={14} /> {t.weekCsv}</button>
              </div>
            )}

            {reportView === "monthly" && (<>
            {(() => {
              const s = monthlyUnsent;
              const list = monthUnsent.entries;
              return (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3">{monthKey()}</div>
                  <Stat label={t.hoursWorked} value={s.hours.toFixed(1)} color={COLORS.accent} />
                  {s.breaks > 0 && <div style={{ color: COLORS.muted }} className="text-[11px] mt-1 mb-2 text-right">{t.breaksDeducted}: −{s.breaks.toFixed(1)} h</div>}
                  <Stat label={t.materialsLogged} value={s.materials.length} color={COLORS.success} />
                  <Stat label={t.toolsLogged} value={s.tools.length} color={COLORS.amber} />
                  <Stat label={t.sitesVisited} value={s.projIds.length} color="#7FA0C7" />
                  <div style={{ color: COLORS.muted }} className="text-xs mt-3 mb-1">{t.sitesLabel}: {s.projIds.map(projectName).join(", ") || "—"}</div>
                  {reportView === "monthly" && monthUnsent.alreadySent > 0 && (
                    <div style={{ color: COLORS.amber }} className="text-[11px] mb-1">{monthUnsent.alreadySent} {t.reportAlreadySentDaily}</div>
                  )}
                  <button onClick={() => sendReportToSupervisor("monthly", s, list)} style={{ background: COLORS.accentDim }} className="w-full mt-3 py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                    <FileText size={15} /> {t.sendToSupervisor}
                  </button>
                </div>
              );
            })()}
            </>)}

            {reportView !== "week" && (
              <>
            <div>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.entriesTitle}</div>
              <EntryGroups entries={reportView === "daily" ? todayEntries : monthUnsent.entries} projectName={projectName} t={t} emptyLabel={t.nothingLogged} onEditTime={openEditTime} onEditEntry={openEditEntry} onDelete={deleteEntryFn} />
            </div>
            <div>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.sentReports}</div>
              {sentReports.length === 0 ? (
                <div style={{ color: COLORS.muted }} className="text-sm">{t.noReportsYet}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sentReports.map((r) => (
                    <button key={r.id} onClick={() => setReportViewModal(r)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="w-full text-left rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{(r.period === "daily" ? t.daily : t.monthly)} · {r.periodLabel}</div>
                        <div style={{ color: COLORS.muted }} className="text-xs">
                          {reportFigures(r).hours}h · {t.reportSentTimes} {(r.sends || []).length || 1}×
                          {r.sentAt ? ` · ${t.reportLastSent} ${new Date(r.sentAt).toLocaleString(undefined, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
                          {r.editedAt ? ` · ${t.editedTag}` : ""}
                        </div>
                      </div>
                      <ChevronRight size={16} color={COLORS.muted} />
                    </button>
                  ))}
                </div>
              )}
            </div>
              </>
            )}
          </div>
          );
        })()}

        {tab === "team" && (() => {
          const roster = team.members;
          const openJobs = projects.filter((pr) => !["completed", "lost"].includes(pr.status || DEFAULT_PROJECT_STATUS));
          return (
            <div className="px-4 pb-24">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="font-black text-lg">{t.navTeam}</div>
                {isOwner() && (
                  <button onClick={() => openTeam()} style={{ background: COLORS.accent }} className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase">
                    {t.teamInviteBtn}
                  </button>
                )}
              </div>
              {roster.length === 0 && (
                <div style={{ color: COLORS.muted }} className="text-xs">{t.teamNoMembers}</div>
              )}
              <div className="flex flex-col gap-2">
                {roster.map((m) => {
                  const jobs = openJobs.filter((pr) => projectCrew(pr).includes(m.uid));
                  const todayProjects = assignments
                    .filter((a) => a.date === todayKey() && a.userId === m.uid)
                    .map((a) => projects.find((pr) => pr.id === a.projectId))
                    .filter(Boolean);
                  return (
                    <div
                      key={m.uid}
                      draggable={canManage()}
                      onDragStart={(e) => e.dataTransfer.setData("text/member-uid", m.uid)}
                      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                      className="rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate">{m.name || m.email || m.uid}</div>
                          <div style={{ color: COLORS.muted }} className="text-[10px] truncate">
                            {m.role === "owner" ? t.roleOwner : m.role === "supervisor" ? t.roleSupervisor : t.roleCrew}
                            {m.email && m.name ? ` · ${m.email}` : ""}
                          </div>
                        </div>
                        {todayProjects.length > 0 && (
                          <span className="shrink-0 flex flex-wrap justify-end gap-1 max-w-[50%]">
                            {todayProjects.map((tp) => (
                              <span key={tp.id} style={{ background: `${projectColour(tp.id)}22`, color: projectColour(tp.id), border: `1px solid ${projectColour(tp.id)}66` }} className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[9rem]">
                                {tp.name}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                      {/* Which jobs this person is attached to, and a one-tap
                          way to attach them to another without opening it. */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {jobs.map((pr) => (
                          <button
                            key={pr.id}
                            onClick={() => { setTab("projects"); setSelectedProject(pr.id); }}
                            style={{ background: COLORS.cardAlt, border: `1px solid ${projectColour(pr.id)}66`, color: COLORS.text }}
                            className="px-2 py-1 rounded-full text-[11px] font-semibold"
                          >
                            {pr.name}
                          </button>
                        ))}
                        {jobs.length === 0 && (
                          <span style={{ color: COLORS.muted }} className="text-[11px]">{t.crewNoJobs}</span>
                        )}
                      </div>
                      {isOwner() && m.role !== "owner" && m.uid !== user?.uid && (
                        removeConfirm === m.uid ? (
                          <div className="flex items-center gap-2 mt-2">
                            <span style={{ color: COLORS.danger }} className="text-[11px] font-bold">{t.teamRemoveConfirm}</span>
                            <button data-remove-yes onClick={() => removeMember(m.uid)} style={{ background: COLORS.danger }} className="px-2.5 py-1 rounded text-[11px] font-bold uppercase">{t.teamRemove}</button>
                            <button onClick={() => setRemoveConfirm(null)} style={{ color: COLORS.muted }} className="px-2 py-1 text-[11px] font-bold uppercase">{t.back}</button>
                          </div>
                        ) : (
                          <button data-remove-member onClick={() => setRemoveConfirm(m.uid)} style={{ color: COLORS.danger }} className="mt-2 text-[10px] font-bold uppercase flex items-center gap-1"><LogOut size={11} /> {t.teamRemove}</button>
                        )
                      )}
                      {canManage() && (
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) toggleProjectCrew(e.target.value, m.uid); e.target.value = ""; }}
                          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.muted }}
                          className="w-full mt-2 rounded-lg px-2 py-1.5 text-[11px] outline-none"
                        >
                          <option value="">{t.crewAddToJob}</option>
                          {openJobs.filter((pr) => !projectCrew(pr).includes(m.uid)).map((pr) => (
                            <option key={pr.id} value={pr.id}>{pr.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {tab === "transport" && (() => {
          const trips = entries
            .filter((e) => e.type === "transport" && (!transportFilter || e.projectId === transportFilter))
            .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
          const mk = monthKey();
          const month = trips.filter((e) => (e.date || "").startsWith(mk));
          const sum = (list, f) => Math.round(list.reduce((s, e) => s + (parseFloat(e[f]) || 0), 0) * 10) / 10;
          const byDay = {};
          trips.forEach((e) => { (byDay[e.date] = byDay[e.date] || []).push(e); });
          const jobIds = [...new Set(entries.filter((e) => e.type === "transport" && e.projectId).map((e) => e.projectId))];
          const driverName = (uid) => { const m = team?.members; if (!m || !uid) return ""; const r = Array.isArray(m) ? m.find((x) => x.uid === uid) : m[uid]; return r?.name || ""; };
          return (
            <div className="flex flex-col gap-4">
              <button data-trip-add onClick={() => openTrip()} style={{ background: COLORS.accent }} className="w-full py-3.5 rounded-xl font-bold uppercase text-sm flex items-center justify-center gap-2"><Truck size={18} /> {t.tripAdd}</button>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
                <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.thisMonth}</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[[t.tripTrips, String(month.length), COLORS.accent], [t.tripHours, sum(month, "hours").toFixed(1), COLORS.amber], ["km", String(sum(month, "km")), COLORS.success], [t.tripWasteKg, String(sum(month.filter((e) => e.loadKind === "waste"), "weightKg")), "#C68B4F"]].map(([l, v, c]) => (
                    <div key={l}><div style={{ color: c }} className="text-lg font-black leading-tight">{v}</div><div style={{ color: COLORS.muted }} className="text-[9px] uppercase">{l}</div></div>
                  ))}
                </div>
              </div>
              {jobIds.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setTransportFilter("")} style={{ background: !transportFilter ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="px-2.5 py-1 rounded-full text-[11px] font-bold">{t.tripAllJobs}</button>
                  {jobIds.map((id) => <button key={id} onClick={() => setTransportFilter(id)} style={{ background: transportFilter === id ? COLORS.accent : COLORS.card, border: `1px solid ${projectColour(id)}66` }} className="px-2.5 py-1 rounded-full text-[11px] font-bold">{projectName(id)}</button>)}
                </div>
              )}
              {trips.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm text-center py-6">{t.tripEmpty}</div>}
              {Object.keys(byDay).sort().reverse().map((day) => (
                <div key={day} className="flex flex-col gap-2">
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">{day}{day === todayKey() ? ` · ${t.navToday}` : ""}</div>
                  {byDay[day].map((e) => (
                    <div key={e.id} data-trip-row style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Truck size={14} color="#C68B4F" className="shrink-0" />
                        <span className="text-sm font-bold truncate">{e.from || "?"} → {e.to || "?"}</span>
                        <span style={{ color: COLORS.muted }} className="ml-auto text-xs shrink-0">{e.departTime}{e.arriveTime ? `–${e.arriveTime}` : ""}</span>
                      </div>
                      <div style={{ color: COLORS.muted }} className="text-[11px] flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{t[`vehicle_${e.vehicle}`] || e.vehicle}</span>
                        <span>{t[`load_${e.loadKind}`] || e.loadKind}{e.weightKg ? ` · ${e.weightKg} kg` : ""}</span>
                        {e.hours ? <span>{e.hours} h</span> : null}
                        {e.km ? <span>{e.km} km</span> : null}
                        {e.mulde ? <span>{t.tripMulde} {e.mulde} m³</span> : null}
                        {e.projectId && <span style={{ color: projectColour(e.projectId) }}>{projectName(e.projectId)}</span>}
                        {e.disposalSite && <span>→ {e.disposalSite}</span>}
                        {driverName(e.userId) && <span>{driverName(e.userId)}</span>}
                      </div>
                      {e.notes && <div className="text-xs">{e.notes}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
        {tab === "safety" && (
          <div className="flex flex-col gap-4">
            <button onClick={() => { setSosOpen(true); setCprStep(0); }} style={{ background: COLORS.danger }} className="w-full py-5 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-2">
              <Siren size={22} /> {t.sosButton}
            </button>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3 flex items-center gap-1"><Phone size={12} /> {t.emergencyNumbers}</div>
              <div className="grid grid-cols-2 gap-2">
                {[t.ambulance, t.police, t.fire, t.generalEmergency].map((label, i) => (
                  <a key={SWISS_EMERGENCY_NUMS[i]} href={`tel:${SWISS_EMERGENCY_NUMS[i]}`} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg py-3 text-center">
                    <div style={{ color: COLORS.danger }} className="text-2xl font-black">{SWISS_EMERGENCY_NUMS[i]}</div>
                    <div style={{ color: COLORS.muted }} className="text-xs">{label}</div>
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SAFETY_CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const active = safetyCat === cat.key;
                return (
                  <button key={cat.key} onClick={() => setSafetyCat(cat.key)} style={{ background: active ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-lg py-2 px-1 flex flex-col items-center gap-1">
                    <CatIcon size={16} color={active ? "#fff" : COLORS.muted} />
                    <span style={{ color: active ? "#fff" : COLORS.muted }} className="text-[10px] font-bold text-center leading-tight">{t[cat.labelKey]}</span>
                  </button>
                );
              })}
            </div>
            {(() => {
              const cat = SAFETY_CATEGORIES.find((c) => c.key === safetyCat) || SAFETY_CATEGORIES[0];
              const CatIcon = cat.icon;
              return (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-3 flex items-center gap-1"><CatIcon size={12} /> {t[cat.labelKey]}</div>
                  <div className="flex flex-col gap-3">
                    {cat.rules.map((r, i) => (
                      <div key={i}>
                        <div className="text-sm font-bold">{t[r + "T"]}</div>
                        <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">{t[r + "X"]}</div>
                      </div>
                    ))}
                  </div>
                  <a href={cat.url} target="_blank" rel="noreferrer" style={{ color: COLORS.accent, borderTop: `1px solid ${COLORS.border}` }} className="mt-3 pt-3 text-xs font-bold flex items-center gap-1">
                    {t.fullRulesLink} <ExternalLink size={12} />
                  </a>
                  <div style={{ color: COLORS.muted }} className="text-[10px] mt-2">{t.summaryDisclaimer}</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* The floating camera button is gone: it covered the dock and the
          bottom of every list on a phone. Photos are added from the job view. */}

      {/* The dock. Active jobs and pinned ones as a tray of tiles, the way a
          game keeps its characters along the bottom: always there, scroll
          sideways, drop things on them. It takes real height from the column
          rather than floating, so nothing ever scrolls underneath it. */}
      {membership && (() => {
        if (dockProjects.length === 0) return null;
        return (
          <div
            data-dock
            onDragOver={(e) => { if (Array.from(e.dataTransfer?.types || []).includes("text/project-id")) { e.preventDefault(); if (!dockDragOver) setDockDragOver(true); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDockDragOver(false); }}
            onDrop={(e) => { if (pinFromDrop(e.dataTransfer)) e.preventDefault(); setDockDragOver(false); }}
            style={{ background: dockDragOver ? `${COLORS.accent}14` : COLORS.card, borderTop: `1px solid ${dockDragOver ? COLORS.accent : COLORS.border}`, transition: "background 0.1s" }}
            className="shrink-0 relative z-20"
          >
            <div className="flex items-center gap-1 px-4 py-1">
              <button onClick={() => setDockOpenRemembered(!dockOpen)} className="flex-1 min-w-0 flex items-center gap-1.5 py-0.5 text-left">
                <MapPin size={11} color={COLORS.muted} />
                <span style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide font-bold truncate">
                  {dockDragOver ? t.dockDropProject : `${t.dockTitle} (${dockProjects.length})`}
                </span>
              </button>
              {/* One tap cycles the order; the word next to it says which. */}
              <button
                data-dock-sort
                onClick={cycleDockSort}
                title={t[`dockSort_${dockSort}`]}
                style={{ color: COLORS.muted, border: `1px solid ${COLORS.border}` }}
                className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              >
                <ArrowUpDown size={11} /> {t[`dockSort_${dockSort}`]}
              </button>
              <button onClick={() => setDockOpenRemembered(!dockOpen)} className="shrink-0 pl-1">
                <ChevronRight size={14} color={COLORS.muted} style={{ transform: dockOpen ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
              </button>
            </div>
            {dockOpen && (
              <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ WebkitOverflowScrolling: "touch" }}>
                {dockProjects.map((pr) => {
                  const col = projectColour(pr.id);
                  const over = dockOver === pr.id;
                  const pinned = pinnedIds.includes(pr.id);
                  const sm = statusMeta(pr.status || DEFAULT_PROJECT_STATUS);
                  const mats = entries.filter((e) => e.projectId === pr.id && (e.type === "material" || e.type === "tool")).length;
                  const crewN = projectCrew(pr).length;
                  return (
                    <div
                      key={pr.id}
                      data-dock-project={pr.id}
                      role="button"
                      tabIndex={0}
                      title={canManage() ? t.dockDropHint : pr.name}
                      onClick={() => { setTab("projects"); setSelectedProject(pr.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setTab("projects"); setSelectedProject(pr.id); } }}
                      onDragOver={(e) => { if (dockAccepts(e.dataTransfer)) { e.preventDefault(); if (!over) setDockOver(pr.id); } }}
                      onDragLeave={() => setDockOver(null)}
                      onDrop={(e) => { e.preventDefault(); setDockOver(null); dropOnProject(pr.id, e.dataTransfer); }}
                      style={{
                        background: over ? `${col}40` : `${col}1A`,
                        borderTop: `1px solid ${over ? col : col + "55"}`,
                        borderRight: `1px solid ${over ? col : col + "55"}`,
                        borderBottom: `1px solid ${over ? col : col + "55"}`,
                        borderLeft: `4px solid ${col}`,
                        transform: over ? "scale(1.04)" : "none",
                        transition: "transform 0.1s, background 0.1s",
                      }}
                      className="shrink-0 w-24 rounded-xl px-1.5 py-2 cursor-pointer select-none flex flex-col items-center gap-1 text-center"
                    >
                      {/* The tile is the picture. Status is the ring colour's
                          little dot; the name sits underneath, two lines at most. */}
                      <div style={{ background: `${col}2A`, border: `2px solid ${col}`, color: col }} className="relative w-14 h-14 rounded-2xl flex items-center justify-center" title={t[(PROJECT_CATEGORIES.find((c) => c.key === pr.category) || PROJECT_CATEGORIES[3]).labelKey]}>
                        <ProjectIcon category={pr.category} size={38} color={col} />
                        {pinned && (
                          <span style={{ background: COLORS.card, color: col }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"><Pin size={11} /></span>
                        )}
                        <span style={{ background: sm.color, border: `2px solid ${COLORS.card}` }} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full" title={t[sm.labelKey]} />
                      </div>
                      <div className="text-[11px] font-bold leading-tight w-full overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{pr.name}</div>
                      <div style={{ color: COLORS.muted }} className="flex items-center gap-1.5 text-[10px] tabular-nums">
                        <span className="flex items-center gap-0.5"><Users size={9} /> {crewN}</span>
                        <span className="flex items-center gap-0.5"><Package size={9} /> {mats}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* The phone's main navigation: four tabs and a «+» under the thumb, the
          way every site app on the market does it. Real height in the column
          like the dock above it, so nothing ever scrolls underneath. */}
      {membership && (
        <nav data-tab-bar style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.border}` }} className="lg:hidden shrink-0 grid grid-cols-5 items-end px-1 pt-1 pb-[max(6px,env(safe-area-inset-bottom))]">
          {[
            { id: "today", label: t.navToday, icon: Clock },
            { id: "projects", label: t.navSites, icon: MapPin },
            null,
            { id: "reports", label: t.navReports, icon: FileText },
            { id: "more", label: t.navMore, icon: Menu },
          ].map((it, idx) => {
            if (!it) {
              return (
                <button key="plus" data-quick-add-button onClick={() => setQuickAddOpen(true)} title={t.quickAddTitle} className="flex flex-col items-center justify-end pb-0.5">
                  <span style={{ background: COLORS.accent }} className="w-12 h-12 -mt-5 rounded-full flex items-center justify-center shadow-lg"><Plus size={24} color="#fff" /></span>
                </button>
              );
            }
            const Icon = it.icon;
            const active = it.id === "more" ? menuOpen : tab === it.id && !selectedProject;
            const onClick = it.id === "more" ? () => setMenuOpen(true) : () => { setTab(it.id); setSelectedProject(null); setMenuOpen(false); };
            return (
              <button key={it.id} data-tab={it.id} {...(it.id === "more" ? { "data-menu-button": true } : {})} onClick={onClick} style={{ color: active ? COLORS.accent : COLORS.muted }} className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold uppercase tracking-wide">
                <Icon size={20} color={active ? COLORS.accent : COLORS.muted} />
                <span className="truncate max-w-full">{it.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      </div>

      {/* No bottom bar on a phone any more: the hamburger in the header holds
          every tab, and the dock has the bottom edge to itself. */}

      {docEditor && (() => {
        const totals = documentTotals(docEditor);
        const isInvoice = docEditor.type === "invoice";
        const cur = billing.currency || "CHF";
        const setLine = (id, field, value) =>
          setDocEditor((s) => ({ ...s, lineItems: s.lineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li)) }));
        return (
          <Modal onClose={() => setDocEditor(null)} title={`${isInvoice ? t.invoiceLabel : t.quoteLabel} ${docEditor.number}`}>
            <div className="flex gap-2 mb-3">
              <div className="w-1/2">
                <div style={{ color: COLORS.muted }} className="text-[10px] uppercase mb-1">{t.docDate}</div>
                <input type="date" value={docEditor.date} onChange={(e) => setDocEditor((s) => ({ ...s, date: e.target.value }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-2 py-2 text-xs outline-none" />
              </div>
              {isInvoice && (
                <div className="w-1/2">
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase mb-1">{t.docDue}</div>
                  <input type="date" value={docEditor.dueDate} onChange={(e) => setDocEditor((s) => ({ ...s, dueDate: e.target.value }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-2 py-2 text-xs outline-none" />
                </div>
              )}
            </div>

            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.docLines}</div>
            <div className="flex flex-col gap-2 mb-3">
              {docEditor.lineItems.map((li) => (
                <div key={li.id} style={{ background: COLORS.card }} className="rounded-lg p-2">
                  <div className="flex gap-1.5 mb-1.5">
                    <input value={li.description} onChange={(e) => setLine(li.id, "description", e.target.value)} placeholder={t.docDescription} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 min-w-0 rounded px-2 py-1.5 text-xs outline-none" />
                    <button onClick={() => setDocEditor((s) => ({ ...s, lineItems: s.lineItems.filter((x) => x.id !== li.id) }))} style={{ color: COLORS.danger }} className="shrink-0 px-1"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex gap-1.5">
                    <input type="number" inputMode="decimal" value={li.qty} onChange={(e) => setLine(li.id, "qty", e.target.value)} placeholder={t.qtyPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/3 rounded px-2 py-1.5 text-xs outline-none" />
                    <input value={li.unit} onChange={(e) => setLine(li.id, "unit", e.target.value)} placeholder={t.unitPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/3 rounded px-2 py-1.5 text-xs outline-none" />
                    <input type="number" inputMode="decimal" step="0.05" value={li.unitPrice} onChange={(e) => setLine(li.id, "unitPrice", e.target.value)} placeholder={t.unitPriceLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/3 rounded px-2 py-1.5 text-xs outline-none" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setDocEditor((s) => ({ ...s, lineItems: [...s.lineItems, { id: uid(), description: "", qty: "1", unit: "", unitPrice: "" }] }))} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-2 rounded-lg text-xs font-bold mb-3 flex items-center justify-center gap-1">
              <Plus size={13} /> {t.docAddLine}
            </button>

            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.docVat}</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {VAT_RATES.map((v) => (
                <button key={v.key} onClick={() => setDocEditor((s) => ({ ...s, vatRate: v.rate }))} style={{ background: docEditor.vatRate === v.rate ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                  {t[v.labelKey]} {v.rate > 0 ? `${v.rate}%` : ""}
                </button>
              ))}
            </div>

            <div style={{ background: COLORS.card }} className="rounded-lg p-3 mb-3 text-sm flex flex-col gap-1">
              <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.docNet}</span><span>{totals.net.toFixed(2)}</span></div>
              <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.docVat} {totals.rate}%</span><span>{totals.vat.toFixed(2)}</span></div>
              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="flex justify-between pt-1 mt-1 font-bold"><span>{t.docTotal} {cur}</span><span>{totals.gross.toFixed(2)}</span></div>
            </div>

            {(() => {
              const st = documentState(docEditor, todayKey());
              const statusSet = DOC_STATUSES[docEditor.type] || DOC_STATUSES.invoice;
              // Paid and partial are derived from the amount received, so they
              // are shown but not directly selectable.
              const selectable = statusSet.filter((s) => !["paid", "partial"].includes(s.key));
              return (
                <>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.docStatusLabel}</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectable.map((s) => {
                      const active = (docEditor.status || "draft") === s.key;
                      return (
                        <button key={s.key} onClick={() => setDocEditor((d) => ({ ...d, status: s.key }))} style={{ background: active ? `${s.color}33` : COLORS.cardAlt, border: `1px solid ${active ? s.color : COLORS.border}`, color: active ? s.color : COLORS.text }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                          {t[s.labelKey]}
                        </button>
                      );
                    })}
                  </div>

                  {isInvoice && (docEditor.status || "draft") !== "draft" && (
                    <>
                      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.paymentTitle}</div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number" inputMode="decimal" step="0.05"
                          value={docEditor.paidAmount || ""}
                          onChange={(e) => setDocEditor((d) => ({ ...d, paidAmount: e.target.value }))}
                          placeholder={t.paidAmountLabel}
                          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                          className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none"
                        />
                        <input
                          type="date"
                          value={docEditor.paidDate || ""}
                          onChange={(e) => setDocEditor((d) => ({ ...d, paidDate: e.target.value }))}
                          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                          className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setDocEditor((d) => ({ ...d, paidAmount: String(documentTotals(d).gross), paidDate: d.paidDate || todayKey() }))}
                        style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                        className="w-full py-2 rounded-lg text-xs font-bold uppercase mb-2"
                      >
                        {t.markPaidBtn}
                      </button>
                      <div style={{ background: COLORS.card }} className="rounded-lg p-3 mb-3 text-sm flex items-center justify-between">
                        <span style={{ color: COLORS.muted }}>{st.overdue ? t.overdueLabel : t.outstandingLabel}</span>
                        <span style={{ color: st.outstanding === 0 ? COLORS.success : st.overdue ? COLORS.danger : COLORS.text }} className="font-bold">
                          {money(st.outstanding)}
                        </span>
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            <textarea value={docEditor.notes} onChange={(e) => setDocEditor((s) => ({ ...s, notes: e.target.value }))} placeholder={t.notesLabel} rows={2} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-none" />

            {isInvoice && validateBillingProfile(billing).length > 0 && (
              <button onClick={() => { setBillingDraft({ ...billing }); setBillingModalOpen(true); }} style={{ background: `${COLORS.amber}22`, border: `1px solid ${COLORS.amber}66`, color: COLORS.amber }} className="w-full py-2.5 rounded-lg text-xs font-bold mb-3">
                {t.qrMissingBilling}
              </button>
            )}

            <button onClick={saveDocument} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm mb-2">{t.saveLabel}</button>
            {docEditor.id && (
              <div className="flex gap-2">
                <button onClick={() => printDocument(docEditor)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5">
                  <Printer size={13} /> {t.savePdfBtn}
                </button>
                {!isInvoice && (
                  <button onClick={() => convertQuoteToInvoice(docEditor)} style={{ background: COLORS.success, color: "#12210A" }} className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase">
                    {t.convertToInvoice}
                  </button>
                )}
              </div>
            )}
            {docEditor.id && (
              <button onClick={() => deleteDocument(docEditor.id)} style={{ color: COLORS.danger }} className="w-full py-3 text-xs font-bold uppercase">{t.deleteLabel}</button>
            )}
          </Modal>
        );
      })()}

      {billingModalOpen && billingDraft && (
        <Modal onClose={() => setBillingModalOpen(false)} title={t.billingTitle}>
          <div style={{ color: COLORS.muted }} className="text-xs mb-3 leading-relaxed">{t.billingHint}</div>
          {[
            ["companyName", t.billingCompany],
            ["street", t.billingStreet],
            ["buildingNumber", t.billingBuilding],
            ["postalCode", t.billingPostal],
            ["town", t.billingTown],
            ["vatNumber", t.vatNumberLabel],
          ].map(([f, label]) => (
            <input key={f} value={billingDraft[f] || ""} onChange={(e) => setBillingDraft((s) => ({ ...s, [f]: e.target.value }))} placeholder={label} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          ))}
          <input
            value={billingDraft.iban || ""}
            onChange={(e) => setBillingDraft((s) => ({ ...s, iban: e.target.value }))}
            placeholder="IBAN (CH…)"
            style={{
              background: COLORS.shell,
              border: `1px solid ${billingDraft.iban && !isSwissIban(billingDraft.iban) ? COLORS.danger : COLORS.border}`,
              color: COLORS.text,
            }}
            className="w-full rounded-lg px-3 py-2 text-sm mb-1 outline-none"
          />
          {billingDraft.iban && !isSwissIban(billingDraft.iban) && (
            <div style={{ color: COLORS.danger }} className="text-[10px] mb-2">{t.qrErrIban}</div>
          )}
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mt-3 mb-1.5">{t.paymentDaysLabel}</div>
          <input type="number" value={billingDraft.paymentDays || ""} onChange={(e) => setBillingDraft((s) => ({ ...s, paymentDays: e.target.value }))} placeholder="30" style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none" />
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.costingTitle}</div>
          <div className="flex gap-2 mb-1">
            <input
              type="number" inputMode="decimal" step="0.05"
              value={billingDraft.labourRate || ""}
              onChange={(e) => setBillingDraft((s) => ({ ...s, labourRate: e.target.value }))}
              placeholder={t.labourRateLabel}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-2/3 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <input
              value={billingDraft.currency ?? "CHF"}
              onChange={(e) => setBillingDraft((s) => ({ ...s, currency: e.target.value }))}
              placeholder="CHF"
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-1/3 rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
          <div style={{ color: COLORS.muted }} className="text-[10px] mb-3 leading-relaxed">{t.labourRateHint}</div>
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.hoursSettings}</div>
          <div className="flex gap-2 mb-1">
            <input
              type="number" inputMode="decimal" step="0.5"
              value={billingDraft.weeklyHours || ""}
              onChange={(e) => setBillingDraft((s) => ({ ...s, weeklyHours: e.target.value }))}
              placeholder={t.weeklyHoursLabel}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <input
              type="number" inputMode="numeric"
              value={billingDraft.holidayDays || ""}
              onChange={(e) => setBillingDraft((s) => ({ ...s, holidayDays: e.target.value }))}
              placeholder={t.holidayDaysLabel}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
          <div style={{ color: COLORS.muted }} className="text-[10px] mb-3 leading-relaxed">{t.hoursSettingsHint}</div>
          <button onClick={saveBilling} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
        </Modal>
      )}

      {companyMigration && (
        <Modal onClose={() => setCompanyMigration(null)} title={t.migrateTitle}>
          {companyMigration.result ? (
            <>
              <div style={{ color: COLORS.success }} className="text-sm mb-3">{t.migrateDone}</div>
              <div style={{ background: COLORS.card }} className="rounded-lg p-3 text-xs flex flex-col gap-1 mb-3">
                {Object.entries(companyMigration.result).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span style={{ color: COLORS.muted }}>{k}</span><span>{v}</span></div>
                ))}
              </div>
              <div style={{ color: COLORS.muted }} className="text-[10px] mb-3 leading-relaxed">{t.migrateKeptOriginal}</div>
              <button onClick={() => window.location.reload()} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.doneLabel}</button>
            </>
          ) : (
            <>
              <div style={{ color: COLORS.muted }} className="text-xs mb-3 leading-relaxed">{t.migrateHint}</div>
              <div style={{ background: COLORS.card }} className="rounded-lg p-3 text-xs flex flex-col gap-1 mb-4">
                <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.navProjects}</span><span>{companyMigration.summary.projects}</span></div>
                <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.entriesTitle}</span><span>{companyMigration.summary.entries}</span></div>
                <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.navCustomers}</span><span>{companyMigration.summary.customers}</span></div>
                <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.docLines}</span><span>{companyMigration.summary.documents}</span></div>
                <div className="flex justify-between"><span style={{ color: COLORS.muted }}>{t.photoLabel} / {t.libraryTab}</span><span>{companyMigration.summary.otherDocs}</span></div>
              </div>
              <button
                onClick={runCompanyMigration}
                disabled={companyMigration.busy}
                style={{ background: COLORS.accent, opacity: companyMigration.busy ? 0.6 : 1 }}
                className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
              >
                {companyMigration.busy ? <Loader2 size={16} className="animate-spin" /> : <ClipboardPaste size={15} />}
                {t.migrateBtn}
              </button>
              <button onClick={() => setCompanyMigration(null)} style={{ color: COLORS.muted }} className="w-full py-3 text-xs font-bold uppercase">{t.legacyImportSkip}</button>
            </>
          )}
        </Modal>
      )}

      {rapportModal && (() => {
        const pr = projects.find((x) => x.id === rapportModal.projectId);
        const cust = pr ? customers.find((c) => c.id === pr.customerId) : null;
        return (
          <Modal onClose={() => setRapportModal(null)} title={t.rapportTitle}>
            <div style={{ background: COLORS.card }} className="rounded-lg p-3 mb-3">
              <div className="text-sm font-bold">{pr ? pr.name : ""}</div>
              <div style={{ color: COLORS.muted }} className="text-[11px]">
                {rapportModal.date}{cust ? " · " + cust.name : ""}
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="mt-2 pt-2 flex justify-between text-sm">
                <span style={{ color: COLORS.muted }}>{t.hoursWorked}</span>
                <span className="font-bold">{rapportModal.hours.toFixed(1)} h</span>
              </div>
              {rapportModal.lines.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {rapportModal.lines.map((li, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate">{li.description}</span>
                      <span style={{ color: COLORS.muted }} className="shrink-0">{li.qty} {li.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={rapportModal.note}
              onChange={(e) => setRapportModal((r) => ({ ...r, note: e.target.value }))}
              placeholder={t.rapportNotePlaceholder}
              rows={2}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-none"
            />

            <input
              value={rapportModal.signerName}
              onChange={(e) => setRapportModal((r) => ({ ...r, signerName: e.target.value }))}
              placeholder={t.sigNameLabel}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
            />

            <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.sigHere}</div>
            <SignaturePad onChange={(sig) => setRapportModal((r) => ({ ...r, signature: sig }))} t={t} />

            <div style={{ color: COLORS.muted }} className="text-[10px] mb-3 leading-relaxed">{t.sigLockNote}</div>

            <button
              onClick={saveRapport}
              disabled={rapportModal.busy}
              style={{ background: COLORS.accent, opacity: rapportModal.busy ? 0.6 : 1 }}
              className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
            >
              {rapportModal.busy ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={15} />}
              {t.sigSaveBtn}
            </button>
          </Modal>
        );
      })()}

      {assignModal && canManage() && (() => {
        const date = assignModal.date;
        const openProjects = projects.filter((p) => !["completed", "lost"].includes(p.status || DEFAULT_PROJECT_STATUS));
        const dayLeave = leaveRequests.filter((r) => r.date === date);
        return (
          <Modal onClose={() => setAssignModal(null)} title={`${t.schedTitle} · ${date}`}>
            {team.members.length === 0 ? (
              <div style={{ color: COLORS.muted }} className="text-xs mb-3">{t.schedNoTeam}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {team.members.map((m) => {
                  const current = assignments.find((a) => a.date === date && a.userId === m.uid);
                  const away = dayLeave.find((r) => r.userId === m.uid);
                  return (
                    <div key={m.uid} style={{ background: COLORS.card }} className="rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold truncate">{m.name || m.email || m.uid}</div>
                        {away && (
                          <span style={{ background: `${COLORS.amber}22`, color: COLORS.amber, border: `1px solid ${COLORS.amber}66` }} className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {t[`leave${(away.type || "other").charAt(0).toUpperCase()}${(away.type || "other").slice(1)}`] || t.leaveOther}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {openProjects.map((pr) => {
                          const active = current && current.projectId === pr.id;
                          return (
                            <button
                              key={pr.id}
                              onClick={() => toggleAssignment(date, m.uid, pr.id)}
                              style={{
                                background: active ? "#6FB3D933" : COLORS.cardAlt,
                                border: `1px solid ${active ? "#6FB3D9" : COLORS.border}`,
                                color: active ? "#6FB3D9" : COLORS.text,
                              }}
                              className="px-2.5 py-1.5 rounded-full text-xs font-bold"
                            >
                              {pr.name}
                            </button>
                          );
                        })}
                        {openProjects.length === 0 && (
                          <div style={{ color: COLORS.muted }} className="text-xs">{t.noProjectsYet}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => { setAssignModal(null); openDay(date); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full mt-4 py-2.5 rounded-lg text-xs font-bold uppercase">
              {t.dayJournalHeading}
            </button>
          </Modal>
        );
      })()}

      {hoursModalOpen && (
        <Modal onClose={() => setHoursModalOpen(false)} title={t.hoursDetailTitle}>
          {!billing.weeklyHours ? (
            <div style={{ color: COLORS.amber }} className="text-xs mb-3 leading-relaxed">{t.hoursNotConfigured}</div>
          ) : null}
          <div className="flex flex-col gap-2">
            {team.members.map((m) => {
              const year = hoursBalance(m.uid, { from: `${new Date().getFullYear()}-01-01` });
              return (
                <div key={m.uid} style={{ background: COLORS.card }} className="rounded-lg p-3">
                  <div className="text-sm font-semibold mb-2 truncate">{m.name || m.email || m.uid}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span style={{ color: COLORS.muted }}>{t.hoursWorked}</span>
                    <span className="text-right">{year.workedHours.toFixed(1)} h</span>
                    <span style={{ color: COLORS.muted }}>{t.hoursExpected}</span>
                    <span className="text-right">{year.configured ? `${year.expected.toFixed(1)} h` : "—"}</span>
                    <span style={{ color: COLORS.muted }}>{t.overtimeLabel}</span>
                    <span className="text-right font-bold" style={{ color: year.overtime > 0 ? COLORS.amber : year.overtime < 0 ? COLORS.danger : COLORS.text }}>
                      {year.configured ? `${year.overtime > 0 ? "+" : ""}${year.overtime.toFixed(1)} h` : "—"}
                    </span>
                    <span style={{ color: COLORS.muted }}>{t.holidayTaken}</span>
                    <span className="text-right">{year.leaveTaken} {t.daysShort}</span>
                    <span style={{ color: COLORS.muted }}>{t.holidayLeft}</span>
                    <span className="text-right font-bold" style={{ color: year.holidayLeft !== null && year.holidayLeft < 0 ? COLORS.danger : COLORS.text }}>
                      {year.holidayLeft !== null ? `${year.holidayLeft} ${t.daysShort}` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ color: COLORS.muted }} className="text-[10px] mt-3 leading-relaxed">{t.hoursFootnote}</div>
        </Modal>
      )}

      {teamModalOpen && (
        <Modal onClose={() => setTeamModalOpen(false)} title={t.teamTitle}>
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.teamMembers} ({team.members.length})</div>
          <div className="flex flex-col gap-1.5 mb-4">
            {team.members.map((m) => (
              <div key={m.uid} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">{m.name || m.email || m.uid}</div>
                  {m.email && m.name && <div style={{ color: COLORS.muted }} className="text-[10px] truncate">{m.email}</div>}
                </div>
                <span style={{ background: m.role === "owner" ? `${COLORS.accent}22` : COLORS.cardAlt, color: m.role === "owner" ? COLORS.accent : COLORS.muted, border: `1px solid ${COLORS.border}` }} className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {m.role === "owner" ? t.roleOwner : m.role === "supervisor" ? t.roleSupervisor : t.roleCrew}
                </span>
              </div>
            ))}
          </div>

          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.teamInvites}</div>
          <div style={{ color: COLORS.muted }} className="text-[10px] mb-2 leading-relaxed">{t.teamInviteHint}</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {team.invites.map((i) => (
              <div key={i.code} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-mono tracking-widest">{i.code}</div>
                  <div style={{ color: COLORS.muted }} className="text-[10px]">{t.teamExpires} {new Date(i.expiresAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { navigator.clipboard?.writeText(i.code); showToast(t.copyBtn); }} style={{ color: COLORS.muted }}><Copy size={14} /></button>
                  <button onClick={() => dropInvite(i.code)} style={{ color: COLORS.danger }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {team.invites.length === 0 && <div style={{ color: COLORS.muted }} className="text-xs">{t.teamNoInvites}</div>}
          </div>
          <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.inviteRoleLabel}</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => makeInvite("crew")} style={{ background: COLORS.accent }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1.5">
              <Plus size={14} /> {t.roleCrew}
            </button>
            <button onClick={() => makeInvite("supervisor")} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.accent}`, color: COLORS.accent }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1.5">
              <Plus size={14} /> {t.roleSupervisor}
            </button>
          </div>
        </Modal>
      )}

      {legacyImport && (
        <Modal onClose={() => setLegacyImport(null)} title={t.legacyImportTitle}>
          <div style={{ color: COLORS.muted }} className="text-xs mb-3 leading-relaxed">{t.legacyImportHint}</div>
          <div style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 text-sm mb-4">
            {legacyImport.docs.length} {t.legacyImportCount}
          </div>
          <button
            onClick={runLegacyImport}
            disabled={legacyImport.busy}
            style={{ background: COLORS.accent, opacity: legacyImport.busy ? 0.6 : 1 }}
            className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
          >
            {legacyImport.busy ? <Loader2 size={16} className="animate-spin" /> : <ClipboardPaste size={15} />}
            {t.legacyImportBtn}
          </button>
          <button onClick={() => setLegacyImport(null)} style={{ color: COLORS.muted }} className="w-full py-3 text-xs font-bold uppercase">{t.legacyImportSkip}</button>
        </Modal>
      )}

      {selectedCustomer && (() => {
        const c = customers.find((x) => x.id === selectedCustomer);
        if (!c) return null;
        const jobs = projects.filter((p) => p.customerId === c.id);
        const contacts = c.contacts || [];
        return (
          <Modal onClose={() => setSelectedCustomer(null)} title={c.name}>
            {c.company && <div style={{ color: COLORS.muted }} className="text-sm -mt-2 mb-3">{c.company}</div>}

            <div className="grid grid-cols-4 gap-2 mb-4">
              {c.phone ? (
                <a href={telHref(c.phone)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg flex flex-col items-center gap-1">
                  <Phone size={15} color={COLORS.success} /><span className="text-[10px] font-bold">{t.callLabel}</span>
                </a>
              ) : <div />}
              {c.phone ? (
                <a href={waHref(c.phone)} target="_blank" rel="noreferrer" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg flex flex-col items-center gap-1">
                  <MessageSquare size={15} color="#25D366" /><span className="text-[10px] font-bold">WhatsApp</span>
                </a>
              ) : <div />}
              {c.email ? (
                <a href={`mailto:${c.email}`} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg flex flex-col items-center gap-1">
                  <Mail size={15} color="#B48EAD" /><span className="text-[10px] font-bold">{t.emailLabel}</span>
                </a>
              ) : <div />}
              {c.address ? (
                <a href={mapsUrl(c.address)} target="_blank" rel="noreferrer" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg flex flex-col items-center gap-1">
                  <MapPin size={15} color={COLORS.accent} /><span className="text-[10px] font-bold">{t.routeLabel}</span>
                </a>
              ) : <div />}
            </div>

            {(c.phone || c.email || c.address) && (
              <div style={{ background: COLORS.card }} className="rounded-lg p-3 mb-3 text-xs flex flex-col gap-1">
                {c.phone && <div style={{ color: COLORS.muted }}>{c.phone}</div>}
                {c.email && <div style={{ color: COLORS.muted }} className="break-all">{c.email}</div>}
                {c.address && <div style={{ color: COLORS.muted }}>{c.address}</div>}
              </div>
            )}
            {c.notes && <div style={{ background: COLORS.card }} className="rounded-lg p-3 mb-3 text-xs whitespace-pre-wrap">{c.notes}</div>}

            <div className="flex gap-2 mb-4">
              <button onClick={() => openCustomerForm(c)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">{t.editLabel}</button>
              <button onClick={() => openContactForm(c.id)} style={{ background: COLORS.accent }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">{t.logContact}</button>
            </div>

            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.jobsLabel} ({jobs.length})</div>
            {jobs.length === 0 ? (
              <div style={{ color: COLORS.muted }} className="text-xs mb-4">{t.noJobsForCustomer}</div>
            ) : (
              <div className="flex flex-col gap-1.5 mb-4">
                {jobs.map((p) => {
                  const sm = statusMeta(p.status || DEFAULT_PROJECT_STATUS);
                  return (
                    <button key={p.id} onClick={() => { setSelectedCustomer(null); setTab("projects"); setSelectedProject(p.id); }} style={{ background: COLORS.card }} className="w-full text-left rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <span className="text-sm truncate">{p.name}</span>
                      <span style={{ background: `${sm.color}22`, color: sm.color, border: `1px solid ${sm.color}66` }} className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t[sm.labelKey]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.contactHistory} ({contacts.length})</div>
            {contacts.length === 0 ? (
              <div style={{ color: COLORS.muted }} className="text-xs">{t.noContactsYet}</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {contacts.map((k) => {
                  const km = contactKindMeta(k.kind);
                  const KIcon = km.icon;
                  const overdue = k.followUp && k.followUp <= todayKey();
                  return (
                    <div key={k.id} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 flex items-start gap-2">
                      <KIcon size={13} color={km.color} className="mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm break-words">{k.note}</div>
                        <div style={{ color: COLORS.muted }} className="text-[10px] mt-0.5">
                          {new Date(k.at).toLocaleDateString()} · {t[km.labelKey]}
                          {k.followUp && (
                            <span style={{ color: overdue ? COLORS.amber : COLORS.muted }} className="font-bold"> · {t.followUpLabel} {k.followUp}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteContact(c.id, k.id)} style={{ color: COLORS.danger }} className="shrink-0"><Trash2 size={12} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </Modal>
        );
      })()}

      {customerForm && (
        <Modal onClose={() => setCustomerForm(null)} title={customerForm.id ? t.editCustomer : t.newCustomer}>
          {[
            ["name", t.customerNameLabel],
            ["company", t.companyLabel],
            ["phone", t.phoneLabel],
            ["email", t.emailLabel],
            ["address", t.addressLabel],
          ].map(([field, label]) => (
            <input
              key={field}
              value={customerForm[field] || ""}
              onChange={(e) => setCustomerForm((s) => ({ ...s, [field]: e.target.value }))}
              placeholder={label}
              type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
            />
          ))}
          <textarea
            value={customerForm.notes || ""}
            onChange={(e) => setCustomerForm((s) => ({ ...s, notes: e.target.value }))}
            placeholder={t.notesLabel}
            rows={3}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-none"
          />
          <button onClick={submitCustomer} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
          {customerForm.id && (
            <button onClick={() => deleteCustomer(customerForm.id)} style={{ color: COLORS.danger }} className="w-full py-3 text-xs font-bold uppercase">{t.deleteLabel}</button>
          )}
        </Modal>
      )}

      {contactForm && (
        <Modal onClose={() => setContactForm(null)} title={t.logContact}>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CONTACT_KINDS.map((k) => {
              const active = contactForm.kind === k.key;
              const KIcon = k.icon;
              return (
                <button key={k.key} onClick={() => setContactForm((s) => ({ ...s, kind: k.key }))} style={{ background: active ? `${k.color}33` : COLORS.cardAlt, border: `1px solid ${active ? k.color : COLORS.border}`, color: active ? k.color : COLORS.text }} className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <KIcon size={12} /> {t[k.labelKey]}
                </button>
              );
            })}
          </div>
          <textarea
            value={contactForm.note}
            onChange={(e) => setContactForm((s) => ({ ...s, note: e.target.value }))}
            placeholder={t.contactNotePlaceholder}
            rows={4}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-none"
          />
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.followUpLabel}</div>
          <input
            type="date"
            value={contactForm.followUp}
            onChange={(e) => setContactForm((s) => ({ ...s, followUp: e.target.value }))}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none"
          />
          <button onClick={submitContact} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
        </Modal>
      )}

      {langPickerOpen && (
        <Modal onClose={() => setLangPickerOpen(false)} title="Language / Sprache / Langue">
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => changeLang(l.code)} style={{ background: lang === l.code ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-3 rounded-lg text-sm font-semibold">
                {l.label}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {profileModalOpen && profileDraft && (
        <Modal onClose={() => setProfileModalOpen(false)} title={t.profileTitle}>
          <div className="flex flex-col gap-2">
            <input value={profileDraft.name} onChange={(e) => setProfileDraft((s) => ({ ...s, name: e.target.value }))} placeholder={t.yourName} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.phone} onChange={(e) => setProfileDraft((s) => ({ ...s, phone: e.target.value }))} placeholder={t.yourPhone} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-2 pt-3">{t.emergencyContact}</div>
            <input value={profileDraft.contactName} onChange={(e) => setProfileDraft((s) => ({ ...s, contactName: e.target.value }))} placeholder={t.contactName} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.contactRelationship} onChange={(e) => setProfileDraft((s) => ({ ...s, contactRelationship: e.target.value }))} placeholder={t.contactRelationship} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.contactPhone} onChange={(e) => setProfileDraft((s) => ({ ...s, contactPhone: e.target.value }))} placeholder={t.contactPhone} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-2 pt-3">{t.supervisorContactHeading}</div>
            <input value={profileDraft.supervisorName} onChange={(e) => setProfileDraft((s) => ({ ...s, supervisorName: e.target.value }))} placeholder={t.supervisorNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.supervisorEmail} onChange={(e) => setProfileDraft((s) => ({ ...s, supervisorEmail: e.target.value }))} placeholder={t.supervisorEmailLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={profileDraft.supervisorPhone} onChange={(e) => setProfileDraft((s) => ({ ...s, supervisorPhone: e.target.value }))} placeholder={t.supervisorPhoneLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-2 pt-3">{t.webhookLabel}</div>
            <input value={profileDraft.webhookUrl} onChange={(e) => setProfileDraft((s) => ({ ...s, webhookUrl: e.target.value }))} placeholder={t.webhookPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div style={{ color: COLORS.muted }} className="text-[10px]">{t.webhookHint}</div>
            <button onClick={saveProfileInfo} style={{ background: COLORS.accent }} className="w-full mt-3 py-3 rounded-lg font-bold uppercase text-sm">{t.saveProfile}</button>
            {isOwner() && (
              <>
                <button
                  onClick={() => { setProfileModalOpen(false); setBillingDraft({ ...billing }); setBillingModalOpen(true); }}
                  style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                  className="w-full mt-2 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2"
                >
                  <CreditCard size={14} /> {t.billingTitle}
                </button>
                <button
                  onClick={() => { setProfileModalOpen(false); openTeam(); }}
                  style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                  className="w-full mt-2 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2"
                >
                  <User size={14} /> {t.teamTitle}
                </button>
              </>
            )}
            <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="mt-4 pt-3">
              <div style={{ color: COLORS.muted }} className="text-[11px] mb-2 break-all">{t.signedInAs} {user?.email}</div>
              <button onClick={doSignOut} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.danger }} className="w-full py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2">
                <LogOut size={14} /> {t.signOut}
              </button>
              <div data-app-version style={{ color: COLORS.muted }} className="mt-4 text-center text-[10px]">{t.versionLabel} {SHELL_BUILD}</div>
          <button data-force-reload onClick={forceReload} style={{ color: COLORS.muted, border: `1px solid ${COLORS.border}` }} className="w-full mt-2 py-2 rounded-lg text-[11px] font-bold uppercase">{t.forceReloadBtn}</button>
          <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.muted }} className="block w-full mt-3 text-center text-[10px] underline">{t.privacyLink}</a>
            </div>

            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-4 pt-3 flex items-center gap-1"><CreditCard size={12} /> {t.profileInsurance}</div>
            <div className="flex flex-col gap-1.5">
              {insuranceCards.length === 0 && <div style={{ color: COLORS.muted }} className="text-xs">{t.noDocsYet}</div>}
              {insuranceCards.map((c) => (
                <button key={c.id} onClick={() => openInsuranceForm(c)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full text-left rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{c.label || c.provider}</div>
                    <div style={{ color: COLORS.muted }} className="text-xs">{c.provider}{c.policyNumber ? ` · ${c.policyNumber}` : ""}</div>
                  </div>
                  <ChevronRight size={16} color={COLORS.muted} />
                </button>
              ))}
              <button onClick={() => openInsuranceForm(null)} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} /> {t.addInsuranceCard}</button>
            </div>

            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-4 pt-3 flex items-center gap-1"><Award size={12} /> {t.profileCertificates}</div>
            <div className="flex flex-col gap-1.5">
              {certificates.length === 0 && <div style={{ color: COLORS.muted }} className="text-xs">{t.noDocsYet}</div>}
              {certificates.map((c) => {
                const expired = c.expiryDate && c.expiryDate < todayKey();
                return (
                  <button key={c.id} onClick={() => openCertForm(c)} style={{ background: COLORS.cardAlt, border: `1px solid ${expired ? COLORS.danger : COLORS.border}` }} className="w-full text-left rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{c.title}</div>
                      <div style={{ color: expired ? COLORS.danger : COLORS.muted }} className="text-xs">{c.issuer}{c.expiryDate ? ` · ${expired ? t.expiredLabel + " " : ""}${c.expiryDate}` : ""}</div>
                    </div>
                    <ChevronRight size={16} color={COLORS.muted} />
                  </button>
                );
              })}
              <button onClick={() => openCertForm(null)} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}`, color: COLORS.accent }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} /> {t.addCertificate}</button>
            </div>

            <div style={{ color: COLORS.muted, borderTop: `1px solid ${COLORS.border}` }} className="text-xs uppercase tracking-wide mt-4 pt-3">{t.backupTitle}</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={openBackupExport} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg text-xs font-bold">{t.exportBackup}</button>
              <button onClick={openBackupImport} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-2.5 rounded-lg text-xs font-bold">{t.importBackupBtn}</button>
            </div>
          </div>
        </Modal>
      )}

      {backupModal === "export" && (
        <Modal onClose={() => setBackupModal(null)} title={t.exportBackup}>
          <div className="flex flex-col gap-3">
            <button onClick={downloadFullBackup} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
              <FileText size={15} /> {t.backupFullBtn}
            </button>
            <div style={{ color: COLORS.muted }} className="text-[10px] leading-relaxed">{t.backupFullHint}</div>
            <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="pt-3" />
            <div style={{ color: COLORS.muted }} className="text-xs">{t.backupHint}</div>
            <textarea
              ref={backupTextareaRef}
              readOnly
              value={backupCodeOutput}
              rows={6}
              onFocus={(e) => e.target.select()}
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none font-mono"
            />
            <div style={{ color: COLORS.muted }} className="text-[10px]">{backupCodeOutput.length.toLocaleString()} {t.charactersLabel}</div>
            <button onClick={copyBackupCode} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"><Copy size={15} /> {t.copyBtn}</button>
          </div>
        </Modal>
      )}

      {backupModal === "import" && (
        <Modal onClose={() => setBackupModal(null)} title={t.importBackupBtn}>
          <div className="flex flex-col gap-2">
            <label style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2 cursor-pointer">
              <ClipboardPaste size={15} /> {t.backupRestoreFileBtn}
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) restoreFullBackup(f); }} />
            </label>
            <div style={{ color: COLORS.muted }} className="text-[10px] leading-relaxed mb-1">{t.backupRestoreFileHint}</div>
            <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="pt-2" />
            <textarea
              value={backupCodeInput}
              onChange={(e) => { setBackupCodeInput(e.target.value); setBackupError(null); }}
              placeholder={t.pasteCodePlaceholder}
              rows={6}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none font-mono"
            />
            {backupError && <div style={{ color: COLORS.danger }} className="text-xs">{backupError}</div>}
            <button onClick={submitBackupImport} disabled={!backupCodeInput.trim()} style={{ background: COLORS.accent, opacity: backupCodeInput.trim() ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm">{t.importBackupBtn}</button>
          </div>
        </Modal>
      )}

      {insuranceForm && (
        <Modal onClose={() => setInsuranceForm(null)} title={t.addInsuranceCard}>
          <div className="flex flex-col gap-2">
            <input value={insuranceForm.label} onChange={(e) => setInsuranceForm((s) => ({ ...s, label: e.target.value }))} placeholder={t.insuranceTypeLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={insuranceForm.provider} onChange={(e) => setInsuranceForm((s) => ({ ...s, provider: e.target.value }))} placeholder={t.providerLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={insuranceForm.policyNumber} onChange={(e) => setInsuranceForm((s) => ({ ...s, policyNumber: e.target.value }))} placeholder={t.policyNumberLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={insuranceForm.phone} onChange={(e) => setInsuranceForm((s) => ({ ...s, phone: e.target.value }))} placeholder={t.insurancePhoneLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input ref={docFileRef} type="file" accept="image/*" onChange={(e) => handleDocPhoto(e, setInsuranceForm)} className="hidden" />
            <button onClick={() => docFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-3 rounded-lg flex items-center justify-center gap-2">
              <Camera size={16} color={COLORS.accent} />
              <span style={{ color: COLORS.accent }} className="text-sm font-bold">{t.attachPhotoTitle}</span>
            </button>
            {insuranceForm.photo && <img src={insuranceForm.photo} alt="" className="w-full rounded-lg max-h-40 object-cover" />}
            <button onClick={submitInsurance} style={{ background: COLORS.accent }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            {insuranceForm.id && <button onClick={() => deleteInsurance(insuranceForm.id)} style={{ color: COLORS.danger }} className="w-full py-2 text-xs font-bold uppercase flex items-center justify-center gap-1"><Trash2 size={13} /> {t.deleteLabel}</button>}
          </div>
        </Modal>
      )}

      {certForm && (
        <Modal onClose={() => setCertForm(null)} title={t.addCertificate}>
          <div className="flex flex-col gap-2">
            <input value={certForm.title} onChange={(e) => setCertForm((s) => ({ ...s, title: e.target.value }))} placeholder={t.certTitleLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={certForm.issuer} onChange={(e) => setCertForm((s) => ({ ...s, issuer: e.target.value }))} placeholder={t.issuerLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <div className="flex gap-2">
              <input type="date" value={certForm.issueDate} onChange={(e) => setCertForm((s) => ({ ...s, issueDate: e.target.value }))} placeholder={t.issueDateLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm((s) => ({ ...s, expiryDate: e.target.value }))} placeholder={t.expiryDateLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <input ref={certFileRef} type="file" accept="image/*" onChange={(e) => handleDocPhoto(e, setCertForm)} className="hidden" />
            <button onClick={() => certFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-3 rounded-lg flex items-center justify-center gap-2">
              <Camera size={16} color={COLORS.accent} />
              <span style={{ color: COLORS.accent }} className="text-sm font-bold">{t.attachPhotoTitle}</span>
            </button>
            {certForm.photo && <img src={certForm.photo} alt="" className="w-full rounded-lg max-h-40 object-cover" />}
            <button onClick={submitCert} style={{ background: COLORS.accent }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            {certForm.id && <button onClick={() => deleteCert(certForm.id)} style={{ color: COLORS.danger }} className="w-full py-2 text-xs font-bold uppercase flex items-center justify-center gap-1"><Trash2 size={13} /> {t.deleteLabel}</button>}
          </div>
        </Modal>
      )}

      {basketProjectModalOpen && (
        <Modal onClose={() => setBasketProjectModalOpen(false)} title={t.chooseProjectLabel}>
          <div className="flex flex-col gap-2">
            {projects.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">{t.noProjectsYet}</div>}
            {projects.map((p) => (
              <button key={p.id} onClick={() => (basketMode === "order" ? requestBasketForProject(p.id) : transferBasketToProject(p.id))} style={{ background: COLORS.cardAlt, border: `1px solid ${basketMode === "order" ? "#C68B4F" : COLORS.border}` }} className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-semibold">
                {p.name}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {reportProjectPickerOpen && (
        <Modal onClose={() => setReportProjectPickerOpen(false)} title={t.chooseProjectLabel}>
          <div className="flex flex-col gap-2">
            {projects.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">{t.noProjectsYet}</div>}
            {projects.map((p) => {
              const selectedIndex = reportProjectSelection.indexOf(p.id);
              const isSelected = selectedIndex !== -1;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleReportProject(p.id)}
                  style={{ background: isSelected ? COLORS.success : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                  className="w-full text-left rounded-lg px-3 py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    {p.address && <div style={{ color: isSelected ? "rgba(0,0,0,0.6)" : COLORS.muted }} className="text-xs truncate">{p.address}</div>}
                  </div>
                  {isSelected && <span style={{ background: "rgba(0,0,0,0.25)" }} className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white">{selectedIndex + 1}</span>}
                </button>
              );
            })}
            <button
              onClick={() => { setReportProjectPickerOpen(false); generateProjectsReport(reportProjectSelection); }}
              disabled={reportProjectSelection.length === 0}
              style={{ background: COLORS.accent, opacity: reportProjectSelection.length === 0 ? 0.5 : 1 }}
              className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
            >
              <FileText size={15} /> {t.generateReportBtn}
            </button>
          </div>
        </Modal>
      )}

      {rangeLeaveModalOpen && (
        <Modal onClose={() => setRangeLeaveModalOpen(false)} title={t.rangeLeaveBtn}>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{t.dateFromLabel}</div>
                <input type="date" value={rangeLeaveForm.from} onChange={(e) => setRangeLeaveForm((f) => ({ ...f, from: e.target.value }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex-1">
                <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{t.dateToLabel}</div>
                <input type="date" value={rangeLeaveForm.to} onChange={(e) => setRangeLeaveForm((f) => ({ ...f, to: e.target.value }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              {["vacation", "sick", "other"].map((ty) => (
                <button key={ty} onClick={() => setRangeLeaveForm((f) => ({ ...f, type: ty }))} style={{ background: rangeLeaveForm.type === ty ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">
                  {ty === "vacation" ? t.leaveVacation : ty === "sick" ? t.leaveSick : t.leaveOther}
                </button>
              ))}
            </div>
            <input value={rangeLeaveForm.note} onChange={(e) => setRangeLeaveForm((f) => ({ ...f, note: e.target.value }))} placeholder={t.leaveNotePlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <button onClick={submitRangeLeave} disabled={!rangeLeaveForm.from || !rangeLeaveForm.to} style={{ background: COLORS.accent, opacity: rangeLeaveForm.from && rangeLeaveForm.to ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm">{t.requestLeave}</button>
          </div>
        </Modal>
      )}

      {selectedDay && (() => {
        const dayEntries = entries.filter((e) => e.date === selectedDay);
        const leave = myLeaveFor(selectedDay);
        return (
          <Modal onClose={() => setSelectedDay(null)} title={selectedDay}>
            <div className="flex flex-col gap-4">
              <div>
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.dayJournalHeading}</div>
                <EntryGroups entries={dayEntries} projectName={projectName} t={t} emptyLabel={t.nothingLogged} onEditTime={openEditTime} onEditEntry={openEditEntry} onDelete={deleteEntryFn} />
              </div>

              {dayEntries.length > 0 && (
                <button onClick={() => generateDayReport(selectedDay)} style={{ background: COLORS.accentDim }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                  <FileText size={15} /> {t.generateReportBtn}
                </button>
              )}

              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="pt-4">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1"><CalendarDays size={12} /> {t.requestLeave}</div>
                <div className="flex gap-2 mb-2">
                  {["vacation", "sick", "other"].map((ty) => (
                    <button key={ty} onClick={() => setLeaveForm((f) => ({ ...f, type: ty }))} style={{ background: leaveForm.type === ty ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">
                      {ty === "vacation" ? t.leaveVacation : ty === "sick" ? t.leaveSick : t.leaveOther}
                    </button>
                  ))}
                </div>
                <input value={leaveForm.note} onChange={(e) => setLeaveForm((f) => ({ ...f, note: e.target.value }))} placeholder={t.leaveNotePlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" />
                <button onClick={submitLeaveRequest} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="w-full py-2.5 rounded-lg font-bold uppercase text-xs mb-2">{leave ? t.saveLabel : t.requestLeave}</button>

                {leave && (
                  <div style={{ background: COLORS.cardAlt }} className="rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span style={{ color: leave.status === "approved" ? COLORS.success : leave.status === "declined" ? COLORS.danger : COLORS.amber }} className="text-xs font-bold uppercase">
                        {leave.status === "approved" ? t.statusApproved : leave.status === "declined" ? t.statusDeclined : t.statusPending}
                      </span>
                      <button onClick={() => sendLeaveToSupervisor(leave)} style={{ color: COLORS.accent }} className="text-xs font-bold uppercase flex items-center gap-1"><Mail size={12} /> {t.sendRequestBtn}</button>
                    </div>
                    {leave.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => setLeaveStatus(leave.id, "approved")} style={{ background: COLORS.success }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">{t.markApproved}</button>
                        <button onClick={() => setLeaveStatus(leave.id, "declined")} style={{ background: COLORS.danger }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase">{t.markDeclined}</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {selectedProject && (
        <Suspense fallback={null}>
        <ProjectDetail
          project={projects.find((p) => p.id === selectedProject)}
          entries={entries.filter((e) => e.projectId === selectedProject)}
          onClose={() => setSelectedProject(null)}
          onAdd={(type) => openAdd(type, selectedProject)}
          onEditEntry={openEditEntry}
          onCopyEntry={copyEntryFn}
          onDeleteEntry={deleteEntryFn}
          onShare={(project, ents) => setShareProjectModal({ project, entries: ents })}
          onScanCompare={(projectId) => openScan("compare", projectId)}
          onReorderEntries={reorderEntries}
          costing={projectCosting(selectedProject, projects.find((p) => p.id === selectedProject)?.quotedAmount)}
          money={money}
          documents={documents.filter((d) => d.projectId === selectedProject)}
          onNewDocument={(type) => newDocumentFor(projects.find((p) => p.id === selectedProject), type)}
          onOpenDocument={(d) => setDocEditor({ ...d })}
          onPrintDocument={printDocument}
          canBill={isOwner()}
          reports={siteReports.filter((r) => r.projectId === selectedProject)}
          onOpenRapport={(pid) => openRapport(pid)}
          onPrintRapport={printRapport}
          regie={regieSummary(selectedProject, { unbilledOnly: true })}
          onRegieDocument={(type) => createRegieDocument(projects.find((p) => p.id === selectedProject), type)}
          customer={customerFor(projects.find((p) => p.id === selectedProject))}
          onEditCustomer={(c) => openCustomerForm(c)}
          crew={projectCrew(projects.find((x) => x.id === selectedProject))}
          pinned={pinnedIds.includes(selectedProject)}
          files={projectFiles.filter((f) => f.projectId === selectedProject)}
          onUploadFiles={(list, kind) => uploadFiles(selectedProject, list, kind)}
          onOpenFile={openFile}
          onDeleteFile={deleteFile}
          canDeleteFile={canDeleteFile}
          onAddLink={() => setLinkForm({ projectId: selectedProject, url: "", name: "", kind: "plan" })}
          fileBusy={fileBusy}
          activeClock={activeClock}
          onStartDay={startDayOn}
          onStopDay={clockOut}
          translations={noteTranslations[selectedProject] || {}}
          onTranslate={(n, code) => translateNote(n, selectedProject, code)}
          langOptions={[...new Set([lang, "de", "en", ...memberLangs])]}
          onTranslateAll={() => translateAllNotes(selectedProject)}
          translatingIds={translatingIds}
          lang={lang}
          onOpenPhoto={openPhoto}
          onInspect={(pid) => openInspection(pid)}
          onEditInspection={(entry) => openInspection(entry.projectId, entry)}
          canEditInspection={canEditInspection}
          onTogglePin={() => togglePin(selectedProject)}
          roster={team.members}
          canManageCrew={canManage()}
          onToggleCrew={(memberUid) => toggleProjectCrew(selectedProject, memberUid)}
          noteDraft={projectNote}
          onNoteDraftChange={setProjectNote}
          onVoiceNote={() => toggleVoiceInput(setProjectNote, "projectNote")}
          voiceActive={voiceListening && voiceTarget === "projectNote"}
          onSaveNote={() => {
            if (!projectNote.trim()) return;
            const noteEntry = newEntry({ type: "note", projectId: selectedProject, description: projectNote.trim() });
            persist({ entries: [noteEntry, ...entries] });
            autoTranslateNote(noteEntry);
            setProjectNote("");
            showToast(t.commentSaved);
          }}
          onEdit={() => {
            const p = projects.find((pr) => pr.id === selectedProject);
            setEditProject({ id: p.id, name: p.name, client: p.client || "", customerId: p.customerId || null, address: p.address || "", category: p.category || "flat", status: p.status || DEFAULT_PROJECT_STATUS, quotedAmount: p.quotedAmount || "" });
          }}
          t={t}
        />
        </Suspense>
      )}

      {newProjectOpen && (
        <Modal onClose={() => setNewProjectOpen(false)} title={t.newProjectTitle}>
          <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder={t.projectNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={newProjectClient} onChange={(e) => setNewProjectClient(e.target.value)} placeholder={t.clientNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={newProjectAddr} onChange={(e) => setNewProjectAddr(e.target.value)} placeholder={t.addressLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.categoryLabel}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PROJECT_CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => setNewProjectCat(c.key)} style={{ background: newProjectCat === c.key ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                {t[c.labelKey]}
              </button>
            ))}
          </div>
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.projStatusLabel}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PROJECT_STATUSES.map((s) => (
              <button key={s.key} onClick={() => setNewProjectStatus(s.key)} style={{ background: newProjectStatus === s.key ? `${s.color}33` : COLORS.cardAlt, border: `1px solid ${newProjectStatus === s.key ? s.color : COLORS.border}`, color: newProjectStatus === s.key ? s.color : COLORS.text }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                {t[s.labelKey]}
              </button>
            ))}
          </div>
          {customers.length > 0 && (
            <>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.customerLabel}</div>
              <select value={newProjectCustomerId} onChange={(e) => setNewProjectCustomerId(e.target.value)} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none">
                <option value="">{t.noCustomerLabel}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}
          <button onClick={addProject} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.addProjectBtn}</button>
        </Modal>
      )}

      {editProject && (
        <Modal onClose={() => setEditProject(null)} title={t.editProjectTitle}>
          <input value={editProject.name} onChange={(e) => setEditProject((s) => ({ ...s, name: e.target.value }))} placeholder={t.projectNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={editProject.client} onChange={(e) => setEditProject((s) => ({ ...s, client: e.target.value }))} placeholder={t.clientNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <input value={editProject.address} onChange={(e) => setEditProject((s) => ({ ...s, address: e.target.value }))} placeholder={t.addressLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" />
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.categoryLabel}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PROJECT_CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => setEditProject((s) => ({ ...s, category: c.key }))} style={{ background: editProject.category === c.key ? COLORS.accent : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                {t[c.labelKey]}
              </button>
            ))}
          </div>
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.projStatusLabel}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PROJECT_STATUSES.map((s) => {
              const active = (editProject.status || DEFAULT_PROJECT_STATUS) === s.key;
              return (
                <button key={s.key} onClick={() => setEditProject((st) => ({ ...st, status: s.key }))} style={{ background: active ? `${s.color}33` : COLORS.cardAlt, border: `1px solid ${active ? s.color : COLORS.border}`, color: active ? s.color : COLORS.text }} className="px-3 py-1.5 rounded-full text-xs font-bold">
                  {t[s.labelKey]}
                </button>
              );
            })}
          </div>
          {customers.length > 0 && (
            <>
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.customerLabel}</div>
              <select value={editProject.customerId || ""} onChange={(e) => setEditProject((s) => ({ ...s, customerId: e.target.value || null }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none">
                <option value="">{t.noCustomerLabel}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">{t.quotedLabel}</div>
          <input
            type="number" inputMode="decimal" step="0.05"
            value={editProject.quotedAmount || ""}
            onChange={(e) => setEditProject((s) => ({ ...s, quotedAmount: e.target.value }))}
            placeholder={`${t.quotedPlaceholder} (${billing.currency || "CHF"})`}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none"
          />
          <button onClick={saveProjectEdit} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
        </Modal>
      )}

      {shareProjectModal && (
        <Modal onClose={() => setShareProjectModal(null)} title={t.shareProject}>
          <div className="flex flex-col gap-3">
            <div style={{ color: COLORS.muted }} className="text-xs">{t.shareHint}</div>
            <div style={{ color: COLORS.muted }} className="text-xs">
              {shareProjectModal.entries.length} {t.entriesLabelFmt}
            </div>
            <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg p-3 text-xs break-all font-mono">
              {encodeProjectCode(shareProjectModal.project, shareProjectModal.entries)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => shareProjectVia(shareProjectModal.project, shareProjectModal.entries, "whatsapp")} style={{ background: COLORS.success }} className="py-3 rounded-lg font-bold uppercase text-xs">WhatsApp</button>
              <button onClick={() => shareProjectVia(shareProjectModal.project, shareProjectModal.entries, "email")} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1"><Mail size={14} /> Email</button>
            </div>
          </div>
        </Modal>
      )}

      {importModalOpen && (
        <Modal onClose={() => setImportModalOpen(false)} title={t.importProject}>
          <div className="flex flex-col gap-2">
            <div style={{ color: COLORS.muted }} className="text-xs mb-1">{t.shareHint}</div>
            <textarea
              value={importCodeInput}
              onChange={(e) => { setImportCodeInput(e.target.value); setImportError(null); }}
              placeholder={t.pasteCodePlaceholder}
              rows={3}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono"
            />
            {importError && <div style={{ color: COLORS.danger }} className="text-xs">{importError}</div>}
            <button onClick={submitImportProject} disabled={!importCodeInput.trim()} style={{ background: COLORS.accent, opacity: importCodeInput.trim() ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm">{t.importBtn}</button>
          </div>
        </Modal>
      )}

      {editTimeModal && (
        <Modal onClose={() => setEditTimeModal(null)} title={t.adjustHoursTitle}>
          <div className="flex flex-col gap-2">
            <div style={{ color: COLORS.muted }} className="text-xs mb-1">{editTimeModal.date}{editTimeModal.projectId ? ` · ${projectName(editTimeModal.projectId)}` : ""}</div>
            {editTimeModal.startTime ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{t.startTimeLabel}</div>
                  <input
                    type="time"
                    autoFocus
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div className="flex-1">
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{t.endTimeLabel}</div>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            ) : (
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                autoFocus
                value={editHoursInput}
                onChange={(e) => setEditHoursInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEditTime()}
                placeholder={t.hoursFieldLabel}
                style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              />
            )}
            <button onClick={saveEditTime} style={{ background: COLORS.accent }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            <button
              onClick={() => { deleteEntryFn(editTimeModal); setEditTimeModal(null); }}
              style={{ color: COLORS.danger }}
              className="w-full mt-2 py-2 text-xs font-bold uppercase flex items-center justify-center gap-1"
            >
              <Trash2 size={13} /> {t.deleteLabel}
            </button>
          </div>
        </Modal>
      )}

      {reportViewModal && (() => {
        const live = Array.isArray(reportViewModal.entryIds);
        const f = reportFigures(reportViewModal);
        const excludedRows = live
          ? (reportViewModal.excludedIds || []).map((id) => entries.find((e) => e.id === id) || { id, description: (reportViewModal.entryLabels || {})[id] || "", deleted: true })
          : [];
        return (
        <Modal onClose={() => setReportViewModal(null)} title={`${reportViewModal.period === "daily" ? t.daily : t.monthly} · ${reportViewModal.periodLabel}`}>
          <div className="flex flex-col gap-3">
            <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg p-3">
              <Stat label={t.sitesLabel} value={f.sites.join(", ") || "—"} color={COLORS.text} />
              <Stat label={t.hoursWorked} value={f.hours.toFixed(1)} color={COLORS.accent} />
              {f.transportHours > 0 && <Stat label={t.reportTransportHours} value={f.transportHours.toFixed(1)} color="#C68B4F" />}
              <Stat label={t.materialsLogged} value={f.materialsCount} color={COLORS.success} />
              <Stat label={t.toolsLogged} value={f.toolsCount} color={COLORS.amber} />
              {(reportViewModal.sends || []).length > 0 && (
                <div style={{ color: COLORS.muted }} className="text-[10px] mt-1">
                  {t.reportSentTimes} {reportViewModal.sends.length}× · {t.reportLastSent} {new Date(reportViewModal.sends[reportViewModal.sends.length - 1].at).toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ color: COLORS.muted }} className="text-xs">{t.editReportHint}</div>
            {!live && (<div className="flex items-center gap-2">
              <span style={{ color: COLORS.muted }} className="text-xs">{t.hoursFieldLabel}</span>
              <input type="number" inputMode="decimal" step="0.1" value={reportViewModal.hours} onChange={(e) => setReportViewModal((r) => ({ ...r, hours: parseFloat(e.target.value) || 0 }))} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>)}
            <textarea value={reportViewModal.notes} onChange={(e) => setReportViewModal((r) => ({ ...r, notes: e.target.value }))} placeholder={t.notesLabel} rows={3} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" />
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {f.rows.map((e) => {
                const meta = typeMeta(e.type, t) || typeMeta("note", t);
                return (
                  <div key={e.id} style={{ background: COLORS.cardAlt, opacity: e.deleted ? 0.6 : 1 }} className="rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {e.description}{e.deleted ? ` ${t.reportDeletedEntry}` : ""}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span style={{ color: COLORS.muted }}>{e.qty ? `${e.qty}${e.unit ? " " + e.unit : ""}` : meta.label}</span>
                      {live && (
                        <button onClick={() => toggleReportEntry(e.id)} title={t.reportExclude} style={{ color: COLORS.muted }}><X size={12} /></button>
                      )}
                    </span>
                  </div>
                );
              })}
              {excludedRows.length > 0 && (
                <>
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mt-2">{t.reportExcludedTitle} ({excludedRows.length})</div>
                  {excludedRows.map((e) => (
                    <div key={e.id} style={{ background: COLORS.cardAlt, opacity: 0.55 }} className="rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate line-through">{e.description}</span>
                      <button onClick={() => toggleReportEntry(e.id)} style={{ color: COLORS.accent }} className="text-[10px] font-bold uppercase shrink-0">{t.reportRestore}</button>
                    </div>
                  ))}
                </>
              )}
            </div>
            <button onClick={saveReportEdits} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => saveReportAsPdf(reportViewModal)} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1"><Printer size={14} /> {t.savePdfBtn}</button>
              <button onClick={() => resendReport(reportViewModal)} style={{ background: COLORS.accentDim }} className="py-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-1"><Send size={14} /> {t.resendBtn}</button>
            </div>
          </div>
        </Modal>
        );
      })()}

      {quickAddOpen && (() => {
          // The site the action is for: clocked in, else the open job, else the
          // only active one; otherwise the sheet asks.
          const candidates = dockProjects.length ? dockProjects : projects.filter((p) => !["completed", "lost"].includes(p.status || DEFAULT_PROJECT_STATUS));
          const pid = activeClock?.projectId || selectedProject || (candidates.length === 1 ? candidates[0].id : quickAddSite) || null;
          const site = projects.find((p) => p.id === pid);
          const close = () => { setQuickAddOpen(false); setQuickAddSite(null); };
          const actions = [
            activeClock
              ? { key: "stop", label: t.clockOut, icon: Square, color: COLORS.danger, run: () => { clockOut(); } }
              : { key: "start", label: t.startYourDay, icon: Play, color: COLORS.success, run: () => { if (pid) startDayOn(pid); } },
            { key: "material", label: t.materials, icon: Package, color: COLORS.success, run: () => openAdd("material", pid) },
            { key: "photo", label: t.photoLabel, icon: Camera, color: "#7FA0C7", run: () => openAdd("photo", pid) },
            { key: "note", label: t.typeNote, icon: MessageSquare, color: COLORS.muted, run: () => openAdd("note", pid) },
            { key: "trip", label: t.tripAdd, icon: Truck, color: "#C68B4F", run: () => openTrip(pid) },
            { key: "inspection", label: t.newInspection, icon: ClipboardCheck, color: "#6FB3D9", run: () => { if (pid) openInspection(pid); } },
          ];
          return (
            <div className="fixed inset-0 z-50 flex items-end lg:hidden">
              <div onClick={close} className="absolute inset-0 bg-black/60" />
              <div data-quick-add style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.border}` }} className="relative w-full rounded-t-2xl px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between mb-2">
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">{t.quickAddTitle}{site ? ` · ${site.name}` : ""}</div>
                  <button onClick={close}><X size={18} color={COLORS.muted} /></button>
                </div>
                {!pid && candidates.length > 1 && (
                  <div className="mb-3">
                    <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.quickPickSite}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {candidates.map((p) => (
                        <button key={p.id} data-quick-site={p.id} onClick={() => setQuickAddSite(p.id)} style={{ background: COLORS.cardAlt, border: `1px solid ${projectColour(p.id)}66` }} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold">{p.name}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {actions.map((a) => {
                    const Icon = a.icon;
                    const needsSite = a.key !== "stop" && !pid;
                    return (
                      <button key={a.key} data-quick-action={a.key} disabled={needsSite} onClick={() => { close(); a.run(); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, opacity: needsSite ? 0.4 : 1 }} className="rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 text-[11px] font-bold">
                        <Icon size={20} color={a.color} />
                        <span className="truncate max-w-full">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
      })()}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/60" />
          <div data-menu-drawer style={{ background: COLORS.card, borderLeft: `1px solid ${COLORS.border}` }} className="relative ml-auto h-full w-72 max-w-[85vw] flex flex-col pt-4 pb-6 px-3 overflow-y-auto">
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-1.5">
                <SwissCross size={12} />
                <span style={{ color: COLORS.accent, letterSpacing: "0.15em" }} className="text-[11px] font-bold uppercase">{t.appLabel}</span>
              </div>
              <button onClick={() => setMenuOpen(false)}><X size={18} color={COLORS.muted} /></button>
            </div>
            {[
              ...(canManage() ? [{ id: "board", label: t.navBoard, icon: Ruler }, { id: "cockpit", label: t.navCockpit, icon: ClipboardCheck }] : []),
              { id: "today", label: t.navToday, icon: Clock },
              { id: "projects", label: t.navProjects, icon: MapPin },
              { id: "customers", label: t.navCustomers, icon: User },
              { id: "calendar", label: t.navCalendar, icon: CalendarDays },
              { id: "materials", label: t.navMaterials, icon: Package },
              { id: "team", label: t.navTeam, icon: Users },
              { id: "transport", label: t.navTransport, icon: Truck },
              { id: "reports", label: t.navReports, icon: FileText },
              { id: "safety", label: t.navSafety, icon: ShieldAlert },
            ].map((it) => {
              const Icon = it.icon;
              const active = tab === it.id;
              const accent = it.id === "safety" ? COLORS.danger : COLORS.accent;
              return (
                <button
                  key={it.id}
                  onClick={() => { setTab(it.id); setMenuOpen(false); setSelectedProject(null); }}
                  style={{ background: active ? `${accent}1F` : "transparent", color: active ? accent : COLORS.text }}
                  className="w-full px-3 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 text-left"
                >
                  <Icon size={18} color={active ? accent : COLORS.muted} /> {it.label}
                </button>
              );
            })}
            <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="mt-3 pt-3 flex flex-col gap-0.5">
              <button onClick={() => { setMenuOpen(false); openProfile(); }} style={{ color: COLORS.muted }} className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-3 text-left">
                <User size={16} /> {t.profileTitle}
              </button>
              <button onClick={() => { setMenuOpen(false); setLangPickerOpen(true); }} style={{ color: COLORS.muted }} className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-3 text-left">
                <Globe size={16} /> {lang.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {photoView && !photoEdit && (
        <Suspense fallback={null}>
        <PhotoViewer
          src={photoView.src}
          entry={photoView.entry}
          onClose={() => setPhotoView(null)}
          onEdit={() => setPhotoEdit({ entry: photoView.entry, src: photoView.src })}
          onRestore={photoView.entry.originalPhotoId && (canManage() || photoView.entry.userId === user?.uid) ? () => restorePhotoOriginal(photoView.entry) : null}
          canEdit={canManage() || photoView.entry.userId === user?.uid}
          t={t}
        />
        </Suspense>
      )}
      {photoEdit && (
        <Suspense fallback={null}>
        <PhotoEditor
          src={photoEdit.src}
          onCancel={() => setPhotoEdit(null)}
          onSave={(dataUrl) => savePhotoEdit(photoEdit.entry, dataUrl)}
          t={t}
        />
        </Suspense>
      )}

      {fileViewer && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.94)" }}>
          <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}` }} className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="text-sm font-bold truncate">{fileViewer.file.name}</div>
            <div className="flex items-center gap-4 shrink-0">
              <a href={fileViewer.url} download={fileViewer.file.name} style={{ color: COLORS.muted }} className="text-[11px] font-bold uppercase">{t.filesDownload}</a>
              <button onClick={closeFileViewer}><X size={20} color={COLORS.muted} /></button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {isImage(fileViewer.file.type)
              ? <img src={fileViewer.url} alt={fileViewer.file.name} className="w-full h-full object-contain" />
              : <iframe src={fileViewer.url} title={fileViewer.file.name} className="w-full h-full" style={{ border: 0, background: "#fff" }} />}
          </div>
        </div>
      )}

      {linkForm && (
        <Modal onClose={() => setLinkForm(null)} title={t.filesAddLink}>
          <input
            value={linkForm.url}
            onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
            placeholder={t.filesLinkPlaceholder}
            inputMode="url"
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            value={linkForm.name}
            onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t.filesLinkName}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full mt-2 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mt-3 mb-1.5">{t.filesKindLabel}</div>
          <div className="flex flex-wrap gap-1.5">
            {FILE_KINDS.map((k) => {
              const on = linkForm.kind === k;
              return (
                <button key={k} onClick={() => setLinkForm((f) => ({ ...f, kind: k }))} style={{ background: on ? `${COLORS.accent}22` : COLORS.cardAlt, border: `1px solid ${on ? COLORS.accent : COLORS.border}`, color: on ? COLORS.accent : COLORS.muted }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold">
                  {t[`fileKind_${k}`]}
                </button>
              );
            })}
          </div>
          <button onClick={addFileLink} disabled={!normaliseLink(linkForm.url)} style={{ background: normaliseLink(linkForm.url) ? COLORS.accent : COLORS.cardAlt, opacity: normaliseLink(linkForm.url) ? 1 : 0.5 }} className="w-full mt-4 py-3 rounded-lg font-bold uppercase text-sm">{t.saveLabel}</button>
        </Modal>
      )}

      {rapportExists && (
        <Modal onClose={() => setRapportExists(null)} title={t.rapportExistsTitle}>
          <div style={{ color: COLORS.muted }} className="text-sm mb-3">
            {projectName(rapportExists.projectId)} · {rapportExists.date} · {rapportExists.existing.signerName}
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => { const r = rapportExists.existing; setRapportExists(null); printRapport(r); }} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.rapportOpenExisting}</button>
            <button onClick={() => { const { projectId, date } = rapportExists; setRapportExists(null); openRapport(projectId, date, true); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.muted }} className="w-full py-3 rounded-lg font-bold uppercase text-xs">{t.rapportCreateNew}</button>
          </div>
        </Modal>
      )}

      {priceImport && (
        <Modal onClose={() => setPriceImport(null)} title={t.importPriceList}>
          <div style={{ color: COLORS.muted }} className="text-xs mb-3 truncate">{priceImport.fileName}</div>
          {priceImport.rows.length === 0 ? (
            <div>
              <div style={{ color: COLORS.danger }} className="text-sm font-semibold mb-2">{t.importNothingFound}</div>
              <div style={{ color: COLORS.muted }} className="text-xs leading-relaxed">{t.importNeedsHeaders}</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  [priceImport.added, t.importNew, COLORS.success],
                  [priceImport.updated, t.importUpdated, COLORS.accent],
                  [priceImport.repriced, t.importRepriced, COLORS.amber],
                ].map(([n, label, colour]) => (
                  <div key={label} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg p-2 text-center">
                    <div style={{ color: colour }} className="text-lg font-black tabular-nums">{n}</div>
                    <div style={{ color: COLORS.muted }} className="text-[10px] uppercase">{label}</div>
                  </div>
                ))}
              </div>

              {/* Naming the merchant on import is what makes the purchase-order
                  grouping work later, and most exports do not carry it. */}
              <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.supplierLabel}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {KNOWN_SUPPLIERS.map((sup) => {
                  const on = priceImport.supplier === sup;
                  return (
                    <button
                      key={sup}
                      onClick={() => setPriceImport((s2) => ({ ...s2, supplier: on ? "" : sup }))}
                      style={{
                        background: on ? `${COLORS.success}22` : COLORS.cardAlt,
                        border: `1px solid ${on ? COLORS.success : COLORS.border}`,
                        color: on ? COLORS.success : COLORS.muted,
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                    >
                      {sup}
                    </button>
                  );
                })}
              </div>

              {priceImport.warnings.length > 0 && (
                <div style={{ background: `${COLORS.amber}14`, border: `1px solid ${COLORS.amber}55`, color: COLORS.amber }} className="rounded-lg p-2.5 mb-3 text-[11px] leading-relaxed">
                  {priceImport.warnings.map((w) => (
                    <div key={w}>{t[`importWarn_${w}`] || w}</div>
                  ))}
                </div>
              )}

              <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.importPreview}</div>
              <div style={{ border: `1px solid ${COLORS.border}` }} className="rounded-lg overflow-hidden mb-3">
                {priceImport.rows.slice(0, 8).map((r, i) => (
                  <div key={i} style={{ background: i % 2 ? COLORS.cardAlt : COLORS.card }} className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate flex-1 min-w-0">{r.name}</span>
                    {r.artNo && <span style={{ color: COLORS.muted }} className="shrink-0">{r.artNo}</span>}
                    <span style={{ color: COLORS.muted }} className="shrink-0 tabular-nums">{r.price ? `${r.price}${r.unit ? "/" + r.unit : ""}` : ""}</span>
                  </div>
                ))}
              </div>
              {priceImport.rows.length > 8 && (
                <div style={{ color: COLORS.muted }} className="text-[10px] mb-3">+{priceImport.rows.length - 8} {t.importMoreRows}</div>
              )}

              <button onClick={applyPriceList} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">
                {t.importApply}
              </button>
            </>
          )}
        </Modal>
      )}

      {addModal && (
        <Modal onClose={() => setAddModal(null)} title={addModal.editingId ? t.editLabel : (addModal.type === "material" ? t.addMaterialTitle : addModal.type === "tool" ? t.addToolTitle : t.attachPhotoTitle)}>
          {addModal.type === "photo" ? (
            <div className="flex flex-col gap-3">
              <input ref={fileRef} data-photo-input type="file" accept="image/*" multiple={!addModal.editingId} onChange={handleFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="w-full py-6 rounded-xl flex flex-col items-center gap-2">
                <Camera size={22} color={COLORS.accent} />
                <span style={{ color: COLORS.accent }} className="text-sm font-bold">{photoPreview && !addModal.editingId ? t.addMorePhotos : t.attachPhotoTitle}</span>
              </button>
              {photoPreview && <img src={photoPreview} alt="preview" className="w-full rounded-lg max-h-48 object-cover" />}
              {photoExtra.length > 0 && (
                <div>
                  <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{1 + photoExtra.length} {t.photosSelected}</div>
                  <div data-photo-extra className="grid grid-cols-4 gap-1.5">
                    {photoExtra.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="w-full h-16 object-cover rounded-md" />
                        <button onClick={() => setPhotoExtra((x) => x.filter((_, j) => j !== i))} style={{ background: "rgba(0,0,0,0.65)" }} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"><X size={11} color="#fff" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t.captionPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input value={form.description} onChange={(e) => setDescriptionWithUnitMemory(e.target.value)} placeholder={t.whatUsedPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />

              {addModal.type === "material" && (() => {
                const catalog = materialsCatalogFor(lang);
                const q = form.description.trim().toLowerCase();
                const flattenCat = (catKey) => catalog.items[catKey].flatMap((g) => g.items.map((name) => ({ name, catKey })));
                const flattenAll = () => Object.keys(catalog.items).flatMap((catKey) => flattenCat(catKey));
                const searchScope = suggestCat ? flattenCat(suggestCat) : flattenAll();
                const searchResults = q.length > 0 ? searchScope.filter((i) => i.name.toLowerCase().includes(q)).slice(0, suggestCat ? 40 : 6) : [];
                const showGrouped = suggestCat && q.length === 0;
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Object.entries(catalog.cats).map(([key, label]) => (
                        <button key={key} onClick={() => setSuggestCat((c) => (c === key ? null : key))} style={{ background: suggestCat === key ? COLORS.success : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap">
                          {label}
                        </button>
                      ))}
                    </div>
                    {pendingSuggestion ? (
                      <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.success}` }} className="rounded-lg p-2.5 flex flex-col gap-2">
                        <div className="text-xs font-semibold">{pendingSuggestion.name}</div>
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={sizeInput}
                            onChange={(e) => setSizeInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmSuggestion()}
                            placeholder={t.sizePlaceholder}
                            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                          />
                          <button onClick={confirmSuggestion} style={{ background: COLORS.success }} className="rounded-lg px-3 flex items-center justify-center"><Check size={16} /></button>
                          <button onClick={() => { setPendingSuggestion(null); setSizeInput(""); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg px-3 flex items-center justify-center"><X size={16} color={COLORS.muted} /></button>
                        </div>
                      </div>
                    ) : q.length > 0 && searchResults.length > 0 ? (
                      <div>
                        <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{t.suggestionsTitle}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {searchResults.map((it) => (
                            <button key={it.name} onClick={() => { setDescriptionWithUnitMemory(it.name); setPendingSuggestion(it); setSizeInput(""); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-2.5 py-1.5 rounded-lg text-xs">
                              {it.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : showGrouped ? (
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {catalog.items[suggestCat].map((grp) => (
                          <div key={grp.group}>
                            <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1 mt-1">{grp.group}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {grp.items.map((name) => (
                                <button key={name} onClick={() => { setDescriptionWithUnitMemory(name); setPendingSuggestion({ name, catKey: suggestCat }); setSizeInput(""); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-2.5 py-1.5 rounded-lg text-xs">
                                  {name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <input type="number" inputMode="decimal" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder={t.qtyPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none" />
                <div className="w-1/2 relative">
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    onFocus={() => setUnitSuggestFocused(true)}
                    onBlur={() => setTimeout(() => setUnitSuggestFocused(false), 150)}
                    placeholder={t.unitPlaceholder}
                    style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  {unitSuggestFocused && (() => {
                    const q = form.unit.trim().toLowerCase();
                    const matches = (q ? UNIT_SUGGESTIONS.filter((u) => u.toLowerCase().startsWith(q)) : UNIT_SUGGESTIONS).slice(0, 6);
                    if (matches.length === 0) return null;
                    return (
                      <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="absolute z-10 mt-1 left-0 right-0 rounded-lg p-1.5 flex flex-wrap gap-1">
                        {matches.map((u) => (
                          <button key={u} onMouseDown={(e) => e.preventDefault()} onClick={() => setForm((f) => ({ ...f, unit: u }))} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="px-2 py-1 rounded text-[11px]">
                            {u}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <input
                type="number" inputMode="decimal" step="0.01"
                value={form.unitPrice || ""}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                placeholder={`${t.unitPriceLabel} (${billing.currency || "CHF"})`}
                style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                className="w-full mt-2 rounded-lg px-3 py-2 text-sm outline-none"
              />
              {/* Flagging extra work at the moment it happens is the only time
                  anyone reliably remembers to. */}
              <button
                onClick={() => setForm((f) => ({ ...f, regie: !f.regie }))}
                style={{
                  background: form.regie ? `${COLORS.amber}22` : COLORS.cardAlt,
                  border: `1px solid ${form.regie ? COLORS.amber : COLORS.border}`,
                  color: form.regie ? COLORS.amber : COLORS.muted,
                }}
                className="w-full mt-2 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2"
              >
                {form.regie ? <Check size={14} /> : <Plus size={14} />} {t.regieToggle}
              </button>
              <div style={{ color: COLORS.muted }} className="text-[10px] mt-1 leading-relaxed">{t.regieHint}</div>
            </div>
          )}
          {addModal.type !== "photo" && (
            <div className="mt-3">
              <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.supplierLabel}</div>
              {/* The known wholesalers as one tap, but the field stays free
                  text: half the material on a Swiss roof comes from a merchant
                  nobody put in a list. */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {KNOWN_SUPPLIERS.map((sup) => {
                  const on = (form.supplier || "").trim().toLowerCase() === sup.toLowerCase();
                  return (
                    <button
                      key={sup}
                      onClick={() => setForm((f) => ({ ...f, supplier: on ? "" : sup }))}
                      style={{
                        background: on ? `${COLORS.success}22` : COLORS.cardAlt,
                        border: `1px solid ${on ? COLORS.success : COLORS.border}`,
                        color: on ? COLORS.success : COLORS.muted,
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                    >
                      {sup}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.supplier || ""}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder={t.supplierPlaceholder}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                />
                <input
                  value={form.artNo || ""}
                  onChange={(e) => setForm({ ...form, artNo: e.target.value })}
                  placeholder={t.artNoPlaceholder}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          )}
          <div className="mt-4">
            <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.tradeLabel}</div>
            <div className="flex flex-wrap gap-1.5">
              {TRADES.map((tr) => {
                const on = (form.trade || DEFAULT_TRADE) === tr.key;
                return (
                  <button
                    key={tr.key}
                    onClick={() => setForm((f) => ({ ...f, trade: tr.key }))}
                    style={{
                      background: on ? `${tr.color}26` : COLORS.cardAlt,
                      border: `1px solid ${on ? tr.color : COLORS.border}`,
                      color: on ? tr.color : COLORS.muted,
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                  >
                    {t[tr.labelKey]}
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={submitAdd} style={{ background: COLORS.accent }} className="w-full mt-4 py-3 rounded-lg font-bold uppercase text-sm">{addModal.editingId ? t.saveLabel : t.logItBtn}</button>
          {addModal.editingId && (
            <button
              onClick={() => {
                deleteEntryFn({ id: addModal.editingId });
                setAddModal(null);
              }}
              style={{ color: COLORS.danger }}
              className="w-full mt-2 py-2 text-xs font-bold uppercase flex items-center justify-center gap-1"
            >
              <Trash2 size={13} /> {t.deleteLabel}
            </button>
          )}
        </Modal>
      )}

      {sosOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "#150000" }}>
          <div className="flex items-center justify-between px-5 pt-6 pb-3">
            <div style={{ color: COLORS.danger }} className="text-lg font-black uppercase flex items-center gap-2"><Siren size={20} /> {t.emergencyTitle}</div>
            <button onClick={() => { setSosOpen(false); logIncident(); }} className="text-xs font-bold uppercase" style={{ color: COLORS.muted }}>{t.closeAndLog}</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[t.ambulance, t.police, t.fire, t.generalEmergency].map((label, i) => (
                <a key={SWISS_EMERGENCY_NUMS[i]} href={`tel:${SWISS_EMERGENCY_NUMS[i]}`} style={{ background: COLORS.danger }} className="rounded-xl py-4 text-center">
                  <div className="text-3xl font-black text-white">{SWISS_EMERGENCY_NUMS[i]}</div>
                  <div className="text-xs text-white/80">{label}</div>
                </a>
              ))}
            </div>
            <div style={{ background: "#241414", border: `1px solid ${COLORS.danger}` }} className="rounded-xl p-4">
              <div className="text-white text-xs uppercase tracking-wide mb-2 opacity-70">{t.notBreathingHint}</div>
              <div className="text-white text-2xl font-black mb-1">{cprStep + 1}. {CPR_STEPS[cprStep].title}</div>
              <div className="text-white text-lg leading-snug">{CPR_STEPS[cprStep].text}</div>
              <div className="flex gap-2 mt-4">
                <button disabled={cprStep === 0} onClick={() => setCprStep((s) => Math.max(0, s - 1))} style={{ background: "#3A1F1F", opacity: cprStep === 0 ? 0.4 : 1 }} className="flex-1 py-3 rounded-lg text-white text-sm font-bold uppercase">{t.back}</button>
                <button disabled={cprStep === CPR_STEPS.length - 1} onClick={() => setCprStep((s) => Math.min(CPR_STEPS.length - 1, s + 1))} style={{ background: COLORS.danger, opacity: cprStep === CPR_STEPS.length - 1 ? 0.4 : 1 }} className="flex-1 py-3 rounded-lg text-white text-sm font-bold uppercase">{t.nextStep}</button>
              </div>
            </div>
            <div style={{ color: "#B98888" }} className="text-xs text-center">{t.cprDisclaimer}</div>
            {profile.contactPhone && (
              <a href={`tel:${profile.contactPhone}`} style={{ background: "#241414", border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.emergencyContact}</div>
                  <div className="text-white font-bold">{profile.contactName || profile.contactPhone}{profile.contactRelationship ? ` · ${profile.contactRelationship}` : ""}</div>
                </div>
                <Phone size={18} color={COLORS.muted} />
              </a>
            )}
            {insuranceCards.length > 0 && (
              <div style={{ background: "#241414", border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 flex flex-col gap-2">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide flex items-center gap-1"><CreditCard size={12} /> {t.profileInsurance}</div>
                {insuranceCards.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="text-white text-sm">
                      <div className="font-bold">{c.label || c.provider}</div>
                      <div style={{ color: COLORS.muted }} className="text-xs">{c.provider}{c.policyNumber ? ` · ${c.policyNumber}` : ""}</div>
                    </div>
                    {c.phone && <a href={`tel:${c.phone}`}><Phone size={16} color={COLORS.muted} /></a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {scanModal && (
        <Modal onClose={() => setScanModal(null)} title={scanModal.mode === "compare" ? t.scanTitleCompare : t.scanTitleSingle}>
          <div className="flex flex-col gap-3">
            {scanModal.mode === "compare" && <div style={{ color: COLORS.muted }} className="text-xs">{t.scanHintCompare}</div>}
            <div className="grid grid-cols-2 gap-2">
              {scanModal.images.map((img, i) => (<img key={i} src={`data:${img.mediaType};base64,${img.b64}`} alt="" className="w-full h-24 object-cover rounded-lg" />))}
              {(scanModal.mode === "single" ? scanModal.images.length < 1 : scanModal.images.length < 2) && (
                <button onClick={() => scanFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="h-24 rounded-lg flex flex-col items-center justify-center gap-1">
                  <ImagePlus size={18} color={COLORS.muted} />
                  <span style={{ color: COLORS.muted }} className="text-xs">{scanModal.images.length === 0 ? t.before : t.after}</span>
                </button>
              )}
            </div>
            <input ref={scanFileRef} type="file" accept="image/*" onChange={addScanImage} className="hidden" />
            {scanModal.error && <div style={{ color: COLORS.danger }} className="text-xs">{scanModal.error}</div>}
            {scanModal.detail && <div style={{ color: COLORS.muted }} className="text-[10px] break-all">{scanModal.detail}</div>}
            {!scanModal.items && (
              <button onClick={runScan} disabled={scanModal.loading || (scanModal.mode === "single" ? scanModal.images.length < 1 : scanModal.images.length < 2)} style={{ background: COLORS.success, opacity: scanModal.loading ? 0.7 : 1 }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                {scanModal.loading ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                {scanModal.loading ? t.readingPhoto : t.readMaterials}
              </button>
            )}
            {scanModal.items && (
              <div className="flex flex-col gap-2">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.detectedHint}</div>
                {scanModal.items.map((it) => (
                  <label key={it.id} style={{ background: COLORS.cardAlt }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                    <input type="checkbox" checked={it.checked} onChange={() => setScanModal((s) => ({ ...s, items: s.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) }))} />
                    <span className="flex-1">{it.name}</span>
                    <span style={{ color: COLORS.muted }}>{it.qty} {it.unit}</span>
                  </label>
                ))}
                <button onClick={confirmScan} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm mt-2">{t.addToMaterialsLog}</button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {libraryScanModal && (
        <Modal onClose={() => setLibraryScanModal(null)} title={t.scanSpecSheet}>
          <div className="flex flex-col gap-3">
            {!libraryScanModal.image ? (
              <button onClick={() => libraryScanFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="h-32 rounded-lg flex flex-col items-center justify-center gap-1">
                <ImagePlus size={20} color={COLORS.muted} />
                <span style={{ color: COLORS.muted }} className="text-xs">{t.photoLabel}</span>
              </button>
            ) : (
              <img src={`data:${libraryScanModal.image.mediaType};base64,${libraryScanModal.image.b64}`} alt="" className="w-full h-40 object-cover rounded-lg" />
            )}
            <input ref={libraryScanFileRef} type="file" accept="image/*" capture="environment" onChange={addLibraryScanImage} className="hidden" />
            {libraryScanModal.error && <div style={{ color: COLORS.danger }} className="text-xs">{libraryScanModal.error}</div>}
            {libraryScanModal.detail && <div style={{ color: COLORS.muted }} className="text-[10px] break-all">{libraryScanModal.detail}</div>}

            {!libraryScanModal.result && (
              <button onClick={runLibraryScan} disabled={!libraryScanModal.image || libraryScanModal.loading} style={{ background: COLORS.success, opacity: !libraryScanModal.image || libraryScanModal.loading ? 0.6 : 1 }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2">
                {libraryScanModal.loading ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                {libraryScanModal.loading ? t.readingSpecSheet : t.scanSpecSheet}
              </button>
            )}

            {libraryScanModal.result && (
              <div className="flex flex-col gap-2">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.reviewBeforeSaving}</div>
                <input value={libraryScanModal.result.name} onChange={(e) => setLibraryScanModal((s) => ({ ...s, result: { ...s.result, name: e.target.value } }))} placeholder={t.itemNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={libraryScanModal.result.supplier} onChange={(e) => setLibraryScanModal((s) => ({ ...s, result: { ...s.result, supplier: e.target.value } }))} placeholder={t.manufacturerLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={libraryScanModal.result.articleNumber} onChange={(e) => setLibraryScanModal((s) => ({ ...s, result: { ...s.result, articleNumber: e.target.value } }))} placeholder={t.articleNumberLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={libraryScanModal.result.category} onChange={(e) => setLibraryScanModal((s) => ({ ...s, result: { ...s.result, category: e.target.value } }))} placeholder={t.techCategoryLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />

                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mt-1">{t.specsLabel}</div>
                {libraryScanModal.result.specs.map((s) => (
                  <div key={s.id} className="flex gap-2">
                    <input value={s.key} onChange={(e) => setLibraryScanModal((st) => ({ ...st, result: { ...st.result, specs: st.result.specs.map((x) => (x.id === s.id ? { ...x, key: e.target.value } : x)) } }))} placeholder={t.specKeyPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none" />
                    <input value={s.value} onChange={(e) => setLibraryScanModal((st) => ({ ...st, result: { ...st.result, specs: st.result.specs.map((x) => (x.id === s.id ? { ...x, value: e.target.value } : x)) } }))} placeholder={t.specValuePlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none" />
                    <button onClick={() => setLibraryScanModal((st) => ({ ...st, result: { ...st.result, specs: st.result.specs.filter((x) => x.id !== s.id) } }))} style={{ color: COLORS.danger }}><X size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setLibraryScanModal((st) => ({ ...st, result: { ...st.result, specs: [...st.result.specs, { id: uid(), key: "", value: "" }] } }))} style={{ color: COLORS.muted, border: `1px dashed ${COLORS.border}` }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} /> {t.addSpecRowBtn}</button>

                <label style={{ background: COLORS.cardAlt }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs mt-1">
                  <input type="checkbox" checked={libraryScanModal.keepPhoto} onChange={(e) => setLibraryScanModal((s) => ({ ...s, keepPhoto: e.target.checked }))} />
                  {t.keepPhotoLabel}
                </label>

                <button onClick={confirmLibraryScan} disabled={!libraryScanModal.result.name.trim()} style={{ background: COLORS.accent, opacity: libraryScanModal.result.name.trim() ? 1 : 0.5 }} className="w-full py-3 rounded-lg font-bold uppercase text-sm mt-1">{t.saveToLibraryBtn}</button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {libraryEditModal && (
        <Modal onClose={() => setLibraryEditModal(null)} title={libraryEditModal.id ? t.editLibraryItemTitle : t.newLibraryItemTitle}>
          <div className="flex flex-col gap-2">
            <input value={libraryEditModal.name} onChange={(e) => updateLibraryEditField("name", e.target.value)} placeholder={t.itemNameLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={libraryEditModal.supplier} onChange={(e) => updateLibraryEditField("supplier", e.target.value)} placeholder={t.manufacturerLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={libraryEditModal.articleNumber} onChange={(e) => updateLibraryEditField("articleNumber", e.target.value)} placeholder={t.articleNumberLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={libraryEditModal.category} onChange={(e) => updateLibraryEditField("category", e.target.value)} placeholder={t.techCategoryLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />

            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mt-1">{t.specsLabel}</div>
            {libraryEditModal.specs.map((s) => (
              <div key={s.id} className="flex gap-2">
                <input value={s.key} onChange={(e) => updateLibrarySpecRow(s.id, "key", e.target.value)} placeholder={t.specKeyPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none" />
                <input value={s.value} onChange={(e) => updateLibrarySpecRow(s.id, "value", e.target.value)} placeholder={t.specValuePlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none" />
                <button onClick={() => removeLibrarySpecRow(s.id)} style={{ color: COLORS.danger }}><X size={16} /></button>
              </div>
            ))}
            <button onClick={addLibrarySpecRow} style={{ color: COLORS.muted, border: `1px dashed ${COLORS.border}` }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={13} /> {t.addSpecRowBtn}</button>

            <button onClick={submitLibraryEdit} disabled={!libraryEditModal.name.trim()} style={{ background: COLORS.accent, opacity: libraryEditModal.name.trim() ? 1 : 0.5 }} className="w-full py-3 rounded-lg font-bold uppercase text-sm mt-2">{t.saveToLibraryBtn}</button>
          </div>
        </Modal>
      )}

      {pickupModal && (
        <Modal onClose={() => setPickupModal(null)} title={t.pickupTitle}>
          {pickupModal.step === "form" ? (
            <div className="flex flex-col gap-2">
              <div style={{ color: COLORS.muted }} className="text-xs mb-1">{t.pickupHint}</div>
              <input value={pickupModal.orderRef} onChange={(e) => setPickupModal((s) => ({ ...s, orderRef: e.target.value }))} placeholder={t.orderPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={pickupModal.supplier} onChange={(e) => setPickupModal((s) => ({ ...s, supplier: e.target.value }))} placeholder={t.supplierPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" />
              <div className="flex gap-2 mt-1">
                <button onClick={() => setPickupModal((s) => ({ ...s, codeType: "qr" }))} style={{ background: pickupModal.codeType === "qr" ? "#C9A6F5" : COLORS.cardAlt }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1"><QrCode size={14} /> {t.qrLabel}</button>
                <button onClick={() => setPickupModal((s) => ({ ...s, codeType: "barcode" }))} style={{ background: pickupModal.codeType === "barcode" ? "#C9A6F5" : COLORS.cardAlt }} className="flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1"><Barcode size={14} /> {t.barcodeLabel}</button>
              </div>
              <button onClick={generatePickupCode} disabled={!pickupModal.orderRef.trim()} style={{ background: "#C9A6F5", opacity: pickupModal.orderRef.trim() ? 1 : 0.5 }} className="w-full mt-2 py-3 rounded-lg font-bold uppercase text-sm text-black">{t.generateCode}</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div style={{ background: "#fff" }} className="rounded-xl p-4 w-full flex items-center justify-center">
                {pickupModal.codeType === "qr" ? (
                  <img alt="QR" className="w-56 h-56" src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pickupModal.orderRef)}`} />
                ) : (
                  <img alt="Barcode" className="w-full h-28 object-contain" src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(pickupModal.orderRef)}&scale=3&includetext=true`} />
                )}
              </div>
              <div className="text-center">
                <div className="font-bold">{pickupModal.orderRef}</div>
                {pickupModal.supplier && <div style={{ color: COLORS.muted }} className="text-xs">{pickupModal.supplier}</div>}
              </div>
              <div style={{ color: COLORS.muted }} className="text-xs text-center">{t.showScreenHint}</div>
              <button onClick={() => setPickupModal(null)} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.doneLabel}</button>
            </div>
          )}
        </Modal>
      )}

      {tripModal && (() => {
          const wasteOpen = tripModal.loadKind === "waste" ? openWasteKg(tripModal.projectId) : 0;
          const hours = tripHours(tripModal.departTime, tripModal.arriveTime);
          const field = { background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text };
          const lbl = (s) => <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">{s}</div>;
          return (
            <Modal onClose={() => setTripModal(null)} title={t.tripAdd}>
              <div className="flex flex-col gap-2.5">
                {lbl(t.tripProject)}
                <select data-trip-project value={tripModal.projectId || ""} onChange={(e) => setTripField("projectId", e.target.value)} style={field} className="rounded-lg px-2 py-2 text-sm outline-none">
                  <option value="">—</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>{lbl(t.tripVehicle)}<select data-trip-vehicle value={tripModal.vehicle} onChange={(e) => setTripField("vehicle", e.target.value)} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none">{VEHICLES.map((v) => <option key={v} value={v}>{t[`vehicle_${v}`]}</option>)}</select></div>
                  <div>{lbl(t.tripDate)}<input type="date" value={tripModal.date} onChange={(e) => setTripField("date", e.target.value)} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>{lbl(t.tripFrom)}<input data-trip-from value={tripModal.from} onChange={(e) => setTripField("from", e.target.value)} placeholder={t.tripFromPh} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                  <div>{lbl(t.tripTo)}<input data-trip-to value={tripModal.to} onChange={(e) => setTripField("to", e.target.value)} placeholder={t.tripToPh} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>{lbl(t.tripDepart)}<input data-trip-depart type="time" value={tripModal.departTime} onChange={(e) => setTripField("departTime", e.target.value)} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                  <div>{lbl(t.tripArrive)}<input data-trip-arrive type="time" value={tripModal.arriveTime} onChange={(e) => setTripField("arriveTime", e.target.value)} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                  <div>{lbl(t.tripKm)}<input data-trip-km value={tripModal.km} onChange={(e) => setTripField("km", e.target.value)} inputMode="decimal" placeholder="0" style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                </div>
                {hours > 0 && <div data-trip-hours style={{ color: COLORS.amber }} className="text-xs font-bold">{t.tripHours}: {hours} h</div>}
                {lbl(t.tripLoad)}
                <div className="flex flex-wrap gap-1.5">
                  {LOAD_KINDS.map((k) => (
                    <button key={k} data-trip-load={k} onClick={() => setTripField("loadKind", k)} style={{ background: tripModal.loadKind === k ? COLORS.accent : COLORS.card, border: `1px solid ${COLORS.border}` }} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold">{t[`load_${k}`]}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>{lbl(t.tripWeight)}<input data-trip-weight value={tripModal.weightKg} onChange={(e) => setTripField("weightKg", e.target.value)} inputMode="decimal" placeholder="kg" style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                  {tripModal.loadKind === "waste" && (
                    <div>{lbl(t.tripMulde)}<select data-trip-mulde value={tripModal.mulde} onChange={(e) => setTripField("mulde", e.target.value)} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none">{MULDE_SIZES.map((m) => <option key={m} value={m}>{m ? `${m} m³` : "—"}</option>)}</select></div>
                  )}
                </div>
                {tripModal.loadKind === "waste" && wasteOpen > 0 && (
                  <div data-trip-waste-hint style={{ color: COLORS.muted }} className="text-[11px]">{t.tripWasteOpen.replace("{kg}", String(wasteOpen))}</div>
                )}
                {tripModal.loadKind === "waste" && (
                  <div>{lbl(t.tripDisposal)}<input data-trip-disposal value={tripModal.disposalSite} onChange={(e) => setTripField("disposalSite", e.target.value)} placeholder={t.tripDisposalPh} style={field} className="w-full rounded-lg px-2 py-2 text-sm outline-none" /></div>
                )}
                {lbl(t.notesLabel)}
                <textarea value={tripModal.notes} onChange={(e) => setTripField("notes", e.target.value)} rows={2} style={field} className="rounded-lg px-2 py-2 text-sm outline-none resize-none" />
                <button data-trip-save onClick={saveTrip} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.tripSave}</button>
              </div>
            </Modal>
          );
      })()}
      {inspectionModal && (
        <Modal onClose={() => setInspectionModal(null)} title={inspectionModal.editingId ? t.inspectEditTitle : t.inspectionTitle}>
          {inspectionModal.step === "form" && (
            <div className="flex flex-col gap-2">
              <textarea value={inspectionModal.text} onChange={(e) => setInspectionModal((s) => ({ ...s, text: e.target.value }))} placeholder={t.inspectionPlaceholder} rows={4} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              <div className="flex gap-2">
                <input value={inspectionModal.startTime} onChange={(e) => setInspectionModal((s) => ({ ...s, startTime: e.target.value }))} placeholder={t.startTimeLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={inspectionModal.ladderLength} onChange={(e) => setInspectionModal((s) => ({ ...s, ladderLength: e.target.value }))} placeholder={t.ladderLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={inspectionModal.psaCount} onChange={(e) => setInspectionModal((s) => ({ ...s, psaCount: e.target.value }))} placeholder={t.psaLabel} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {inspectionModal.images.map((img, i) => (<img key={i} src={`data:${img.mediaType};base64,${img.b64}`} alt="" className="w-full h-16 object-cover rounded-lg" />))}
                {inspectionModal.images.length < 3 && (
                  <button onClick={() => inspectionFileRef.current?.click()} style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }} className="h-16 rounded-lg flex items-center justify-center">
                    <ImagePlus size={16} color={COLORS.muted} />
                  </button>
                )}
              </div>
              <input ref={inspectionFileRef} type="file" accept="image/*" onChange={addInspectionImage} className="hidden" />
              {inspectionModal.error && <div style={{ color: COLORS.danger }} className="text-xs">{inspectionModal.error}</div>}
              {inspectionModal.detail && <div style={{ color: COLORS.muted }} className="text-[10px] break-all">{inspectionModal.detail}</div>}
              {/* Tiles: what was looked at. Tap cycles none → OK → Mangel. */}
              <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mt-1">{t.inspectChecklist}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {INSPECTION_ITEMS.map((k) => {
                  const st = (inspectionModal.checklist || {})[k];
                  const col = st === "ok" ? COLORS.success : st === "mangel" ? COLORS.danger : COLORS.muted;
                  return (
                    <button key={k} data-inspect-tile={k} onClick={() => cycleInspectionItem(k)} style={{ background: st ? `${col}22` : COLORS.cardAlt, border: `1px solid ${st ? col : COLORS.border}`, color: st ? col : COLORS.text }} className="rounded-lg px-2 py-2 text-[11px] font-bold leading-tight text-left flex items-center gap-1.5">
                      <span style={{ background: st ? col : COLORS.border }} className="w-2 h-2 rounded-full shrink-0" />
                      <span className="truncate">{t[`inspect_${k}`]}</span>
                      {st && <span className="ml-auto text-[9px] uppercase">{st === "ok" ? t.inspectOk : t.inspectMangel}</span>}
                    </button>
                  );
                })}
              </div>
              {/* Replaced tiles: model from the reference, count, and what that
                  weighs -- the number the skip is ordered by. */}
              <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mt-1">{t.inspectReplacedTiles}</div>
              {(inspectionModal.tiles || []).map((row, i) => {
                const meta = tileMeta(row.model);
                const w = tileWaste(row.model, row.count);
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <select
                        data-tile-model
                        value={ROOF_TILES.some((x) => x.key === row.model) ? row.model : (row.model ? "__free" : "")}
                        onChange={(e) => setInspectionModal((s) => { const tiles = s.tiles.slice(); tiles[i] = { ...tiles[i], model: e.target.value === "__free" ? " " : e.target.value }; return { ...s, tiles }; })}
                        style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                        className="flex-1 min-w-0 rounded-lg px-2 py-2 text-sm outline-none"
                      >
                        <option value="">{t.inspectTileModel}</option>
                        {ROOF_TILES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                        <option value="__free">{t.inspectTileOther}</option>
                      </select>
                      <input data-tile-count value={row.count} onChange={(e) => setInspectionModal((s) => { const tiles = s.tiles.slice(); tiles[i] = { ...tiles[i], count: e.target.value }; return { ...s, tiles }; })} inputMode="numeric" placeholder={t.qtyPlaceholder} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="w-20 rounded-lg px-2 py-2 text-sm outline-none" />
                    </div>
                    {row.model && !meta && (
                      <input value={row.model.trim()} onChange={(e) => setInspectionModal((s) => { const tiles = s.tiles.slice(); tiles[i] = { ...tiles[i], model: e.target.value || " " }; return { ...s, tiles }; })} placeholder={t.inspectTileOther} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="rounded-lg px-2 py-1.5 text-xs outline-none" />
                    )}
                    {meta && (
                      <div style={{ color: COLORS.muted }} className="text-[10px]">
                        {meta.kgPerPiece} kg/Stk{meta.perM2 ? ` · ${meta.perM2} Stk/m²` : ""}{parseFloat(row.count) > 0 ? ` → ~${w.wasteKg} kg${w.areaM2 ? ` · ${w.areaM2} m²` : ""}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center justify-between">
                <button onClick={() => setInspectionModal((s) => ({ ...s, tiles: [...(s.tiles || []), { model: "", count: "" }] }))} style={{ color: COLORS.accent }} className="text-[10px] font-bold uppercase flex items-center gap-1"><Plus size={11} /> {t.inspectAddTile}</button>
                {(() => { const w = tilesWaste((inspectionModal.tiles || []).filter((r) => r.model && parseFloat(r.count) > 0)); return w.wasteKg > 0 ? <span data-waste-kg style={{ color: COLORS.amber }} className="text-[11px] font-bold">{t.inspectWaste}: ~{w.wasteKg} kg</span> : null; })()}
              </div>
              <button data-inspect-save onClick={saveInspectionPlain} style={{ background: COLORS.accent }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm">{t.inspectSave}</button>
              {!inspectionModal.editingId && <button onClick={runInspection} disabled={!inspectionModal.text.trim()} style={{ background: "#6FB3D9", opacity: inspectionModal.text.trim() ? 1 : 0.5 }} className="w-full mt-1 py-3 rounded-lg font-bold uppercase text-sm text-black">{t.sendToAdvisors}</button>}
              <div style={{ color: COLORS.muted }} className="text-[10px]">{t.advisorsHint}</div>
            </div>
          )}
          {inspectionModal.step === "running" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 size={28} className="animate-spin" color="#6FB3D9" />
              <div className="text-sm font-semibold text-center">{inspectionModal.agentNote}</div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((n) => (<div key={n} className="w-2 h-2 rounded-full" style={{ background: n <= inspectionModal.progress ? "#6FB3D9" : COLORS.border }} />))}
              </div>
            </div>
          )}
          {inspectionModal.step === "result" && (
            <div className="flex flex-col gap-3">
              <div style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, whiteSpace: "pre-wrap" }} className="rounded-lg p-3 text-sm leading-relaxed">{inspectionModal.report}</div>
              {inspectionModal.materials && inspectionModal.materials.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.materialsAlsoLog}</div>
                  {inspectionModal.materials.map((it) => (
                    <label key={it.id} style={{ background: COLORS.cardAlt }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                      <input type="checkbox" checked={it.checked} onChange={() => setInspectionModal((s) => ({ ...s, materials: s.materials.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) }))} />
                      <span className="flex-1">{it.name}</span>
                      <span style={{ color: COLORS.muted }}>{it.qty} {it.unit}</span>
                    </label>
                  ))}
                </div>
              )}
              <button onClick={confirmInspection} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm">{t.logInspection}</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function MountainBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        {/* Layer 1 — furthest, palest, tallest peaks */}
        <path d="M0,900 L0,520 L40,420 L80,480 L130,340 L180,460 L230,380 L280,470 L330,360 L400,450 L400,900 Z" fill="#3A4550" opacity="0.5" />
        <polygon points="112,375 130,340 150,372" fill={COLORS.text} opacity="0.4" />
        <polygon points="312,393 330,360 350,392" fill={COLORS.text} opacity="0.4" />
        <polygon points="213,410 230,380 249,412" fill={COLORS.text} opacity="0.35" />

        {/* Layer 2 — mid distance */}
        <path d="M0,900 L0,620 L50,540 L100,600 L150,500 L200,610 L260,520 L310,600 L360,540 L400,610 L400,900 Z" fill="#2C343B" opacity="0.65" />
        <polygon points="133,532 150,500 168,530" fill={COLORS.text} opacity="0.3" />
        <polygon points="243,550 260,520 277,548" fill={COLORS.text} opacity="0.3" />

        {/* Layer 3 — closest foothills, blends into the app shell */}
        <path d="M0,900 L0,760 L60,700 L120,750 L190,680 L260,740 L330,690 L400,750 L400,900 Z" fill="#20262B" opacity="0.9" />
      </svg>
    </div>
  );
}

function SwissCross({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "inline-block" }}>
      <rect x="0" y="0" width="32" height="32" rx="6" fill="#DA291C" />
      <rect x="13" y="6" width="6" height="20" fill="#fff" />
      <rect x="6" y="13" width="20" height="6" fill="#fff" />
    </svg>
  );
}

// Usage, for the owner: how many people used the app, how often, for what.
// Counts per company and day from the Worker; no names, no text.
export function UsageCard({ t, usage, onLoad }) {
  useEffect(() => { if (!usage) onLoad(); }, []);
  const days = (usage && usage.days) || [];
  const totals = (usage && usage.totals) || {};
  const last7 = days.slice(-7);
  const people7 = new Set();
  const sum = (list, pick) => list.reduce((s, d) => s + Object.entries(d.events || {}).filter(([k]) => pick(k)).reduce((x, [, v]) => x + v, 0), 0);
  const entries7 = sum(last7, (k) => k.startsWith("entry."));
  const active7 = Math.max(...last7.map((d) => d.active), 0);
  const entries30 = Object.entries(totals).filter(([k]) => k.startsWith("entry.")).reduce((s, [, v]) => s + v, 0);
  const reports30 = (totals["report.sent"] || 0) + (totals["rapport.sign"] || 0);
  const trips30 = (totals["entry.transport"] || 0) + (totals["entry.inspection"] || 0);
  const maxActive = Math.max(...days.map((d) => d.active), 1);
  const tile = (label, value) => (
    <div key={label} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg p-2.5">
      <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-lg font-black leading-tight">{value}</div>
    </div>
  );
  return (
    <div data-usage-card style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3 lg:col-span-3">
      <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.ccUsage}</div>
      {!usage && <div style={{ color: COLORS.muted }} className="text-xs">{t.ccUsageLoading}</div>}
      {usage && days.length === 0 && <div style={{ color: COLORS.muted }} className="text-xs">{t.ccUsageEmpty}</div>}
      {usage && days.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {tile(t.ccUsageActive30, String(usage.activePeople || 0))}
            {tile(t.ccUsageActive7, String(active7))}
            {tile(t.ccUsageEntries30, `${entries30} · ${entries7}`)}
            {tile(t.ccUsageReports30, String(reports30))}
            {tile(t.ccUsageTrips30, String(trips30))}
          </div>
          <div className="flex items-end gap-[3px] h-10 mt-3">
            {days.map((d) => (
              <div key={d.date} title={`${d.date}: ${d.active}`} style={{ height: `${Math.max(6, Math.round((d.active / maxActive) * 100))}%`, background: d.active ? COLORS.accent : COLORS.border }} className="flex-1 rounded-sm" />
            ))}
          </div>
          <div style={{ color: COLORS.muted }} className="text-[10px] mt-2">{t.ccUsageFootnote}</div>
        </>
      )}
    </div>
  );
}

export function Section({ title, items, onEditItem, onCopyItem, onDeleteItem, onReorder, t }) {
  const [sort, setSort] = useState("name");
  if (items.length === 0) return null;

  const sorted = (() => {
    const copy = items.slice();
    if (sort === "name") return copy.sort((a, b) => String(a.description || "").localeCompare(String(b.description || ""), undefined, { sensitivity: "base" }));
    if (sort === "qty") return copy.sort((a, b) => (parseFloat(b.qty || 0) || 0) - (parseFloat(a.qty || 0) || 0));
    if (sort === "unit") return copy.sort((a, b) => String(a.unit || "").localeCompare(String(b.unit || "")) || String(a.description || "").localeCompare(String(b.description || "")));
    // Grouping by merchant is how a purchase order gets written, so it earns
    // a sort of its own.
    if (sort === "supplier") return copy.sort((a, b) => String(a.supplier || "￿").localeCompare(String(b.supplier || "￿")) || String(a.description || "").localeCompare(String(b.description || "")));
    if (sort === "date") return copy.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    return copy; // manual
  })();

  const row = (i, handle) => (
    <div style={{ background: COLORS.cardAlt }} className="rounded-lg pl-1 pr-3 py-2 text-sm flex items-center justify-between gap-2">
      {handle}
      <div className="flex-1 min-w-0">
        <div className="truncate flex items-center gap-1.5">
          {i.regie && (
            <span style={{ background: `${COLORS.amber}22`, color: COLORS.amber, border: `1px solid ${COLORS.amber}66` }} className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded uppercase">
              {t.regieShort}
            </span>
          )}
          <span className="truncate">{i.description}</span>
        </div>
        {(i.supplier || i.artNo) && (
          <div style={{ color: COLORS.muted }} className="text-[10px] truncate">
            {[i.supplier, i.artNo && `${t.artNoShort} ${i.artNo}`].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
      <span style={{ color: COLORS.muted }} className="shrink-0 tabular-nums">{i.qty ? `${i.qty}${i.unit ? " " + i.unit : ""}` : ""}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onCopyItem(i)} title={t.copyBtn} style={{ color: COLORS.muted }}><Copy size={13} /></button>
        <button onClick={() => onEditItem(i)} title={t.editLabel} style={{ color: COLORS.muted }}><Pencil size={13} /></button>
        <button onClick={() => onDeleteItem(i)} title={t.deleteLabel} style={{ color: COLORS.danger }}><Trash2 size={13} /></button>
      </div>
    </div>
  );

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide truncate min-w-0">{title}</div>
        {/* One picker instead of six chips: the chips ran off the right edge
            of a phone. A native select opens the system list on Android. */}
        <label
          data-sort-select
          style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.muted }}
          className="shrink-0 flex items-center gap-1 rounded-lg pl-2 pr-1.5 py-1"
        >
          <ArrowUpDown size={11} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ background: "transparent", color: COLORS.text }}
            className="text-[11px] font-bold outline-none appearance-none pr-3 max-w-[9rem]"
          >
            {[
              ["name", t.sortName],
              ["qty", t.sortQty],
              ["unit", t.sortUnit],
              ["supplier", t.sortSupplier],
              ["date", t.sortDate],
              ["manual", t.sortManual],
            ].map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      {sort === "manual" ? (
        <ReorderList items={sorted} onReorder={onReorder} renderItem={row} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((i) => (
            <Fragment key={i.id}>{row(i, null)}</Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// Drag-to-reorder list. Uses pointer events rather than HTML5 drag-and-drop,
// which doesn't fire on touch devices — this app is used on phones on site.
// Dragging is started from the grip handle only, so the row itself stays
// tappable and the list still scrolls normally.
function ReorderList({ items, onReorder, renderItem, gapClass = "gap-1.5" }) {
  const [dragId, setDragId] = useState(null);
  const [order, setOrder] = useState(null);
  const rowRefs = useRef({});
  const startedRef = useRef(false);

  const view = order ? order.map((id) => items.find((i) => i.id === id)).filter(Boolean) : items;

  function beginDrag(e, id) {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) {} // a pointer the browser does not know must not cancel the gesture
    startedRef.current = false;
    setDragId(id);
    setOrder(items.map((i) => i.id));
  }

  function onMove(e) {
    if (!dragId || !order) return;
    startedRef.current = true;
    const y = e.clientY;
    const from = order.indexOf(dragId);
    let to = from;
    for (let idx = 0; idx < order.length; idx++) {
      const el = rowRefs.current[order[idx]];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y < r.top + r.height / 2) { to = idx; break; }
      to = idx;
    }
    if (to !== from) {
      const next = order.slice();
      next.splice(to, 0, next.splice(from, 1)[0]);
      setOrder(next);
    }
  }

  function endDrag() {
    if (dragId && order && startedRef.current) {
      const before = items.map((i) => i.id);
      if (order.some((id, i) => before[i] !== id)) onReorder(order);
    }
    setDragId(null);
    setOrder(null);
    startedRef.current = false;
  }

  return (
    <div className={`flex flex-col ${gapClass}`}>
      {view.map((item) => (
        <div
          key={item.id}
          ref={(el) => { rowRefs.current[item.id] = el; }}
          style={{
            opacity: dragId === item.id ? 0.85 : 1,
            transform: dragId === item.id ? "scale(1.02)" : "none",
            boxShadow: dragId === item.id ? "0 6px 18px rgba(0,0,0,0.45)" : "none",
            transition: dragId ? "none" : "transform 0.12s",
          }}
          className="relative"
        >
          {renderItem(item, (
            <button
              onPointerDown={(e) => beginDrag(e, item.id)}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ color: COLORS.muted, touchAction: "none", cursor: "grab" }}
              className="shrink-0 px-1 py-1 -my-1"
              aria-label="Reorder"
            >
              <GripVertical size={15} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// Signature pad. Pointer events rather than mouse or touch handlers, so the
// same code works with a finger on a phone, a stylus on a tablet, and a mouse
// on a desk — the customer signs on whatever the roofer is holding.
function SignaturePad({ onChange, t }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Backing store at device resolution, or the line looks furry on a phone.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(e) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) {} // a pointer the browser does not know must not cancel the gesture
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange(canvasRef.current.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    dirty.current = false;
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        style={{ background: "#fff", border: `1px solid ${COLORS.border}`, touchAction: "none" }}
        className="w-full h-40 rounded-lg"
      />
      <button onClick={clear} style={{ color: COLORS.muted }} className="w-full py-2 text-[11px] font-bold uppercase">
        {t.sigClear}
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}` }} className="relative w-full max-w-md lg:max-w-xl rounded-t-2xl lg:rounded-2xl p-5 lg:p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-black text-lg uppercase">{title}</div>
          <button onClick={onClose}><X size={20} color={COLORS.muted} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
