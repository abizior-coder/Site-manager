// Crash reports per company and day: what build, which code, the first
// lines of the message and stack, the path, the language, the device family.
// No account id, no names, no site. Kept 30 days, at most 200 a day per
// company; owner and supervisor can read them back for the Cockpit.
// Everything is injected so the logic runs in a test without Cloudflare.

export const MAX_PER_DAY = 200;
export const RETENTION_SECONDS = 30 * 86400;
export const MAX_DAYS = 30;
export const RECENT = 10;
export const FIELD_LIMITS = { build: 16, code: 4, tag: 24, message: 200, stack: 400, path: 80, lang: 5, ua: 12 };

export function dayKey(now) {
  return new Date(now).toISOString().slice(0, 10);
}
export function kvKey(cid, day) {
  return `e:${cid}:${day}`;
}

// Only the listed fields, each cut to its limit; nothing without a message or code.
export function cleanReport(body) {
  if (!body || typeof body !== "object") return null;
  const out = {};
  for (const [k, max] of Object.entries(FIELD_LIMITS)) {
    const v = body[k];
    if (v == null) continue;
    out[k] = String(v).replace(/\s+/g, " ").trim().slice(0, max);
  }
  if (!out.message && !out.code) return null;
  return out;
}

export function appendError(existing, report, now) {
  const day = existing && typeof existing === "object" ? existing : {};
  const items = Array.isArray(day.items) ? day.items.slice() : [];
  const count = (Number(day.count) || 0) + 1;
  if (items.length >= MAX_PER_DAY) items.shift();
  items.push({ at: now, ...report });
  return { count, items };
}

export function summarise(rows) {
  const days = (rows || []).map((r) => ({ date: r.date, count: (r.day && Number(r.day.count)) || 0 }));
  const all = [];
  for (const r of rows || []) for (const it of (r.day && r.day.items) || []) all.push(it);
  all.sort((a, b) => (b.at || 0) - (a.at || 0));
  return { days, recent: all.slice(0, RECENT) };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

// POST /errors/<cid>  {build, code, tag, message, stack, path, lang, ua}  -- any member
// GET  /errors/<cid>?days=7                                              -- owner or supervisor
export async function handleErrors({ request, env, headers, verify, isMember, now = Date.now() }) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "errors" || parts.length !== 2) return json({ error: "not found" }, 404, headers);
  const cid = parts[1];
  if (!SAFE_SEGMENT.test(cid)) return json({ error: "bad id" }, 400, headers);
  const kv = env.RATE_LIMIT;
  if (!kv) return json({ error: "error reports are not configured" }, 503, headers);

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
    const report = cleanReport(body);
    if (!report) return json({ error: "report missing" }, 400, headers);
    const key = kvKey(cid, dayKey(now));
    const existing = JSON.parse((await kv.get(key)) || "null");
    await kv.put(key, JSON.stringify(appendError(existing, report, now)), { expirationTtl: RETENTION_SECONDS });
    return json({ ok: true }, 200, headers);
  }

  if (request.method === "GET") {
    const manages = membership.role === "owner" || membership.role === "supervisor";
    if (!manages) return json({ error: "owners and supervisors only" }, 403, headers);
    const days = Math.min(MAX_DAYS, Math.max(1, parseInt(url.searchParams.get("days") || "7", 10) || 7));
    const dates = [];
    for (let i = days - 1; i >= 0; i--) dates.push(dayKey(now - i * 86400000));
    const rows = await Promise.all(
      dates.map(async (date) => ({ date, day: JSON.parse((await kv.get(kvKey(cid, date))) || "null") })),
    );
    return json(summarise(rows), 200, headers);
  }

  return json({ error: "method not allowed" }, 405, headers);
}
