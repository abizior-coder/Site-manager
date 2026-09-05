// Spending limits for the AI proxy. Sign-up is open, so a cap per account
// alone is a cap per throwaway account; the cap that protects the bill is the
// one per company, and a company is something you cannot register your way
// into -- you need an invite from its owner.
//
// Counters live in KV and expire on their own. Everything is injected so the
// arithmetic can be tested without Cloudflare.

export const ACCOUNT_DAILY_LIMIT = 200; // scans + translations per account per day
export const COMPANY_DAILY_LIMIT = 600; // per company per day, across every member
export const ACCOUNT_MINUTE_LIMIT = 20; // per account per minute: a loop, not a person

function day(now) {
  return new Date(now).toISOString().slice(0, 10);
}
function minute(now) {
  return Math.floor(now / 60000);
}

async function bump(kv, key, ttl) {
  const used = parseInt((await kv.get(key)) || "0", 10);
  await kv.put(key, String(used + 1), { expirationTtl: ttl });
  return used; // the count before this call
}

// Returns null when the call may proceed, else { status, error }.
export async function checkLimits(kv, { uid, cid }, now = Date.now()) {
  if (!kv) return null; // stays deployable without KV; the binding turns the caps on
  if (!cid) return { status: 400, error: "company missing" };
  const [perMinute, perDay, perCompany] = await Promise.all([
    bump(kv, `rate:${uid}:${minute(now)}`, 120),
    bump(kv, `${uid}:${day(now)}`, 172800),
    bump(kv, `co:${cid}:${day(now)}`, 172800),
  ]);
  if (perMinute >= ACCOUNT_MINUTE_LIMIT) return { status: 429, error: "too many requests — wait a minute" };
  if (perDay >= ACCOUNT_DAILY_LIMIT) return { status: 429, error: "daily scan limit reached — try again tomorrow" };
  if (perCompany >= COMPANY_DAILY_LIMIT)
    return { status: 429, error: "the company's daily limit is reached — try again tomorrow" };
  return null;
}
