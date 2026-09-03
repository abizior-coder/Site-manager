// The usage counters without Cloudflare: a KV in memory, a sign-in table, a
// membership table. Pinned down: who may post, who may read, what is
// counted, and that nothing but counts and short hashes is stored.
// Run: node worker/metrics.test.mjs
import { handleMetrics, mergeDay, summarise, hashUid, kvKey, MAX_COUNT_PER_EVENT } from "./src/metrics.js";

let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "ok   " : "FAIL ") + name + (ok ? "" : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
}

function fakeKv() {
  const store = new Map();
  return { store, async get(k) { return store.has(k) ? store.get(k) : null; }, async put(k, v) { store.set(k, v); } };
}
const TOKENS = { "tok-chef": "u-chef", "tok-crew": "u-crew", "tok-other": "u-other" };
const MEMBERS = { "c1:u-chef": "owner", "c1:u-crew": "crew", "c2:u-other": "owner" };
const verify = async (req) => {
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  return TOKENS[token] ? { ok: true, uid: TOKENS[token], token } : { ok: false, status: 401, error: "sign-in required" };
};
const isMember = async (cid, uid) => (MEMBERS[`${cid}:${uid}`] ? { member: true, role: MEMBERS[`${cid}:${uid}`] } : { member: false });
const NOW = Date.parse("2026-09-03T12:00:00Z");

function req(method, path, token, body) {
  return new Request(`https://w.example${path}`, { method, headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
}
async function call(env, method, path, token, body) {
  const res = await handleMetrics({ request: req(method, path, token, body), env, headers: {}, verify, isMember, now: NOW });
  return { status: res.status, body: await res.json() };
}

// --- pure ------------------------------------------------------------------
t("a batch folds into the day", mergeDay(null, { events: { "entry.material": 2, open: 1 }, uidHash: "abc" }), { events: { "entry.material": 2, open: 1 }, users: { abc: 1 } });
t("a second person adds up", mergeDay({ events: { open: 1 }, users: { abc: 1 } }, { events: { open: 1 }, uidHash: "def" }), { events: { open: 2 }, users: { abc: 1, def: 1 } });
t("bad names and zero counts are dropped", mergeDay(null, { events: { "Bad Name": 3, ok: 0, fine: 1 }, uidHash: "x" }), { events: { fine: 1 }, users: { x: 1 } });
t("a count is capped per post", mergeDay(null, { events: { open: 999999 } }).events.open, MAX_COUNT_PER_EVENT);
t("the summary counts people once across days", summarise([{ date: "d1", day: { events: { open: 2 }, users: { a: 1, b: 1 } } }, { date: "d2", day: { events: { open: 1, trip: 1 }, users: { a: 1 } } }, { date: "d3", day: null }]), { days: [{ date: "d1", active: 2, events: { open: 2 } }, { date: "d2", active: 1, events: { open: 1, trip: 1 } }, { date: "d3", active: 0, events: {} }], totals: { open: 3, trip: 1 }, activePeople: 2 });
t("the uid hash is short and stable", [(await hashUid("u-chef")).length, (await hashUid("u-chef")) === (await hashUid("u-chef")), (await hashUid("u-chef")) === (await hashUid("u-crew"))], [12, true, false]);

// --- routes ----------------------------------------------------------------
{
  const env = { RATE_LIMIT: fakeKv() };
  t("no sign-in, no post", (await call(env, "POST", "/metrics/c1", "", { events: { open: 1 } })).status, 401);
  t("a stranger may not post", (await call(env, "POST", "/metrics/c1", "tok-other", { events: { open: 1 } })).status, 403);
  t("a crew member posts counts", (await call(env, "POST", "/metrics/c1", "tok-crew", { events: { open: 1, "entry.time": 3 } })).body, { ok: true });
  t("the owner posts too", (await call(env, "POST", "/metrics/c1", "tok-chef", { events: { open: 1 } })).status, 200);
  const stored = JSON.parse(env.RATE_LIMIT.store.get(kvKey("c1", "2026-09-03")));
  t("the day holds counts and two short hashes, no uids", [stored.events, Object.keys(stored.users).length, Object.keys(stored.users).some((h) => h.includes("u-"))], [{ open: 2, "entry.time": 3 }, 2, false]);
  t("events must be an object", (await call(env, "POST", "/metrics/c1", "tok-crew", { events: "open" })).status, 400);
  t("a crew member may not read", (await call(env, "GET", "/metrics/c1?days=7", "tok-crew")).status, 403);
  const r = await call(env, "GET", "/metrics/c1?days=7", "tok-chef");
  t("the owner reads seven days ending today", [r.status, r.body.days.length, r.body.days[6].date, r.body.days[6].active, r.body.totals, r.body.activePeople], [200, 7, "2026-09-03", 2, { open: 2, "entry.time": 3 }, 2]);
  t("another company's owner sees nothing of c1", (await call(env, "GET", "/metrics/c1?days=7", "tok-other")).status, 403);
  t("a bad company id is refused", (await call(env, "GET", "/metrics/../x", "tok-chef")).status, 404);
  t("without KV the route says so", (await call({}, "POST", "/metrics/c1", "tok-crew", { events: { open: 1 } })).status, 503);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
