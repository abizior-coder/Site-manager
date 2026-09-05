// The caps on the AI proxy, against a KV in memory. Run: node worker/limits.test.mjs
import { checkLimits, ACCOUNT_MINUTE_LIMIT, ACCOUNT_DAILY_LIMIT, COMPANY_DAILY_LIMIT } from "./src/limits.js";

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
  const m = new Map();
  return {
    m,
    async get(k) {
      return m.has(k) ? m.get(k) : null;
    },
    async put(k, v) {
      m.set(k, v);
    },
  };
}
const T0 = Date.UTC(2026, 8, 3, 9, 0, 0); // 09:00 on a Thursday

t("without a KV binding there is no cap", await checkLimits(null, { uid: "u1", cid: "c1" }, T0), null);
t("a call without a company is refused, not counted", (await checkLimits(fakeKv(), { uid: "u1" }, T0)).status, 400);

{
  const kv = fakeKv();
  let last = null;
  for (let i = 0; i < ACCOUNT_MINUTE_LIMIT; i++) last = await checkLimits(kv, { uid: "u1", cid: "c1" }, T0 + i * 100);
  t("twenty calls in a minute are fine", last, null);
  t("the twenty-first is not", (await checkLimits(kv, { uid: "u1", cid: "c1" }, T0 + 5000)).status, 429);
  t("the next minute starts fresh", await checkLimits(kv, { uid: "u1", cid: "c1" }, T0 + 61000), null);
}
{
  const kv = fakeKv();
  // spread over the day so the minute cap never bites
  let last = null;
  for (let i = 0; i < ACCOUNT_DAILY_LIMIT; i++) last = await checkLimits(kv, { uid: "u1", cid: "c1" }, T0 + i * 61000);
  t("two hundred calls in a day are fine", last, null);
  t(
    "the two-hundred-and-first is not",
    (await checkLimits(kv, { uid: "u1", cid: "c1" }, T0 + ACCOUNT_DAILY_LIMIT * 61000)).status,
    429,
  );
  t(
    "a fresh account in the same company still has its own daily cap",
    await checkLimits(kv, { uid: "u2", cid: "c1" }, T0 + 1000),
    null,
  );
}
{
  const kv = fakeKv();
  // Many throwaway accounts cannot outspend the company: the company counter
  // adds across uids.
  const uids = Array.from({ length: 4 }, (_, i) => `throwaway-${i}`);
  let n = 0,
    last = null;
  for (let i = 0; i < COMPANY_DAILY_LIMIT; i++) {
    last = await checkLimits(kv, { uid: uids[i % 4], cid: "c1" }, T0 + i * 61000);
    n++;
  }
  t("six hundred calls across four accounts are fine", last, null);
  const over = await checkLimits(kv, { uid: "throwaway-9", cid: "c1" }, T0 + n * 61000);
  t("the six-hundred-and-first from a fifth account is refused", over.status, 429);
  t("and says it is the company's cap", /company/.test(over.error), true);
  t("another company is untouched", await checkLimits(kv, { uid: "x", cid: "c2" }, T0 + n * 61000), null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
