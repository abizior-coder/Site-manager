// Crash reports without Cloudflare: who may post, who may read, what is
// kept, the daily cap, the field limits. Run: node worker/errors.test.mjs
import {
  handleErrors,
  cleanReport,
  appendError,
  summarise,
  kvKey,
  MAX_PER_DAY,
  RETENTION_SECONDS,
} from "./src/errors.js";

let pass = 0,
  fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(
    (ok ? "ok   " : "FAIL ") +
      name +
      (ok ? "" : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`),
  );
  ok ? pass++ : fail++;
}
function fakeKv() {
  const store = new Map(),
    ttls = new Map();
  return {
    store,
    ttls,
    async get(k) {
      return store.has(k) ? store.get(k) : null;
    },
    async put(k, v, o) {
      store.set(k, v);
      ttls.set(k, o && o.expirationTtl);
    },
  };
}
const TOKENS = { "tok-chef": "u-chef", "tok-crew": "u-crew", "tok-other": "u-other" };
const MEMBERS = { "c1:u-chef": "owner", "c1:u-crew": "crew", "c2:u-other": "owner" };
const verify = async (req) => {
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  return TOKENS[token]
    ? { ok: true, uid: TOKENS[token], token }
    : { ok: false, status: 401, error: "sign-in required" };
};
const isMember = async (cid, uid) =>
  MEMBERS[`${cid}:${uid}`] ? { member: true, role: MEMBERS[`${cid}:${uid}`] } : { member: false };
const NOW = Date.parse("2026-09-05T12:00:00Z");
function req(method, path, token, body) {
  return new Request(`https://w.example${path}`, {
    method,
    headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function call(env, method, path, token, body, now = NOW) {
  const res = await handleErrors({ request: req(method, path, token, body), env, headers: {}, verify, isMember, now });
  return { status: res.status, body: await res.json() };
}

t(
  "a report keeps only the listed fields, cut to size",
  cleanReport({
    build: "8f1ef53cc8",
    code: "E91",
    tag: "CRASH",
    message: "x".repeat(300),
    stack: "  at a\n  at b",
    uid: "secret",
    ua: "ios",
  }),
  { build: "8f1ef53cc8", code: "E91", tag: "CRASH", message: "x".repeat(200), stack: "at a at b", ua: "ios" },
);
t("nothing without message or code", cleanReport({ build: "abc" }), null);
{
  let day = null;
  for (let i = 0; i < MAX_PER_DAY + 5; i++) day = appendError(day, { code: "E91", message: `m${i}` }, NOW + i);
  t(
    "the day counts every report but keeps at most the cap",
    [day.count, day.items.length, day.items[0].message],
    [MAX_PER_DAY + 5, MAX_PER_DAY, "m5"],
  );
}
t(
  "the summary has a count per day and the newest ten",
  (() => {
    const s = summarise([
      {
        date: "2026-09-04",
        day: {
          count: 2,
          items: [
            { at: 1, message: "a" },
            { at: 3, message: "c" },
          ],
        },
      },
      { date: "2026-09-05", day: { count: 1, items: [{ at: 2, message: "b" }] } },
    ]);
    return [s.days, s.recent.map((x) => x.message)];
  })(),
  [
    [
      { date: "2026-09-04", count: 2 },
      { date: "2026-09-05", count: 1 },
    ],
    ["c", "b", "a"],
  ],
);

const env = { RATE_LIMIT: fakeKv() };
const report = {
  build: "8f1ef53cc8",
  code: "E91",
  tag: "CRASH",
  message: "Cannot read properties of undefined",
  stack: "TypeError: …",
  path: "/index.html",
  lang: "de",
  ua: "android",
};
t("no sign-in, no report", (await call(env, "POST", "/errors/c1", null, report)).status, 401);
t("a stranger cannot report into a company", (await call(env, "POST", "/errors/c1", "tok-other", report)).status, 403);
t("a crew member can report", (await call(env, "POST", "/errors/c1", "tok-crew", report)).body, { ok: true });
t(
  "the day record holds the cleaned report with the time",
  JSON.parse(env.RATE_LIMIT.store.get(kvKey("c1", "2026-09-05"))).items.map((x) => [x.at, x.code, x.ua]),
  [[NOW, "E91", "android"]],
);
t("the record expires after thirty days", env.RATE_LIMIT.ttls.get(kvKey("c1", "2026-09-05")), RETENTION_SECONDS);
t("an empty body is refused", (await call(env, "POST", "/errors/c1", "tok-crew", { build: "x" })).status, 400);
t("crew cannot read the log", (await call(env, "GET", "/errors/c1?days=7", "tok-crew")).status, 403);
{
  const r = await call(env, "GET", "/errors/c1?days=7", "tok-chef");
  t(
    "the owner reads seven days and the recent list",
    [r.status, r.body.days.length, r.body.days[6], r.body.recent[0].message],
    [200, 7, { date: "2026-09-05", count: 1 }, "Cannot read properties of undefined"],
  );
}
t("another company sees nothing", (await call(env, "GET", "/errors/c2?days=7", "tok-other")).body.recent, []);
t("without KV the endpoint says so", (await call({}, "POST", "/errors/c1", "tok-crew", report)).status, 503);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
