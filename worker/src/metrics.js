// Usage counts per company and day, so the owner (and the product) can see
// whether the app is used at all, by how many people, and for what.
//
// What is stored: for each company and day, a count per event name and the
// set of people who were active -- as short hashes of the account id, so a
// KV dump names nobody. No text, no sites, no times of day. That is the whole
// DSG story: counts, per firm, kept for 400 days.
//
// Everything is injected (KV, the sign-in check, the membership check) so the
// arithmetic can be tested without Cloudflare.

export const EVENT_RE = /^[a-z][a-z0-9_.]{0,39}$/;
export const MAX_EVENTS_PER_POST = 40;
export const MAX_COUNT_PER_EVENT = 1000;
export const RETENTION_SECONDS = 400 * 86400;
export const MAX_DAYS = 90;

export function dayKey(now) {
  return new Date(now).toISOString().slice(0, 10);
}
export function kvKey(cid, day) {
  return `m:${cid}:${day}`;
}

// A hash the Worker can compute anywhere; 12 hex chars is plenty for
// counting people and useless for naming them.
export async function hashUid(uid) {
  const data = new TextEncoder().encode(`site-log:${uid}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fold a batch of events from one person into a day's record. Pure.
export function mergeDay(existing, { events, uidHash }) {
  const day = existing && typeof existing === "object" ? existing : {};
  const out = { events: { ...(day.events || {}) }, users: { ...(day.users || {}) } };
  for (const [name, n] of Object.entries(events || {})) {
    if (!EVENT_RE.test(name)) continue;
    const count = Math.min(MAX_COUNT_PER_EVENT, Math.max(0, Math.floor(Number(n) || 0)));
    if (!count) continue;
    out.events[name] = (out.events[name] || 0) + count;
  }
  if (uidHash) out.users[uidHash] = (out.users[uidHash] || 0) + 1;
  return out;
}

// Daily rows plus the totals the Cockpit shows. Pure.
export function summarise(rows) {
  const days = (rows || []).map((r) => ({
    date: r.date,
    active: Object.keys((r.day && r.day.users) || {}).length,
    events: (r.day && r.day.events) || {},
  }));
  const totals = {};
  const people = new Set();
  for (const r of rows || []) {
    for (const [k, v] of Object.entries((r.day && r.day.events) || {})) totals[k] = (totals[k] || 0) + v;
    for (const h of Object.keys((r.day && r.day.users) || {})) people.add(h);
  }
  return { days, totals, activePeople: people.size };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

// POST /metrics/<cid>  { events: { name: count } }   -- any member
// GET  /metrics/<cid>?days=30                         -- owner or supervisor
export async function handleMetrics({ request, env, headers, verify, isMember, now = Date.now() }) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["metrics", cid]
  if (parts[0] !== "metrics" || parts.length !== 2) return json({ error: "not found" }, 404, headers);
  const cid = parts[1];
  if (!SAFE_SEGMENT.test(cid)) return json({ error: "bad id" }, 400, headers);

  const kv = env.RATE_LIMIT;
  if (!kv) return json({ error: "metrics are not configured" }, 503, headers);

  const auth = await verify(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, headers);
  const membership = await isMember(cid, auth.uid, auth.token);
  if (!membership.member) return json({ error: "not a member of this company" }, 403, headers);

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400, headers);
    }
    const events = body && typeof body.events === "object" && body.events ? body.events : null;
    if (!events) return json({ error: "events missing" }, 400, headers);
    if (Object.keys(events).length > MAX_EVENTS_PER_POST) return json({ error: "too many events" }, 400, headers);
    const key = kvKey(cid, dayKey(now));
    const existing = JSON.parse((await kv.get(key)) || "null");
    const merged = mergeDay(existing, { events, uidHash: await hashUid(auth.uid) });
    await kv.put(key, JSON.stringify(merged), { expirationTtl: RETENTION_SECONDS });
    return json({ ok: true }, 200, headers);
  }

  if (request.method === "GET") {
    const manages = membership.role === "owner" || membership.role === "supervisor";
    if (!manages) return json({ error: "owners and supervisors only" }, 403, headers);
    const days = Math.min(MAX_DAYS, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10) || 30));
    const dates = [];
    for (let i = days - 1; i >= 0; i--) dates.push(dayKey(now - i * 86400000));
    const rows = await Promise.all(
      dates.map(async (date) => ({ date, day: JSON.parse((await kv.get(kvKey(cid, date))) || "null") })),
    );
    return json(summarise(rows), 200, headers);
  }

  return json({ error: "method not allowed" }, 405, headers);
}
